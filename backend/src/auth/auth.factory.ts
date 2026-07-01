import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '@prisma/client';

import { newId } from '../common/utils/id.util';

/**
 * Inputs required to construct the Better Auth instance. Resolved from validated
 * configuration in AuthModule.
 */
export interface CreateAuthOptions {
  prisma: PrismaClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  useSecureCookies: boolean;
  /** Cross-subdomain cookie domain (prod, e.g. ".fworld.com"); undefined in dev. */
  cookieDomain?: string;
  /**
   * Google OAuth credentials. The Google provider is enabled only when both are
   * present (env-driven); the callback terminates at the backend by default
   * (`baseURL` + `/api/v1/auth/callback/google`).
   */
  google?: { clientId: string; clientSecret: string };
  /** Auth-endpoint rate limiting (env-driven). */
  rateLimit: {
    enabled: boolean;
    /** Window length in seconds. */
    window: number;
    /** General request cap per window. */
    max: number;
    /** Tighter cap per window for auth-sensitive endpoints (login/register/…). */
    sensitiveMax: number;
  };
  /**
   * Delivery of the email-verification link. Abstracted so the real transport
   * (Resend) is wired in a later milestone; for now the implementation logs.
   */
  sendVerificationEmail: (input: { email: string; url: string }) => Promise<void> | void;
}

/**
 * Build the FWorld Better Auth instance — **foundation only** (Milestone 2.1).
 *
 * Milestone 2.2 enables **email/password** + **email verification** (native
 * Better Auth). Phone OTP, Google, and Apple remain disabled (later milestones).
 */
export function createAuth(options: CreateAuthOptions) {
  return betterAuth({
    appName: 'FWorld',
    secret: options.secret,
    baseURL: options.baseURL,
    basePath: '/api/v1/auth',
    trustedOrigins: options.trustedOrigins,
    database: prismaAdapter(options.prisma, { provider: 'postgresql' }),
    // Email/password (Milestone 2.2). `requireEmailVerification` is left at its
    // default (false) so login works pre-verification; verification is sent on
    // sign-up and can be enforced in a later milestone.
    emailAndPassword: {
      enabled: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await options.sendVerificationEmail({ email: user.email, url });
      },
    },
    // Google OAuth (Milestone 2.3.1). Enabled only when credentials are present.
    // The callback terminates at the backend (default redirectURI). Apple/OTP
    // remain disabled.
    ...(options.google
      ? {
          socialProviders: {
            google: {
              clientId: options.google.clientId,
              clientSecret: options.google.clientSecret,
            },
          },
        }
      : {}),
    // Native account linking (auth-architecture/06): a Google sign-in links to an
    // existing user on a verified-email match. Google's email is verified, so it
    // is a trusted provider. No custom linking logic.
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    session: {
      // Sliding expiration (auth-architecture/08). The ABSOLUTE maximum lifetime
      // is enforced separately in AuthGuard (Better Auth has no native absolute cap).
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh the session if older than 1 day
    },
    // Auth-endpoint rate limiting (Q9 / api-architecture/08). Uses Better Auth's
    // built-in in-memory limiter for now; configuring `secondaryStorage` (Redis)
    // later makes it distributed with NO change here.
    rateLimit: {
      enabled: options.rateLimit.enabled,
      window: options.rateLimit.window,
      max: options.rateLimit.max,
      customRules: {
        '/sign-in/email': { window: options.rateLimit.window, max: options.rateLimit.sensitiveMax },
        '/sign-up/email': { window: options.rateLimit.window, max: options.rateLimit.sensitiveMax },
        '/forget-password': {
          window: options.rateLimit.window,
          max: options.rateLimit.sensitiveMax,
        },
        '/send-verification-email': {
          window: options.rateLimit.window,
          max: options.rateLimit.sensitiveMax,
        },
      },
    },
    advanced: {
      // App-layer UUID v7 (CTO decision) instead of Better Auth's default id.
      database: {
        generateId: () => newId(),
      },
      // Secure cookies in production; HttpOnly + SameSite=Lax everywhere (Q2/Q9).
      useSecureCookies: options.useSecureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
      },
      // Cross-subdomain cookies for prod (fworld.com ↔ api.fworld.com, Q3). Only
      // enabled when a domain is configured; host-only in dev (localhost).
      ...(options.cookieDomain
        ? { crossSubDomainCookies: { enabled: true, domain: options.cookieDomain } }
        : {}),
    },
    user: {
      // Extend Better Auth's user with the approved FWorld fields (Q10).
      // `input: false` keeps them server-controlled (no client-set role/status).
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'CUSTOMER', input: false },
        status: { type: 'string', required: false, defaultValue: 'ACTIVE', input: false },
        phone: { type: 'string', required: false, input: false },
        phoneVerified: { type: 'boolean', required: false, defaultValue: false, input: false },
        lastLogin: { type: 'date', required: false, input: false },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
