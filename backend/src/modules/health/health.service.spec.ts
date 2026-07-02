import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../../database/prisma.service';
import { HealthService } from './health.service';

function makeService(opts: { dbUp?: boolean; redisEnabled?: boolean; redisUp?: boolean } = {}) {
  const { dbUp = true, redisEnabled = true, redisUp = true } = opts;
  const prisma = {
    $queryRaw: dbUp ? vi.fn().mockResolvedValue([1]) : vi.fn().mockRejectedValue(new Error('down')),
  } as unknown as PrismaService;
  const cache = {
    isEnabled: vi.fn().mockReturnValue(redisEnabled),
    ping: vi.fn().mockResolvedValue(redisUp),
  } as unknown as CacheService;
  const config = { get: vi.fn().mockReturnValue('9.9.9') } as unknown as ConfigService;
  return new HealthService(prisma, cache, config);
}

describe('HealthService.check', () => {
  it('reports ok when database and redis are up', async () => {
    const report = await makeService().check();
    expect(report.status).toBe('ok');
    expect(report.version).toBe('9.9.9');
    expect(report.checks.database.status).toBe('up');
    expect(report.checks.redis.status).toBe('up');
    expect(report.checks.memory.status).toBe('up');
    expect(typeof report.uptime).toBe('number');
  });

  it('reports ok when redis is disabled (non-critical)', async () => {
    const report = await makeService({ redisEnabled: false }).check();
    expect(report.status).toBe('ok');
    expect(report.checks.redis.status).toBe('disabled');
  });

  it('reports degraded when redis is down', async () => {
    const report = await makeService({ redisUp: false }).check();
    expect(report.status).toBe('degraded');
    expect(report.checks.redis.status).toBe('down');
  });

  it('reports error when the database is down', async () => {
    const report = await makeService({ dbUp: false }).check();
    expect(report.status).toBe('error');
    expect(report.checks.database.status).toBe('down');
  });
});

describe('HealthService.readiness / liveness', () => {
  it('is ready when the database is reachable', async () => {
    await expect(makeService().readiness()).resolves.toMatchObject({ status: 'ready' });
  });

  it('is 503 when the database is unreachable', async () => {
    await expect(makeService({ dbUp: false }).readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('liveness is always ok while the process runs', () => {
    expect(makeService().liveness()).toMatchObject({ status: 'ok' });
  });
});
