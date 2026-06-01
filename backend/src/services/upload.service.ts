import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';
  private presignTtl = 3600;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('r2.endpoint');
    const accessKeyId = this.configService.get<string>('r2.accessKeyId');
    const secretAccessKey = this.configService.get<string>('r2.secretAccessKey');
    this.bucket = this.configService.get<string>('r2.bucket') || 'youtube-downloads';
    this.publicUrl = this.configService.get<string>('r2.publicUrl') || '';
    this.presignTtl = this.configService.get<number>('r2.presignTtl') || 3600;

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
    } else {
      this.logger.warn('R2 not configured — uploads disabled');
    }
  }

  /**
   * Upload a file to R2 using multipart streaming (@aws-sdk/lib-storage).
   * Returns the remote object key.
   */
  async store(localPath: string): Promise<string> {
    if (!this.client) {
      throw new Error('R2 is not configured');
    }

    const key = `downloads/${path.basename(localPath)}`;
    const contentType = this.guessMime(localPath);

    const body = fs.createReadStream(localPath);

    const parallelUpload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
      queueSize: 4,        // concurrent part uploads
      partSize: 5 * 1024 * 1024, // 5 MB parts (minimum)
      leavePartsOnError: false,
    });

    parallelUpload.on('httpUploadProgress', (progress) => {
      this.logger.debug(
        `R2 upload ${key}: ${progress.loaded}/${progress.total} bytes`,
      );
    });

    await parallelUpload.done();
    this.logger.log(`Uploaded ${key} to R2 bucket ${this.bucket}`);
    return key;
  }

  /**
   * Get a presigned download URL valid for TTL seconds.
   */
  async getDownloadUrl(key: string, filename: string): Promise<string> {
    if (!this.client) {
      throw new Error('R2 is not configured');
    }

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: this.presignTtl,
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private guessMime(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}
