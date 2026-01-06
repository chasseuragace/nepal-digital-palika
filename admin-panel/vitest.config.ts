import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['services/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.ts'],
      exclude: ['services/__tests__/**', 'services/index.ts']
    },
    // Separate test environments
    testTimeout: 10000, // Longer timeout for integration tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
