import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

const RUN = process.env.RUN_DB_TESTS === 'true';

const ADDRESS = {
  fullName: 'Jane Doe',
  phone: '9876543210',
  addressLine1: '1 Road',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
};

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

async function signIn(app: NestExpressApplication, label: string) {
  const email = `addr_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  return agent;
}

describe.skipIf(!RUN)('Addresses (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await bootApp();
    agent = await signIn(app, 'a');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/addresses')).status).toBe(401);
  });

  it('supports full CRUD with default switching', async () => {
    const first = await agent.post('/api/v1/addresses').send({ ...ADDRESS, isDefault: true });
    expect(first.status).toBe(201);
    expect(first.body.data.isDefault).toBe(true);
    const firstId: string = first.body.data.id;

    const second = await agent
      .post('/api/v1/addresses')
      .send({ ...ADDRESS, fullName: 'Second', isDefault: true });
    expect(second.body.data.isDefault).toBe(true);
    const secondId: string = second.body.data.id;

    // Setting the second default clears the first.
    const firstAfter = await agent.get(`/api/v1/addresses/${firstId}`);
    expect(firstAfter.body.data.isDefault).toBe(false);

    const updated = await agent.patch(`/api/v1/addresses/${firstId}`).send({ city: 'Pune' });
    expect(updated.body.data.city).toBe('Pune');

    const madeDefault = await agent.patch(`/api/v1/addresses/${firstId}/default`);
    expect(madeDefault.body.data.isDefault).toBe(true);
    const secondAfter = await agent.get(`/api/v1/addresses/${secondId}`);
    expect(secondAfter.body.data.isDefault).toBe(false);

    expect((await agent.delete(`/api/v1/addresses/${secondId}`)).status).toBe(200);
    expect((await agent.get(`/api/v1/addresses/${secondId}`)).status).toBe(404);
  });

  it('enforces ownership across users (404)', async () => {
    const created = await agent.post('/api/v1/addresses').send(ADDRESS);
    const id: string = created.body.data.id;
    const other = await signIn(app, 'b');
    expect((await other.get(`/api/v1/addresses/${id}`)).status).toBe(404);
    expect((await other.patch(`/api/v1/addresses/${id}`).send({ city: 'X' })).status).toBe(404);
    expect((await other.delete(`/api/v1/addresses/${id}`)).status).toBe(404);
  });
});
