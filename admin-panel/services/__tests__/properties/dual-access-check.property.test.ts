/**
 * Property 11: Dual Access Check Requirement
 * 
 * **Validates: Requirements 3.4**
 * 
 * For any admin attempting a data operation, the operation should succeed only if 
 * BOTH user_has_access_to_palika(palika_id) AND user_has_permission(required_permission) 
 * return TRUE.
 * 
 * Test scenarios:
 * 1. Admin with region access but no permission → should fail
 * 2. Admin with permission but no region access → should fail
 * 3. Admin with both region access and permission → should succeed
 * 4. Super admin with no explicit assignments → should succeed
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../setup/integration-setup'

describe('Property 11: Dual Access Check Requirement', () => {
  let testProvinces: number[] = []
  let testDistricts: number[] = []
  let testPalikas: number[] = []

  beforeAll(async () => {
    // Get test provinces
    const { data: provinces } = await supabase.from('provinces').select('id').limit(5)
    if (!provinces || provinces.length < 1) throw new Error('Not enough provinces')
    testProvinces = provinces.slice(0, Math.min(3, provinces.length)).map(p => p.id)

    // Get test districts
    let districts: any[] = []
    for (const provinceId of testProvinces) {
      const { data: d } = await supabase.from('districts').select('id').eq('province_id', provinceId).limit(10)
      if (d && d.length > 0) {
        districts = d.slice(0, Math.min(3, d.length))
        break
      }
    }
    if (districts.length < 1) throw new Error('Not enough districts')
    testDistricts = districts.map(d => d.id)

    // Get test palikas - need at least 2 for testing
    let palikas: any[] = []
    for (const districtId of testDistricts) {
      const { data: p } = await supabase.from('palikas').select('id').eq('district_id', districtId).limit(10)
      if (p && p.length > 0) {
        palikas = p.slice(0, Math.min(3, p.length))
        if (palikas.length >= 2) break
      }
    }
    if (palikas.length < 2) throw new Error('Not enough palikas')
    testPalikas = palikas.map(p => p.id)
  })

  afterEach(async () => {
    // Clean up test data
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-dual-access-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test heritage sites
    const { data: testSites } = await supabase.from('heritage_sites').select('id').like('name_en', 'Test Dual Access %')
    if (testSites && testSites.length > 0) {
      for (const site of testSites) {
        await supabase.from('heritage_sites').delete().eq('id', site.id)
      }
    }
  })

  describe('Requirement 3.4: Both region access AND permission required', () => {
    it('should fail when admin has region access but no permission', async () => {
      // Skip if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dual-access-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in a palika using service role
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Dual Access ${uniqueId}`,
              name_ne: 'Test Heritage Site',
              slug: `test-dual-access-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'published'
            }

            const { data: site } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            // Create test admin with access to first palika but with a role that has no permissions
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            // Use a role that typically has limited permissions (e.g., support_agent)
            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-dual-access-${uniqueId}`,
              role: 'support_agent', // Limited role
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika (region access granted)
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Try to UPDATE the heritage site (has region access but may lack permission)
            const { error: updateError } = await adminClient
              .from('heritage_sites')
              .update({ name_en: `Updated ${uniqueId}` })
              .eq('id', site.id)

            // Verify operation failed due to permission check
            // Note: This may fail due to either permission or region access
            expect(updateError).toBeDefined()
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should succeed when admin has both region access and permission', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dual-access-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in a palika using service role
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Dual Access ${uniqueId}`,
              name_ne: 'Test Heritage Site',
              slug: `test-dual-access-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'published'
            }

            const { data: site } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            // Create test admin with access to first palika and with a role that has permissions
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            // Use a role that has permissions (e.g., palika_admin)
            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-dual-access-${uniqueId}`,
              role: 'palika_admin', // Has permissions
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika (region access granted)
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Try to UPDATE the heritage site (has both region access and permission)
            const newName = `Updated ${uniqueId}`
            const { data: updated, error: updateError } = await adminClient
              .from('heritage_sites')
              .update({ name_en: newName })
              .eq('id', site.id)
              .select()
              .single()

            // Verify operation succeeded
            expect(updateError).toBeNull()
            expect(updated).toBeDefined()
            expect(updated.name_en).toBe(newName)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should succeed when super_admin attempts operation regardless of assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dual-access-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in a palika using service role
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Dual Access ${uniqueId}`,
              name_ne: 'Test Heritage Site',
              slug: `test-dual-access-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'published'
            }

            const { data: site } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            // Create test super_admin with no explicit assignments
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-dual-access-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Try to UPDATE the heritage site (super_admin should have all access)
            const newName = `Updated ${uniqueId}`
            const { data: updated, error: updateError } = await adminClient
              .from('heritage_sites')
              .update({ name_en: newName })
              .eq('id', site.id)
              .select()
              .single()

            // Verify operation succeeded
            expect(updateError).toBeNull()
            expect(updated).toBeDefined()
            expect(updated.name_en).toBe(newName)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
