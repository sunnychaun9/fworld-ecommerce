import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

/**
 * System health endpoints (public infrastructure probes; excluded from the
 * global API prefix).
 * - `GET /health`        liveness (process is up)
 * - `GET /health/ready`  readiness (dependencies reachable)
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  liveness(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Public()
  @Get('ready')
  async readiness(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up' };
    } catch {
      throw new ServiceUnavailableException('Database not reachable');
    }
  }
}
