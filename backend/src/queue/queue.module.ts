import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YoutubeProcessor } from './youtube.processor';
import { YtdlpService } from '../services/ytdlp.service';
import { UploadService } from '../services/upload.service';
import { CleanupService } from '../services/cleanup.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          db: config.get<number>('redis.db'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'youtube-downloads',
    }),
  ],
  providers: [
    YoutubeProcessor,
    YtdlpService,
    UploadService,
    CleanupService,
  ],
  exports: [BullModule, YtdlpService, UploadService, CleanupService],
})
export class QueueModule {}
