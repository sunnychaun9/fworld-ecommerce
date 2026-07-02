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
 * Product media integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, variant images, ordering, variant/product mismatch, invalid product
 * and auth protection.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';
const URL = 'https://cdn.example.com/a.jpg';
const MISSING_UUID = '01920000-0000-7000-8000-0000deadbeef';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

describe.skipIf(!RUN)('Media (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let categoryId: string;
  let productId: string;
  let productId2: string;
  let variantId: string;
  let variantId2: string;

  async function seedProduct(): Promise<string> {
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Media Product',
        slug: `media-product-${id}`,
        categoryId,
        mrp: '999.00',
        sellingPrice: '799.00',
      },
    });
    return id;
  }

  async function seedVariant(pid: string): Promise<string> {
    const id = newId();
    await prisma.productVariant.create({ data: { id, productId: pid, sku: `MED-${id}` } });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE product_images RESTART IDENTITY CASCADE');

    categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'MediaTmpCat', slug: `media-tmp-cat-${Date.now()}` },
    });
    productId = await seedProduct();
    productId2 = await seedProduct();
    variantId = await seedVariant(productId);
    variantId2 = await seedVariant(productId2);

    const email = `media_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Media Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/images')
      .send({ productId, url: URL });
    expect(res.status).toBe(401);
  });

  it('creates, reads, updates, and deletes a product image', async () => {
    const created = await admin
      .post('/api/v1/images')
      .send({ productId, url: URL, altText: 'Front' });
    expect(created.status).toBe(201);
    const id: string = created.body.data.id;

    const byId = await request(app.getHttpServer()).get(`/api/v1/images/${id}`);
    expect(byId.body.data.url).toBe(URL);

    const updated = await admin.patch(`/api/v1/images/${id}`).send({ altText: 'Back' });
    expect(updated.body.data.altText).toBe('Back');

    expect((await admin.delete(`/api/v1/images/${id}`)).status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/api/v1/images/${id}`)).status).toBe(404);
  });

  it('creates a variant image when the variant belongs to the product', async () => {
    const res = await admin.post('/api/v1/images').send({ productId, url: URL, variantId });
    expect(res.status).toBe(201);
    expect(res.body.data.variantId).toBe(variantId);
  });

  it('rejects a variant that belongs to another product (422 VARIANT_PRODUCT_MISMATCH)', async () => {
    const res = await admin
      .post('/api/v1/images')
      .send({ productId, url: URL, variantId: variantId2 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('VARIANT_PRODUCT_MISMATCH');
  });

  it('rejects an image for a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const res = await admin.post('/api/v1/images').send({ productId: MISSING_UUID, url: URL });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns product images ordered by sortOrder then createdAt', async () => {
    await admin.post('/api/v1/images').send({ productId: productId2, url: URL, sortOrder: 2 });
    await admin.post('/api/v1/images').send({ productId: productId2, url: URL, sortOrder: 0 });
    await admin.post('/api/v1/images').send({ productId: productId2, url: URL, sortOrder: 1 });

    const res = await request(app.getHttpServer()).get(`/api/v1/products/${productId2}/images`);
    expect(res.status).toBe(200);
    const orders = res.body.data.map((i: { sortOrder: number }) => i.sortOrder);
    expect(orders).toEqual([0, 1, 2]);
  });
});
