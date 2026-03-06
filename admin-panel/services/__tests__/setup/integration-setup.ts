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

/**
 * Create a complete admin user with admin_regions entry
 *
 * This helper creates:
 * 1. Auth user (via Supabase Auth)
 * 2. Admin profile (admin_users table)
 * 3. Region assignment (admin_regions table) ← KEY FIX
 *
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin full name
 * @param role Admin role (palika_admin, district_admin, province_admin, etc.)
 * @param regionType Region type (palika, district, province)
 * @param regionId Region ID (palika_id, district_id, or province_id)
 * @param hierarchyLevel Hierarchy level (should match role)
 * @returns Created admin object with id
 */
export async function createTestAdminWithRegion(
  email: string,
  password: string,
  fullName: string,
  role: string,
  regionType: 'palika' | 'district' | 'province',
  regionId: number,
  hierarchyLevel: string
) {
  // Step 1: Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError || !authUser.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`)
  }

  // Step 2: Create admin_users record
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .insert({
      id: authUser.user.id,
      full_name: fullName,
      role,
      hierarchy_level: hierarchyLevel,
      is_active: true,
      province_id: regionType === 'province' ? regionId : null,
      district_id: regionType === 'district' ? regionId : null,
      palika_id: regionType === 'palika' ? regionId : null
    })
    .select()
    .single()

  if (adminError || !admin) {
    // Cleanup on failure
    await supabase.auth.admin.deleteUser(authUser.user.id)
    throw new Error(`Failed to create admin profile: ${adminError?.message}`)
  }

  // Step 3: Create admin_regions entry (CRITICAL FIX)
  const { error: regionError } = await supabase
    .from('admin_regions')
    .insert({
      admin_id: authUser.user.id,
      region_type: regionType,
      region_id: regionId
    })

  if (regionError) {
    // Cleanup on failure
    await supabase.auth.admin.deleteUser(authUser.user.id)
    await supabase.from('admin_users').delete().eq('id', authUser.user.id)
    throw new Error(`Failed to assign admin region: ${regionError.message}`)
  }

  return admin
}

/**
 * Helper to create a palika_admin for testing
 * Automatically fetches province/district from the palika
 *
 * @param palikaId The palika to assign admin to
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin name
 * @returns Created admin object
 */
export async function createPalikaAdminForTest(
  palikaId: number,
  email: string,
  password: string,
  fullName: string
) {
  // Fetch palika to get district_id
  const { data: palika, error: palikaError } = await supabase
    .from('palikas')
    .select('district_id')
    .eq('id', palikaId)
    .single()

  if (palikaError || !palika) {
    throw new Error(`Failed to fetch palika: ${palikaError?.message}`)
  }

  // Fetch district to get province_id
  const { data: district, error: districtError } = await supabase
    .from('districts')
    .select('province_id')
    .eq('id', palika.district_id)
    .single()

  if (districtError || !district) {
    throw new Error(`Failed to fetch district: ${districtError?.message}`)
  }

  return createTestAdminWithRegion(
    email,
    password,
    fullName,
    'palika_admin',
    'palika',
    palikaId,
    'palika'
  )
}

/**
 * Helper to create a district_admin for testing
 * Automatically fetches province from the district
 *
 * @param districtId The district to assign admin to
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin name
 * @returns Created admin object
 */
export async function createDistrictAdminForTest(
  districtId: number,
  email: string,
  password: string,
  fullName: string
) {
  // Fetch district to get province_id
  const { data: district, error: districtError } = await supabase
    .from('districts')
    .select('province_id')
    .eq('id', districtId)
    .single()

  if (districtError || !district) {
    throw new Error(`Failed to fetch district: ${districtError?.message}`)
  }

  return createTestAdminWithRegion(
    email,
    password,
    fullName,
    'district_admin',
    'district',
    districtId,
    'district'
  )
}

/**
 * Helper to create a province_admin for testing
 *
 * @param provinceId The province to assign admin to
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin name
 * @returns Created admin object
 */
export async function createProvinceAdminForTest(
  provinceId: number,
  email: string,
  password: string,
  fullName: string
) {
  return createTestAdminWithRegion(
    email,
    password,
    fullName,
    'province_admin',
    'province',
    provinceId,
    'province'
  )
}

/**
 * Helper to create a super_admin for testing
 * Super admins don't have region assignments
 *
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin name
 * @returns Created admin object
 */
export async function createSuperAdminForTest(
  email: string,
  password: string,
  fullName: string
) {
  // Step 1: Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError || !authUser.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`)
  }

  // Step 2: Create admin_users record (no region assignment for super_admin)
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .insert({
      id: authUser.user.id,
      full_name: fullName,
      role: 'super_admin',
      hierarchy_level: 'national',
      is_active: true
    })
    .select()
    .single()

  if (adminError || !admin) {
    // Cleanup on failure
    await supabase.auth.admin.deleteUser(authUser.user.id)
    throw new Error(`Failed to create admin profile: ${adminError?.message}`)
  }

  return admin
}

/**
 * Helper to create a moderator for testing
 * Moderators are palika-level with limited permissions
 *
 * @param palikaId The palika to assign moderator to
 * @param email Admin email
 * @param password Admin password
 * @param fullName Admin name
 * @returns Created admin object
 */
export async function createModeratorForTest(
  palikaId: number,
  email: string,
  password: string,
  fullName: string
) {
  // Fetch palika to get district_id
  const { data: palika, error: palikaError } = await supabase
    .from('palikas')
    .select('district_id')
    .eq('id', palikaId)
    .single()

  if (palikaError || !palika) {
    throw new Error(`Failed to fetch palika: ${palikaError?.message}`)
  }

  // Fetch district to get province_id
  const { data: district, error: districtError } = await supabase
    .from('districts')
    .select('province_id')
    .eq('id', palika.district_id)
    .single()

  if (districtError || !district) {
    throw new Error(`Failed to fetch district: ${districtError?.message}`)
  }

  return createTestAdminWithRegion(
    email,
    password,
    fullName,
    'moderator',
    'palika',
    palikaId,
    'palika'
  )
}