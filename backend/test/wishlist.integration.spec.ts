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

describe.skipIf(!RUN)('Wishlist (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let activeProduct: string;
  let draftProduct: string;

  async function seedProduct(status: 'ACTIVE' | 'DRAFT'): Promise<string> {
    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'WishCat', slug: `wish-cat-${newId()}` },
    });
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Wish Product',
        slug: `wish-product-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status,
      },
    });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    activeProduct = await seedProduct('ACTIVE');
    draftProduct = await seedProduct('DRAFT');
    const email = `wish_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Wish User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/wishlist')).status).toBe(401);
  });

  it('adds, dedupes, lists, and removes wishlist items', async () => {
    const added = await agent.post('/api/v1/wishlist').send({ productId: activeProduct });
    expect(added.status).toBe(201);

    // Duplicate add returns the existing entry (no second row).
    const dup = await agent.post('/api/v1/wishlist').send({ productId: activeProduct });
    expect(dup.body.data.id).toBe(added.body.data.id);

    const list = await agent.get('/api/v1/wishlist');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].product.id).toBe(activeProduct);

    expect((await agent.delete(`/api/v1/wishlist/${activeProduct}`)).status).toBe(200);
    expect((await agent.delete(`/api/v1/wishlist/${activeProduct}`)).status).toBe(404);
  });

  it('rejects wishlisting an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const res = await agent.post('/api/v1/wishlist').send({ productId: draftProduct });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_NOT_ACTIVE');
  });
});
