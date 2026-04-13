import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseAuth } from './mock-supabase-auth'

const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

if (useMockAuth) {
  console.log('🎭 Mock Auth Enabled - Using in-memory mock authentication')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Only create real Supabase client if not using mock auth
let supabaseInstance: any = null

function getSupabaseClient() {
  if (useMockAuth) {
    // Return a mock client that won't try to connect
    return {
      auth: createMockSupabaseAuth(),
      from: () => {
        throw new Error('Supabase data operations not available in mock auth mode')
      }
    }
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return getSupabaseClient()[prop as string]
  }
})

// Service role client for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

let supabaseAdminAuth: any

if (useMockAuth) {
  // Use mock auth for admin operations
  supabaseAdminAuth = createMockSupabaseAuth()
} else {
  // Use real Supabase for admin operations
  supabaseAdminAuth = createClient(supabaseUrl, supabaseServiceKey).auth
}

export const supabaseAdmin = {
  auth: supabaseAdminAuth,
  // For data operations, still use real Supabase (only if not mock mode)
  from: (table: string) => {
    if (useMockAuth) {
      throw new Error('Supabase data operations not available in mock auth mode')
    }
    return createClient(supabaseUrl, supabaseServiceKey).from(table)
  },
}