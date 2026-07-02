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
 * Order integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers order creation, inventory reservation, cart clearing, user isolation.
 */
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
  const email = `order_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  return agent;
}

describe.skipIf(!RUN)('Orders (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let variantId: string;

  async function seedVariant(stock: number): Promise<string> {
    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'OrderCat', slug: `order-cat-${newId()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Order Product',
        slug: `order-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    const v = newId();
    await prisma.productVariant.create({
      data: { id: v, productId, sku: `ORD-${v}`, size: 'M', color: 'Black' },
    });
    await prisma.inventory.create({ data: { id: newId(), variantId: v, availableStock: stock } });
    return v;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    variantId = await seedVariant(10);
    agent = await signIn(app, 'a');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/orders')).status).toBe(401);
  });

  it('creates an order: reserves inventory, clears the cart, snapshots totals', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId, quantity: 2 });
    const res = await agent.post('/api/v1/orders').send({ shippingAddress: ADDRESS });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.paymentStatus).toBe('PENDING');
    expect(Number(res.body.data.grandTotal)).toBe(1600);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productName).toBe('Order Product');
    expect(Number(res.body.data.items[0].unitPrice)).toBe(800);
    expect(res.body.data.shippingAddress.city).toBe('Mumbai');

    const inv = await prisma.inventory.findUnique({ where: { variantId } });
    expect(inv?.availableStock).toBe(8);
    expect(inv?.reservedStock).toBe(2);

    const cart = await agent.get('/api/v1/cart');
    expect(cart.body.data.items).toEqual([]);
  });

  it('rejects an order when the cart is empty (422 EMPTY_CART)', async () => {
    const res = await agent.post('/api/v1/orders').send({ shippingAddress: ADDRESS });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('EMPTY_CART');
  });

  it('rejects when requested quantity exceeds stock (422 INSUFFICIENT_STOCK)', async () => {
    const lowVariant = await seedVariant(1);
    await agent.post('/api/v1/cart/items').send({ variantId: lowVariant, quantity: 1 });
    await prisma.inventory.updateMany({
      where: { variantId: lowVariant },
      data: { availableStock: 0 },
    });
    const res = await agent.post('/api/v1/orders').send({ shippingAddress: ADDRESS });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('INSUFFICIENT_STOCK');
    await agent.delete('/api/v1/cart');
  });

  it('lists and fetches only the current user orders', async () => {
    const list = await agent.get('/api/v1/orders');
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
    const orderId: string = list.body.data.items[0].id;

    const detail = await agent.get(`/api/v1/orders/${orderId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.items.length).toBeGreaterThanOrEqual(1);

    // Another user cannot see this order.
    const other = await signIn(app, 'b');
    expect((await other.get(`/api/v1/orders/${orderId}`)).status).toBe(404);
    expect((await other.get('/api/v1/orders')).body.data.items).toEqual([]);
  });
});
