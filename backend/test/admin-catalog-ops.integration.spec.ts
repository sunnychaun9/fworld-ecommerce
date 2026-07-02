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
  const email = `cat_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  if (admin) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
  }
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  return agent;
}

describe.skipIf(!RUN)('Admin catalog operations (integration)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let customer: ReturnType<typeof request.agent>;
  let categoryId: string;
  let productA: string;
  let productB: string;
  let variantId: string;

  async function seedProduct(): Promise<string> {
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Cat Product',
        slug: `cat-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'DRAFT',
      },
    });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'CatOps', slug: `cat-ops-${newId()}` },
    });
    productA = await seedProduct();
    productB = await seedProduct();

    variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId: productA, sku: `CAT-${variantId}` },
    });
    await prisma.inventory.create({
      data: { id: newId(), variantId, availableStock: 10, reservedStock: 0, lowStockAlert: 3 },
    });

    admin = await signIn(app, prisma, 'admin', true);
    customer = await signIn(app, prisma, 'cust', false);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('blocks unauthenticated and non-admin access', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/admin/inventory')).status).toBe(401);
    expect(
      (
        await customer
          .post('/api/v1/admin/products/status')
          .send({ productIds: [productA], status: 'ACTIVE' })
      ).status,
    ).toBe(403);
    expect((await customer.get('/api/v1/import-export/products/export')).status).toBe(403);
  });

  it('performs bulk status, featured, delete and restore with soft validation', async () => {
    const missing = newId();
    const status = await admin
      .post('/api/v1/admin/products/status')
      .send({ productIds: [productA, productB, missing], status: 'ACTIVE' });
    expect(status.status).toBe(200);
    expect(status.body.data.affected).toBe(2); // missing id ignored

    const featured = await admin
      .post('/api/v1/admin/products/featured')
      .send({ productIds: [productA], featured: true, bestSeller: true });
    expect(featured.body.data.affected).toBe(1);

    const archived = await admin
      .post('/api/v1/admin/products/delete')
      .send({ productIds: [productB] });
    expect(archived.body.data.affected).toBe(1);
    const dbB = await prisma.product.findUnique({ where: { id: productB } });
    expect(dbB?.status).toBe('ARCHIVED');

    await admin.post('/api/v1/admin/products/restore').send({ productIds: [productB] });
    const restored = await prisma.product.findUnique({ where: { id: productB } });
    expect(restored?.status).toBe('DRAFT');
  });

  it('lists inventory, adjusts stock with an audit trail, and reports low stock', async () => {
    expect((await admin.get('/api/v1/admin/inventory')).status).toBe(200);

    const decrease = await admin
      .post('/api/v1/admin/inventory/adjust')
      .send({ variantId, type: 'DECREASE', quantity: 4, reason: 'damaged units' });
    expect(decrease.status).toBe(200);
    expect(decrease.body.data.inventory.availableStock).toBe(6);
    expect(decrease.body.data.adjustment).toMatchObject({ previousQuantity: 10, newQuantity: 6 });

    const negative = await admin
      .post('/api/v1/admin/inventory/adjust')
      .send({ variantId, type: 'DECREASE', quantity: 100, reason: 'oops' });
    expect(negative.status).toBe(422);
    expect(negative.body.errors[0].code).toBe('NEGATIVE_STOCK');

    const lowStock = await admin.get('/api/v1/admin/inventory/low-stock');
    expect(lowStock.status).toBe(200);
    expect(Array.isArray(lowStock.body.data)).toBe(true);
  });

  it('exports products and imports with per-row validation', async () => {
    expect((await admin.get('/api/v1/import-export/products/template')).status).toBe(200);

    const exported = await admin.get('/api/v1/import-export/products/export');
    expect(exported.status).toBe(200);
    expect(exported.body.data.count).toBeGreaterThanOrEqual(2);

    const imported = await admin.post('/api/v1/import-export/products/import').send({
      products: [
        {
          name: 'Imported Shirt',
          slug: `imported-${newId()}`,
          categoryId,
          mrp: 1500,
          sellingPrice: 1200,
          status: 'ACTIVE',
          variants: [{ sku: `IMP-${newId()}`, size: 'L', availableStock: 12 }],
        },
        { name: 'Bad Row', slug: `bad-${newId()}`, categoryId, mrp: 500, sellingPrice: 900 },
      ],
    });
    expect(imported.status).toBe(200);
    expect(imported.body.data.imported).toBe(1);
    expect(imported.body.data.failed).toBe(1);
    expect(imported.body.data.errors[0].row).toBe(1);
  });
});
