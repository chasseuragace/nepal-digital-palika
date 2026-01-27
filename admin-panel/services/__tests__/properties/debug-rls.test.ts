import { describe, it, expect, beforeAll } from 'vitest'
import { supabase, createAuthenticatedClient } from '../setup/integration-setup'

/**
 * Debug RLS enforcement
 * This test helps identify why RLS policies aren't working
 */
describe('Debug RLS Enforcement', () => {
  let testPalikas: number[] = []

  beforeAll(async () => {
    // Get test palikas
    const { data: palikas } = await supabase.from('palikas').select('id').limit(3)
    if (!palikas || palikas.length < 2) throw new Error('Not enough palikas')
    testPalikas = palikas.map(p => p.id)
  })

  it('should debug RLS policy enforcement', async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const email = `debug-rls-${uniqueId}@example.com`
    const password = 'TestPassword123!'

    // Create test admin with access to first palika only
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) throw new Error(`Auth error: ${authError.message}`)

    const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
      id: authUser.user.id,
      full_name: `debug-rls-${uniqueId}`,
      role: 'palika_admin',
      hierarchy_level: 'palika',
      province_id: null,
      district_id: null,
      palika_id: testPalikas[0],
      is_active: true
    }).select().single()
    if (adminError) throw new Error(`Admin error: ${adminError.message}`)

    // Assign admin to first palika
    const { error: regionError } = await supabase.from('admin_regions').insert({
      admin_id: admin.id,
      region_type: 'palika',
      region_id: testPalikas[0]
    })
    if (regionError) throw new Error(`Region error: ${regionError.message}`)

    // Create heritage sites in different palikas
    const site1Data = {
      palika_id: testPalikas[0],
      name_en: `Debug Site ${uniqueId} - Palika 1`,
      name_ne: 'Debug Site',
      slug: `debug-${uniqueId}-1`,
      category_id: 1,
      location: 'POINT(85.3 27.7)',
      status: 'published'
    }

    const site2Data = {
      palika_id: testPalikas[1],
      name_en: `Debug Site ${uniqueId} - Palika 2`,
      name_ne: 'Debug Site',
      slug: `debug-${uniqueId}-2`,
      category_id: 1,
      location: 'POINT(85.3 27.7)',
      status: 'published'
    }

    const { data: site1 } = await supabase.from('heritage_sites').insert(site1Data).select().single()
    const { data: site2 } = await supabase.from('heritage_sites').insert(site2Data).select().single()

    console.log('Created admin:', admin.id, admin.full_name, admin.role)
    console.log('Admin palika_id:', admin.palika_id)
    console.log('Site 1 palika_id:', site1?.palika_id)
    console.log('Site 2 palika_id:', site2?.palika_id)

    // Create authenticated client
    const adminClient = await createAuthenticatedClient(email, password)

    // Test 1: Query all heritage sites (should be filtered by RLS)
    const { data: allSites, error: allError } = await adminClient
      .from('heritage_sites')
      .select('id, palika_id, name_en')
      .eq('status', 'published')

    console.log('Query result:', allSites?.length, 'sites')
    console.log('Sites returned:', allSites?.map(s => ({ id: s.id, palika_id: s.palika_id, name: s.name_en })))

    if (allError) {
      console.error('Query error:', allError)
      throw allError
    }

    // Test 2: Query with explicit palika filter
    const { data: filteredSites } = await adminClient
      .from('heritage_sites')
      .select('id, palika_id, name_en')
      .eq('palika_id', testPalikas[0])
      .eq('status', 'published')

    console.log('Filtered query result:', filteredSites?.length, 'sites')

    // Verify results
    const canSeeSite1 = allSites?.some(s => s.id === site1?.id)
    const canSeeSite2 = allSites?.some(s => s.id === site2?.id)

    console.log('Can see site 1 (should be true):', canSeeSite1)
    console.log('Can see site 2 (should be false):', canSeeSite2)

    expect(canSeeSite1).toBe(true)
    expect(canSeeSite2).toBe(false)
  })
})
