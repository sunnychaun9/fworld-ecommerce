import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Google OAuth integration tests.
 *
 * Two gates:
 * - `RUN_DB_TESTS=true` (+ PostgreSQL): runs the **initiation** test, which
 *   validates that the Google provider is configured and the OAuth flow starts
 *   (no Google network calls).
 * - `RUN_GOOGLE_OAUTH_E2E=true` (+ PostgreSQL): runs the full **callback** flows
 *   (first sign-in, repeat sign-in, linked account, /me). These mock Google's
 *   token/userinfo endpoints via global `fetch` so no external calls are made.
 *   They are behind a dedicated flag because the exact handshake (id_token vs
 *   userinfo, PKCE/state) must be validated against Better Auth in a DB
 *   environment before they gate CI.
 */
const RUN_DB = process.env.RUN_DB_TESTS === 'true';
const RUN_E2E = process.env.RUN_GOOGLE_OAUTH_E2E === 'true';

const GOOGLE_ID = 'test-google-client-id';
const GOOGLE_SECRET = 'test-google-client-secret';

async function bootApp(): Promise<NestExpressApplication> {
  process.env.GOOGLE_CLIENT_ID = GOOGLE_ID;
  process.env.GOOGLE_CLIENT_SECRET = GOOGLE_SECRET;
  // These flows replay /sign-in/social many times from the same loopback IP,
  // which trips Better Auth's per-IP rate limiter (429). Rate limiting is a
  // production security feature validated by unit tests; disable it here so the
  // OAuth callback logic is exercised deterministically without throttling.
  process.env.AUTH_RATE_LIMIT_ENABLED = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, app.get(ConfigService));
  await app.init();
  return app;
}

describe.skipIf(!RUN_DB)('Google OAuth — initiation (integration, requires PostgreSQL)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await bootApp();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('starts the Google OAuth flow and returns a Google authorization URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/sign-in/social')
      .send({ provider: 'google', callbackURL: '/' });

    expect([200, 302]).toContain(res.status);
    const url: string = res.body?.url ?? res.headers['location'] ?? '';
    expect(url).toContain('accounts.google.com');
    expect(url).toContain(`client_id=${GOOGLE_ID}`);
  });
});

describe.skipIf(!RUN_E2E)('Google OAuth — callback flows (integration, mocked Google)', () => {
  let app: NestExpressApplication;

  const profile = {
    sub: 'google-sub-12345',
    email: 'google.user@example.com',
    email_verified: true,
    name: 'Google User',
    picture: 'https://example.com/avatar.png',
  };

  // Mock Google's token + userinfo endpoints; pass everything else through.
  function installGoogleFetchMock(): void {
    const realFetch = globalThis.fetch.bind(globalThis);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('oauth2.googleapis.com/token')) {
        const idToken = [
          Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test' })).toString('base64url'),
          Buffer.from(
            JSON.stringify({
              iss: 'https://accounts.google.com',
              aud: GOOGLE_ID,
              ...profile,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 3600,
            }),
          ).toString('base64url'),
          'signature',
        ].join('.');
        return new Response(
          JSON.stringify({
            access_token: 'mock-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'openid email profile',
            id_token: idToken,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('googleapis.com') && url.includes('userinfo')) {
        return new Response(JSON.stringify(profile), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return realFetch(input, init);
    });
  }

  // Drive sign-in/social → callback with the mocked Google response, returning a
  // cookie-bearing agent representing the now-authenticated session.
  async function signInWithGoogle(): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    const start = await agent
      .post('/api/v1/auth/sign-in/social')
      .send({ provider: 'google', callbackURL: '/' });
    const authUrl = new URL(start.body.url as string);
    const state = authUrl.searchParams.get('state') ?? '';
    await agent.get(`/api/v1/auth/callback/google?code=mock-code&state=${state}`);
    return agent;
  }

  beforeAll(async () => {
    app = await bootApp();
  });
  afterAll(async () => {
    await app?.close();
  });
  // Isolate each flow: the callback tests share one app instance, so remove any
  // user for the test email before each so they are order-independent (e.g. the
  // linking test needs an email not already claimed by an earlier sign-in).
  // Scoped to this email only — the DB is shared with other integration files
  // that run in parallel, so a global truncate would wipe their data.
  beforeEach(async () => {
    await app.get(PrismaService).user.deleteMany({ where: { email: profile.email } });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new user on first Google sign-in and /me returns the principal', async () => {
    installGoogleFetchMock();
    const agent = await signInWithGoogle();
    const me = await agent.get('/api/v1/me');
    expect(me.status).toBe(200);
    expect(me.body.success).toBe(true);
    expect(me.body.data).toMatchObject({ role: 'CUSTOMER', status: 'ACTIVE' });
    expect(typeof me.body.data.userId).toBe('string');
  });

  it('reuses the same user on repeat Google sign-in (no duplicate)', async () => {
    installGoogleFetchMock();
    const first = await (await signInWithGoogle()).get('/api/v1/me');
    const second = await (await signInWithGoogle()).get('/api/v1/me');
    expect(second.body.data.userId).toBe(first.body.data.userId);
  });

  it('links Google to an existing email/password account on matching verified email', async () => {
    installGoogleFetchMock();
    // Pre-create an email/password account with the same email.
    const password = 'Sup3rSecret!pw';
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-up/email')
      .send({ email: profile.email, password, name: 'Existing User' });
    // Better Auth only trust-links a social provider to an existing local
    // account when that account's email is verified (linking to an unverified
    // account is refused to prevent takeover). Simulate a verified user.
    await app.get(PrismaService).user.update({
      where: { email: profile.email },
      data: { emailVerified: true },
    });
    const existing = request.agent(app.getHttpServer());
    await existing.post('/api/v1/auth/sign-in/email').send({ email: profile.email, password });
    const existingMe = await existing.get('/api/v1/me');

    // Google sign-in with the same (verified) email should link, not duplicate.
    const googleMe = await (await signInWithGoogle()).get('/api/v1/me');
    expect(googleMe.body.data.userId).toBe(existingMe.body.data.userId);
  });
});
