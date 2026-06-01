import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
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
      this.logger.warn(
        'R2 not configured — downloads will be served locally',
      );
    }
  }

  /** Upload a local file to R2. Returns the remote object key. */
  async store(localPath: string): Promise<string> {
    if (!this.client) {
      throw new Error('R2 is not configured');
    }

    const key = `downloads/${path.basename(localPath)}`;
    const body = fs.createReadStream(localPath);
    const contentType = this.guessMime(localPath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.log(`Uploaded ${key} to R2 bucket ${this.bucket}`);
    return key;
  }

  /** Get a presigned download URL valid for TTL seconds. */
  async getDownloadUrl(key: string, filename: string): Promise<string> {
    if (!this.client) {
      throw new Error('R2 is not configured');
    }

    // If public URL is configured, return direct public URL
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    // Otherwise generate a presigned URL
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    return getSignedUrl(this.client, command, { expiresIn: this.presignTtl });
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
