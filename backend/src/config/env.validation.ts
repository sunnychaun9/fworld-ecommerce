import { z } from 'zod';

/**
 * Environment variable schema. Validated once at bootstrap so the app fails fast
 * on misconfiguration (CTO decision: Zod for validation). Only foundational keys
 * are required here; integration keys (Razorpay, Shiprocket, R2, …) are added in
 * their respective feature sprints.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().min(1).default('api/v1'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  // Optional at validation time so unit tests / CI build run without a database;
  // required at runtime when PrismaService connects.
  DATABASE_URL: z.string().min(1).optional(),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),
  // Better Auth (Milestone 2.1). The secret MUST be overridden in production.
  BETTER_AUTH_SECRET: z.string().min(1).default('dev-better-auth-secret-change-me'),
  BETTER_AUTH_URL: z.string().min(1).default('http://localhost:4000'),
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
