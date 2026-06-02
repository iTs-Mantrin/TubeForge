import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DownloadRequestDto } from './dto/download.dto';
import { YtdlpService } from '../services/ytdlp.service';
import { CacheService } from '../services/cache.service';

/**
 * In-memory store for task progress (falls back when Redis is unreachable).
 */
const inMemoryStore = new Map<string, any>();

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ytdlpService: YtdlpService,
    private readonly cacheService: CacheService,
    @InjectQueue('youtube-downloads') private readonly downloadQueue: Queue,
  ) {}

  /** Get video metadata via yt-dlp (async spawn, non-blocking). */
  async preview(url: string): Promise<any> {
    // Check cache first
    const cacheKey = this.cacheService.metadataKey(url);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for preview: ${url}`);
      return cached;
    }

    try {
      const info = await this.ytdlpService.preview(url);
      // Cache metadata for 1 hour
      await this.cacheService.set(cacheKey, info, 3600);
      return info;
    } catch (err: any) {
      this.logger.error(`Preview failed for ${url}: ${err.message}`);
      throw new HttpException(
        `Could not fetch video info: ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** Push a download job to the BullMQ queue. */
  async enqueueDownload(taskId: string, dto: DownloadRequestDto): Promise<void> {
    inMemoryStore.set(taskId, {
      taskId,
      percent: 0,
      speed: '',
      eta: '',
      filename: '',
      status: 'queued',
      errorMsg: '',
    });

    await this.downloadQueue.add(
      'download',
      {
        taskId,
        url: dto.url,
        quality: dto.quality || 'highest',
        audioOnly: dto.audioOnly || false,
        downloadDir:
          this.configService.get<string>('DOWNLOAD_DIR') || '/tmp/yt-downloads',
      },
      {
        jobId: taskId,
        removeOnComplete: false,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  /** Read progress from Redis (via worker) or in-memory fallback. */
  async getProgress(taskId: string): Promise<any | null> {
    try {
      const job = await this.downloadQueue.getJob(taskId);
      if (job) {
        const state = await job.getState();
        const progress = (job.progress || {}) as Record<string, any>;
        return {
          taskId,
          percent: progress.percent ?? 0,
          speed: progress.speed ?? '',
          eta: progress.eta ?? '',
          filename: progress.filename ?? '',
          status: state === 'completed' ? 'done' : state,
          errorMsg: progress.errorMsg ?? job.failedReason ?? '',
          downloadUrl: progress.downloadUrl ?? '',
        };
      }
    } catch {
      // Redis unavailable — fall through
    }

    return inMemoryStore.get(taskId) || null;
  }

  /** Get the download URL (presigned R2 or local fallback). */
  async getDownloadUrl(taskId: string): Promise<string | null> {
    const job = await this.downloadQueue.getJob(taskId).catch(() => null);
    if (!job) {
      const mem = inMemoryStore.get(taskId);
      return mem?.downloadUrl || null;
    }
    const progress = job.progress as any;
    return progress?.downloadUrl || null;
  }

  /** Cancel a queued or running download. */
  async cancel(taskId: string): Promise<void> {
    const job = await this.downloadQueue.getJob(taskId).catch(() => null);
    if (job) {
      await job.remove();
    }
    inMemoryStore.delete(taskId);
  }
}
