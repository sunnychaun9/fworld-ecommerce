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
 * Brand integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * Covers CRUD, auth protection, slug generation/duplication, invalid URL, and
 * delete-protection when a product references the brand.
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

describe.skipIf(!RUN)('Brands (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE brands RESTART IDENTITY CASCADE');

    const email = `brand_admin_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Brand Admin' });
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    admin = request.agent(app.getHttpServer());
    await admin.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an unauthenticated create (401)', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/brands').send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });

  it('creates, reads (id + slug), lists publicly, and updates a brand', async () => {
    const created = await admin
      .post('/api/v1/brands')
      .send({ name: 'Puma', website: 'https://puma.com' });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('puma');
    const id: string = created.body.data.id;

    expect((await request(app.getHttpServer()).get(`/api/v1/brands/${id}`)).status).toBe(200);

    const bySlug = await request(app.getHttpServer()).get('/api/v1/brands/slug/puma');
    expect(bySlug.body.data.id).toBe(id);

    const list = await request(app.getHttpServer()).get('/api/v1/brands');
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((b: { slug: string }) => b.slug === 'puma')).toBe(true);

    const updated = await admin
      .patch(`/api/v1/brands/${id}`)
      .send({ description: 'Forever Faster' });
    expect(updated.body.data.description).toBe('Forever Faster');
  });

  it('auto-suffixes duplicate generated slugs (nike, nike-2)', async () => {
    const a = await admin.post('/api/v1/brands').send({ name: 'Nike' });
    const b = await admin.post('/api/v1/brands').send({ name: 'Nike' });
    expect(a.body.data.slug).toBe('nike');
    expect(b.body.data.slug).toBe('nike-2');
  });

  it('rejects a duplicate explicit slug (409 SLUG_TAKEN)', async () => {
    await admin.post('/api/v1/brands').send({ name: 'Adidas', slug: 'adidas' });
    const dup = await admin.post('/api/v1/brands').send({ name: 'Adidas 2', slug: 'adidas' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('SLUG_TAKEN');
  });

  it('rejects an invalid website URL (400)', async () => {
    const res = await admin.post('/api/v1/brands').send({ name: 'BadSite', website: 'not a url' });
    expect(res.status).toBe(400);
  });

  it('blocks deleting a brand referenced by a product (409 BRAND_IN_USE)', async () => {
    const brand = await admin.post('/api/v1/brands').send({ name: 'Reebok' });
    const brandId: string = brand.body.data.id;

    // Seed a category + product referencing the brand (Products CRUD not built yet).
    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'BrandTmpCat', slug: `brand-tmp-cat-${Date.now()}` },
    });
    const productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Ref Product',
        slug: `ref-product-${Date.now()}`,
        categoryId,
        brandId,
        mrp: '999.00',
        sellingPrice: '799.00',
      },
    });

    const blocked = await admin.delete(`/api/v1/brands/${brandId}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.errors[0].code).toBe('BRAND_IN_USE');

    // Once unreferenced, the brand deletes cleanly.
    await prisma.product.delete({ where: { id: productId } });
    await prisma.category.delete({ where: { id: categoryId } });
    expect((await admin.delete(`/api/v1/brands/${brandId}`)).status).toBe(200);
  });
});
