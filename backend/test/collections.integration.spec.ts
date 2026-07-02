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
 * Collection integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, product membership (add/duplicate/remove/reorder), slug lookup,
 * public listing and auth protection.
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

describe.skipIf(!RUN)('Collections (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let categoryId: string;
  let productA: string;
  let productB: string;

  async function seedProduct(): Promise<string> {
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Col Product',
        slug: `col-product-${id}`,
        categoryId,
        mrp: '999.00',
        sellingPrice: '799.00',
      },
    });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE collections RESTART IDENTITY CASCADE');

    categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'ColTmpCat', slug: `col-tmp-cat-${Date.now()}` },
    });
    productA = await seedProduct();
    productB = await seedProduct();

    const email = `col_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Col Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/collections')
      .send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });

  it('creates, reads (id + slug), lists publicly, updates, and auto-suffixes slugs', async () => {
    const created = await admin.post('/api/v1/collections').send({ name: 'Summer' });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('summer');
    const id: string = created.body.data.id;

    const second = await admin.post('/api/v1/collections').send({ name: 'Summer' });
    expect(second.body.data.slug).toBe('summer-2');

    expect((await request(app.getHttpServer()).get(`/api/v1/collections/${id}`)).status).toBe(200);
    const bySlug = await request(app.getHttpServer()).get('/api/v1/collections/slug/summer');
    expect(bySlug.body.data.id).toBe(id);

    const list = await request(app.getHttpServer()).get('/api/v1/collections');
    expect(list.body.data.items.some((c: { slug: string }) => c.slug === 'summer')).toBe(true);

    const updated = await admin.patch(`/api/v1/collections/${id}`).send({ description: 'Hot' });
    expect(updated.body.data.description).toBe('Hot');
  });

  it('rejects a duplicate explicit slug (409 SLUG_TAKEN)', async () => {
    await admin.post('/api/v1/collections').send({ name: 'Festive', slug: 'festive' });
    const dup = await admin
      .post('/api/v1/collections')
      .send({ name: 'Festive 2', slug: 'festive' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SLUG_TAKEN');
  });

  it('adds products, rejects duplicates, reorders, and removes; delete keeps products', async () => {
    const col = await admin.post('/api/v1/collections').send({ name: 'Edit' });
    const id: string = col.body.data.id;

    const added = await admin
      .post(`/api/v1/collections/${id}/products`)
      .send({ productIds: [productA, productB] });
    expect(added.status).toBe(201);

    const dup = await admin
      .post(`/api/v1/collections/${id}/products`)
      .send({ productIds: [productA] });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('PRODUCT_ALREADY_IN_COLLECTION');

    const reordered = await admin.patch(`/api/v1/collections/${id}/products/reorder`).send({
      items: [
        { productId: productA, sortOrder: 2 },
        { productId: productB, sortOrder: 1 },
      ],
    });
    const orderedIds = reordered.body.data.map((p: { id: string }) => p.id);
    expect(orderedIds).toEqual([productB, productA]);

    expect((await admin.delete(`/api/v1/collections/${id}/products/${productA}`)).status).toBe(200);
    const afterRemove = await request(app.getHttpServer()).get(
      `/api/v1/collections/${id}/products`,
    );
    expect(afterRemove.body.data.map((p: { id: string }) => p.id)).toEqual([productB]);

    // Deleting the collection removes membership but not the products.
    expect((await admin.delete(`/api/v1/collections/${id}`)).status).toBe(200);
    expect(await prisma.product.findUnique({ where: { id: productA } })).not.toBeNull();
    expect(await prisma.product.findUnique({ where: { id: productB } })).not.toBeNull();
  });

  it('rejects adding to a missing collection (422 COLLECTION_NOT_FOUND)', async () => {
    const res = await admin
      .post('/api/v1/collections/01920000-0000-7000-8000-0000deadbeef/products')
      .send({ productIds: [productA] });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('COLLECTION_NOT_FOUND');
  });
});
