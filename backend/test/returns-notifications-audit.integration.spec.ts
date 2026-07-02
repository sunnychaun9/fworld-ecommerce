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
  const email = `rna_${label}_${Date.now()}@fworld.test`;
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

describe.skipIf(!RUN)('Returns, notifications & audit (integration)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let customer: ReturnType<typeof request.agent>;
  let outsider: ReturnType<typeof request.agent>;
  let customerId: string;
  let orderItemId: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);

    const adminAuth = await signIn(app, prisma, 'admin', true);
    admin = adminAuth.agent;
    const customerAuth = await signIn(app, prisma, 'cust', false);
    customer = customerAuth.agent;
    customerId = customerAuth.userId;
    const outsiderAuth = await signIn(app, prisma, 'out', false);
    outsider = outsiderAuth.agent;

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'RnaCat', slug: `rna-cat-${newId()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Rna Product',
        slug: `rna-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    const variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `RNA-${variantId}` },
    });

    const orderId = newId();
    await prisma.order.create({
      data: {
        id: orderId,
        userId: customerId,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        shippingAddress: { city: 'Mumbai' },
        subtotal: '800.00',
        grandTotal: '800.00',
      },
    });
    orderItemId = newId();
    await prisma.orderItem.create({
      data: {
        id: orderItemId,
        orderId,
        variantId,
        productName: 'Rna Product',
        productSlug: 'rna-product',
        variantSku: 'RNA',
        unitPrice: '800.00',
        quantity: 1,
        lineTotal: '800.00',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('runs the return flow with eligibility, isolation, and admin decisions', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/v1/returns')
          .send({ orderItemId, reason: 'x' })
      ).status,
    ).toBe(401);

    const created = await customer
      .post('/api/v1/returns')
      .send({ orderItemId, reason: 'Item was defective' });
    expect(created.status).toBe(201);
    expect(Number(created.body.data.refundAmount)).toBe(800);
    const returnId: string = created.body.data.id;

    const dup = await customer.post('/api/v1/returns').send({ orderItemId, reason: 'again' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('RETURN_EXISTS');

    expect(
      (await customer.get('/api/v1/returns')).body.data.some(
        (r: { id: string }) => r.id === returnId,
      ),
    ).toBe(true);
    expect((await outsider.get(`/api/v1/returns/${returnId}`)).status).toBe(404); // isolation

    // Customer cannot make admin decisions.
    expect(
      (await customer.patch(`/api/v1/returns/${returnId}`).send({ status: 'APPROVED' })).status,
    ).toBe(403);

    const approved = await admin
      .patch(`/api/v1/returns/${returnId}`)
      .send({ status: 'APPROVED', decisionReason: 'Approved' });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('APPROVED');

    // Invalid skip: APPROVED cannot jump to REFUNDED.
    const invalid = await admin.patch(`/api/v1/returns/${returnId}`).send({ status: 'REFUNDED' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.errors[0].code).toBe('INVALID_RETURN_TRANSITION');
  });

  it('runs the notification flow (admin create, user read, unread counts)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/notifications')).status).toBe(401);
    expect(
      (
        await customer
          .post('/api/v1/notifications')
          .send({ userId: customerId, type: 'SYSTEM', title: 't', message: 'm' })
      ).status,
    ).toBe(403);

    const created = await admin
      .post('/api/v1/notifications')
      .send({ userId: customerId, type: 'ORDER', title: 'Order shipped', message: 'On the way' });
    expect(created.status).toBe(201);
    const notificationId: string = created.body.data.id;

    const before = await customer.get('/api/v1/notifications');
    expect(before.body.data.unreadCount).toBeGreaterThanOrEqual(1);

    expect((await customer.patch(`/api/v1/notifications/${notificationId}/read`)).status).toBe(200);
    const afterRead = await customer.get('/api/v1/notifications');
    const item = afterRead.body.data.items.find((n: { id: string }) => n.id === notificationId);
    expect(item.readAt).not.toBeNull();

    expect((await customer.patch('/api/v1/notifications/read-all')).status).toBe(200);
    expect((await customer.get('/api/v1/notifications')).body.data.unreadCount).toBe(0);
  });

  it('records audit logs and restricts the audit endpoint to admins', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/audit')).status).toBe(401);
    expect((await customer.get('/api/v1/audit')).status).toBe(403);

    const audit = await admin.get('/api/v1/audit?entity=RETURN');
    expect(audit.status).toBe(200);
    expect(
      audit.body.data.items.some((a: { action: string }) => a.action === 'RETURN_DECISION'),
    ).toBe(true);
  });
});
