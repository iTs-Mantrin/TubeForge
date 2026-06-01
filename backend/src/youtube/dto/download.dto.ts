import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class DownloadRequestDto {
  @ApiProperty({ description: 'YouTube video URL' })
  @IsString()
  @Matches(/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//, {
    message: 'Only YouTube URLs are allowed (youtube.com, youtu.be)',
  })
  url: string;

  @ApiPropertyOptional({
    description:
      'Quality / yt-dlp format string. Named presets (highest, 1080p, 720p, …) ' +
      'or raw format selectors like "bestvideo[height<=2160]+bestaudio/best"',
    default: 'highest',
  })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({
    description: 'Extract audio only as MP3',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  audioOnly?: boolean;
}

export class DownloadResponseDto {
  @ApiProperty() taskId: string;
  @ApiProperty() status: string;
  @ApiProperty() source: string;
  @ApiPropertyOptional() message?: string;
}
