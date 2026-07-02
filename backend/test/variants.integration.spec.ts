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
 * Variant integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, nested listing, unique SKU/barcode, duplicate size/color, filtering
 * and auth protection.
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

describe.skipIf(!RUN)('Variants (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let productId: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE product_variants RESTART IDENTITY CASCADE');

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'VarTmpCat', slug: `var-tmp-cat-${Date.now()}` },
    });
    productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Var Product',
        slug: `var-product-${Date.now()}`,
        categoryId,
        mrp: '999.00',
        sellingPrice: '799.00',
      },
    });

    const email = `var_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Var Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/variants')
      .send({ productId, sku: 'NOPE' });
    expect(res.status).toBe(401);
  });

  it('rejects a variant for a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const res = await admin
      .post('/api/v1/variants')
      .send({ productId: '01920000-0000-7000-8000-0000deadbeef', sku: 'ORPHAN' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_NOT_FOUND');
  });

  it('creates, reads, lists by product, and updates a variant', async () => {
    const created = await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'TEE-BLK-M', size: 'M', color: 'Black', colorHex: '#000000' });
    expect(created.status).toBe(201);
    const id: string = created.body.data.id;

    expect((await request(app.getHttpServer()).get(`/api/v1/variants/${id}`)).status).toBe(200);

    const nested = await request(app.getHttpServer()).get(`/api/v1/products/${productId}/variants`);
    expect(nested.status).toBe(200);
    expect(nested.body.data.items.some((v: { id: string }) => v.id === id)).toBe(true);

    const updated = await admin.patch(`/api/v1/variants/${id}`).send({ colorHex: '#111111' });
    expect(updated.body.data.colorHex).toBe('#111111');
  });

  it('rejects a duplicate SKU (409 SKU_TAKEN)', async () => {
    await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'DUP-SKU', size: 'S', color: 'Red' });
    const dup = await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'DUP-SKU', size: 'L', color: 'Blue' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SKU_TAKEN');
  });

  it('rejects a duplicate barcode (409 BARCODE_TAKEN)', async () => {
    await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'BC-1', barcode: '8900000000001', size: 'XL', color: 'Green' });
    const dup = await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'BC-2', barcode: '8900000000001', size: 'XXL', color: 'Grey' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('BARCODE_TAKEN');
  });

  it('rejects a duplicate size/color for the same product (409 VARIANT_EXISTS)', async () => {
    await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'COMBO-1', size: 'M', color: 'Navy' });
    const dup = await admin
      .post('/api/v1/variants')
      .send({ productId, sku: 'COMBO-2', size: 'M', color: 'Navy' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('VARIANT_EXISTS');
  });

  it('filters variants by productId and color', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/v1/variants?productId=${productId}&color=Black`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((v: { color: string }) => v.color === 'Black')).toBe(true);
  });
});
