/**
 * Property 25: UPDATE RLS Enforcement
 * 
 * **Validates: Requirements 6.7**
 * 
 * For any UPDATE operation on a content table by a non-super_admin user, 
 * the operation should fail if user_has_access_to_palika(palika_id) returns FALSE.
 * 
 * UPDATE operations should:
 * 1. Fail when admin lacks region access
 * 2. Succeed when admin has region access
 * 3. Return descriptive error messages
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../setup/integration-setup'
import { siteName } from '../setup/test-generators'

describe('Property 25: UPDATE RLS Enforcement', () => {
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
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-update-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test heritage sites
    const { data: testSites } = await supabase.from('heritage_sites').select('id').like('name_en', 'Test Update RLS %')
    if (testSites && testSites.length > 0) {
      for (const site of testSites) {
        await supabase.from('heritage_sites').delete().eq('id', site.id)
      }
    }
  })

  describe('Requirement 6.7: UPDATE operations fail without region access', () => {
    it('should fail UPDATE when admin lacks region access', async () => {
      // Skip if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          siteName(),
          async (testSiteName) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-update-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in a palika using service role
            const siteData = {
              palika_id: testPalikas[1], // Create in second palika
              name_en: `Test Update RLS ${testSiteName}`,
              name_ne: 'Test Heritage Site',
              slug: `test-update-rls-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'published'
            }

            const { data: site, error: siteError } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            if (siteError) throw new Error(`Failed to create site: ${siteError.message}`)

            // Create test admin with access to first palika only
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-update-rls-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika only
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

            // Try to UPDATE the heritage site in a palika they don't have access to
            const { data: updateData, error: updateError, count } = await adminClient
              .from('heritage_sites')
              .update({ name_en: `Updated ${uniqueId}` })
              .eq('id', site.id)
              .select()

            // Verify UPDATE failed - either error or 0 rows affected
            if (updateError) {
              expect(updateError?.message).toMatch(/access|permission|denied|forbidden|violates|security/i)
            } else {
              // If no error, should have 0 rows affected (RLS prevented the update)
              expect(updateData).toHaveLength(0)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should succeed UPDATE when admin has region access', async () => {
      await fc.assert(
        fc.asyncProperty(
          siteName(),
          async (testSiteName) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-update-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in a palika using service role
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Update RLS ${testSiteName}`,
              name_ne: 'Test Heritage Site',
              slug: `test-update-rls-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'published'
            }

            const { data: site, error: siteError } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            if (siteError) throw new Error(`Failed to create site: ${siteError.message}`)

            // Create test admin with access to first palika
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-update-rls-${uniqueId}`,
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

            // Try to UPDATE the heritage site in a palika they DO have access to
            const newName = `Updated ${testSiteName}`
            const { data: updated, error: updateError } = await adminClient
              .from('heritage_sites')
              .update({ name_en: newName })
              .eq('id', site.id)
              .select()
              .single()

            // Verify UPDATE succeeded
            expect(updateError).toBeNull()
            expect(updated).toBeDefined()
            expect(updated.name_en).toBe(newName)
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
