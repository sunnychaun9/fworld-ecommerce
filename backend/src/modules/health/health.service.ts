import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../../database/prisma.service';

export type CheckStatus = 'up' | 'down' | 'disabled';

export interface HealthCheck {
  status: CheckStatus;
  [key: string]: unknown;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  checks: { database: HealthCheck; redis: HealthCheck; memory: HealthCheck };
  version: string;
  uptime: number;
}

const MB = 1024 * 1024;

/**
 * Health service. Aggregates liveness/readiness signals for PostgreSQL, Redis,
 * process memory and uptime. All Prisma access is a lightweight `SELECT 1`; Redis
 * is a non-critical dependency (its absence yields `degraded`, not `error`).
 */
@Injectable()
export class HealthService {
  private readonly version: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.version = config.get<string>('version', '0.1.0');
  }

  async check(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const memory = this.checkMemory();

    let status: HealthReport['status'] = 'ok';
    if (database.status !== 'up') {
      status = 'error';
    } else if (redis.status === 'down') {
      status = 'degraded';
    }

    return {
      status,
      checks: { database, redis, memory },
      version: this.version,
      uptime: Math.round(process.uptime()),
    };
  }

  liveness(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  async readiness(): Promise<{ status: 'ready'; checks: { database: HealthCheck } }> {
    const database = await this.checkDatabase();
    if (database.status !== 'up') {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database not reachable',
      });
    }
    return { status: 'ready', checks: { database } };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return { status: 'down', error: String(error) };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    if (!this.cache.isEnabled()) {
      return { status: 'disabled' };
    }
    return { status: (await this.cache.ping()) ? 'up' : 'down' };
  }

  private checkMemory(): HealthCheck {
    const usage = process.memoryUsage();
    return {
      status: 'up',
      rssMb: Math.round(usage.rss / MB),
      heapUsedMb: Math.round(usage.heapUsed / MB),
      heapTotalMb: Math.round(usage.heapTotal / MB),
    };
  }
}
