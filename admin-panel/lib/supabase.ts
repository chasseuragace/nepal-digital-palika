import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseAuth } from './mock-supabase-auth'

const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
const useFakeDatasources = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

if (useMockAuth) {
  console.log('🎭 Mock Auth Enabled - Using in-memory mock authentication')
}

if (useFakeDatasources) {
  console.log('🎭 Fake Datasources Enabled - No Supabase connections will be made')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Only create real Supabase client if not using fake datasources
let supabaseInstance: any = null

function getSupabaseClient() {
  // If using fake datasources, don't create any Supabase client
  if (useFakeDatasources) {
    console.warn('[Supabase] Attempted to use Supabase client while NEXT_PUBLIC_USE_FAKE_DATASOURCES=true')
    // Return a mock client that does nothing (datasources should use fake implementations)
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'from') {
          return () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: null }),
            update: () => ({ data: null, error: null }),
            delete: () => ({ error: null }),
            eq: () => ({
              select: () => ({ data: [], error: null }),
              single: () => ({ data: null, error: null }),
            }),
          })
        }
        return () => {}
      }
    })
  }

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

// Service role client for admin operations - lazy initialization
// Only create when first accessed to avoid client-side errors
let supabaseAdminInstance: any = null

function getSupabaseAdmin() {
  // If using fake datasources, don't create any Supabase admin client
  if (useFakeDatasources) {
    console.warn('[Supabase] Attempted to use Supabase admin client while NEXT_PUBLIC_USE_FAKE_DATASOURCES=true')
    // Return a mock client that does nothing (datasources should use fake implementations)
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'from') {
          return () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: null }),
            update: () => ({ data: null, error: null }),
            delete: () => ({ error: null }),
            eq: () => ({
              select: () => ({ data: [], error: null }),
              single: () => ({ data: null, error: null }),
            }),
          })
        }
        return () => {}
      }
    })
  }

  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. ' +
      'This should only be used in server-side code.'
    )
  }

  let supabaseAdminAuth: any

  if (useMockAuth) {
    // Use mock auth for admin operations
    supabaseAdminAuth = createMockSupabaseAuth()
  } else {
    // Use real Supabase for admin operations
    supabaseAdminAuth = createClient(supabaseUrl, supabaseServiceKey).auth
  }

  const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey)

  supabaseAdminInstance = {
    auth: supabaseAdminAuth,
    // For data operations, use service role key to bypass RLS policies
    // This allows testing and server-side operations even with mock auth
    from: (table: string) => {
      return supabaseAdminClient.from(table)
    },
    storage: supabaseAdminClient.storage
  }

  return supabaseAdminInstance
}

export const supabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as string]
  }
})