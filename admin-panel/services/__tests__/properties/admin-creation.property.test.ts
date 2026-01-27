import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

describe('Property 1: Admin Creation Validation', () => {
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
      const { data: newProvinces } = await supabase
        .from('provinces')
        .insert([{ name_en: 'Test Province 2', name_ne: 'परीक्षण प्रान्त २', code: 'TP2' }])
        .select()

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

    let { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(2)

    if (!districts || districts.length < 2) {
      const { data: newDistricts } = await supabase
        .from('districts')
        .insert([{ province_id: testProvinceId, name_en: 'Test District 2', name_ne: 'परीक्षण जिल्ला २', code: 'TD2' }])
        .select()

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

    let { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(2)

    if (!palikas || palikas.length < 2) {
      const { data: newPalikas } = await supabase
        .from('palikas')
        .insert([{ district_id: testDistrictId, name_en: 'Test Palika 2', name_ne: 'परीक्षण पालिका २', type: 'municipality', code: 'TP2' }])
        .select()

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
    await supabase
      .from('admin_users')
      .delete()
      .like('full_name', 'Test Admin%')
  })

  describe('Requirement 1.1: National-level admin creation', () => {
    it('should create national-level admin without region assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            expect(admin).toBeDefined()
            expect(admin.id).toBe(authUser.user.id)
            expect(admin.hierarchy_level).toBe('national')
            expect(admin.province_id).toBeNull()
            expect(admin.district_id).toBeNull()
            expect(admin.palika_id).toBeNull()

            const { data: regions } = await supabase
              .from('admin_regions')
              .select('*')
              .eq('admin_id', admin.id)

            expect(regions.length).toBe(0)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Requirement 1.2: Province-level admin creation', () => {
    it('should create province-level admin with province assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'province_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            expect(admin).toBeDefined()
            expect(admin.hierarchy_level).toBe('province')
            expect(admin.province_id).toBe(testProvinceId)
            expect(admin.district_id).toBeNull()
            expect(admin.palika_id).toBeNull()

            const { data: region } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'province',
                region_id: testProvinceId
              })
              .select()
              .single()

            expect(region).toBeDefined()
            expect(region.region_type).toBe('province')
            expect(region.region_id).toBe(testProvinceId)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should create province-level admin with multiple province assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            const { data: admin } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'province_admin',
                hierarchy_level: 'province',
                province_id: testProvinceId,
                district_id: null,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            const { data: regions } = await supabase
              .from('admin_regions')
              .insert([
                { admin_id: admin.id, region_type: 'province', region_id: testProvinceId },
                { admin_id: admin.id, region_type: 'province', region_id: testProvinceId2 }
              ])
              .select()

            expect(regions.length).toBe(2)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Requirement 1.3: District-level admin creation', () => {
    it('should create district-level admin with district assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            const { data: admin } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'district_admin',
                hierarchy_level: 'district',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            expect(admin.hierarchy_level).toBe('district')
            expect(admin.province_id).toBe(testProvinceId)
            expect(admin.district_id).toBe(testDistrictId)

            const { data: region } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'district',
                region_id: testDistrictId
              })
              .select()
              .single()

            expect(region.region_type).toBe('district')
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should create district-level admin with multiple district assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            const { data: admin } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'district_admin',
                hierarchy_level: 'district',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: null,
                is_active: true
              })
              .select()
              .single()

            const { data: regions } = await supabase
              .from('admin_regions')
              .insert([
                { admin_id: admin.id, region_type: 'district', region_id: testDistrictId },
                { admin_id: admin.id, region_type: 'district', region_id: testDistrictId2 }
              ])
              .select()

            expect(regions.length).toBe(2)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Requirement 1.4: Palika-level admin creation', () => {
    it('should create palika-level admin with palika assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            const { data: admin } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            expect(admin.hierarchy_level).toBe('palika')
            expect(admin.palika_id).toBe(testPalikaId)

            const { data: region } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikaId
              })
              .select()
              .single()

            expect(region.region_type).toBe('palika')
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should create palika-level admin with multiple palika assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ fullName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-admin-${uniqueId}@example.com`

            const { data: authUser } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            const { data: admin } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Admin ${testData.fullName}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            const { data: regions } = await supabase
              .from('admin_regions')
              .insert([
                { admin_id: admin.id, region_type: 'palika', region_id: testPalikaId },
                { admin_id: admin.id, region_type: 'palika', region_id: testPalikaId2 }
              ])
              .select()

            expect(regions.length).toBe(2)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
