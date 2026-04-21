import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * e2e tests import m-place's real datasource + repository classes so Phase 3
 * exercises the exact code the m-place UI runs — not a parallel reimpl. The
 * `@/` alias must therefore resolve into m-place/src, and VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY must be set so m-place's supabase-client module picks
 * them up at import time.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../m-place/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.e2e.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: 'verbose',
    // E2E flows mutate the same palika's data (heritage, events, blog,
    // providers, tier). Running files in parallel leads to cross-test
    // interference (e.g., the tier-flow's PATCH happening mid-way through
    // heritage create). Force one file at a time, one test at a time.
    sequence: { concurrent: false },
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    },
  },
});
