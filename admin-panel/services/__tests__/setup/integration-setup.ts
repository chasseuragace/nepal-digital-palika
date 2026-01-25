/**
 * Integration Test Setup
 * Uses real Supabase database for development testing
 */

import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from '../../database-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for integration tests. Make sure .env.local is configured.')
}

// Create real Supabase client for integration tests
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
    email: 'superadmin@nepaltourism.dev',
    password: 'SuperSecurePass123!'
  },
  palikaAdmin: {
    email: 'palika.admin@kathmandu.gov.np', 
    password: 'KathmanduAdmin456!'
  },
  moderator: {
    email: 'content.moderator@kathmandu.gov.np',
    password: 'ModeratorSecure789!'
  }
}

// Helper to clean up test data
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

// Helper to verify database has seeded data
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