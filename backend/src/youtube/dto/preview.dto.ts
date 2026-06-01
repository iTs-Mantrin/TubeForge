import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class PreviewRequestDto {
  @ApiProperty({ description: 'YouTube video URL' })
  @IsString()
  @Matches(/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//, {
    message: 'Only YouTube URLs are allowed (youtube.com, youtu.be)',
  })
  url: string;
}

export class PreviewResponseDto {
  @ApiProperty() title: string;
  @ApiProperty() duration: number;
  @ApiProperty() uploader: string;
  @ApiProperty() thumbnail: string;
  @ApiProperty() webpageUrl: string;
  @ApiProperty({ type: [Object], description: 'All available formats (untruncated)' })
  formats: any[];
}

export class FormatInfo {
  @ApiPropertyOptional() formatId?: string;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() ext?: string;
  @ApiPropertyOptional() filesize?: number;
  @ApiPropertyOptional() vcodec?: string;
  @ApiPropertyOptional() acodec?: string;
  @ApiPropertyOptional() tbr?: number;
}
