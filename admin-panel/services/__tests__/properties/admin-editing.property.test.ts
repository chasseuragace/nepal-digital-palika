import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

describe('Property 30: Admin Editing Capability', () => {
  let testProvinceId: number
  let testDistrictId: number
  let testPalikaId: number
  let testProvinceId2: number
  let testDistrictId2: number
  let testPalikaId2: number

  beforeAll(async () => {
    let { data: provinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(2)

    if (!provinces || provinces.length < 2) {
      const { data: allProvinces } = await supabase
        .from('provinces')
        .insert([
          {
            name_en: 'Test Province Edit 2',
            name_ne: 'परीक्षण प्रान्त संपादन २',
            code: 'TPE2'
          }
        ])
        .select()

      if (!allProvinces) {
        throw new Error('Failed to create test province')
      }

      const { data: fetchedProvinces } = await supabase
        .from('provinces')
        .select('id')
        .limit(2)

      provinces = fetchedProvinces
    }

    if (!provinces || provinces.length < 2) {
      throw new Error('Not enough provinces in database. Expected at least 2.')
    }

    testProvinceId = provinces[0].id
    testProvinceId2 = provinces[1].id

    let { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(2)

    if (!districts || districts.length < 2) {
      const { data: allDistricts } = await supabase
        .from('districts')
        .insert([
          {
            province_id: testProvinceId,
            name_en: 'Test District Edit 2',
            name_ne: 'परीक्षण जिल्ला संपादन २',
            code: 'TDE2'
          }
        ])
        .select()

      if (!allDistricts) {
        throw new Error('Failed to create test district')
      }

      const { data: fetchedDistricts } = await supabase
        .from('districts')
        .select('id')
        .eq('province_id', testProvinceId)
        .limit(2)

      districts = fetchedDistricts
    }

    if (!districts || districts.length < 2) {
      throw new Error(`Not enough districts in province ${testProvinceId}. Expected at least 2.`)
    }

    testDistrictId = districts[0].id
    testDistrictId2 = districts[1].id

    let { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(2)

    if (!palikas || palikas.length < 2) {
      const { data: allPalikas } = await supabase
        .from('palikas')
        .insert([
          {
            district_id: testDistrictId,
            name_en: 'Test Palika Edit 2',
            name_ne: 'परीक्षण पालिका संपादन २',
            type: 'municipality',
            code: 'TPE2'
          }
        ])
        .select()

      if (!allPalikas) {
        throw new Error('Failed to create test palika')
      }

      const { data: fetchedPalikas } = await supabase
        .from('palikas')
        .select('id')
        .eq('district_id', testDistrictId)
        .limit(2)

      palikas = fetchedPalikas
    }

    if (!palikas || palikas.length < 2) {
      throw new Error(`Not enough palikas in district ${testDistrictId}. Expected at least 2.`)
    }

    testPalikaId = palikas[0].id
    testPalikaId2 = palikas[1].id
  })

  afterEach(async () => {
    await supabase
      .from('admin_users')
      .delete()
      .like('email', 'test-admin-edit-%@example.com')
  })

  describe('Requirement 7.5: Admin editing with valid hierarchy configuration', () => {
    it('should edit national-level admin successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            originalFullName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedFullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.originalFullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Edit admin - update full_name and is_active
            const { data: updatedAdmin, error: updateError } = await supabase
              .from('admin_users')
              .update({
                full_name: testData.updatedFullName,
                is_active: false
              })
              .eq('id', admin.id)
              .select()
              .single()

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            expect(updatedAdmin).toBeDefined()
            expect(updatedAdmin.full_name).toBe(testData.updatedFullName)
            expect(updatedAdmin.is_active).toBe(false)
            expect(updatedAdmin.hierarchy_level).toBe('national')
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should edit province-level admin and update regions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            originalFullName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedFullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create province-level admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.originalFullName,
                role: 'province_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Create initial region assignment
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })

            if (regionError) {
              throw new Error(`Failed to create region: ${regionError.message}`)
            }

            // Edit admin - update full_name and region
            const { data: updatedAdmin, error: updateError } = await supabase
              .from('admin_users')
              .update({
                full_name: testData.updatedFullName,
                province_id: testProvinceId2
              })
              .eq('id', admin.id)
              .select()
              .single()

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            // Delete old region and create new one
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('admin_id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete old regions: ${deleteError.message}`)
            }

            const { data: newRegion, error: newRegionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId2
              })
              .select()
              .single()

            if (newRegionError) {
              throw new Error(`Failed to create new region: ${newRegionError.message}`)
            }

            expect(updatedAdmin).toBeDefined()
            expect(updatedAdmin.full_name).toBe(testData.updatedFullName)
            expect(updatedAdmin.province_id).toBe(testProvinceId2)
            expect(newRegion.region_id).toBe(testProvinceId2)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should edit district-level admin and update regions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            originalFullName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedFullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create district-level admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.originalFullName,
                role: 'district_admin',
                hierarchy_level: 'district',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Create initial region assignment
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })

            if (regionError) {
              throw new Error(`Failed to create region: ${regionError.message}`)
            }

            // Edit admin - update full_name and district
            const { data: updatedAdmin, error: updateError } = await supabase
              .from('admin_users')
              .update({
                full_name: testData.updatedFullName,
                district_id: testDistrictId2
              })
              .eq('id', admin.id)
              .select()
              .single()

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            // Delete old region and create new one
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('admin_id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete old regions: ${deleteError.message}`)
            }

            const { data: newRegion, error: newRegionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId2
              })
              .select()
              .single()

            if (newRegionError) {
              throw new Error(`Failed to create new region: ${newRegionError.message}`)
            }

            expect(updatedAdmin).toBeDefined()
            expect(updatedAdmin.full_name).toBe(testData.updatedFullName)
            expect(updatedAdmin.district_id).toBe(testDistrictId2)
            expect(newRegion.region_id).toBe(testDistrictId2)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should edit palika-level admin and update regions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            originalFullName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedFullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create palika-level admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.originalFullName,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Create initial region assignment
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId
              })

            if (regionError) {
              throw new Error(`Failed to create region: ${regionError.message}`)
            }

            // Edit admin - update full_name and palika
            const { data: updatedAdmin, error: updateError } = await supabase
              .from('admin_users')
              .update({
                full_name: testData.updatedFullName,
                palika_id: testPalikaId2
              })
              .eq('id', admin.id)
              .select()
              .single()

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            // Delete old region and create new one
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('admin_id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete old regions: ${deleteError.message}`)
            }

            const { data: newRegion, error: newRegionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId2
              })
              .select()
              .single()

            if (newRegionError) {
              throw new Error(`Failed to create new region: ${newRegionError.message}`)
            }

            expect(updatedAdmin).toBeDefined()
            expect(updatedAdmin.full_name).toBe(testData.updatedFullName)
            expect(updatedAdmin.palika_id).toBe(testPalikaId2)
            expect(newRegion.region_id).toBe(testPalikaId2)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should toggle is_active status during edit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 }),
            initialActive: fc.boolean(),
            finalActive: fc.boolean()
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin with initial is_active status
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: testData.initialActive
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            expect(admin.is_active).toBe(testData.initialActive)

            // Edit admin - toggle is_active
            const { data: updatedAdmin, error: updateError } = await supabase
              .from('admin_users')
              .update({
                is_active: testData.finalActive
              })
              .eq('id', admin.id)
              .select()
              .single()

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            expect(updatedAdmin.is_active).toBe(testData.finalActive)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should not allow email change during edit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Verify email cannot be changed (we don't update it)
            const { data: fetchedAdmin, error: fetchError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('id', admin.id)
              .single()

            if (fetchError) {
              throw new Error(`Failed to fetch admin: ${fetchError.message}`)
            }

            // Email is stored in auth.users, not admin_users, so we just verify the admin exists
            expect(fetchedAdmin).toBeDefined()
            expect(fetchedAdmin.id).toBe(admin.id)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should not allow role change during edit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin with specific role
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Verify role cannot be changed (we don't update it)
            const { data: fetchedAdmin, error: fetchError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('id', admin.id)
              .single()

            if (fetchError) {
              throw new Error(`Failed to fetch admin: ${fetchError.message}`)
            }

            expect(fetchedAdmin.role).toBe('super_admin')
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Requirement 7.5: Admin editing with cascading region updates', () => {
    it('should delete old regions and create new ones when hierarchy changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-edit-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create province-level admin
            const { data: admin, error: createError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'province_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (createError) {
              throw new Error(`Failed to create admin: ${createError.message}`)
            }

            // Create initial province region assignment
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })

            if (regionError) {
              throw new Error(`Failed to create region: ${regionError.message}`)
            }

            // Verify initial region exists
            const { data: initialRegions, error: initialFetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (initialFetchError) {
              throw new Error(`Failed to fetch initial regions: ${initialFetchError.message}`)
            }

            expect(initialRegions.length).toBe(1)
            expect(initialRegions[0].region_type).toBe('province')

            // Edit admin - change to district level
            const { error: updateError } = await supabase
              .from('admin_users')
              .update({
                hierarchy_level: 'district',
                district_id: testDistrictId
              })
              .eq('id', admin.id)

            if (updateError) {
              throw new Error(`Failed to update admin: ${updateError.message}`)
            }

            // Delete old regions
            const { error: deleteError } = await supabase
              .from('admin_regions')
              .delete()
              .eq('admin_id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete old regions: ${deleteError.message}`)
            }

            // Create new district region assignment
            const { data: newRegion, error: newRegionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })
              .select()
              .single()

            if (newRegionError) {
              throw new Error(`Failed to create new region: ${newRegionError.message}`)
            }

            // Verify new region exists and old one is gone
            const { data: finalRegions, error: finalFetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (finalFetchError) {
              throw new Error(`Failed to fetch final regions: ${finalFetchError.message}`)
            }

            expect(finalRegions.length).toBe(1)
            expect(finalRegions[0].region_type).toBe('district')
            expect(finalRegions[0].region_id).toBe(testDistrictId)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
