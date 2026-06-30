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
    session: {
      // Sliding expiration (auth-architecture/08).
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh the session if older than 1 day
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
