import { defineConfig } from 'vitest/config'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

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
    testTimeout: 300000, // Longer timeout for integration tests (5 minutes)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
