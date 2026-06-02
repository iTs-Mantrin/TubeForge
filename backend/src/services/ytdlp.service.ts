import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import * as path from 'path';
import * as fs from 'fs';
import { sanitizeFilename } from '../common/utils/sanitize';

export interface DownloadProgress {
  percent: number;
  speed: string;
  eta: string;
  status: string;
  filename?: string;
}

export interface DownloadResult {
  outputPath: string;
  title?: string;
}

@Injectable()
export class YtdlpService {
  private readonly logger = new Logger(YtdlpService.name);

  /** Semaphore — limits concurrent yt-dlp processes so YouTube doesn't rate-limit the server IP. */
  private activeDownloads = 0;
  private maxConcurrent = 10;
  private pendingQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = [];

  constructor(private readonly configService: ConfigService) {
    this.maxConcurrent =
      this.configService.get<number>('ytDlp.maxConcurrentDownloads') || 10;
  }

  /** Wait until a download slot is available, then acquire it. */
  private async acquireSlot(): Promise<void> {
    if (this.activeDownloads < this.maxConcurrent) {
      this.activeDownloads++;
      return;
    }
    return new Promise<void>((resolve, reject) => {
      this.pendingQueue.push({ resolve, reject });
    });
  }

  /** Release a download slot and hand it to the next waiter (if any). */
  private releaseSlot(): void {
    const next = this.pendingQueue.shift();
    if (next) {
      next.resolve();
    } else {
      this.activeDownloads--;
    }
  }

