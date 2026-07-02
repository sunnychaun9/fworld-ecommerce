import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { setupSwagger } from '../src/swagger.setup';

const RUN = process.env.RUN_DB_TESTS === 'true';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  process.env.RATE_LIMIT_TTL = '60000';
  process.env.RATE_LIMIT_LIMIT = '3';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  setupSwagger(app, '9.9.9');
  await app.init();
  return app;
}

describe.skipIf(!RUN)('Health, Swagger & security (integration)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await bootApp();
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.RATE_LIMIT_TTL;
    delete process.env.RATE_LIMIT_LIMIT;
  });

  it('exposes health, liveness and readiness probes (public, no prefix)', async () => {
    const health = await request(app.getHttpServer()).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.data.status).toBeDefined();
    expect(health.body.data.checks).toHaveProperty('database');
    expect(health.body.data.checks).toHaveProperty('redis');
    expect(health.body.data.checks).toHaveProperty('memory');
    expect(health.body.data).toHaveProperty('version');
    expect(health.body.data).toHaveProperty('uptime');

    expect((await request(app.getHttpServer()).get('/health/live')).body.data.status).toBe('ok');

    const ready = await request(app.getHttpServer()).get('/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.data.status).toBe('ready');
  });

  it('serves the OpenAPI document at /api/docs', async () => {
    const json = await request(app.getHttpServer()).get('/api/docs-json');
    expect(json.status).toBe(200);
    expect(json.body.info.title).toBe('FWorld API');
    expect(json.body.paths['/api/v1/search/products']).toBeDefined();
    expect(json.body.components.securitySchemes).toHaveProperty('JWT');

    expect((await request(app.getHttpServer()).get('/api/docs')).status).toBe(200);
  });

  it('sets secure headers via helmet', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });

  it('rate-limits throttled routes beyond the configured limit', async () => {
    const path = '/api/v1/search/products?q=rate-limit-probe';
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(app.getHttpServer()).get(path)).status);
    }
    expect(statuses.filter((s) => s === 200).length).toBe(3); // limit = 3
    expect(statuses).toContain(429);
  });
});
