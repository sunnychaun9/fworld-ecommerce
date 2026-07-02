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
 * Product integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, filtering, sorting, auth protection, slug duplication, publish
 * validation, and invalid foreign keys.
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

const MISSING_UUID = '01920000-0000-7000-8000-0000deadbeef';

describe.skipIf(!RUN)('Products (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let categoryId: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE products RESTART IDENTITY CASCADE');

    // A category to reference (Products depend on Category, which is complete).
    categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'ProdTmpCat', slug: `prod-tmp-cat-${Date.now()}` },
    });

    const email = `prod_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Prod Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .send({ name: 'Nope', categoryId, mrp: 100, sellingPrice: 80 });
    expect(res.status).toBe(401);
  });

  it('creates, reads (id + slug), and updates a product', async () => {
    const created = await admin
      .post('/api/v1/products')
      .send({ name: 'Linen Shirt', categoryId, mrp: 2499, sellingPrice: 1999 });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('linen-shirt');
    const id: string = created.body.data.id;

    expect((await request(app.getHttpServer()).get(`/api/v1/products/${id}`)).status).toBe(200);
    const bySlug = await request(app.getHttpServer()).get('/api/v1/products/slug/linen-shirt');
    expect(bySlug.body.data.id).toBe(id);

    const updated = await admin.patch(`/api/v1/products/${id}`).send({ featured: true });
    expect(updated.body.data.featured).toBe(true);
  });

  it('auto-suffixes duplicate generated slugs (shirt, shirt-2)', async () => {
    const a = await admin
      .post('/api/v1/products')
      .send({ name: 'Shirt', categoryId, mrp: 100, sellingPrice: 90 });
    const b = await admin
      .post('/api/v1/products')
      .send({ name: 'Shirt', categoryId, mrp: 100, sellingPrice: 90 });
    expect(a.body.data.slug).toBe('shirt');
    expect(b.body.data.slug).toBe('shirt-2');
  });

  it('rejects a duplicate explicit slug (409 SLUG_TAKEN)', async () => {
    await admin
      .post('/api/v1/products')
      .send({ name: 'Jeans', slug: 'blue-jeans', categoryId, mrp: 100, sellingPrice: 90 });
    const dup = await admin
      .post('/api/v1/products')
      .send({ name: 'Jeans 2', slug: 'blue-jeans', categoryId, mrp: 100, sellingPrice: 90 });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SLUG_TAKEN');
  });

  it('rejects sellingPrice greater than MRP (422)', async () => {
    const res = await admin
      .post('/api/v1/products')
      .send({ name: 'Overpriced', categoryId, mrp: 100, sellingPrice: 200 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('SELLING_PRICE_EXCEEDS_MRP');
  });

  it('rejects publishing without required fields (422 PRODUCT_PUBLISH_INVALID)', async () => {
    const res = await admin
      .post('/api/v1/products')
      .send({ name: 'Draftish', categoryId, mrp: 100, sellingPrice: 90, status: 'ACTIVE' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_PUBLISH_INVALID');
  });

  it('rejects a create referencing a missing category (422 CATEGORY_NOT_FOUND)', async () => {
    const res = await admin
      .post('/api/v1/products')
      .send({ name: 'Orphan', categoryId: MISSING_UUID, mrp: 100, sellingPrice: 90 });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('CATEGORY_NOT_FOUND');
  });

  it('filters by categoryId and featured, and sorts by price', async () => {
    const cheap = await admin
      .post('/api/v1/products')
      .send({ name: 'Cheap Tee', categoryId, mrp: 500, sellingPrice: 499, featured: true });
    const pricey = await admin
      .post('/api/v1/products')
      .send({ name: 'Pricey Jacket', categoryId, mrp: 5000, sellingPrice: 4999, featured: true });

    const filtered = await request(app.getHttpServer()).get(
      `/api/v1/products?categoryId=${categoryId}&featured=true`,
    );
    expect(filtered.status).toBe(200);
    const ids = filtered.body.data.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(cheap.body.data.id);
    expect(ids).toContain(pricey.body.data.id);

    const asc = await request(app.getHttpServer()).get(
      `/api/v1/products?featured=true&sort=priceAsc&limit=100`,
    );
    const prices = asc.body.data.items.map((p: { sellingPrice: string }) => Number(p.sellingPrice));
    const sorted = [...prices].sort((x, y) => x - y);
    expect(prices).toEqual(sorted);
  });
});
