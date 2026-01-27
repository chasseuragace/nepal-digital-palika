/**
 * Integration Test Setup
 * Uses real Supabase database for development testing
 * 
 * IMPORTANT: Tests use authenticated clients to properly test RLS enforcement.
 * Service role is only used for admin operations (creating test users, cleanup).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseClient } from '../../database-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for integration tests. Make sure .env.local is configured.')
}

// Service role client - ONLY for admin operations (creating users, cleanup)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const integrationDb = createSupabaseClient(supabase)

// Test admin user credentials (from your seeded data)
export const testAdminCredentials = {
  superAdmin: {
    email: 'superadmin@nepal-tourism.gov.np',
    password: 'TempPassword123!'
  },
  palikaAdmin: {
    email: 'ktm.admin@nepal-tourism.gov.np', 
    password: 'TempPassword123!'
  },
  moderator: {
    email: 'moderator@nepal-tourism.gov.np',
    password: 'TempPassword123!'
  }
}

/**
 * Create an authenticated Supabase client for a specific user
 * This is used for RLS testing - the client respects RLS policies
 * 
 * @param email - User email
 * @param password - User password
 * @returns Authenticated Supabase client
 */
export async function createAuthenticatedClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(`Failed to authenticate user ${email}: ${error.message}`)
  }

  if (!data.session) {
    throw new Error(`No session created for user ${email}`)
  }

  // Create a new client with the user's session token
  // IMPORTANT: Use the session's access_token to set auth context for RLS
  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Set the session on the client so RLS policies can access auth.uid()
  await authenticatedClient.auth.setSession(data.session)

  return authenticatedClient
}

// Helper to clean up test data (uses service role for admin operations)
export async function cleanupTestData() {
  // Clean up any test-created data
  // Be careful not to delete seeded data
  await supabase
    .from('heritage_sites')
    .delete()
    .like('name_en', 'Test %')
    
  await supabase
    .from('events')
    .delete()
    .like('name_en', 'Test %')
    
  await supabase
    .from('blog_posts')
    .delete()
    .like('title_en', 'Test %')
}

// Helper to verify database has seeded data (uses service role for admin check)
export async function verifySeededData() {
  const { data: heritageSites } = await supabase
    .from('heritage_sites')
    .select('count')
    
  const { data: events } = await supabase
    .from('events')
    .select('count')
    
  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('count')
    
  if (!heritageSites?.length || !events?.length || !adminUsers?.length) {
    throw new Error('Database not properly seeded. Run: npm run seed:all in 07-database-seeding/')
  }
}