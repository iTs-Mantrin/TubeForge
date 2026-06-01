import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { YtdlpService } from '../services/ytdlp.service';
import { CacheService } from '../services/cache.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'youtube-downloads',
    }),
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService, YtdlpService, CacheService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
