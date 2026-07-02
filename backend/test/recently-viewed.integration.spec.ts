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

describe.skipIf(!RUN)('Recently viewed (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let productA: string;
  let productB: string;
  let draftProduct: string;

  async function seedProduct(status: 'ACTIVE' | 'DRAFT'): Promise<string> {
    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'RvCat', slug: `rv-cat-${newId()}` },
    });
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Rv Product',
        slug: `rv-product-${newId()}`,
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
    productA = await seedProduct('ACTIVE');
    productB = await seedProduct('ACTIVE');
    draftProduct = await seedProduct('DRAFT');
    const email = `rv_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Rv User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated access (401)', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/recently-viewed')).status).toBe(401);
  });

  it('records views newest-first, dedupes on re-view, and clears', async () => {
    await agent.post(`/api/v1/recently-viewed/${productA}`);
    await agent.post(`/api/v1/recently-viewed/${productB}`);
    let list = await agent.get('/api/v1/recently-viewed');
    expect(list.body.data.map((e: { productId: string }) => e.productId)).toEqual([
      productB,
      productA,
    ]);

    // Re-viewing A moves it to the front without adding a second row.
    const reView = await agent.post(`/api/v1/recently-viewed/${productA}`);
    expect(reView.body.data.map((e: { productId: string }) => e.productId)).toEqual([
      productA,
      productB,
    ]);

    const cleared = await agent.delete('/api/v1/recently-viewed');
    expect(cleared.body.data).toEqual({ cleared: true });
    list = await agent.get('/api/v1/recently-viewed');
    expect(list.body.data).toEqual([]);
  });

  it('rejects viewing an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const res = await agent.post(`/api/v1/recently-viewed/${draftProduct}`);
    expect(res.status).toBe(422);
    expect(res.body.errors[0].code).toBe('PRODUCT_NOT_ACTIVE');
  });
});
