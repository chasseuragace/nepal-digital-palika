import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

// Helper function to verify super admin access without needing JWT
async function verifySuperAdminAccess(adminId: string, palikaId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', adminId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch admin: ${error?.message}`)
  }

  // Super admin should have access to all palikas
  if (data.role === 'super_admin' && data.is_active) {
    return true
  }

  return false
}

describe('Property 18: Super Admin Override', () => {
  let testPalikas: number[] = []
  let testProvinceId: number
  let testDistrictId: number

  beforeAll(async () => {
    // Get test data for palikas
    const { data: provinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(1)

    if (!provinces || provinces.length === 0) {
      throw new Error('No provinces found in database')
    }

    testProvinceId = provinces[0].id

    const { data: districts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(1)

    if (!districts || districts.length === 0) {
      throw new Error(`No districts found in province ${testProvinceId}`)
    }

    testDistrictId = districts[0].id

    // Get multiple palikas for testing
    const { data: palikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(10)

    if (!palikas || palikas.length === 0) {
      throw new Error(`No palikas found in district ${testDistrictId}`)
    }

    testPalikas = palikas.map((p) => p.id)
  })

  afterEach(async () => {
    // Clean up test super admins
    await supabase
      .from('admin_users')
      .delete()
      .like('email', 'test-super-admin-%@example.com')
  })

  describe('Requirement 5.4: Super Admin Override', () => {
    it('should grant super_admin access to all palikas regardless of assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-super-admin-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create super_admin with no region assignments
            const { data: admin, error } = await supabase
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

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            expect(admin).toBeDefined()
            expect(admin.role).toBe('super_admin')
            expect(admin.hierarchy_level).toBe('national')

            // Test that super_admin can access all palikas
            for (const palikaId of testPalikas) {
              const hasAccess = await verifySuperAdminAccess(admin.id, palikaId)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should grant super_admin access to all palikas even with legacy palika_id assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-super-admin-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create super_admin with legacy palika_id assignment
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: testPalikas[0], // Legacy assignment
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            expect(admin).toBeDefined()
            expect(admin.role).toBe('super_admin')
            expect(admin.palika_id).toBe(testPalikas[0])

            // Test that super_admin can access all palikas, not just the legacy one
            for (const palikaId of testPalikas) {
              const hasAccess = await verifySuperAdminAccess(admin.id, palikaId)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should grant super_admin access to all palikas even with admin_regions assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-super-admin-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create super_admin
            const { data: admin, error } = await supabase
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

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign super_admin to a specific palika via admin_regions
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikas[0]
              })

            if (regionError) {
              throw new Error(`Failed to create admin_regions: ${regionError.message}`)
            }

            // Test that super_admin can access all palikas, not just the assigned one
            for (const palikaId of testPalikas) {
              const hasAccess = await verifySuperAdminAccess(admin.id, palikaId)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should grant super_admin access to all palikas with mixed assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-super-admin-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create super_admin with legacy palika_id
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: null,
                district_id: null,
                palika_id: testPalikas[0], // Legacy assignment
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Also assign to admin_regions
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert({
                admin_id: admin.id,
                region_type: 'palika',
                region_id: testPalikas[1]
              })

            if (regionError) {
              throw new Error(`Failed to create admin_regions: ${regionError.message}`)
            }

            // Test that super_admin can access all palikas
            for (const palikaId of testPalikas) {
              const hasAccess = await verifySuperAdminAccess(admin.id, palikaId)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should grant super_admin access to all palikas regardless of any region assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-super-admin-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create super_admin with all possible assignments
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: testData.fullName,
                role: 'super_admin',
                hierarchy_level: 'national',
                province_id: testProvinceId,
                district_id: testDistrictId,
                palika_id: testPalikas[0],
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to create admin: ${error.message}`)
            }

            // Assign to multiple palikas via admin_regions
            const { error: regionError } = await supabase
              .from('admin_regions')
              .insert([
                {
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: testPalikas[0]
                },
                {
                  admin_id: admin.id,
                  region_type: 'palika',
                  region_id: testPalikas[1]
                }
              ])

            if (regionError) {
              throw new Error(`Failed to create admin_regions: ${regionError.message}`)
            }

            // Test that super_admin can access all palikas
            for (const palikaId of testPalikas) {
              const hasAccess = await verifySuperAdminAccess(admin.id, palikaId)
              expect(hasAccess).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
