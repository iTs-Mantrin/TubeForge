import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');
    const db = this.configService.get<number>('redis.db');

    this.defaultTtl = 3600; // 1 hour default

    try {
      this.redis = new Redis({
        host,
        port,
        password: password || undefined,
        db,
        keyPrefix: 'yt:cache:',
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null; // give up
          return Math.min(times * 200, 2000);
        },
      });
      this.redis.on('error', (err) => {
        this.logger.warn(`Redis cache error: ${err.message}`);
      });
    } catch {
      this.logger.warn('Redis unavailable — cache disabled');
    }
  }

  /**
   * Get a cached value. Returns null if missing or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (entry.expiresAt < Date.now()) {
        await this.redis.del(key).catch(() => {});
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Set a cached value with TTL in seconds.
   */
  async set<T>(
    key: string,
    data: T,
    ttlSeconds: number = this.defaultTtl,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      await this.redis.setex(key, ttlSeconds, JSON.stringify(entry));
    } catch (err: any) {
      this.logger.warn(`Cache set failed: ${err.message}`);
    }
  }

  /**
   * Invalidate a cache key.
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // ignore
    }
  }

  /**
   * Build cache key for video metadata.
   */
  metadataKey(url: string): string {
    return `meta:${Buffer.from(url).toString('base64url').slice(0, 48)}`;
  }

  /**
   * Build cache key for download result by taskId + quality.
   */
  downloadKey(taskId: string, quality: string): string {
    return `dl:${taskId}:${quality}`;
  }
}
