import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseAuth } from './mock-supabase-auth'

const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

if (useMockAuth) {
  console.log('🎭 Mock Auth Enabled - Using in-memory mock authentication')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  // For data operations, still use real Supabase
  from: (table: string) => createClient(supabaseUrl, supabaseServiceKey).from(table),
}