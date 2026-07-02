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

async function signIn(app: NestExpressApplication, prisma: PrismaService, label: string) {
  const email = `review_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return { agent, userId: user?.id ?? '' };
}

describe.skipIf(!RUN)('Reviews (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let buyer: ReturnType<typeof request.agent>;
  let stranger: ReturnType<typeof request.agent>;
  let productId: string;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);

    const categoryId = newId();
    await prisma.category.create({
      data: { id: categoryId, name: 'RevCat', slug: `rev-cat-${newId()}` },
    });
    productId = newId();
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Reviewable',
        slug: `reviewable-${newId()}`,
        categoryId,
        mrp: '1000.00',
        sellingPrice: '800.00',
        status: 'ACTIVE',
      },
    });
    const variantId = newId();
    await prisma.productVariant.create({
      data: { id: variantId, productId, sku: `REV-${variantId}` },
    });

    const buyerAuth = await signIn(app, prisma, 'buyer');
    buyer = buyerAuth.agent;
    const strangerAuth = await signIn(app, prisma, 'stranger');
    stranger = strangerAuth.agent;

    // Seed a PAID order for the buyer containing the product.
    const orderId = newId();
    await prisma.order.create({
      data: {
        id: orderId,
        userId: buyerAuth.userId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        shippingAddress: { city: 'Mumbai' },
        subtotal: '800.00',
        grandTotal: '800.00',
      },
    });
    await prisma.orderItem.create({
      data: {
        id: newId(),
        orderId,
        variantId,
        productName: 'Reviewable',
        productSlug: 'reviewable',
        variantSku: 'REV',
        unitPrice: '800.00',
        quantity: 1,
        lineTotal: '800.00',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('exposes public product reviews with aggregates (empty initially)', async () => {
    const res = await request(app.getHttpServer()).get(`/api/v1/reviews/product/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ averageRating: 0, totalReviews: 0 });
    expect(res.body.data.reviews).toEqual([]);
  });

  it('rejects unauthenticated and non-purchaser reviews', async () => {
    expect(
      (await request(app.getHttpServer()).post('/api/v1/reviews').send({ productId, rating: 5 }))
        .status,
    ).toBe(401);
    const notBought = await stranger.post('/api/v1/reviews').send({ productId, rating: 5 });
    expect(notBought.status).toBe(422);
    expect(notBought.body.errors[0].code).toBe('PURCHASE_REQUIRED');
  });

  it('lets a purchaser create, update, and delete a review (aggregates follow)', async () => {
    const created = await buyer
      .post('/api/v1/reviews')
      .send({ productId, rating: 5, title: 'Great', comment: 'Loved it' });
    expect(created.status).toBe(201);
    const reviewId: string = created.body.data.id;

    const dup = await buyer.post('/api/v1/reviews').send({ productId, rating: 4 });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('ALREADY_REVIEWED');

    let agg = await request(app.getHttpServer()).get(`/api/v1/reviews/product/${productId}`);
    expect(agg.body.data).toMatchObject({ averageRating: 5, totalReviews: 1 });

    const mine = await buyer.get('/api/v1/reviews/my');
    expect(mine.body.data.some((r: { id: string }) => r.id === reviewId)).toBe(true);

    await buyer.patch(`/api/v1/reviews/${reviewId}`).send({ rating: 3 });
    agg = await request(app.getHttpServer()).get(`/api/v1/reviews/product/${productId}`);
    expect(agg.body.data.averageRating).toBe(3);

    // Ownership: another user cannot modify this review.
    expect((await stranger.patch(`/api/v1/reviews/${reviewId}`).send({ rating: 1 })).status).toBe(
      404,
    );

    expect((await buyer.delete(`/api/v1/reviews/${reviewId}`)).status).toBe(200);
    agg = await request(app.getHttpServer()).get(`/api/v1/reviews/product/${productId}`);
    expect(agg.body.data).toMatchObject({ averageRating: 0, totalReviews: 0 });
  });
});
