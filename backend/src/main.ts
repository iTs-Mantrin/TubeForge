import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CleanupService } from './services/cleanup.service';
import { PinoLogger } from './common/utils/pino-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new PinoLogger(),
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ── Global pipes ─────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global filters / interceptors ────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── CORS ─────────────────────────────────────────
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((o) => o.trim())
      : true,
    credentials: true,
  });

  // ── Swagger docs ─────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('YouTube Downloader API')
    .setDescription('Download YouTube videos/audio via yt-dlp with BullMQ queue + R2 storage')
    .setVersion('1.0')
    .addTag('YouTube')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // ── Start cleanup service ────────────────────────
  const cleanupService = app.get(CleanupService);
  cleanupService.start();

  // ── Start ────────────────────────────────────────
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
  logger.log(`Swagger docs at http://${host}:${port}/docs`);
  logger.log(`API base path: /api/v1`);
}

bootstrap();
