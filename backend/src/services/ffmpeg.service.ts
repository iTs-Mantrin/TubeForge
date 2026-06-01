import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

export interface FfmpegOptions {
  /** Input file path */
  inputPath: string;
  /** Output file path */
  outputPath: string;
  /** Target codec (e.g. 'libx264', 'aac') */
  videoCodec?: string;
  audioCodec?: string;
  /** Video bitrate (e.g. '1M') */
  videoBitrate?: string;
  /** Audio bitrate (e.g. '192k') */
  audioBitrate?: string;
  /** Remove original after conversion */
  deleteOriginal?: boolean;
}

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  /**
   * Merge audio and video streams (e.g., yt-dlp bestvideo+bestaudio output).
   */
  async mergeAudioVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ): Promise<void> {
    await this.runFfmpeg([
      '-i',
      videoPath,
      '-i',
      audioPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      outputPath,
    ]);
  }

  /**
   * Convert audio to MP3 with specified quality.
   */
  async convertToMp3(
    inputPath: string,
    outputPath: string,
    bitrate = '192k',
  ): Promise<void> {
    await this.runFfmpeg([
      '-i',
      inputPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-ab',
      bitrate,
      outputPath,
    ]);
  }

  /**
   * Extract thumbnail from video.
   */
  async extractThumbnail(
    videoPath: string,
    outputPath: string,
    seekSeconds = 5,
  ): Promise<void> {
    await this.runFfmpeg([
      '-ss',
      String(seekSeconds),
      '-i',
      videoPath,
      '-vframes',
      '1',
      '-q:v',
      '2',
      outputPath,
    ]);
  }

  private async runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', args);
      let stderr = '';

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`),
          );
          return;
        }
        resolve();
      });

      proc.on('error', reject);
    });
  }
}
