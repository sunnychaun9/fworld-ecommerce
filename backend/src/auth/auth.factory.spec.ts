import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { createAuth } from './auth.factory';

// Constructing the auth instance does not connect to the database (Prisma is
// lazy), so this exercises only the resolved Better Auth configuration.
const baseOptions = {
  prisma: new PrismaClient(),
  secret: 'test-secret-value-at-least-32-characters-long',
  baseURL: 'http://localhost:4000',
  trustedOrigins: ['http://localhost:3000'],
  useSecureCookies: false,
  rateLimit: { enabled: true, window: 60, max: 100, sensitiveMax: 20 },
  sendVerificationEmail: () => undefined,
};
const auth = createAuth(baseOptions);

describe('createAuth (Better Auth foundation)', () => {
  it('mounts at the versioned base path', () => {
    expect(auth.options.basePath).toBe('/api/v1/auth');
  });

  it('uses sliding database-backed sessions', () => {
    expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 7);
    expect(auth.options.session?.updateAge).toBe(60 * 60 * 24);
  });

  it('configures HttpOnly + SameSite=Lax cookies', () => {
    expect(auth.options.advanced?.defaultCookieAttributes?.httpOnly).toBe(true);
    expect(auth.options.advanced?.defaultCookieAttributes?.sameSite).toBe('lax');
  });

  it('wires app-layer UUID v7 id generation', () => {
    const generateId = auth.options.advanced?.database?.generateId;
    expect(typeof generateId).toBe('function');
    if (typeof generateId === 'function') {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    }
  });

  it('trusts the configured frontend origin', () => {
    expect(auth.options.trustedOrigins).toContain('http://localhost:3000');
  });

  it('extends the user with the approved fields and no password/provider', () => {
    const fields = auth.options.user?.additionalFields ?? {};
    expect(Object.keys(fields).sort()).toEqual([
      'lastLogin',
      'phone',
      'phoneVerified',
      'role',
      'status',
    ]);
    expect('password' in fields).toBe(false);
    expect('provider' in fields).toBe(false);
  });

  it('exposes a mountable handler', () => {
    expect(typeof auth.handler).toBe('function');
  });

  it('enables email/password (Milestone 2.2)', () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it('configures email verification on sign-up', () => {
    expect(auth.options.emailVerification?.sendOnSignUp).toBe(true);
    expect(typeof auth.options.emailVerification?.sendVerificationEmail).toBe('function');
  });

  it('does not enable social providers when no credentials are configured', () => {
    expect((auth.options as Record<string, unknown>).socialProviders).toBeUndefined();
  });

  it('enables Google OAuth when credentials are provided', () => {
    const googleAuth = createAuth({
      ...baseOptions,
      google: { clientId: 'google-client-id', clientSecret: 'google-client-secret' },
    });
    const providers = (
      googleAuth.options as {
        socialProviders?: { google?: { clientId?: string; clientSecret?: string } };
      }
    ).socialProviders;
    expect(providers?.google?.clientId).toBe('google-client-id');
    expect(providers?.google?.clientSecret).toBe('google-client-secret');
    // Apple is not configured.
    expect((providers as Record<string, unknown> | undefined)?.apple).toBeUndefined();
  });

  it('enables native account linking with Google as a trusted provider', () => {
    expect(auth.options.account?.accountLinking?.enabled).toBe(true);
    expect(auth.options.account?.accountLinking?.trustedProviders).toContain('google');
  });

  it('configures auth rate limiting with a tighter rule for sensitive endpoints', () => {
    expect(auth.options.rateLimit?.enabled).toBe(true);
    expect(auth.options.rateLimit?.window).toBe(60);
    expect(auth.options.rateLimit?.max).toBe(100);
    const rules = auth.options.rateLimit?.customRules ?? {};
    expect(rules['/sign-in/email']).toMatchObject({ max: 20, window: 60 });
    expect(rules['/sign-up/email']).toMatchObject({ max: 20 });
  });

  it('does not set a cookie domain by default (host-only / localhost)', () => {
    expect(auth.options.advanced?.crossSubDomainCookies).toBeUndefined();
  });

  it('enables cross-subdomain cookies when a domain is configured', () => {
    const prodAuth = createAuth({ ...baseOptions, cookieDomain: '.fworld.com' });
    expect(prodAuth.options.advanced?.crossSubDomainCookies).toEqual({
      enabled: true,
      domain: '.fworld.com',
    });
  });
});
