/**
 * RLS Admin Regions Dependency Test
 *
 * Tests whether RLS policies properly depend on admin_regions table
 * and NOT on direct admin_users.palika_id/district_id/province_id shortcuts
 *
 * Critical: Deleting admin_regions entry MUST immediately revoke access
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import {
  supabase,
  createAuthenticatedClient,
  createPalikaAdminForTest,
  createDistrictAdminForTest
} from '../setup/integration-setup'

describe('RLS Admin Regions Dependency Tests', () => {
  let testPalikaId: number
  let testDistrictId: number
  let testCategoryId: number

  beforeAll(async () => {
    // Get test palika
    const { data: palikas } = await supabase.from('palikas').select('id, district_id').limit(1)
    if (!palikas || palikas.length === 0) throw new Error('No palikas found')
    testPalikaId = palikas[0].id
    testDistrictId = palikas[0].district_id

    // Get or create category
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('entity_type', 'heritage_site')
      .limit(1)

    if (categories && categories.length > 0) {
      testCategoryId = categories[0].id
    } else {
      const { data: newCat } = await supabase
        .from('categories')
        .insert({
          entity_type: 'heritage_site',
          name_en: 'Test Category',
          name_ne: 'परीक्षण श्रेणी',
          slug: `test-${Date.now()}`
        })
        .select()
        .single()
      testCategoryId = newCat?.id || 1
    }
  })

  afterEach(async () => {
    // Cleanup
    const { data: testAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .like('full_name', 'test-rls-dependency-%')

    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Cleanup sites
    const { data: testSites } = await supabase
      .from('heritage_sites')
      .select('id')
      .like('name_en', 'Test RLS Dependency%')

    if (testSites && testSites.length > 0) {
      for (const site of testSites) {
        await supabase.from('heritage_sites').delete().eq('id', site.id)
      }
    }
  })

  describe('Palika Admin - admin_regions dependency', () => {
    it('should revoke access when admin_regions entry is deleted (CRITICAL)', async () => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const email = `test-rls-dependency-${uniqueId}@example.com`
      const password = 'TestPassword123!'

      // Step 1: Create palika admin with helper (creates auth + admin_users + admin_regions)
      const admin = await createPalikaAdminForTest(testPalikaId, email, password, `test-rls-dependency-${uniqueId}`)
      console.log('Created admin:', admin.id, admin.full_name)

      // Step 2: Create a DRAFT heritage site (not public)
      const { data: site } = await supabase
        .from('heritage_sites')
        .insert({
          palika_id: testPalikaId,
          name_en: `Test RLS Dependency ${uniqueId} - Draft`,
          name_ne: 'परीक्षण',
          slug: `test-rls-dep-${uniqueId}`,
          category_id: testCategoryId,
          location: 'POINT(85.3 27.7)',
          status: 'draft' // CRITICAL: Use draft so it requires RLS access
        })
        .select()
        .single()

      if (!site) throw new Error('Failed to create site')
      console.log('Created draft site:', site.id, 'status:', site.status)

      // Step 3: Create authenticated client as the admin
      const adminClient = await createAuthenticatedClient(email, password)

      // Step 4: BEFORE deletion - admin CAN see the draft site
      const { data: siteBeforeDeletion } = await adminClient
        .from('heritage_sites')
        .select('id')
        .eq('id', site.id)
        .eq('status', 'draft')
        .single()

      console.log('Before admin_regions deletion - admin sees site:', !!siteBeforeDeletion)
      expect(siteBeforeDeletion).toBeDefined()
      expect(siteBeforeDeletion?.id).toBe(site.id)

      // Step 5: DELETE admin_regions entry (revoke region access)
      const { error: deleteError } = await supabase
        .from('admin_regions')
        .delete()
        .eq('admin_id', admin.id)
        .eq('region_type', 'palika')
        .eq('region_id', testPalikaId)

      if (deleteError) throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)
      console.log('Deleted admin_regions entry')

      // Step 6: Refresh session
      await adminClient.auth.refreshSession()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 7: AFTER deletion - admin CANNOT see the draft site
      const { data: siteAfterDeletion } = await adminClient
        .from('heritage_sites')
        .select('id')
        .eq('id', site.id)
        .eq('status', 'draft')
        .single()

      console.log('After admin_regions deletion - admin sees site:', !!siteAfterDeletion)

      // THIS IS THE CRITICAL TEST
      // If this fails, it means RLS is still using admin_users.palika_id shortcut
      expect(siteAfterDeletion).toBeNull()
    })

    it('should verify admin_users.palika_id is not used for access control', async () => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const email = `test-rls-dependency-palika-${uniqueId}@example.com`
      const password = 'TestPassword123!'

      // Create admin
      const admin = await createPalikaAdminForTest(testPalikaId, email, password, `test-rls-dependency-${uniqueId}`)

      // Query direct admin_users to see palika_id
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, palika_id, role')
        .eq('id', admin.id)
        .single()

      console.log('Admin record - palika_id:', adminUser?.palika_id, 'role:', adminUser?.role)
      expect(adminUser?.palika_id).toBe(testPalikaId)

      // Query admin_regions to verify it exists
      const { data: regions } = await supabase
        .from('admin_regions')
        .select('admin_id, region_type, region_id')
        .eq('admin_id', admin.id)

      console.log('Admin regions:', regions)
      expect(regions).toHaveLength(1)
      expect(regions?.[0]).toEqual({
        admin_id: admin.id,
        region_type: 'palika',
        region_id: testPalikaId
      })

      // Create draft site
      const { data: site } = await supabase
        .from('heritage_sites')
        .insert({
          palika_id: testPalikaId,
          name_en: `Test RLS Verify ${uniqueId}`,
          name_ne: 'परीक्षण',
          slug: `test-verify-${uniqueId}`,
          category_id: testCategoryId,
          location: 'POINT(85.3 27.7)',
          status: 'draft'
        })
        .select()
        .single()

      // Delete admin_regions WITHOUT updating admin_users.palika_id
      await supabase
        .from('admin_regions')
        .delete()
        .eq('admin_id', admin.id)

      // NOTE: admin_users.palika_id STILL EXISTS and STILL EQUALS testPalikaId
      // If RLS depends on this field, admin should still see the site
      // But admin_regions is deleted, so if RLS is correct, admin should NOT see site

      const adminClient = await createAuthenticatedClient(email, password)
      await adminClient.auth.refreshSession()

      const { data: siteAfter } = await adminClient
        .from('heritage_sites')
        .select('id')
        .eq('id', site?.id || 0)
        .eq('status', 'draft')
        .single()

      console.log('After deletion - admin_users.palika_id still exists:', adminUser?.palika_id)
      console.log('After deletion - admin_regions deleted')
      console.log('After deletion - admin can see site:', !!siteAfter)

      // If this passes: RLS correctly uses admin_regions, not admin_users.palika_id ✅
      // If this fails: RLS is still using admin_users.palika_id shortcut ❌
      expect(siteAfter).toBeNull()
    })
  })

  describe('District Admin - should use admin_regions, not admin_users.district_id', () => {
    it('should revoke access when admin_regions is deleted', async () => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const email = `test-rls-dep-district-${uniqueId}@example.com`
      const password = 'TestPassword123!'

      // Create district admin
      const admin = await createDistrictAdminForTest(testDistrictId, email, password, `test-rls-dependency-${uniqueId}`)

      // Create draft site in a palika in this district
      const { data: site } = await supabase
        .from('heritage_sites')
        .insert({
          palika_id: testPalikaId,
          name_en: `Test District RLS ${uniqueId}`,
          name_ne: 'परीक्षण',
          slug: `test-dist-${uniqueId}`,
          category_id: testCategoryId,
          location: 'POINT(85.3 27.7)',
          status: 'draft'
        })
        .select()
        .single()

      if (!site) throw new Error('Failed to create site')

      const adminClient = await createAuthenticatedClient(email, password)

      // Before deletion - admin can see
      const { data: siteBefore } = await adminClient
        .from('heritage_sites')
        .select('id')
        .eq('id', site.id)
        .eq('status', 'draft')
        .single()

      expect(siteBefore).toBeDefined()

      // Delete admin_regions
      await supabase
        .from('admin_regions')
        .delete()
        .eq('admin_id', admin.id)

      await adminClient.auth.refreshSession()

      // After deletion - admin CANNOT see
      const { data: siteAfter } = await adminClient
        .from('heritage_sites')
        .select('id')
        .eq('id', site.id)
        .eq('status', 'draft')
        .single()

      expect(siteAfter).toBeNull()
    })
  })

  describe('Debug RLS Policy Evaluation', () => {
    it('should show which RLS checks are passing/failing', async () => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const email = `test-debug-${uniqueId}@example.com`
      const password = 'TestPassword123!'

      const admin = await createPalikaAdminForTest(testPalikaId, email, password, `test-debug-${uniqueId}`)

      // Check if debug functions exist
      const { data: debugResult, error: debugError } = await supabase
        .rpc('debug_user_has_access_to_palika', { palika_id_param: testPalikaId })

      if (!debugError) {
        console.log('\n=== DEBUG: user_has_access_to_palika ===')
        console.log(debugResult)
      } else {
        console.log('Debug function not available:', debugError.message)
      }

      // After deleting admin_regions
      await supabase
        .from('admin_regions')
        .delete()
        .eq('admin_id', admin.id)

      const { data: debugAfter } = await supabase
        .rpc('debug_user_has_access_to_palika', { palika_id_param: testPalikaId })

      if (debugAfter) {
        console.log('\n=== DEBUG: After admin_regions deletion ===')
        console.log(debugAfter)
      }
    })
  })
})
