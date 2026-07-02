import { createHmac } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { newId } from '../src/common/utils/id.util';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Payment verification + webhook integration tests (requires PostgreSQL; gated by
 * `RUN_DB_TESTS=true`). Uses real HMAC signature verification with test secrets.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';
const KEY_SECRET = 'test_secret';
const WEBHOOK_SECRET = 'whsec_test';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  process.env.RAZORPAY_KEY_ID = 'test_key';
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

function paymentSignature(orderId: string, paymentId: string): string {
  return createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}

interface Scenario {
  orderId: string;
  variantId: string;
  paymentId: string;
  providerOrderId: string;
}

describe.skipIf(!RUN)('Payment verification & webhooks (integration)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let userId: string;

  async function seed(providerOrderId: string): Promise<Scenario> {
    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'VerCat', slug: `ver-cat-${newId()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Ver Product',
        slug: `ver-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    const variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `VER-${variantId}`, size: 'M', color: 'Black' },
    });
    // Reflects a placed order: 2 units already moved from available to reserved.
    await prisma.inventory.create({
      data: { id: newId(), variantId, availableStock: 8, reservedStock: 2 },
    });
    const orderId = newId();
    await prisma.order.create({
      data: {
        id: orderId,
        userId,
        shippingAddress: { city: 'Mumbai' },
        subtotal: '1600.00',
        grandTotal: '1600.00',
      },
    });
    await prisma.orderItem.create({
      data: {
        id: newId(),
        orderId,
        variantId,
        productName: 'Ver Product',
        productSlug: 'ver-product',
        variantSku: 'VER',
        unitPrice: '800.00',
        quantity: 2,
        lineTotal: '1600.00',
      },
    });
    const paymentId = newId();
    await prisma.payment.create({
      data: {
        id: paymentId,
        orderId,
        provider: 'RAZORPAY',
        providerOrderId,
        amount: '1600.00',
        currency: 'INR',
      },
    });
    return { orderId, variantId, paymentId, providerOrderId };
  }

  function postWebhook(event: unknown) {
    const raw = JSON.stringify(event);
    const signature = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    return request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(raw);
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    const email = `verify_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Verify User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    userId = user?.id ?? '';
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated verification (401)', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/payments/verify').send({
      paymentId: newId(),
      razorpayOrderId: 'x',
      razorpayPaymentId: 'y',
      razorpaySignature: 'z',
    });
    expect(res.status).toBe(401);
  });

  it('verifies a valid signature: marks PAID, confirms order, releases reservation (idempotent)', async () => {
    const s = await seed('order_ok');
    const res = await agent.post('/api/v1/payments/verify').send({
      paymentId: s.paymentId,
      razorpayOrderId: 'order_ok',
      razorpayPaymentId: 'rzp_ok',
      razorpaySignature: paymentSignature('order_ok', 'rzp_ok'),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PAID');

    const order = await prisma.order.findUnique({ where: { id: s.orderId } });
    expect(order?.paymentStatus).toBe('PAID');
    expect(order?.status).toBe('CONFIRMED');
    let inv = await prisma.inventory.findUnique({ where: { variantId: s.variantId } });
    expect(inv?.reservedStock).toBe(0);
    expect(inv?.availableStock).toBe(8);

    // Duplicate verification is idempotent (no further inventory change).
    const again = await agent.post('/api/v1/payments/verify').send({
      paymentId: s.paymentId,
      razorpayOrderId: 'order_ok',
      razorpayPaymentId: 'rzp_ok',
      razorpaySignature: paymentSignature('order_ok', 'rzp_ok'),
    });
    expect(again.body.data.status).toBe('PAID');
    inv = await prisma.inventory.findUnique({ where: { variantId: s.variantId } });
    expect(inv?.reservedStock).toBe(0);
    expect(inv?.availableStock).toBe(8);
  });

  it('rejects an invalid signature (422) and leaves the payment PENDING', async () => {
    const s = await seed('order_bad');
    const res = await agent.post('/api/v1/payments/verify').send({
      paymentId: s.paymentId,
      razorpayOrderId: 'order_bad',
      razorpayPaymentId: 'rzp_bad',
      razorpaySignature: 'invalid',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('INVALID_PAYMENT_SIGNATURE');
    const payment = await prisma.payment.findUnique({ where: { id: s.paymentId } });
    expect(payment?.status).toBe('PENDING');
  });

  it('handles payment.failed webhook: FAILED, order PENDING, inventory restored', async () => {
    const s = await seed('order_fail');
    const res = await postWebhook({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'rzp_fail', order_id: 'order_fail' } } },
    });
    expect(res.status).toBe(201);
    const order = await prisma.order.findUnique({ where: { id: s.orderId } });
    expect(order?.paymentStatus).toBe('FAILED');
    expect(order?.status).toBe('PENDING');
    const inv = await prisma.inventory.findUnique({ where: { variantId: s.variantId } });
    expect(inv?.availableStock).toBe(10);
    expect(inv?.reservedStock).toBe(0);
  });

  it('handles payment.captured webhook idempotently (duplicate delivery safe)', async () => {
    const s = await seed('order_cap');
    const event = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'rzp_cap', order_id: 'order_cap' } } },
    };
    expect((await postWebhook(event)).status).toBe(201);
    let inv = await prisma.inventory.findUnique({ where: { variantId: s.variantId } });
    expect(inv?.reservedStock).toBe(0);
    expect(inv?.availableStock).toBe(8);

    // Duplicate delivery must not touch inventory again.
    expect((await postWebhook(event)).status).toBe(201);
    inv = await prisma.inventory.findUnique({ where: { variantId: s.variantId } });
    expect(inv?.reservedStock).toBe(0);
    expect(inv?.availableStock).toBe(8);

    const order = await prisma.order.findUnique({ where: { id: s.orderId } });
    expect(order?.status).toBe('CONFIRMED');
  });

  it('rejects a webhook with an invalid signature (400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'bad')
      .send(JSON.stringify({ event: 'payment.captured' }));
    expect(res.status).toBe(400);
  });
});
