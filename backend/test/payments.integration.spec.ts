import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { newId } from '../src/common/utils/id.util';
import { PrismaService } from '../src/database/prisma.service';
import { RazorpayService } from '../src/modules/payments/razorpay.service';

/**
 * Payment integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Razorpay is overridden with a stub — no external calls, no signature checks.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';

const fakeRazorpay = {
  createOrder: () => Promise.resolve({ id: 'rzp_test_order', amount: 0, currency: 'INR' }),
  getKeyId: () => 'rzp_test_key',
};

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(RazorpayService)
    .useValue(fakeRazorpay)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

async function signIn(app: NestExpressApplication, prisma: PrismaService, label: string) {
  const email = `pay_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return { agent, userId: user?.id ?? '' };
}

async function seedOrder(prisma: PrismaService, userId: string, status: 'PENDING' | 'CONFIRMED') {
  const id = newId();
  await prisma.order.create({
    data: {
      id,
      userId,
      status,
      shippingAddress: { city: 'Mumbai' },
      subtotal: '1600.00',
      grandTotal: '1600.00',
    },
  });
  return id;
}

describe.skipIf(!RUN)('Payments (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let payableOrder: string;
  let confirmedOrder: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    const a = await signIn(app, prisma, 'a');
    agent = a.agent;
    payableOrder = await seedOrder(prisma, a.userId, 'PENDING');
    confirmedOrder = await seedOrder(prisma, a.userId, 'CONFIRMED');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/create-order')
      .send({ orderId: payableOrder });
    expect(res.status).toBe(401);
  });

  it('creates a payment order for a payable order', async () => {
    const res = await agent.post('/api/v1/payments/create-order').send({ orderId: payableOrder });
    expect(res.status).toBe(201);
    expect(res.body.data.razorpayOrderId).toBe('rzp_test_order');
    expect(res.body.data.amount).toBe(160000);
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data.key).toBe('rzp_test_key');
    expect(typeof res.body.data.paymentId).toBe('string');
  });

  it('reuses the existing pending payment', async () => {
    const first = await agent.post('/api/v1/payments/create-order').send({ orderId: payableOrder });
    const second = await agent
      .post('/api/v1/payments/create-order')
      .send({ orderId: payableOrder });
    expect(second.body.data.paymentId).toBe(first.body.data.paymentId);
    const count = await prisma.payment.count({ where: { orderId: payableOrder } });
    expect(count).toBe(1);
  });

  it('rejects a non-payable order (422 ORDER_NOT_PAYABLE)', async () => {
    const res = await agent.post('/api/v1/payments/create-order').send({ orderId: confirmedOrder });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('ORDER_NOT_PAYABLE');
  });

  it('rejects a payment for an order owned by another user (404)', async () => {
    const b = await signIn(app, prisma, 'b');
    const res = await b.agent.post('/api/v1/payments/create-order').send({ orderId: payableOrder });
    expect(res.status).toBe(404);
  });
});
