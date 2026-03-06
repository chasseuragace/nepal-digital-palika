/**
 * Property 3: Region Assignment Deletion Revokes Access
 * 
 * **Validates: Requirements 1.7**
 * 
 * For any admin with an admin_regions record, deleting that record should 
 * immediately revoke the admin's access to that region (verified by querying 
 * the user_has_access_to_palika function).
 * 
 * Test flow:
 * 1. Create admin with access to palika A
 * 2. Verify admin can access content in palika A
 * 3. Delete the admin_regions record
 * 4. Verify admin can no longer access content in palika A
 * 5. Verify audit log records the deletion
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../setup/integration-setup'
import { siteName } from '../setup/test-generators'

describe('Property 3: Region Assignment Deletion Revokes Access', () => {
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

    // Get test palikas
    let palikas: any[] = []
    for (const districtId of testDistricts) {
      const { data: p } = await supabase.from('palikas').select('id').eq('district_id', districtId).limit(10)
      if (p && p.length > 0) {
        palikas = p.slice(0, Math.min(3, p.length))
        if (palikas.length >= 1) break
      }
    }
    if (palikas.length < 1) throw new Error('Not enough palikas')
    testPalikas = palikas.map(p => p.id)
  })

  afterEach(async () => {
    // Clean up test data
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-region-deletion-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test heritage sites
    const { data: testSites } = await supabase.from('heritage_sites').select('id').like('name_en', 'Test Region Deletion %')
    if (testSites && testSites.length > 0) {
      for (const site of testSites) {
        await supabase.from('heritage_sites').delete().eq('id', site.id)
      }
    }
  })

  describe('Requirement 1.7: Region assignment deletion revokes access', () => {
    it('should revoke access immediately after deleting admin_regions record', async () => {
      await fc.assert(
        fc.asyncProperty(
          siteName(),
          async (testSiteName) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-region-deletion-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in the palika using service role
            // Use unpublished status so RLS enforcement applies (published sites are public)
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Region Deletion ${uniqueId}`,
              name_ne: 'Test Heritage Site',
              slug: `test-region-deletion-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'draft'
            }

            const { data: site } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            // Create test admin with access to the palika
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            // Get proper province and district IDs for the palika
            const { data: palika, error: palikaError } = await supabase
              .from('palikas')
              .select('district_id')
              .eq('id', testPalikas[0])
              .single()
            if (palikaError || !palika) throw new Error(`Failed to get palika: ${palikaError?.message}`)

            const { data: district, error: districtError } = await supabase
              .from('districts')
              .select('province_id')
              .eq('id', palika.district_id)
              .single()
            if (districtError || !district) throw new Error(`Failed to get district: ${districtError?.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-region-deletion-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: district.province_id,
              district_id: palika.district_id,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to the palika
            const { data: adminRegion, error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            }).select().single()
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

            // Verify admin can access the site BEFORE deletion
            const { data: visibleBefore, error: errorBefore } = await adminClient
              .from('heritage_sites')
              .select('id')
              .eq('id', site.id)
              .single()

            expect(errorBefore).toBeNull()
            expect(visibleBefore).toBeDefined()
            expect(visibleBefore?.id).toBe(site.id)

            // Delete the admin_regions record using service role
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('id', adminRegion.id)

            if (deleteError) throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)

            // Refresh session to clear auth cache after RLS policy changes
            await adminClient.auth.refreshSession()

            // Wait a moment for the change to propagate
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify admin can NO LONGER access the site AFTER deletion
            const { data: visibleAfter, error: errorAfter } = await adminClient
              .from('heritage_sites')
              .select('id')
              .eq('id', site.id)
              .single()

            // After deletion, the query should return no results or an error
            expect(visibleAfter).toBeNull()

            // Verify audit log records the deletion
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_regions')
              .eq('action', 'DELETE')
              .eq('entity_id', adminRegion.id.toString())
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) throw new Error(`Failed to fetch audit log: ${auditError.message}`)

            // Verify audit log entry exists
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)

            const auditLog = auditLogs[0]
            expect(auditLog.action).toBe('DELETE')
            expect(auditLog.entity_type).toBe('admin_regions')
            expect(auditLog.entity_id).toBe(adminRegion.id.toString())
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should allow re-access after re-assigning the region', async () => {
      await fc.assert(
        fc.asyncProperty(
          siteName(),
          async (testSiteName) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-region-deletion-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create a heritage site in the palika using service role
            // Use unpublished status so RLS enforcement applies (published sites are public)
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Region Deletion ${testSiteName}`,
              name_ne: 'Test Heritage Site',
              slug: `test-region-deletion-${uniqueId}`,
              category_id: 1,
              location: 'POINT(85.3 27.7)',
              status: 'draft'
            }

            const { data: site } = await supabase
              .from('heritage_sites')
              .insert(siteData)
              .select()
              .single()

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            // Get proper province and district IDs for the palika
            const { data: palika, error: palikaError } = await supabase
              .from('palikas')
              .select('district_id')
              .eq('id', testPalikas[0])
              .single()
            if (palikaError || !palika) throw new Error(`Failed to get palika: ${palikaError?.message}`)

            const { data: district, error: districtError } = await supabase
              .from('districts')
              .select('province_id')
              .eq('id', palika.district_id)
              .single()
            if (districtError || !district) throw new Error(`Failed to get district: ${districtError?.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-region-deletion-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: district.province_id,
              district_id: palika.district_id,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to the palika
            const { data: adminRegion, error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            }).select().single()
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

            // Delete the admin_regions record
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('id', adminRegion.id)

            if (deleteError) throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)

            // Refresh session after deletion
            await adminClient.auth.refreshSession()
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify admin cannot access the site
            const { data: visibleAfterDelete } = await adminClient
              .from('heritage_sites')
              .select('id')
              .eq('id', site.id)
              .single()

            expect(visibleAfterDelete).toBeNull()

            // Re-assign the region using service role
            const { error: reassignError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })

            if (reassignError) throw new Error(`Failed to reassign region: ${reassignError.message}`)

            // Refresh session after re-assignment
            await adminClient.auth.refreshSession()
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify admin can access the site again
            const { data: visibleAfterReassign, error: errorAfterReassign } = await adminClient
              .from('heritage_sites')
              .select('id')
              .eq('id', site.id)
              .single()

            expect(errorAfterReassign).toBeNull()
            expect(visibleAfterReassign).toBeDefined()
            expect(visibleAfterReassign?.id).toBe(site.id)
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
