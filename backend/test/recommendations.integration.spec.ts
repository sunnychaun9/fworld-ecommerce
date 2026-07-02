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

describe.skipIf(!RUN)('Recommendations (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let categoryId: string;
  let target: string;
  let sameCategory: string;

  async function seedProduct(
    catId: string,
    flags: { featured?: boolean; newArrival?: boolean; bestSeller?: boolean } = {},
  ): Promise<string> {
    const id = newId();
    await prisma.product.create({
      data: {
        id,
        name: 'Reco Product',
        slug: `reco-product-${newId()}`,
        categoryId: catId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
        featured: flags.featured ?? false,
        newArrival: flags.newArrival ?? false,
        bestSeller: flags.bestSeller ?? false,
      },
    });
    return id;
  }

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'RecoCat', slug: `reco-cat-${newId()}` },
    });
    target = await seedProduct(categoryId, { featured: true });
    sameCategory = await seedProduct(categoryId, { newArrival: true, bestSeller: true });

    const email = `reco_user_${Date.now()}@fworld.test`;
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email, password, name: 'Reco User' });
    agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns public product recommendations (same category, excluding self)', async () => {
    const res = await request(app.getHttpServer()).get(`/api/v1/recommendations/product/${target}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).toContain(sameCategory);
    expect(ids).not.toContain(target);
  });

  it('returns public home recommendations', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/recommendations/home');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.trending)).toBe(true);
    expect(Array.isArray(res.body.data.newArrivals)).toBe(true);
    expect(Array.isArray(res.body.data.bestSellers)).toBe(true);
  });

  it('requires authentication for for-you recommendations', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/recommendations/for-you')).status).toBe(
      401,
    );
  });

  it('returns for-you recommendations for an authenticated user', async () => {
    // Wishlist a same-category product so the user has a category signal.
    await agent.post('/api/v1/wishlist').send({ productId: sameCategory });
    const res = await agent.get('/api/v1/recommendations/for-you');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
