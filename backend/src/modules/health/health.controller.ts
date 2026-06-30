import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 * System health endpoints (excluded from the global API prefix and rate limiting
 * via `@SkipThrottle` is unnecessary here as they are infrastructure probes).
 * - `GET /health`        liveness (process is up)
 * - `GET /health/ready`  readiness (dependencies reachable)
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  liveness(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }

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