  /**
   * Fetch video metadata asynchronously using spawn (non-blocking).
   * Returns parsed JSON from yt-dlp --dump-single-json.
   */
  async preview(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = this.buildPreviewArgs(url);
      const proc = spawn('yt-dlp', args, {
        timeout: 60_000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`yt-dlp preview failed (exit ${code}): ${stderr}`),
          );
          return;
        }
        try {
          const info = JSON.parse(stdout);
          const formats = (info.formats || []).map((f: any) => ({
            formatId: f.format_id,
            height: f.height,
            ext: f.ext,
            filesize: f.filesize,
            vcodec: f.vcodec,
            acodec: f.acodec,
            tbr: f.tbr,
          }));

          // Derive simplified list of available quality labels
          const seen = new Set<number>();
          const qualities: string[] = [];
          const qualityOrder = [144, 240, 360, 480, 720, 1080, 1440, 2160];
          for (const f of info.formats || []) {
            if (f.height && f.vcodec !== 'none' && !seen.has(f.height)) {
              seen.add(f.height);
            }
          }
          for (const h of qualityOrder) {
            if (seen.has(h)) qualities.push(`${h}p`);
          }
          if (qualities.length === 0) qualities.push('highest');

          resolve({
            title: info.title || 'Unknown',
            duration: info.duration || 0,
            uploader: info.uploader || info.channel || 'Unknown',
            thumbnail: info.thumbnail || '',
            webpageUrl: info.webpage_url || url,
            formats,
            qualities,
          });
        } catch (e: any) {
          reject(new Error(`Failed to parse yt-dlp output: ${e.message}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Download a video/audio file.
   *
   * Spawns yt-dlp, parses progress from stdout, then resolves with
   * the output file path once complete.
   *
   * @param onProgress — called repeatedly with current progress
   */
  async downloadVideo(
    taskId: string,
    url: string,
    quality: string,
    audioOnly: boolean,
    downloadDir: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<DownloadResult> {
    // Acquire semaphore slot — waits if too many concurrent downloads
    await this.acquireSlot();

    const prefix = `yt_${taskId}_`;
    fs.mkdirSync(downloadDir, { recursive: true });

    const outtmpl = path.join(downloadDir, `${prefix}%(title)s.%(ext)s`);
    const args = this.buildDownloadArgs(url, outtmpl, quality, audioOnly);

    this.logger.log(
      `Starting download ${taskId} (active: ${this.activeDownloads}/${this.maxConcurrent}): yt-dlp ${args.slice(0, 4).join(' ')} …`,
    );

    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', args);

      let stderr = '';
      let title: string | undefined;

      proc.stdout.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (!line) return;

        // Capture title from yt-dlp output
        const titleMatch = line.match(/^\[download\] Destination: (.+)/);
        if (titleMatch) {
          title = path.basename(titleMatch[1]);
        }

        // Parse progress line
        const progressMatch = line.match(
          /\[download\]\s+(\d+\.?\d*)%.*?(\d+\.?\d*[KMG]?i?B\/s).*?ETA\s+(\S+)/,
        );
        if (progressMatch && onProgress) {
          onProgress({
            percent: parseFloat(progressMatch[1]),
            speed: progressMatch[2],
            eta: progressMatch[3],
            status: 'downloading',
            filename: title,
          });
        }
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        this.releaseSlot();
        if (code !== 0) {
          reject(new Error(`yt-dlp exited ${code}: ${stderr}`));
          return;
        }

        // Find the output file
        const outputPath = this.findOutputFile(downloadDir, prefix);
        if (!outputPath) {
          reject(new Error('Output file not found after download'));
          return;
        }

        resolve({ outputPath, title });
      });

      proc.on('error', (err) => {
        this.releaseSlot();
        reject(err);
      });
    });
  }

  // ── Private helpers ───────────────────────────────────────

  /**
   * Build safe args for preview (no shell injection).
   * url is passed as a positional argument, not interpolated.
   *
   * Uses --dump-single-json only — no format selection, no extractor args.
   * Format selection is irrelevant for metadata-only previews and can fail
   * when the requested format isn't available for a given video.
   */
  private buildPreviewArgs(url: string): string[] {
    const args = [
      '--js-runtimes',
      'node',
      '--dump-single-json',
      '--skip-download',
      '--no-playlist',
    ];

    const cookiesFile =
      this.configService.get<string>('ytDlp.cookiesFile');
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    }

    args.push(url);
    return args;
  }

  /**
   * Build yt-dlp arguments for download.
   *
   * Format strategy tiered to guarantee MP4+AAC output:
   * 1. Prefer best MP4 video + M4A audio (native no-transcode path)
   * 2. Fallback to best video + best audio (ffmpeg recode may trigger)
   * 3. Fallback to best single file
   */
  private buildDownloadArgs(
    url: string,
    outtmpl: string,
    quality: string,
    audioOnly: boolean,
  ): string[] {
    const args: string[] = [
      url,
      '--js-runtimes',
      'node',
      '--no-warnings',
      '--progress',
      '--newline',
      '--no-playlist',
      '--geo-bypass',
      '--concurrent-fragments',
      `${this.configService.get<number>('ytDlp.concurrentFragments') || 8}`,
      '--throttled-rate',
      this.configService.get<string>('ytDlp.throttledRate') || '100K',
      '--retries',
      this.configService.get<string>('ytDlp.retries') || '10',
      '--fragment-retries',
      this.configService.get<string>('ytDlp.fragmentRetries') || '10',
      '--socket-timeout',
      `${this.configService.get<number>('ytDlp.socketTimeout') || 30}`,
      '--limit-rate',
      this.configService.get<string>('ytDlp.limitRate') || '50M',
      '-o',
      outtmpl,
      '--user-agent',
      this.configService.get<string>('ytDlp.userAgent') ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ];

    const cookiesFile = this.configService.get<string>('ytDlp.cookiesFile');
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    }

    if (audioOnly) {
      args.push(
        '-f',
        'ba[ext=m4a]/ba/b',
        '--extract-audio',
        '--audio-format',
        'aac',
        '--audio-quality',
        '192k',
      );
    } else {
      const q = quality.toLowerCase();
      let formatSelector: string;

      if (q === 'highest') {
        formatSelector = 'bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b';
      } else {
        const heightMatch = q.match(/^(\d+)p$/);
        const height = heightMatch ? heightMatch[1] : '1080';
        formatSelector =
          `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/` +
          `bestvideo[height<=${height}]+bestaudio/` +
          `best`;
      }

      args.push('-f', formatSelector);
      args.push('--merge-output-format', 'mp4');
      args.push('--recode-video', 'mp4');
    }

    return args;
  }

  private findOutputFile(dir: string, prefix: string): string {
    try {
      const files = fs
        .readdirSync(dir)
        .filter(
          (f) =>
            f.startsWith(prefix) &&
            !f.match(/\.(part|fragment|ytdl|tmp)$/),
        )
        .map((f) => path.join(dir, f))
        .sort(
          (a, b) =>
            fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
        );
      return files[0] || '';
    } catch {
      return '';
    }
  }
}
