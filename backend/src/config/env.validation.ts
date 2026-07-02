import { z } from 'zod';

/**
 * Dev-only placeholder secret. Used as the Better Auth secret in local/test
 * environments so developers don't need to set one. It is **rejected in
 * production** by the schema below — there is no production fallback secret.
 */
export const DEV_AUTH_SECRET = 'dev-only-insecure-secret-change-me-in-production-min-32';

/**
 * An optional string env var. A missing key *or* an empty string (the common
 * case when a `.env` template ships the var blank, e.g. `COOKIE_DOMAIN=`) is
 * treated as "unset" (`undefined`). Any non-empty value must have length >= 1.
 */
const optionalString = () =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional());

/**
 * Environment variable schema. Validated once at bootstrap so the app fails fast
 * on misconfiguration (CTO decision: Zod for validation).
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    API_PREFIX: z.string().min(1).default('api/v1'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    // Optional at validation time so unit tests / CI build run without a database
    // in non-production; REQUIRED in production (see refinement below).
    DATABASE_URL: optionalString(),
    RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),

    // Better Auth. The secret defaults to the dev placeholder in dev/test and is
    // REQUIRED (and must differ from the placeholder) in production.
    BETTER_AUTH_SECRET: z.string().min(1).default(DEV_AUTH_SECRET),
    BETTER_AUTH_URL: z.string().min(1).default('http://localhost:4000'),

    // Auth-endpoint rate limiting (env-driven; Redis pluggable later).
    AUTH_RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true'),
    AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_SENSITIVE_MAX: z.coerce.number().int().positive().default(20),

    // Production cross-subdomain cookie domain, e.g. ".fworld.com". Unset in dev
    // (host-only cookies; localhost works cross-port).
    COOKIE_DOMAIN: optionalString(),

    // Absolute maximum session lifetime (days), enforced on top of sliding sessions.
    SESSION_ABSOLUTE_MAX_DAYS: z.coerce.number().int().positive().default(30),

    // Google OAuth (Milestone 2.3.1). Optional — the provider is enabled only
    // when both are set. Must be provided together.
    GOOGLE_CLIENT_ID: optionalString(),
    GOOGLE_CLIENT_SECRET: optionalString(),

    // Razorpay (Milestone 4.4). Optional — enabled only when both are set.
    RAZORPAY_KEY_ID: optionalString(),
    RAZORPAY_KEY_SECRET: optionalString(),
    // Razorpay webhook secret (Milestone 4.5). Optional.
    RAZORPAY_WEBHOOK_SECRET: optionalString(),
  })
  .superRefine((env, ctx) => {
    // Google credentials must be provided together (any environment).
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_ID'],
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together',
      });
    }

    // Razorpay credentials must be provided together (any environment).
    if (Boolean(env.RAZORPAY_KEY_ID) !== Boolean(env.RAZORPAY_KEY_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RAZORPAY_KEY_ID'],
        message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set together',
      });
    }

    if (env.NODE_ENV !== 'production') {
      return;
    }
    if (!env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required in production',
      });
    }
    if (env.BETTER_AUTH_SECRET === DEV_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BETTER_AUTH_SECRET'],
        message:
          'BETTER_AUTH_SECRET is required in production: set a strong secret (>= 32 chars), not the dev placeholder',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Used by `ConfigModule.forRoot({ validate })`. Throws a readable error listing
 * every invalid variable.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
