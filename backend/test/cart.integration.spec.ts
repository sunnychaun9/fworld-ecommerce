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
 * Cart integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers the authenticated cart flow, stock rules, duplicate merge and totals.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

describe.skipIf(!RUN)('Cart (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let variantId: string;
  let variantLowStock: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'CartCat', slug: `cart-cat-${Date.now()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Cart Product',
        slug: `cart-product-${Date.now()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `CART-${variantId}`, size: 'M', color: 'Black' },
    });
    await prisma.inventory.create({
      data: { id: newId(), variantId, availableStock: 10 },
    });
    variantLowStock = newId();
    await prisma.productVariant.create({
      data: {
        id: variantLowStock,
        productId,
        sku: `CART-LOW-${variantLowStock}`,
        size: 'L',
        color: 'Red',
      },
    });
    await prisma.inventory.create({
      data: { id: newId(), variantId: variantLowStock, availableStock: 2 },
    });

    const email = `cart_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Cart User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/cart')).status).toBe(401);
  });

  it('returns an empty cart for a fresh user', async () => {
    const res = await agent.get('/api/v1/cart');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalItems).toBe(0);
  });

  it('adds, merges, updates, computes totals, removes and clears', async () => {
    const add = await agent.post('/api/v1/cart/items').send({ variantId, quantity: 2 });
    expect(add.status).toBe(201);
    expect(add.body.data.totalItems).toBe(2);

    // Duplicate add merges into one line.
    const merged = await agent.post('/api/v1/cart/items').send({ variantId, quantity: 3 });
    expect(merged.body.data.items).toHaveLength(1);
    expect(merged.body.data.items[0].quantity).toBe(5);
    expect(merged.body.data.items[0].lineTotal).toBe(4000);
    expect(merged.body.data.subtotal).toBe(4000);

    const itemId: string = merged.body.data.items[0].id;
    const updated = await agent.patch(`/api/v1/cart/items/${itemId}`).send({ quantity: 1 });
    expect(updated.body.data.items[0].quantity).toBe(1);

    // Quantity 0 removes the line.
    const removedByZero = await agent.patch(`/api/v1/cart/items/${itemId}`).send({ quantity: 0 });
    expect(removedByZero.body.data.items).toEqual([]);

    await agent.post('/api/v1/cart/items').send({ variantId, quantity: 1 });
    const cart = await agent.get('/api/v1/cart');
    const line: string = cart.body.data.items[0].id;
    expect((await agent.delete(`/api/v1/cart/items/${line}`)).body.data.items).toEqual([]);

    await agent.post('/api/v1/cart/items').send({ variantId, quantity: 1 });
    const cleared = await agent.delete('/api/v1/cart');
    expect(cleared.body.data.items).toEqual([]);
  });

  it('rejects quantity exceeding available stock (422 INSUFFICIENT_STOCK)', async () => {
    const res = await agent
      .post('/api/v1/cart/items')
      .send({ variantId: variantLowStock, quantity: 5 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('INSUFFICIENT_STOCK');
  });

  it('rejects a missing variant (422 VARIANT_NOT_FOUND)', async () => {
    const res = await agent
      .post('/api/v1/cart/items')
      .send({ variantId: '01920000-0000-7000-8000-0000deadbeef', quantity: 1 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('VARIANT_NOT_FOUND');
  });
});
