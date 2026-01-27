import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

describe('Property 31: Admin Deletion Cascades', () => {
  let testProvinceId: number
  let testDistrictId: number
  let testPalikaId: number
  let testPalikaId2: number

  beforeAll(async () => {
    // Get test province
    let { data: provinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(1)

    if (!provinces || provinces.length === 0) {
      throw new Error('No provinces found in database')
    }

    testProvinceId = provinces[0].id

    // Get test district
    let { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(1)

    if (!districts || districts.length === 0) {
      throw new Error(`No districts found in province ${testProvinceId}`)
    }

    testDistrictId = districts[0].id

    // Get test palikas
    let { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(2)

    if (!palikas || palikas.length < 2) {
      throw new Error(`Not enough palikas in district ${testDistrictId}. Expected at least 2.`)
    }

    testPalikaId = palikas[0].id
    testPalikaId2 = palikas[1].id
  })

  afterEach(async () => {
    // Clean up test admins
    await supabase
      .from('admin_users')
      .delete()
      .like('full_name', 'Test Admin Deletion%')
  })

  describe('Requirement 7.6: Admin deletion cascades to admin_regions', () => {
    it('should delete admin and cascade delete all associated admin_regions records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-deletion-${uniqueId}@example.com`

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
            const { data: admin, error: adminError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin Deletion ${testData.fullName}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Create multiple admin_regions records
            const { data: regions, error: regionsError } = await supabase
              .from('admin_regions')
              .insert([
                {
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: testPalikaId
                },
                {
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: testPalikaId2
                }
              ])
              .select()

            if (regionsError) {
              throw new Error(`Failed to create admin_regions: ${regionsError.message}`)
            }

            expect(regions.length).toBe(2)

            // Verify admin_regions exist before deletion
            const { data: beforeDelete, error: beforeError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (beforeError) {
              throw new Error(`Failed to fetch admin_regions before deletion: ${beforeError.message}`)
            }

            expect(beforeDelete.length).toBe(2)

            // Delete the admin
            const { error: deleteError } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete admin: ${deleteError.message}`)
            }

            // Verify admin is deleted
            const { data: deletedAdmin, error: checkAdminError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('id', admin.id)

            if (checkAdminError) {
              throw new Error(`Failed to check admin deletion: ${checkAdminError.message}`)
            }

            expect(deletedAdmin.length).toBe(0)

            // Verify all admin_regions records are cascade deleted
            const { data: afterDelete, error: afterError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (afterError) {
              throw new Error(`Failed to fetch admin_regions after deletion: ${afterError.message}`)
            }

            expect(afterDelete.length).toBe(0)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should handle deletion of admin with single region assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-deletion-${uniqueId}@example.com`

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
            const { data: admin, error: adminError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin Deletion ${testData.fullName}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Create single admin_regions record
            const { data: region, error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId
              })
              .select()
              .single()

            if (regionError) {
              throw new Error(`Failed to create admin_regions: ${regionError.message}`)
            }

            expect(region).toBeDefined()

            // Delete the admin
            const { error: deleteError } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete admin: ${deleteError.message}`)
            }

            // Verify admin_regions record is cascade deleted
            const { data: afterDelete, error: afterError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (afterError) {
              throw new Error(`Failed to fetch admin_regions after deletion: ${afterError.message}`)
            }

            expect(afterDelete.length).toBe(0)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should handle deletion of admin with no region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-deletion-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin without region assignments
            const { data: admin, error: adminError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin Deletion ${testData.fullName}`,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Verify no admin_regions exist
            const { data: beforeDelete, error: beforeError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (beforeError) {
              throw new Error(`Failed to fetch admin_regions before deletion: ${beforeError.message}`)
            }

            expect(beforeDelete.length).toBe(0)

            // Delete the admin
            const { error: deleteError } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', admin.id)

            if (deleteError) {
              throw new Error(`Failed to delete admin: ${deleteError.message}`)
            }

            // Verify admin is deleted
            const { data: deletedAdmin, error: checkAdminError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('id', admin.id)

            if (checkAdminError) {
              throw new Error(`Failed to check admin deletion: ${checkAdminError.message}`)
            }

            expect(deletedAdmin.length).toBe(0)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should allow independent deletion of multiple admins', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName1: fc.string({ minLength: 1, maxLength: 100 }),
            fullName2: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId1 = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const uniqueId2 = `${Date.now()}-${Math.random().toString(36).substring(8)}`
            const email1 = `test-admin-deletion-${uniqueId1}@example.com`
            const email2 = `test-admin-deletion-${uniqueId2}@example.com`

            // Create first auth user and admin
            const { data: authUser1, error: authError1 } = await supabase.auth.admin.createUser({
              email: email1,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError1) {
              throw new Error(`Failed to create first auth user: ${authError1.message}`)
            }

            const { data: admin1, error: adminError1 } = await supabase
              .from('admin_users')
              .insert({
                id: authUser1.user.id,
                full_name: `Test Admin Deletion ${testData.fullName1}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (adminError1) {
              throw new Error(`Failed to create first admin: ${adminError1.message}`)
            }

            // Create second auth user and admin
            const { data: authUser2, error: authError2 } = await supabase.auth.admin.createUser({
              email: email2,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError2) {
              throw new Error(`Failed to create second auth user: ${authError2.message}`)
            }

            const { data: admin2, error: adminError2 } = await supabase
              .from('admin_users')
              .insert({
                id: authUser2.user.id,
                full_name: `Test Admin Deletion ${testData.fullName2}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId2,
                is_active: true
              })
              .select()
              .single()

            if (adminError2) {
              throw new Error(`Failed to create second admin: ${adminError2.message}`)
            }

            // Create regions for both admins
            const { error: regionsError1 } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin1.id,
                region_type: 'palika',
                region_id: testPalikaId
              })

            if (regionsError1) {
              throw new Error(`Failed to create regions for first admin: ${regionsError1.message}`)
            }

            const { error: regionsError2 } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin2.id,
                region_type: 'palika',
                region_id: testPalikaId2
              })

            if (regionsError2) {
              throw new Error(`Failed to create regions for second admin: ${regionsError2.message}`)
            }

            // Delete first admin
            const { error: deleteError1 } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', admin1.id)

            if (deleteError1) {
              throw new Error(`Failed to delete first admin: ${deleteError1.message}`)
            }

            // Verify first admin's regions are deleted
            const { data: admin1Regions, error: checkError1 } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin1.id)

            if (checkError1) {
              throw new Error(`Failed to check first admin regions: ${checkError1.message}`)
            }

            expect(admin1Regions.length).toBe(0)

            // Verify second admin's regions still exist
            const { data: admin2Regions, error: checkError2 } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin2.id)

            if (checkError2) {
              throw new Error(`Failed to check second admin regions: ${checkError2.message}`)
            }

            expect(admin2Regions.length).toBe(1)

            // Delete second admin
            const { error: deleteError2 } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', admin2.id)

            if (deleteError2) {
              throw new Error(`Failed to delete second admin: ${deleteError2.message}`)
            }

            // Verify second admin's regions are deleted
            const { data: admin2RegionsAfter, error: checkError3 } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin2.id)

            if (checkError3) {
              throw new Error(`Failed to check second admin regions after deletion: ${checkError3.message}`)
            }

            expect(admin2RegionsAfter.length).toBe(0)
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
