import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { newId } from '../src/common/utils/id.util';
import { PrismaService } from '../src/database/prisma.service';

const RUN = process.env.RUN_DB_TESTS === 'true';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

async function signIn(
  app: NestExpressApplication,
  prisma: PrismaService,
  label: string,
  admin: boolean,
) {
  const email = `ops_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  if (admin) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
  }
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return { agent, userId: user?.id ?? '' };
}

describe.skipIf(!RUN)('Admin operations — orders, shipping, dashboard (integration)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let customer: ReturnType<typeof request.agent>;
  let outsider: ReturnType<typeof request.agent>;
  let variantId: string;
  let customerId: string;
  let orderA: string;
  let orderB: string;

  async function seedOrder(userId: string, status: string): Promise<string> {
    const id = newId();
    await prisma.order.create({
      data: {
        id,
        userId,
        status: status as never,
        paymentStatus: 'PAID',
        shippingAddress: { city: 'Mumbai' },
        subtotal: '800.00',
        grandTotal: '800.00',
      },
    });
    await prisma.orderItem.create({
      data: {
        id: newId(),
        orderId: id,
        variantId,
        productName: 'Ops Product',
        productSlug: 'ops-product',
        variantSku: 'OPS',
        unitPrice: '800.00',
        quantity: 1,
        lineTotal: '800.00',
      },
    });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'OpsCat', slug: `ops-cat-${newId()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Ops Product',
        slug: `ops-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `OPS-${variantId}` },
    });

    const adminAuth = await signIn(app, prisma, 'admin', true);
    admin = adminAuth.agent;
    const customerAuth = await signIn(app, prisma, 'cust', false);
    customer = customerAuth.agent;
    customerId = customerAuth.userId;
    const outsiderAuth = await signIn(app, prisma, 'out', false);
    outsider = outsiderAuth.agent;

    orderA = await seedOrder(customerId, 'PENDING');
    orderB = await seedOrder(customerId, 'CONFIRMED');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('blocks unauthenticated and non-admin access to admin endpoints', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/admin/orders')).status).toBe(401);
    expect((await customer.get('/api/v1/admin/orders')).status).toBe(403);
    expect((await customer.get('/api/v1/dashboard')).status).toBe(403);
    expect(
      (
        await customer
          .post('/api/v1/shipping')
          .send({ orderId: orderA, courier: 'X', trackingNumber: 'X' })
      ).status,
    ).toBe(403);
  });

  it('lists and transitions orders through the lifecycle with guards', async () => {
    const list = await admin.get('/api/v1/admin/orders');
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((o: { id: string }) => o.id === orderA)).toBe(true);

    const confirmed = await admin
      .patch(`/api/v1/admin/orders/${orderA}/status`)
      .send({ status: 'CONFIRMED' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe('CONFIRMED');

    // Invalid skip: CONFIRMED cannot jump to DELIVERED.
    const invalid = await admin
      .patch(`/api/v1/admin/orders/${orderA}/status`)
      .send({ status: 'DELIVERED' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.errors[0].code).toBe('INVALID_STATUS_TRANSITION');

    const processing = await admin
      .patch(`/api/v1/admin/orders/${orderA}/status`)
      .send({ status: 'PROCESSING' });
    expect(processing.status).toBe(200);

    const detail = await admin.get(`/api/v1/admin/orders/${orderA}`);
    expect(detail.body.data.statusHistory.length).toBeGreaterThanOrEqual(2);
  });

  it('runs the shipment flow and enforces uniqueness', async () => {
    const created = await admin
      .post('/api/v1/shipping')
      .send({ orderId: orderA, courier: 'BlueDart', trackingNumber: `TRK-${orderA}` });
    expect(created.status).toBe(201);
    const shipmentId: string = created.body.data.id;

    // Order auto-marked SHIPPED.
    const afterShip = await admin.get(`/api/v1/admin/orders/${orderA}`);
    expect(afterShip.body.data.status).toBe('SHIPPED');

    // One shipment per order.
    const dup = await admin
      .post('/api/v1/shipping')
      .send({ orderId: orderA, courier: 'BlueDart', trackingNumber: `TRK2-${orderA}` });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SHIPMENT_EXISTS');

    // Tracking number is unique across orders.
    const dupTracking = await admin
      .post('/api/v1/shipping')
      .send({ orderId: orderB, courier: 'BlueDart', trackingNumber: `TRK-${orderA}` });
    expect(dupTracking.status).toBe(409);
    expect(dupTracking.body.errors[0].code).toBe('TRACKING_NUMBER_TAKEN');

    expect((await admin.get(`/api/v1/shipping/${shipmentId}`)).status).toBe(200);

    // Delivering the shipment marks the order DELIVERED.
    const delivered = await admin.patch(`/api/v1/shipping/${shipmentId}`).send({ delivered: true });
    expect(delivered.status).toBe(200);
    const afterDeliver = await admin.get(`/api/v1/admin/orders/${orderA}`);
    expect(afterDeliver.body.data.status).toBe('DELIVERED');
  });

  it('exposes customer tracking scoped to the order owner', async () => {
    const owner = await customer.get(`/api/v1/orders/${orderA}/tracking`);
    expect(owner.status).toBe(200);
    expect(owner.body.data.trackingNumber).toBe(`TRK-${orderA}`);

    // A different customer cannot see it.
    expect((await outsider.get(`/api/v1/orders/${orderA}/tracking`)).status).toBe(404);
    // Unauthenticated is rejected.
    expect(
      (await request(app.getHttpServer()).get(`/api/v1/orders/${orderA}/tracking`)).status,
    ).toBe(401);
  });

  it('returns the admin dashboard summary', async () => {
    const res = await admin.get('/api/v1/dashboard');
    expect(res.status).toBe(200);
    const body = res.body.data;
    for (const key of ['sales', 'orders', 'customers', 'products', 'inventory', 'revenue']) {
      expect(body).toHaveProperty(key);
    }
    expect(Array.isArray(body.recentOrders)).toBe(true);
    expect(body.orders.total).toBeGreaterThanOrEqual(2);
    expect(body.revenue.total).toBeGreaterThanOrEqual(0);
  });
});
