import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Integration-test config (separate from the unit suite). Runs only the
 * `test/**.integration.spec.ts` files, which require a live PostgreSQL and are
 * gated by `RUN_DB_TESTS=true`. Invoke with `pnpm --filter @fworld/backend
 * test:integration`.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    root: '.',
    include: ['test/**/*.integration.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
