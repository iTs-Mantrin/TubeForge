import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { spawn } from 'child_process';
import * as os from 'os';

@ApiTags('Health')
@Controller('api/v1')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private startTime = Date.now();

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async health(): Promise<HealthResponse> {
    const ytDlpVersion = await this.getYtDlpVersion().catch(() => 'unknown');

    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      system: {
        memory: {
          free: os.freemem(),
          total: os.totalmem(),
          usagePercent: Math.round(
            ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
          ),
        },
        cpu: os.cpus().length,
        platform: os.platform(),
        loadAvg: os.loadavg(),
      },
      dependencies: {
        ytDlp: ytDlpVersion,
      },
    };
  }

  @Get('healthz')
  @ApiOperation({ summary: 'Kubernetes-style liveness probe' })
  healthz(): { ok: boolean } {
    return { ok: true };
  }

  private getYtDlpVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', ['--version'], { timeout: 5000 });
      let out = '';
      proc.stdout.on('data', (d: Buffer) => (out += d.toString()));
      proc.on('close', (code) =>
        code === 0 ? resolve(out.trim()) : reject(new Error(out)),
      );
      proc.on('error', reject);
    });
  }
}

interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  system: {
    memory: { free: number; total: number; usagePercent: number };
    cpu: number;
    platform: string;
    loadAvg: number[];
  };
  dependencies: {
    ytDlp: string;
  };
}
