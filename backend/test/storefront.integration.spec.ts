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
 * Storefront integration tests (requires PostgreSQL; gated by `RUN_DB_TESTS=true`).
 * All endpoints are public reads over ACTIVE catalog data.
 */
const RUN = process.env.RUN_DB_TESTS === 'true';
const IMG = 'https://cdn.example.com/a.jpg';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

const server = (app: NestExpressApplication) => request(app.getHttpServer());
const slugs = (arr: { slug: string }[]) => arr.map((p) => p.slug);

describe.skipIf(!RUN)('Storefront (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let categorySlug: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE products, collections RESTART IDENTITY CASCADE');

    const categoryId = newId();
    categorySlug = `store-cat-${Date.now()}`;
    await prisma.category.create({
      data: { id: categoryId, name: 'Store Cat', slug: categorySlug },
    });
    const brandId = newId();
    await prisma.brand.create({
      data: { id: brandId, name: 'Store Brand', slug: `store-brand-${Date.now()}` },
    });

    // Active, featured, in-stock product with a variant, inventory and image.
    const p1 = newId();
    await prisma.product.create({
      data: {
        id: p1,
        name: 'Store Tee',
        slug: 'store-tee',
        categoryId,
        brandId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
        featured: true,
        fit: 'slim',
      },
    });
    const v1 = newId();
    await prisma.productVariant.create({
      data: { id: v1, productId: p1, sku: `STORE-${v1}`, size: 'M', color: 'Black' },
    });
    await prisma.inventory.create({ data: { id: newId(), variantId: v1, availableStock: 5 } });
    await prisma.productImage.create({
      data: { id: newId(), productId: p1, url: IMG, sortOrder: 0 },
    });

    // Active new-arrival product WITHOUT inventory (must still appear, inStock false).
    await prisma.product.create({
      data: {
        id: newId(),
        name: 'Store Jeans',
        slug: 'store-jeans',
        categoryId,
        mrp: '2000.00',
        sellingPrice: '2000.00',
        status: 'ACTIVE',
        newArrival: true,
      },
    });

    // Draft product — must never be returned.
    await prisma.product.create({
      data: {
        id: newId(),
        name: 'Store Draft',
        slug: 'store-draft',
        categoryId,
        mrp: '500.00',
        sellingPrice: '500.00',
        status: 'DRAFT',
      },
    });

    const collectionId = newId();
    await prisma.collection.create({
      data: { id: collectionId, name: 'Store Edit', slug: 'store-edit', status: 'ACTIVE' },
    });
    await prisma.collectionProduct.create({
      data: { collectionId, productId: p1, sortOrder: 0 },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns home sections', async () => {
    const res = await server(app).get('/api/v1/store/home');
    expect(res.status).toBe(200);
    expect(slugs(res.body.data.featured)).toContain('store-tee');
    expect(slugs(res.body.data.newArrivals)).toContain('store-jeans');
    expect(res.body.data.collections.some((c: { slug: string }) => c.slug === 'store-edit')).toBe(
      true,
    );
  });

  it('lists only ACTIVE products (draft hidden) with computed inStock', async () => {
    const res = await server(app).get('/api/v1/store/products?limit=100');
    expect(res.status).toBe(200);
    const all = slugs(res.body.data.items);
    expect(all).toContain('store-tee');
    expect(all).toContain('store-jeans');
    expect(all).not.toContain('store-draft');
    const jeans = res.body.data.items.find((p: { slug: string }) => p.slug === 'store-jeans');
    expect(jeans.inStock).toBe(false);
  });

  it('filters by featured and inStock', async () => {
    const featured = await server(app).get('/api/v1/store/products?featured=true');
    expect(slugs(featured.body.data.items)).toEqual(['store-tee']);
    const inStock = await server(app).get('/api/v1/store/products?inStock=true');
    expect(slugs(inStock.body.data.items)).toEqual(['store-tee']);
  });

  it('paginates', async () => {
    const res = await server(app).get('/api/v1/store/products?limit=1');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.pageInfo.hasNext).toBe(true);
  });

  it('returns product details with computed discount and relations', async () => {
    const res = await server(app).get('/api/v1/store/products/store-tee');
    expect(res.status).toBe(200);
    expect(res.body.data.discountPercentage).toBe(20);
    expect(res.body.data.inStock).toBe(true);
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.collections).toHaveLength(1);
    expect(res.body.data.brand).not.toBeNull();
  });

  it('hides an inactive product by slug (404)', async () => {
    const res = await server(app).get('/api/v1/store/products/store-draft');
    expect(res.status).toBe(404);
  });

  it('returns a collection with its active products', async () => {
    const res = await server(app).get('/api/v1/store/collections/store-edit');
    expect(res.status).toBe(200);
    expect(res.body.data.collection.slug).toBe('store-edit');
    expect(slugs(res.body.data.products)).toEqual(['store-tee']);
  });

  it('returns a category with its active products', async () => {
    const res = await server(app).get(`/api/v1/store/categories/${categorySlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.category.slug).toBe(categorySlug);
    expect(slugs(res.body.data.products).sort()).toEqual(['store-jeans', 'store-tee']);
  });
});
