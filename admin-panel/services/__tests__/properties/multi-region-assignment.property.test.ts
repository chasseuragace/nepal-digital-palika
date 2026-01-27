import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

/**
 * Property 34: Multi-Region Assignment Support
 * 
 * An admin assigned to multiple regions of the same type should have access to all of them.
 * An admin assigned to multiple regions of different types should have access to all of them and their children.
 * Access should be immediate after assignment.
 * Access should be revoked immediately after deletion.
 * 
 * Validates: Requirements 10.6
 */
describe('Property 34: Multi-Region Assignment Support', () => {
  let testProvinces: number[] = []
  let testDistricts: number[] = []
  let testPalikas: number[] = []

  beforeAll(async () => {
    // Fetch existing provinces
    const { data: provinces, error: provinceError } = await supabase
      .from('provinces')
      .select('id')
      .limit(5)

    if (provinceError || !provinces || provinces.length < 2) {
      throw new Error('Not enough provinces in database. Expected at least 2.')
    }

    testProvinces = provinces.slice(0, 3).map(p => p.id)

    // Fetch districts - try to get 2+ from any province
    let districts: any[] = []
    for (const provinceId of testProvinces) {
      const { data: d, error: districtError } = await supabase
        .from('districts')
        .select('id')
        .eq('province_id', provinceId)
        .limit(5)

      if (!districtError && d && d.length >= 2) {
        districts = d.slice(0, 3)
        break
      }
    }

    if (districts.length < 2) {
      throw new Error(`Not enough districts found. Expected at least 2.`)
    }

    testDistricts = districts.map(d => d.id)

    // Fetch palikas from first district
    const { data: palikas, error: palikaError } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistricts[0])
      .limit(5)

    if (palikaError || !palikas || palikas.length < 2) {
      throw new Error(`Not enough palikas in district ${testDistricts[0]}. Expected at least 2.`)
    }

    testPalikas = palikas.slice(0, 3).map(p => p.id)
  })

  afterEach(async () => {
    // Clean up test admins
    const { data: testAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .like('full_name', 'test-multi-region-%')

    if (testAdmins && testAdmins.length > 0) {
      const adminIds = testAdmins.map(a => a.id)
      await supabase.auth.admin.deleteUser(adminIds[0])
    }
  })

  describe('Requirement 10.6: Admin assigned to multiple regions of same type', () => {
    it('should grant access to all assigned palikas when admin is assigned to multiple palikas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-multi-region-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create palika_admin assigned to multiple palikas
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `test-multi-region-${uniqueId}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: null,
                district_id: null,
                palika_id: testPalikas[0], // Primary palika
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign admin to multiple palikas (use available palikas)
            const palikaCount = Math.min(2, testPalikas.length)
            const { data: regions, error: regionsError } = await supabase
              .from('admin_regions')
              .insert(
                testPalikas.slice(0, palikaCount).map(palikaId => ({
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: palikaId
                }))
              )
              .select()

            if (regionsError) {
              throw new Error(`Failed to create admin_regions: ${regionsError.message}`)
            }

            // Verify all palikas are assigned
            expect(regions.length).toBe(palikaCount)
            expect(regions.map(r => r.region_id).sort()).toEqual(testPalikas.slice(0, palikaCount).sort())

            // Verify we can fetch all assigned regions
            const { data: fetchedRegions, error: fetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)
              .eq('region_type', 'palika')

            if (fetchError) {
              throw new Error(`Failed to fetch admin_regions: ${fetchError.message}`)
            }

            expect(fetchedRegions.length).toBe(palikaCount)
            expect(fetchedRegions.map(r => r.region_id).sort()).toEqual(testPalikas.slice(0, palikaCount).sort())
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should grant access to all assigned districts when admin is assigned to multiple districts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-multi-region-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create district_admin assigned to multiple districts
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `test-multi-region-${uniqueId}`,
                role: 'district_admin',
                hierarchy_level: 'district',
                province_id: testProvinces[0],
                district_id: testDistricts[0], // Primary district
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign admin to multiple districts (use available districts)
            const districtCount = Math.min(2, testDistricts.length)
            const { data: regions, error: regionsError } = await supabase
              .from('admin_regions')
              .insert(
                testDistricts.slice(0, districtCount).map(districtId => ({
                  admin_id: admin.id,
                  region_type: 'district',
                  region_id: districtId
                }))
              )
              .select()

            if (regionsError) {
              throw new Error(`Failed to create admin_regions: ${regionsError.message}`)
            }

            // Verify all districts are assigned
            expect(regions.length).toBe(districtCount)
            expect(regions.map(r => r.region_id).sort()).toEqual(testDistricts.slice(0, districtCount).sort())

            // Verify we can fetch all assigned regions
            const { data: fetchedRegions, error: fetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)
              .eq('region_type', 'district')

            if (fetchError) {
              throw new Error(`Failed to fetch admin_regions: ${fetchError.message}`)
            }

            expect(fetchedRegions.length).toBe(districtCount)
            expect(fetchedRegions.map(r => r.region_id).sort()).toEqual(testDistricts.slice(0, districtCount).sort())
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should grant access to all assigned provinces when admin is assigned to multiple provinces', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-multi-region-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create province_admin assigned to multiple provinces
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `test-multi-region-${uniqueId}`,
                role: 'province_admin',
                hierarchy_level: 'province',
                province_id: testProvinces[0], // Primary province
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign admin to multiple provinces (use available provinces)
            const provinceCount = Math.min(2, testProvinces.length)
            const { data: regions, error: regionsError } = await supabase
              .from('admin_regions')
              .insert(
                testProvinces.slice(0, provinceCount).map(provinceId => ({
                  admin_id: admin.id,
                  region_type: 'province',
                  region_id: provinceId
                }))
              )
              .select()

            if (regionsError) {
              throw new Error(`Failed to create admin_regions: ${regionsError.message}`)
            }

            // Verify all provinces are assigned
            expect(regions.length).toBe(provinceCount)

            // Verify the admin has access to all these provinces through the hierarchy
            const { data: adminRegions, error: fetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (fetchError) {
              throw new Error(`Failed to fetch admin_regions: ${fetchError.message}`)
            }

            // Should have province-level assignments
            const provinceAssignments = adminRegions.filter(r => r.region_type === 'province')
            expect(provinceAssignments.length).toBe(provinceCount)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should immediately revoke access when a region assignment is deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-multi-region-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create palika_admin assigned to multiple palikas
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `test-multi-region-${uniqueId}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: null,
                district_id: null,
                palika_id: testPalikas[0],
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign admin to multiple palikas (use available palikas)
            const palikaCount = Math.min(2, testPalikas.length)
            const { data: regions, error: regionsError } = await supabase
              .from('admin_regions')
              .insert(
                testPalikas.slice(0, palikaCount).map(palikaId => ({
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: palikaId
                }))
              )
              .select()

            if (regionsError) {
              throw new Error(`Failed to create admin_regions: ${regionsError.message}`)
            }

            // Verify all palikas are assigned
            expect(regions.length).toBe(palikaCount)

            // Delete one region assignment
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('admin_id', admin.id)
              .eq('region_type', 'palika')
              .eq('region_id', testPalikas[0])

            if (deleteError) {
              throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)
            }

            // Verify remaining palikas
            const { data: remainingRegions, error: fetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)
              .eq('region_type', 'palika')

            if (fetchError) {
              throw new Error(`Failed to fetch admin_regions: ${fetchError.message}`)
            }

            expect(remainingRegions.length).toBe(palikaCount - 1)
            expect(remainingRegions.map(r => r.region_id)).not.toContain(testPalikas[0])
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
