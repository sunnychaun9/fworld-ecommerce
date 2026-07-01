import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Category integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers the CRUD flow, nesting, slug uniqueness, cycle prevention, non-empty
 * delete protection, and admin authorization.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';

async function bootApp(): Promise<NestExpressApplication> {
  // These flows issue many requests from one loopback IP; rate limiting is a
  // production feature validated by unit tests — disable it here for determinism.
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

describe.skipIf(!RUN)('Categories (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let admin: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await bootApp();
    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE categories RESTART IDENTITY CASCADE');

    // Create an authenticated ADMIN (promote via DB, then sign in).
    const email = `cat_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Cat Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });

  it('creates a root category, a child, and reads them back', async () => {
    const root = await admin.post('/api/v1/categories').send({ name: 'Topwear' });
    expect(root.status).toBe(201);
    expect(root.body.data.slug).toBe('topwear');

    const child = await admin
      .post('/api/v1/categories')
      .send({ name: 'T-Shirts', parentId: root.body.data.id });
    expect(child.status).toBe(201);
    expect(child.body.data.parentId).toBe(root.body.data.id);

    const roots = await request(app.getHttpServer()).get('/api/v1/categories?rootOnly=true');
    expect(roots.status).toBe(200);
    expect(roots.body.data.items.some((c: { slug: string }) => c.slug === 'topwear')).toBe(true);
    expect(roots.body.data.pageInfo.total).toBeGreaterThanOrEqual(1);

    const bySlug = await request(app.getHttpServer()).get('/api/v1/categories/slug/t-shirts');
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.data.id).toBe(child.body.data.id);
  });

  it('rejects a duplicate slug (409 SLUG_TAKEN)', async () => {
    await admin.post('/api/v1/categories').send({ name: 'Jeans', slug: 'jeans' });
    const dup = await admin.post('/api/v1/categories').send({ name: 'Jeans 2', slug: 'jeans' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SLUG_TAKEN');
  });

  it('prevents a category cycle (422 CATEGORY_CYCLE)', async () => {
    const a = await admin.post('/api/v1/categories').send({ name: 'Bottomwear' });
    const b = await admin
      .post('/api/v1/categories')
      .send({ name: 'Trousers', parentId: a.body.data.id });
    // Try to make A a child of its own descendant B → cycle.
    const res = await admin
      .patch(`/api/v1/categories/${a.body.data.id}`)
      .send({ parentId: b.body.data.id });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('CATEGORY_CYCLE');
  });

  it('blocks deleting a non-empty category, then allows it once emptied', async () => {
    const parent = await admin.post('/api/v1/categories').send({ name: 'Outerwear' });
    const kid = await admin
      .post('/api/v1/categories')
      .send({ name: 'Jackets', parentId: parent.body.data.id });

    const blocked = await admin.delete(`/api/v1/categories/${parent.body.data.id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.errors[0].code).toBe('CATEGORY_NOT_EMPTY');

    expect((await admin.delete(`/api/v1/categories/${kid.body.data.id}`)).status).toBe(200);
    expect((await admin.delete(`/api/v1/categories/${parent.body.data.id}`)).status).toBe(200);
  });
});
