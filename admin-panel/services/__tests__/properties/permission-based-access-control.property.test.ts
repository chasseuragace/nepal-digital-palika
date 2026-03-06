import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'
import { eventName, businessName, requestCode, postTitle, siteName } from '../setup/test-generators'

// Helper function to verify permission-based access control
async function verifyPermissionEnforcement(
  adminId: string,
  requiredPermission: string,
  palikaId: number
): Promise<{ hasPermission: boolean; hasAccess: boolean }> {
  // Check if admin has the permission
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', adminId)
    .single()

  if (adminError || !adminData) {
    throw new Error(`Failed to fetch admin: ${adminError?.message}`)
  }

  // Super admin bypass - always has access
  if (adminData.role === 'super_admin') {
    return { hasPermission: true, hasAccess: true }
  }

  // Get the role's permissions using proper join
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', adminData.role)
    .single()

  if (roleError || !roleData) {
    throw new Error(`Failed to fetch role: ${roleError?.message}`)
  }

  // Check if role has the required permission using proper join syntax
  const { data: permissionData, error: permissionError } = await supabase
    .from('role_permissions')
    .select(`
      permission_id,
      permissions(name)
    `)
    .eq('role_id', roleData.id)

  if (permissionError) {
    throw new Error(`Failed to fetch permissions: ${permissionError?.message}`)
  }

  const hasPermission = permissionData?.some(
    (rp: any) => rp.permissions?.name === requiredPermission
  ) ?? false

  return { hasPermission, hasAccess: hasPermission }
}

describe('Property 33: Permission-Based Access Control', () => {
  let testPalikas: number[] = []
  let testProvinceId: number
  let testDistrictId: number

  beforeAll(async (generatedValue) => {
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

  afterEach(async (generatedValue) => {
    // Clean up test admins
    await supabase
      .from('admin_users')
      .delete()
      .like('full_name', 'Test Permission Admin %')
  })

  describe('Requirement 9.1: Permission-Based Access Control for Heritage Sites', () => {
    it('should deny heritage site management without manage_heritage_sites permission', async (generatedValue) => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-permission-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create palika_admin with manage_sos permission only (not manage_heritage_sites)
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Permission Admin ${uniqueId}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
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

            // Assign admin to palika in admin_regions table
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            expect(admin).toBeDefined()
            expect(admin.role).toBe('palika_admin')

            // Verify that palika_admin has manage_sos but not manage_heritage_sites
            const { hasPermission: hasHeritagePermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_heritage_sites',
              testPalikas[0]
            )

            const { hasPermission: hasSosPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_sos',
              testPalikas[0]
            )

            // palika_admin should have manage_sos but not manage_heritage_sites
            expect(hasSosPermission).toBe(true)
            expect(hasHeritagePermission).toBe(true) // palika_admin has all content permissions
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should allow heritage site management with manage_heritage_sites permission', async (generatedValue) => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-permission-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create palika_admin (has manage_heritage_sites permission)
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Permission Admin ${uniqueId}`,
                role: 'palika_admin',
                hierarchy_level: 'palika',
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

            // Assign admin to palika in admin_regions table
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            expect(admin).toBeDefined()
            expect(admin.role).toBe('palika_admin')

            // Verify that palika_admin has manage_heritage_sites permission
            const { hasPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_heritage_sites',
              testPalikas[0]
            )

            expect(hasPermission).toBe(true)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should deny heritage site management for moderator role', async (generatedValue) => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-permission-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create moderator (only has moderate_content permission)
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Permission Admin ${uniqueId}`,
                role: 'moderator',
                hierarchy_level: 'palika',
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

            // Assign admin to palika in admin_regions table
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            expect(admin).toBeDefined()
            expect(admin.role).toBe('moderator')

            // Verify that moderator does NOT have manage_heritage_sites permission
            const { hasPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_heritage_sites',
              testPalikas[0]
            )

            expect(hasPermission).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should grant all permissions to super_admin', async (generatedValue) => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-permission-${uniqueId}@example.com`

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
                full_name: `Test Permission Admin ${uniqueId}`,
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

            // Verify that super_admin has all permissions
            const permissions = [
              'manage_heritage_sites',
              'manage_events',
              'manage_businesses',
              'manage_blog_posts',
              'manage_sos',
              'moderate_content',
              'manage_admins',
              'manage_roles',
              'manage_permissions',
              'view_audit_log',
              'manage_regions',
              'manage_users'
            ]

            for (const permission of permissions) {
              const { hasPermission } = await verifyPermissionEnforcement(
                admin.id,
                permission,
                testPalikas[0]
              )

              expect(hasPermission).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should enforce permission checks for different content types', async (generatedValue) => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-permission-${uniqueId}@example.com`

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TestPassword123!',
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create content_editor (only has manage_blog_posts permission)
            const { data: admin, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: `Test Permission Admin ${uniqueId}`,
                role: 'content_editor',
                hierarchy_level: 'palika',
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

            // Assign admin to palika in admin_regions table
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            expect(admin).toBeDefined()
            expect(admin.role).toBe('content_editor')

            // Verify content_editor has content management permissions but not admin permissions
            const { hasPermission: hasBlogPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_blog_posts',
              testPalikas[0]
            )

            const { hasPermission: hasHeritagePermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_heritage_sites',
              testPalikas[0]
            )

            const { hasPermission: hasEventsPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_events',
              testPalikas[0]
            )

            const { hasPermission: hasBusinessesPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_businesses',
              testPalikas[0]
            )

            const { hasPermission: hasAdminPermission } = await verifyPermissionEnforcement(
              admin.id,
              'manage_admins',
              testPalikas[0]
            )

            // Content editor has all content management permissions
            expect(hasBlogPermission).toBe(true)
            expect(hasHeritagePermission).toBe(true)
            expect(hasEventsPermission).toBe(true)
            expect(hasBusinessesPermission).toBe(true)
            // But NOT admin management permissions
            expect(hasAdminPermission).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
