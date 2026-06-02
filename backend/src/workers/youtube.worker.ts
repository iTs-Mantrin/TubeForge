/**
 * Standalone BullMQ worker entry point.
 *
 * Uses NestJS standalone application context so it can leverage the
 * same DI-powered services as the in-process @Processor.
 *
 * Usage:
 *   node dist/workers/youtube.worker.js
 *
 * Or via docker-compose:
 *   command: node dist/workers/youtube.worker.js
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../app.module';
import { YtdlpService } from '../services/ytdlp.service';
import { UploadService } from '../services/upload.service';

async function bootstrap() {
  // ── Write YOUTUBE_COOKIES env var to temp file for yt-dlp ──
  const COOKIES_PATH = '/tmp/youtube-cookies.txt';
  const youtubeCookies = process.env.YOUTUBE_COOKIES;
  if (youtubeCookies) {
    fs.writeFileSync(COOKIES_PATH, youtubeCookies, 'utf-8');
    process.env.YT_DLP_COOKIES_FILE = COOKIES_PATH;
    console.log(`[YoutubeWorker] YOUTUBE_COOKIES found — wrote ${COOKIES_PATH} (${youtubeCookies.length} chars)`);
  }

  // ── Create NestJS standalone app ─────────────────────────
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('YoutubeWorker');

  const configService = app.get<any>('ConfigService');
  const ytdlpService = app.get(YtdlpService);
  const uploadService = app.get(UploadService);

  const REDIS_HOST = configService.get('redis.host') || 'localhost';
  const REDIS_PORT = configService.get('redis.port') || 6379;
  const REDIS_PASSWORD = configService.get('redis.password') || '';
  const QUEUE_NAME = configService.get('queue.name') || 'youtube-downloads';
  const CONCURRENCY = configService.get('queue.concurrency') || 3;
  const DOWNLOAD_DIR = configService.get('download.dir') || '/tmp/yt-downloads';

  logger.log(
    `Starting worker — concurrency=${CONCURRENCY}, queue=${QUEUE_NAME}`,
  );

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { taskId, url, quality, audioOnly } = job.data as any;

      const downloadDir = DOWNLOAD_DIR;
      fs.mkdirSync(downloadDir, { recursive: true });

      // Use shared ytdlp service for the download
      const { outputPath } = await ytdlpService.downloadVideo(
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
            status: progress.status,
          });
        },
      );

      // Upload to R2 using shared upload service
      let downloadUrl = '';
      try {
        const remoteKey = await uploadService.store(outputPath);
        downloadUrl = await uploadService.getDownloadUrl(
          remoteKey,
          path.basename(outputPath),
        );
        fs.unlinkSync(outputPath);
      } catch (err: any) {
        logger.warn(`R2 upload failed: ${err.message}`);
      }

      await job.updateProgress({
        percent: 100,
        status: 'done',
        downloadUrl,
      });

      return { status: 'done', downloadUrl };
    },
    {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD || undefined,
        ...(configService.get('redis.tls') ? { tls: {} } : {}),
      },
      concurrency: CONCURRENCY,
    },
  );

  worker.on('completed', (job) => {
    if (job) logger.log(`Job ${job.id} completed`);
  });
  worker.on('failed', (job, err) => {
    if (job) logger.error(`Job ${job.id} failed: ${err.message}`);
  });

  logger.log('Worker is ready');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
