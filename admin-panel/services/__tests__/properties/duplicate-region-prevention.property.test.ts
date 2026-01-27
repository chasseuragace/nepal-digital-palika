import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

describe('Property 2: Duplicate Region Assignment Prevention', () => {
  let testProvinceId: number
  let testDistrictId: number
  let testPalikaId: number
  let testProvinceId2: number
  let testDistrictId2: number
  let testPalikaId2: number

  beforeAll(async () => {
    // Get test provinces
    let { data: provinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(2)

    if (!provinces || provinces.length < 2) {
      const { data: newProvinces, error: provinceError } = await supabase
        .from('provinces')
        .insert([
          {
            name_en: 'Test Province Dup 2',
            name_ne: 'परीक्षण प्रान्त डुप २',
            code: 'TPD2'
          }
        ])
        .select()

      if (provinceError) {
        throw new Error(`Failed to create test province: ${provinceError.message}`)
      }

      const { data: allProvinces } = await supabase
        .from('provinces')
        .select('id')
        .limit(2)

      provinces = allProvinces
    }

    if (!provinces || provinces.length < 2) {
      throw new Error('Not enough provinces in database. Expected at least 2.')
    }

    testProvinceId = provinces[0].id
    testProvinceId2 = provinces[1].id

    // Get test districts
    let { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(2)

    if (!districts || districts.length < 2) {
      const { data: newDistricts, error: districtError } = await supabase
        .from('districts')
        .insert([
          {
            province_id: testProvinceId,
            name_en: 'Test District Dup 2',
            name_ne: 'परीक्षण जिल्ला डुप २',
            code: 'TDD2'
          }
        ])
        .select()

      if (districtError) {
        throw new Error(`Failed to create test district: ${districtError.message}`)
      }

      const { data: allDistricts } = await supabase
        .from('districts')
        .select('id')
        .eq('province_id', testProvinceId)
        .limit(2)

      districts = allDistricts
    }

    if (!districts || districts.length < 2) {
      throw new Error(`Not enough districts in province ${testProvinceId}. Expected at least 2.`)
    }

    testDistrictId = districts[0].id
    testDistrictId2 = districts[1].id

    // Get test palikas
    let { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(2)

    if (!palikas || palikas.length < 2) {
      const { data: newPalikas, error: palikaError } = await supabase
        .from('palikas')
        .insert([
          {
            district_id: testDistrictId,
            name_en: 'Test Palika Dup 2',
            name_ne: 'परीक्षण पालिका डुप २',
            type: 'municipality',
            code: 'TPD2'
          }
        ])
        .select()

      if (palikaError) {
        throw new Error(`Failed to create test palika: ${palikaError.message}`)
      }

      const { data: allPalikas } = await supabase
        .from('palikas')
        .select('id')
        .eq('district_id', testDistrictId)
        .limit(2)

      palikas = allPalikas
    }

    if (!palikas || palikas.length < 2) {
      throw new Error(`Not enough palikas in district ${testDistrictId}. Expected at least 2.`)
    }

    testPalikaId = palikas[0].id
    testPalikaId2 = palikas[1].id
  })

  afterEach(async () => {
    // Clean up test admins
    const { data: testAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .like('full_name', 'test-dup-region-%')

    if (testAdmins && testAdmins.length > 0) {
      const adminIds = testAdmins.map(a => a.id)
      
      // Delete admin_regions first (foreign key constraint)
      await supabase
        .from('admin_regions')
        .delete()
        .in('admin_id', adminIds)

      // Delete admin_users
      await supabase
        .from('admin_users')
        .delete()
        .in('id', adminIds)

      // Delete auth users
      for (const adminId of adminIds) {
        await supabase.auth.admin.deleteUser(adminId)
      }
    }
  })

  describe('Requirement 1.6: Duplicate region prevention', () => {
    it('should prevent duplicate province assignments for the same admin', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dup-region-${uniqueId}@example.com`

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
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Create first admin_regions record
            const { data: firstRegion, error: firstError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()
              .single()

            if (firstError) {
              throw new Error(`Failed to create first admin_regions: ${firstError.message}`)
            }

            expect(firstRegion).toBeDefined()
            expect(firstRegion.admin_id).toBe(admin.id)
            expect(firstRegion.region_type).toBe('province')
            expect(firstRegion.region_id).toBe(testProvinceId)

            // Attempt to create duplicate admin_regions record
            const { data: duplicateRegion, error: duplicateError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()

            // Should fail with UNIQUE constraint violation
            expect(duplicateError).toBeDefined()
            expect(duplicateError?.code).toBe('23505') // PostgreSQL UNIQUE constraint violation code
            expect(duplicateRegion).toBeNull()
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should prevent duplicate district assignments for the same admin', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dup-region-${uniqueId}@example.com`

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
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'district',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Create first admin_regions record
            const { data: firstRegion, error: firstError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })
              .select()
              .single()

            if (firstError) {
              throw new Error(`Failed to create first admin_regions: ${firstError.message}`)
            }

            expect(firstRegion).toBeDefined()
            expect(firstRegion.admin_id).toBe(admin.id)
            expect(firstRegion.region_type).toBe('district')
            expect(firstRegion.region_id).toBe(testDistrictId)

            // Attempt to create duplicate admin_regions record
            const { data: duplicateRegion, error: duplicateError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })
              .select()

            // Should fail with UNIQUE constraint violation
            expect(duplicateError).toBeDefined()
            expect(duplicateError?.code).toBe('23505') // PostgreSQL UNIQUE constraint violation code
            expect(duplicateRegion).toBeNull()
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should prevent duplicate palika assignments for the same admin', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dup-region-${uniqueId}@example.com`

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
                full_name: testData.fullName,
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

            // Create first admin_regions record
            const { data: firstRegion, error: firstError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId
              })
              .select()
              .single()

            if (firstError) {
              throw new Error(`Failed to create first admin_regions: ${firstError.message}`)
            }

            expect(firstRegion).toBeDefined()
            expect(firstRegion.admin_id).toBe(admin.id)
            expect(firstRegion.region_type).toBe('palika')
            expect(firstRegion.region_id).toBe(testPalikaId)

            // Attempt to create duplicate admin_regions record
            const { data: duplicateRegion, error: duplicateError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId
              })
              .select()

            // Should fail with UNIQUE constraint violation
            expect(duplicateError).toBeDefined()
            expect(duplicateError?.code).toBe('23505') // PostgreSQL UNIQUE constraint violation code
            expect(duplicateRegion).toBeNull()
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should allow different region types for the same admin', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-dup-region-${uniqueId}@example.com`

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
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'district',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError) {
              throw new Error(`Failed to create admin: ${adminError.message}`)
            }

            // Create province assignment
            const { data: provinceRegion, error: provinceError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()
              .single()

            if (provinceError) {
              throw new Error(`Failed to create province region: ${provinceError.message}`)
            }

            expect(provinceRegion).toBeDefined()
            expect(provinceRegion.region_type).toBe('province')

            // Create district assignment (different region_type, same admin)
            const { data: districtRegion, error: districtError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })
              .select()
              .single()

            if (districtError) {
              throw new Error(`Failed to create district region: ${districtError.message}`)
            }

            expect(districtRegion).toBeDefined()
            expect(districtRegion.region_type).toBe('district')

            // Verify both regions exist
            const { data: allRegions, error: fetchError } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            if (fetchError) {
              throw new Error(`Failed to fetch admin_regions: ${fetchError.message}`)
            }

            expect(allRegions.length).toBe(2)
            expect(allRegions.some(r => r.region_type === 'province')).toBe(true)
            expect(allRegions.some(r => r.region_type === 'district')).toBe(true)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should allow different admins to be assigned to the same region', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName1: fc.string({ minLength: 1, maxLength: 100 }),
            fullName2: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email1 = `test-dup-region-${uniqueId}-1@example.com`
            const email2 = `test-dup-region-${uniqueId}-2@example.com`

            // Create first auth user
            const { data: authUser1, error: authError1 } = await supabase.auth.admin.createUser({
              email: email1,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError1) {
              throw new Error(`Failed to create first auth user: ${authError1.message}`)
            }

            // Create second auth user
            const { data: authUser2, error: authError2 } = await supabase.auth.admin.createUser({
              email: email2,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError2) {
              throw new Error(`Failed to create second auth user: ${authError2.message}`)
            }

            // Create first admin
            const { data: admin1, error: adminError1 } = await supabase
              .from('admin_users')
              .insert({
                id: authUser1.user.id,
                full_name: testData.fullName1,
                role: 'super_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError1) {
              throw new Error(`Failed to create first admin: ${adminError1.message}`)
            }

            // Create second admin
            const { data: admin2, error: adminError2 } = await supabase
              .from('admin_users')
              .insert({
                id: authUser2.user.id,
                full_name: testData.fullName2,
                role: 'super_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId2,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (adminError2) {
              throw new Error(`Failed to create second admin: ${adminError2.message}`)
            }

            // Assign first admin to province
            const { data: region1, error: regionError1 } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin1.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()
              .single()

            if (regionError1) {
              throw new Error(`Failed to create first admin_regions: ${regionError1.message}`)
            }

            expect(region1).toBeDefined()

            // Assign second admin to same province (different admin, same region)
            const { data: region2, error: regionError2 } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin2.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()
              .single()

            if (regionError2) {
              throw new Error(`Failed to create second admin_regions: ${regionError2.message}`)
            }

            expect(region2).toBeDefined()
            expect(region2.admin_id).not.toBe(region1.admin_id)
            expect(region2.region_id).toBe(region1.region_id)
            expect(region2.region_type).toBe(region1.region_type)
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
