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
 * Checkout integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Stateless preparation: validates the cart and returns computed totals.
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

describe.skipIf(!RUN)('Checkout (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let productId: string;
  let variantId: string;
  let lowStockVariant: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'CheckCat', slug: `check-cat-${Date.now()}` },
    });
    productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Checkout Product',
        slug: `checkout-product-${Date.now()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `CHK-${variantId}`, size: 'M', color: 'Black' },
    });
    await prisma.inventory.create({ data: { id: newId(), variantId, availableStock: 10 } });
    await prisma.productImage.create({
      data: { id: newId(), productId, url: 'https://cdn.example.com/a.jpg', sortOrder: 0 },
    });
    lowStockVariant = newId();
    await prisma.productVariant.create({
      data: {
        id: lowStockVariant,
        productId,
        sku: `CHK-LOW-${lowStockVariant}`,
        size: 'L',
        color: 'Red',
      },
    });
    await prisma.inventory.create({
      data: { id: newId(), variantId: lowStockVariant, availableStock: 1 },
    });

    const email = `checkout_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Checkout User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ couponCode: null });
    expect(res.status).toBe(401);
  });

  it('rejects an empty cart (422 EMPTY_CART)', async () => {
    const res = await agent.post('/api/v1/checkout').send({ couponCode: null });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('EMPTY_CART');
  });

  it('prepares checkout with computed totals and a primary image', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId, quantity: 2 });
    const res = await agent.post('/api/v1/checkout').send({ couponCode: null });
    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].lineTotal).toBe(1600);
    expect(res.body.data.items[0].image).not.toBeNull();
    expect(res.body.data.subtotal).toBe(1600);
    expect(res.body.data.grandTotal).toBe(1600);
    await agent.delete('/api/v1/cart');
  });

  it('rejects checkout when a line exceeds available stock (422 INSUFFICIENT_STOCK)', async () => {
    // availableStock is 1; add 1 (ok in cart), then reduce stock below cart quantity.
    await agent.post('/api/v1/cart/items').send({ variantId: lowStockVariant, quantity: 1 });
    await prisma.inventory.updateMany({
      where: { variantId: lowStockVariant },
      data: { availableStock: 0 },
    });
    const res = await agent.post('/api/v1/checkout').send({ couponCode: null });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('INSUFFICIENT_STOCK');
    await agent.delete('/api/v1/cart');
  });

  it('rejects checkout when a product is no longer active (422 PRODUCT_NOT_ACTIVE)', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId, quantity: 1 });
    await prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVED' } });
    const res = await agent.post('/api/v1/checkout').send({ couponCode: null });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_NOT_ACTIVE');
    await prisma.product.update({ where: { id: productId }, data: { status: 'ACTIVE' } });
    await agent.delete('/api/v1/cart');
  });
});
