import { describe, expect, it } from 'vitest';

import { DEV_AUTH_SECRET, validateEnv } from './env.validation';

const STRONG_SECRET = 'a'.repeat(40);

describe('validateEnv', () => {
  it('applies dev defaults without throwing when nothing is set', () => {
    const env = validateEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.BETTER_AUTH_SECRET).toBe(DEV_AUTH_SECRET);
    expect(env.SESSION_ABSOLUTE_MAX_DAYS).toBe(30);
    expect(env.AUTH_RATE_LIMIT_ENABLED).toBe('true');
    expect(env.AUTH_RATE_LIMIT_SENSITIVE_MAX).toBe(20);
  });

  it('requires DATABASE_URL in production', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', BETTER_AUTH_SECRET: STRONG_SECRET }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects the dev placeholder secret in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://u:p@db:5432/app',
        BETTER_AUTH_SECRET: DEV_AUTH_SECRET,
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('rejects a too-short secret in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://u:p@db:5432/app',
        BETTER_AUTH_SECRET: 'short-secret',
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('accepts a strong secret + DATABASE_URL in production', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://u:p@db:5432/app',
      BETTER_AUTH_SECRET: STRONG_SECRET,
    });
    expect(env.NODE_ENV).toBe('production');
    expect(env.BETTER_AUTH_SECRET).toBe(STRONG_SECRET);
  });

  it('rejects partial Google credentials (one without the other)', () => {
    expect(() => validateEnv({ GOOGLE_CLIENT_ID: 'id-only' })).toThrow(/GOOGLE_CLIENT/);
    expect(() => validateEnv({ GOOGLE_CLIENT_SECRET: 'secret-only' })).toThrow(/GOOGLE_CLIENT/);
  });

  it('accepts both Google credentials together', () => {
    const env = validateEnv({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' });
    expect(env.GOOGLE_CLIENT_ID).toBe('id');
    expect(env.GOOGLE_CLIENT_SECRET).toBe('secret');
  });

  it('rejects partial Razorpay credentials (one without the other)', () => {
    expect(() => validateEnv({ RAZORPAY_KEY_ID: 'id-only' })).toThrow(/RAZORPAY_KEY/);
    expect(() => validateEnv({ RAZORPAY_KEY_SECRET: 'secret-only' })).toThrow(/RAZORPAY_KEY/);
  });

  it('accepts both Razorpay credentials together', () => {
    const env = validateEnv({ RAZORPAY_KEY_ID: 'rzp_id', RAZORPAY_KEY_SECRET: 'rzp_secret' });
    expect(env.RAZORPAY_KEY_ID).toBe('rzp_id');
    expect(env.RAZORPAY_KEY_SECRET).toBe('rzp_secret');
  });

  it('treats empty-string optional vars as unset (blank .env template values)', () => {
    // Mirrors the .env.example template which ships these blank, e.g. `COOKIE_DOMAIN=`.
    const env = validateEnv({
      COOKIE_DOMAIN: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      DATABASE_URL: '',
    });
    expect(env.COOKIE_DOMAIN).toBeUndefined();
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it('treats an empty DATABASE_URL as unset in production (still throws required)', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: '',
        BETTER_AUTH_SECRET: STRONG_SECRET,
      }),
    ).toThrow(/DATABASE_URL/);
  });
});
