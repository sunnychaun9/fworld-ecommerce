import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { newId } from '../src/common/utils/id.util';
import { CacheService } from '../src/modules/cache/cache.service';
import { JobsService } from '../src/modules/jobs/jobs.service';
import { PrismaService } from '../src/database/prisma.service';

const RUN = process.env.RUN_DB_TESTS === 'true';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  process.env.REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
  process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
  process.env.CACHE_ENABLED = 'true';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

async function signInAdmin(app: NestExpressApplication, prisma: PrismaService) {
  const email = `scj_admin_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: 'admin' });
  await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return { agent, userId: user?.id ?? '' };
}

async function waitFor<T>(read: () => Promise<T>, present: boolean, tries = 30): Promise<T> {
  let value = await read();
  for (let i = 0; i < tries && (value !== null) !== present; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    value = await read();
  }
  return value;
}

describe.skipIf(!RUN)('Search, cache & jobs (integration — requires PostgreSQL + Redis)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let cache: CacheService;
  let jobs: JobsService;
  let admin: ReturnType<typeof request.agent>;
  let orderId: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    cache = app.get(CacheService);
    jobs = app.get(JobsService);

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'Shirts', slug: `shirts-${newId()}` },
    });
    const brandId = newId();
    await prisma.brand.create({ data: { id: brandId, name: 'Acme', slug: `acme-${newId()}` } });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Blue Oxford Shirt',
        slug: `blue-oxford-${newId()}`,
        categoryId,
        brandId,
        mrp: '2000.00',
        sellingPrice: '1500.00',
        status: 'ACTIVE',
      },
    });
    await prisma.productVariant.create({
      data: { id: newId(), productId, sku: `OX-${newId()}`, size: 'M', color: 'Blue' },
    });

    const adminAuth = await signInAdmin(app, prisma);
    admin = adminAuth.agent;

    orderId = newId();
    await prisma.order.create({
      data: {
        id: orderId,
        userId: adminAuth.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddress: { city: 'Mumbai' },
        subtotal: '1500.00',
        grandTotal: '1500.00',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.CACHE_ENABLED;
  });

  it('searches ACTIVE products with pagination and facets (public)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/search/products?q=oxford');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 20 });
    expect(res.body.data.facets).toHaveProperty('brands');
    expect(res.body.data.facets).toHaveProperty('categories');
    expect(res.body.data.facets.categories.some((c: { name: string }) => c.name === 'Shirts')).toBe(
      true,
    );
  });

  it('confirms Redis is enabled for this suite', () => {
    expect(cache.isEnabled()).toBe(true);
  });

  it('caches the dashboard and invalidates it on an order change', async () => {
    // Start from a clean dashboard cache.
    await cache.invalidateOrders();

    const dash = await admin.get('/api/v1/dashboard');
    expect(dash.status).toBe(200);
    const cached = await waitFor(() => cache.get('cache:dashboard'), true);
    expect(cached).not.toBeNull();

    // An order status change invalidates the dashboard namespace.
    const patched = await admin
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .send({ status: 'CONFIRMED' });
    expect(patched.status).toBe(200);
    const afterInvalidate = await waitFor(() => cache.get('cache:dashboard'), false);
    expect(afterInvalidate).toBeNull();
  });

  it('executes cleanup jobs without error', async () => {
    await expect(jobs.cleanupExpiredCoupons()).resolves.toBeTypeOf('number');
    await expect(jobs.cleanupExpiredNotifications()).resolves.toBeTypeOf('number');
    await expect(jobs.cleanupAbandonedCarts()).resolves.toBeTypeOf('number');
    await expect(jobs.deleteExpiredPendingPayments()).resolves.toBeTypeOf('number');
    await expect(jobs.recomputeRecommendationCaches()).resolves.toBeUndefined();
  });
});
