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
 * Inventory integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, one-per-variant uniqueness, filtering, computed stock status and
 * auth protection.
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

describe.skipIf(!RUN)('Inventory (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let productId: string;
  let variantId: string;
  let variantId2: string;

  async function seedVariant(sku: string): Promise<string> {
    const id = newId();
    await prisma.productVariant.create({ data: { id, productId, sku } });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE inventory RESTART IDENTITY CASCADE');

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'InvTmpCat', slug: `inv-tmp-cat-${Date.now()}` },
    });
    productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Inv Product',
        slug: `inv-product-${Date.now()}`,
        categoryId,
        mrp: '999.00',
        sellingPrice: '799.00',
      },
    });
    variantId = await seedVariant(`INV-SKU-1-${Date.now()}`);
    variantId2 = await seedVariant(`INV-SKU-2-${Date.now()}`);

    const email = `inv_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Inv Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory')
      .send({ variantId, availableStock: 5 });
    expect(res.status).toBe(401);
  });

  it('creates inventory, reads it, computes status, and reads via variant', async () => {
    const created = await admin
      .post('/api/v1/inventory')
      .send({ variantId, availableStock: 2, lowStockAlert: 5 });
    expect(created.status).toBe(201);
    expect(created.body.data.stockStatus).toBe('LOW_STOCK');
    const id: string = created.body.data.id;

    const byId = await request(app.getHttpServer()).get(`/api/v1/inventory/${id}`);
    expect(byId.body.data.stockStatus).toBe('LOW_STOCK');

    const byVariant = await request(app.getHttpServer()).get(
      `/api/v1/variants/${variantId}/inventory`,
    );
    expect(byVariant.body.data.id).toBe(id);

    const updated = await admin.patch(`/api/v1/inventory/${id}`).send({ availableStock: 0 });
    expect(updated.body.data.stockStatus).toBe('OUT_OF_STOCK');
  });

  it('rejects duplicate inventory for a variant (409 INVENTORY_EXISTS)', async () => {
    const dup = await admin.post('/api/v1/inventory').send({ variantId, availableStock: 1 });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('INVENTORY_EXISTS');
  });

  it('rejects reservedStock greater than availableStock (422)', async () => {
    const res = await admin
      .post('/api/v1/inventory')
      .send({ variantId: variantId2, availableStock: 3, reservedStock: 10 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('RESERVED_EXCEEDS_AVAILABLE');
  });

  it('filters by stockStatus (IN_STOCK)', async () => {
    await admin
      .post('/api/v1/inventory')
      .send({ variantId: variantId2, availableStock: 50, lowStockAlert: 5 });
    const res = await request(app.getHttpServer()).get(
      '/api/v1/inventory?stockStatus=IN_STOCK&limit=100',
    );
    expect(res.status).toBe(200);
    expect(
      res.body.data.items.every((i: { stockStatus: string }) => i.stockStatus === 'IN_STOCK'),
    ).toBe(true);
    expect(res.body.data.items.some((i: { variantId: string }) => i.variantId === variantId2)).toBe(
      true,
    );
  });
});
