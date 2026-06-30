import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest unit-test config (TRD §19). SWC compiles TypeScript + legacy decorators
 * and emits decorator metadata so NestJS providers load correctly under Vitest.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    root: '.',
    include: ['src/**/*.spec.ts'],
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
