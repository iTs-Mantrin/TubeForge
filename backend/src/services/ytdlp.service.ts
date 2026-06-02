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

  constructor(private readonly configService: ConfigService) {}

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
          resolve({
            title: info.title || 'Unknown',
            duration: info.duration || 0,
            uploader: info.uploader || info.channel || 'Unknown',
            thumbnail: info.thumbnail || '',
            webpageUrl: info.webpage_url || url,
            formats,
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
    const prefix = `yt_${taskId}_`;
    fs.mkdirSync(downloadDir, { recursive: true });

    const outtmpl = path.join(downloadDir, `${prefix}%(title)s.%(ext)s`);
    const args = this.buildDownloadArgs(url, outtmpl, quality, audioOnly);

    this.logger.log(
      `Starting download ${taskId}: yt-dlp ${args.slice(0, 4).join(' ')} …`,
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

      proc.on('error', reject);
    });
  }

  // ── Private helpers ───────────────────────────────────────

  /**
   * Build safe args for preview (no shell injection).
   * url is passed as a positional argument, not interpolated.
   *
   * Uses multiple strategies to bypass YouTube's datacenter-IP blocking
   * (common on Render / Railway / cloud providers):
   * - Android player client (less aggressively blocked than web)
   * - --geo-bypass for geographical restrictions
   * - Cookie-based auth when cookies.txt is available
   */
  private buildPreviewArgs(url: string): string[] {
    const args = [
      '--no-warnings',
      '--dump-single-json',
      '--skip-download',
      '--no-playlist',
      '--extractor-args',
      'youtube:player_client=android&player_skip=webpage,configs',
      '--geo-bypass',
      '--user-agent',
      this.configService.get<string>('ytDlp.userAgent') ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ];

    const cookiesFile = this.configService.get<string>('ytDlp.cookiesFile');
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    }

    args.push(url); // <-- safe: never concatenated into string
    return args;
  }

  /**
   * Build yt-dlp arguments for download.
   */
  private buildDownloadArgs(
    url: string,
    outtmpl: string,
    quality: string,
    audioOnly: boolean,
  ): string[] {
    const args: string[] = [
      url,
      '--no-warnings',
      '--progress',
      '--newline',
      '--no-playlist',
      '--extractor-args',
      'youtube:player_client=android&player_skip=webpage,configs',
      '--geo-bypass',
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
        'bestaudio/best',
        '--extract-audio',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '192k',
      );
    } else {
      const q = quality.toLowerCase();
      const fmtMap: Record<string, string> = {
        highest: 'bestvideo+bestaudio/best',
        '2160p': 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
        '1440p': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
      };
      args.push('-f', fmtMap[q] || quality);
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
