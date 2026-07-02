import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
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

async function signIn(
  app: NestExpressApplication,
  prisma: PrismaService,
  label: string,
  admin: boolean,
) {
  const email = `coupon_${label}_${Date.now()}@fworld.test`;
  const password = 'Sup3rSecret!pw';
  await request(app.getHttpServer())
    .post('/api/v1/auth/sign-up/email')
    .send({ email, password, name: label });
  if (admin) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
  }
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  return agent;
}

describe.skipIf(!RUN)('Coupons (integration — requires PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let customer: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await bootApp();
    prisma = app.get(PrismaService);
    admin = await signIn(app, prisma, 'admin', true);
    customer = await signIn(app, prisma, 'cust', false);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated and non-admin coupon creation', async () => {
    const code = `PUBLIC${Date.now()}`;
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/v1/coupons')
          .send({ code, discountType: 'FLAT', discountValue: 100 })
      ).status,
    ).toBe(401);
    expect(
      (
        await customer
          .post('/api/v1/coupons')
          .send({ code, discountType: 'FLAT', discountValue: 100 })
      ).status,
    ).toBe(403);
  });

  it('creates, validates (public), updates, lists (my), and deletes a coupon', async () => {
    const code = `SAVE${Date.now()}`;
    const created = await admin.post('/api/v1/coupons').send({
      code: code.toLowerCase(),
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 200,
    });
    expect(created.status).toBe(201);
    expect(created.body.data.code).toBe(code.toUpperCase());
    const id: string = created.body.data.id;

    // Public validation — valid.
    const valid = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .send({ code, orderAmount: 1000 });
    expect(valid.status).toBe(201);
    expect(valid.body.data.valid).toBe(true);
    expect(valid.body.data.discount).toBe(100);
    expect(valid.body.data.finalAmount).toBe(900);

    // Below minimum → invalid (still 2xx, valid:false).
    const belowMin = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .send({ code, orderAmount: 100 });
    expect(belowMin.body.data.valid).toBe(false);

    // Unknown coupon → invalid.
    const unknown = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .send({ code: 'NOPE-DOES-NOT-EXIST', orderAmount: 100 });
    expect(unknown.body.data.valid).toBe(false);

    // Authenticated "my" list includes the active coupon.
    const mine = await customer.get('/api/v1/coupons/my');
    expect(mine.status).toBe(200);
    expect(mine.body.data.some((c: { id: string }) => c.id === id)).toBe(true);

    // Deactivate → validation now fails.
    await admin.patch(`/api/v1/coupons/${id}`).send({ active: false });
    const afterDeactivate = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .send({ code, orderAmount: 1000 });
    expect(afterDeactivate.body.data.valid).toBe(false);

    expect((await admin.delete(`/api/v1/coupons/${id}`)).status).toBe(200);
  });

  it('rejects a duplicate coupon code (409 COUPON_CODE_TAKEN)', async () => {
    const code = `DUP${Date.now()}`;
    await admin.post('/api/v1/coupons').send({ code, discountType: 'FLAT', discountValue: 50 });
    const dup = await admin
      .post('/api/v1/coupons')
      .send({ code, discountType: 'FLAT', discountValue: 50 });
    expect(dup.status).toBe(409);
    expect(dup.body.errors[0].code).toBe('COUPON_CODE_TAKEN');
  });
});
