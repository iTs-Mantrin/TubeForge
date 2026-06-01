import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgressResponseDto {
  @ApiProperty() taskId: string;
  @ApiProperty() percent: number;
  @ApiProperty() speed: string;
  @ApiProperty() eta: string;
  @ApiProperty() filename: string;
  @ApiProperty() status: string; // queued | downloading | processing | done | error
  @ApiPropertyOptional() errorMsg?: string;
  @ApiPropertyOptional() downloadUrl?: string;
}
