import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/**
 * INTEGRATION TESTS — require a live PostgreSQL 16 with the Better Auth migration
 * applied. These are deliberately separated from the unit suite: they live under
 * `test/` (excluded from the default `vitest run`) and only execute when
 * `RUN_DB_TESTS=true`. Run with: `pnpm --filter @fworld/backend test:integration`
 * after `docker compose up -d postgres` and `prisma migrate deploy`.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';

describe.skipIf(!RUN)('Auth methods (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let httpServer: Parameters<typeof request>[0];
  const email = `user_${Date.now()}@example.com`;
  const password = 'Sup3rSecret!pw';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApp(app, app.get(ConfigService));
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers a new user (POST /auth/sign-up/email)', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Test User' });
    expect([200, 201]).toContain(res.status);
  });

  it('rejects invalid credentials (401)', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/sign-in/email')
      .send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in, retrieves session, reads /me, then logout revokes the session', async () => {
    const agent = request.agent(httpServer);

    const login = await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toBeDefined();

    // Better Auth native session lookup.
    const session = await agent.get('/api/v1/auth/get-session');
    expect(session.status).toBe(200);
    expect(session.body?.user?.email).toBe(email);

    // FWorld authenticated endpoint (Nest, global envelope) via AuthGuard.
    const me = await agent.get('/api/v1/me');
    expect(me.status).toBe(200);
    expect(me.body.success).toBe(true);
    expect(me.body.data).toMatchObject({ role: 'CUSTOMER', status: 'ACTIVE' });
    expect(typeof me.body.data.userId).toBe('string');

    // Logout revokes the DB session.
    const logout = await agent.post('/api/v1/auth/sign-out');
    expect([200, 204]).toContain(logout.status);

    // Subsequent /me is now unauthorized.
    const meAfter = await agent.get('/api/v1/me');
    expect(meAfter.status).toBe(401);
    expect(meAfter.body.success).toBe(false);
  });

  it('rejects /me without authentication (401, enveloped)', async () => {
    const res = await request(httpServer).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows public health without authentication', async () => {
    const res = await request(httpServer).get('/health');
    expect(res.status).toBe(200);
  });
});
