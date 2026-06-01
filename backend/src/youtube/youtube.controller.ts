import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import {
  PreviewRequestDto,
  PreviewResponseDto,
} from './dto/preview.dto';
import { DownloadRequestDto, DownloadResponseDto } from './dto/download.dto';
import { ProgressResponseDto } from './dto/progress.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('YouTube')
@Controller('api/v1/youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Get video metadata before downloading' })
  async preview(
    @Body() dto: PreviewRequestDto,
  ): Promise<PreviewResponseDto> {
    const info = await this.youtubeService.preview(dto.url);
    if (!info) {
      throw new HttpException(
        'Could not fetch video info',
        HttpStatus.BAD_REQUEST,
      );
    }
    return info;
  }

  @Post('download')
  @ApiOperation({ summary: 'Start a YouTube download job in the queue' })
  async download(@Body() dto: DownloadRequestDto): Promise<DownloadResponseDto> {
    const taskId = uuidv4();
    await this.youtubeService.enqueueDownload(taskId, dto);
    return {
      taskId,
      status: 'queued',
      source: 'youtube',
      message: 'Download job queued',
    };
  }

  @Get('progress/:taskId')
  @ApiOperation({ summary: 'Poll download progress by task ID' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  async progress(@Param('taskId') taskId: string): Promise<ProgressResponseDto> {
    const state = await this.youtubeService.getProgress(taskId);
    if (!state) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return state;
  }

  @Get('file/:taskId')
  @ApiOperation({ summary: 'Get the presigned / CDN download URL for a completed download' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  async file(@Param('taskId') taskId: string) {
    const url = await this.youtubeService.getDownloadUrl(taskId);
    if (!url) {
      throw new HttpException(
        'File not available — download may still be in progress',
        HttpStatus.NOT_FOUND,
      );
    }
    return { downloadUrl: url };
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Cancel a queued or running download' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  async cancel(@Param('taskId') taskId: string) {
    await this.youtubeService.cancel(taskId);
    return { status: 'cancelled' };
  }
}
