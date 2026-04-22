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
    // Use mock auth but allow real Supabase data operations
    // This enables testing with mock login credentials against real database
    if (!supabaseInstance) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    }

    return {
      auth: createMockSupabaseAuth(),
      ...supabaseInstance,
      from: supabaseInstance.from.bind(supabaseInstance),
      storage: supabaseInstance.storage
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

// Export the client lazily - only create when first accessed
export const supabaseClient = new Proxy({}, {
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

const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey)

export const supabaseAdmin = {
  auth: supabaseAdminAuth,
  // For data operations, use service role key to bypass RLS policies
  // This allows testing and server-side operations even with mock auth
  from: (table: string) => {
    return supabaseAdminClient.from(table)
  },
  storage: supabaseAdminClient.storage
}