import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { YtdlpService } from '../services/ytdlp.service';
import { UploadService } from '../services/upload.service';

interface DownloadJobData {
  taskId: string;
  url: string;
  quality: string;
  audioOnly: boolean;
  downloadDir: string;
}

@Processor('youtube-downloads', {
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '10', 10),
})
export class YoutubeProcessor extends WorkerHost {
  private readonly logger = new Logger(YoutubeProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ytdlpService: YtdlpService,
    private readonly uploadService: UploadService,
  ) {
    super();
  }

  async process(job: Job<DownloadJobData>): Promise<any> {
    const { taskId, url, quality, audioOnly, downloadDir } = job.data;

    // Start download via shared ytdlp service
    const { outputPath } = await this.ytdlpService.downloadVideo(
      taskId,
      url,
      quality,
      audioOnly,
      downloadDir,
      (progress) => {
        job.updateProgress({
          percent: progress.percent,
          speed: progress.speed,
          eta: progress.eta,
          filename: progress.filename || '',
          status: progress.status,
        });
      },
    );

    // Upload to R2 with retry
    let downloadUrl = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const remoteKey = await this.uploadService.store(outputPath);
        downloadUrl = await this.uploadService.getDownloadUrl(
          remoteKey,
          path.basename(outputPath),
        );
        // Delete temp file only after confirmed upload
        try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
        break;
      } catch (err: any) {
        if (attempt < 3) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
          await new Promise((r) => setTimeout(r, delay));
          this.logger.warn(
            `R2 upload attempt ${attempt} failed, retrying in ${delay}ms: ${err.message}`,
          );
        } else {
          this.logger.warn(
            `R2 upload failed after 3 attempts: ${err.message}`,
          );
          downloadUrl = '';
        }
      }
    }

    // Mark done
    await job.updateProgress({
      percent: 100,
      speed: '',
      eta: '',
      filename: path.basename(outputPath),
      status: 'done',
      downloadUrl,
    });

    return {
      status: 'done',
      outputPath,
      downloadUrl,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
