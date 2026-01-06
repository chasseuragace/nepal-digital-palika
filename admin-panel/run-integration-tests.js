#!/usr/bin/env node

/**
 * Integration Test Runner
 * Loads environment variables and runs integration tests
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load .env.local file
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      envVars[key.trim()] = value
    }
  })
  
  // Set environment variables
  Object.assign(process.env, envVars)
  
  console.log('✅ Loaded environment variables from .env.local')
} else {
  console.error('❌ .env.local file not found')
  process.exit(1)
}

// Check required variables
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '))
  process.exit(1)
}

console.log('🚀 Running integration tests against real Supabase database...')
console.log('📍 Target:', process.env.NEXT_PUBLIC_SUPABASE_URL)

try {
  execSync('npx vitest run services/__tests__/integration/*.test.ts', {
    stdio: 'inherit',
    env: process.env
  })
} catch (error) {
  process.exit(error.status || 1)
}