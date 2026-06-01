import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Start periodic cleanup of temp files.
   * Called during module onModuleInit or via explicit start.
   */
  start(): void {
    const intervalMinutes = 15; // check every 15 minutes
    this.logger.log(
      `Cleanup service started — interval=${intervalMinutes}m`,
    );
    this.intervalHandle = setInterval(() => {
      this.cleanup().catch((err) =>
        this.logger.warn(`Cleanup error: ${err.message}`),
      );
    }, intervalMinutes * 60 * 1000);

    // Also run immediately on start
    this.cleanup().catch((err) =>
      this.logger.warn(`Initial cleanup error: ${err.message}`),
    );
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Remove files older than MAX_FILE_AGE_MINUTES in the download directory.
   */
  async cleanup(): Promise<number> {
    const downloadDir =
      this.configService.get<string>('DOWNLOAD_DIR') || '/tmp/yt-downloads';
    const maxAgeMinutes =
      this.configService.get<number>('MAX_FILE_AGE_MINUTES') || 30;

    if (!fs.existsSync(downloadDir)) return 0;

    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    let removed = 0;

    try {
      const files = fs.readdirSync(downloadDir);
      for (const file of files) {
        const filePath = path.join(downloadDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            removed++;
          }
        } catch {
          // skip files we can't stat/unlink
        }
      }
    } catch (err) {
      this.logger.warn(`Cleanup scan failed: ${(err as Error).message}`);
    }

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} expired temp file(s)`);
    }
    return removed;
  }
}
