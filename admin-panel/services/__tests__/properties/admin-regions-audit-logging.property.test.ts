/**
 * Admin Regions Audit Logging Property-Based Tests
 * 
 * **Validates: Requirements 4.4**
 * 
 * Property 13: Admin Regions Audit Logging
 * For any INSERT, UPDATE, or DELETE operation on the admin_regions table,
 * an audit_log entry should be created recording the change.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'

// Create service role client for audit logging (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for integration tests. Make sure .env.local is configured.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

describe('Property 13: Admin Regions Audit Logging', () => {
  let testAdminId: string
  let testPalikaId: number
  let testDistrictId: number
  let testProvinceId: number

  beforeAll(async () => {
    // Get or create test geographic data
    const { data: existingProvinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(1)

    if (!existingProvinces || existingProvinces.length === 0) {
      const { data: province, error: provinceError } = await supabase
        .from('provinces')
        .insert({
          name_en: 'Test Province',
          name_ne: 'परीक्षण प्रान्त',
          code: `TEST_PROV_${Date.now()}`
        })
        .select()
        .single()

      if (provinceError) {
        throw new Error(`Failed to create test province: ${provinceError.message}`)
      }

      testProvinceId = province.id
    } else {
      testProvinceId = existingProvinces[0].id
    }

    const { data: existingDistricts } = await supabase
      .from('districts')
      .select('id')
      .eq('province_id', testProvinceId)
      .limit(1)

    if (!existingDistricts || existingDistricts.length === 0) {
      const { data: district, error: districtError } = await supabase
        .from('districts')
        .insert({
          province_id: testProvinceId,
          name_en: 'Test District',
          name_ne: 'परीक्षण जिल्ला',
          code: `TEST_DIST_${Date.now()}`
        })
        .select()
        .single()

      if (districtError) {
        throw new Error(`Failed to create test district: ${districtError.message}`)
      }

      testDistrictId = district.id
    } else {
      testDistrictId = existingDistricts[0].id
    }

    const { data: existingPalikas } = await supabase
      .from('palikas')
      .select('id')
      .eq('district_id', testDistrictId)
      .limit(1)

    if (!existingPalikas || existingPalikas.length === 0) {
      const { data: palika, error: palikaError } = await supabase
        .from('palikas')
        .insert({
          district_id: testDistrictId,
          name_en: 'Test Palika',
          name_ne: 'परीक्षण पालिका',
          type: 'municipality',
          code: `TEST_PAL_${Date.now()}`
        })
        .select()
        .single()

      if (palikaError) {
        throw new Error(`Failed to create test palika: ${palikaError.message}`)
      }

      testPalikaId = palika.id
    } else {
      testPalikaId = existingPalikas[0].id
    }

    // Get or create a test admin user
    const { data: existingAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)

    if (!existingAdmins || existingAdmins.length === 0) {
      // Create a test admin user using Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: `test-admin-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: authUser.user.id,
          full_name: 'Test Admin',
          role: 'super_admin',
          hierarchy_level: 'national',
          is_active: true
        })
        .select()
        .single()

      if (adminError) {
        throw new Error(`Failed to create admin user: ${adminError.message}`)
      }

      testAdminId = adminUser.id
    } else {
      testAdminId = existingAdmins[0].id
    }
  })

  afterEach(async () => {
    // Clean up test data after each test
    // Delete any test admin regions created
    await supabase
      .from('admin_regions')
      .delete()
      .eq('admin_id', testAdminId)

    // Clear audit logs for test data
    await supabase
      .from('audit_log')
      .delete()
      .eq('admin_id', testAdminId)
  })

  /**
   * **Validates: Requirement 4.4**
   * 
   * Requirement 4.4: WHEN an admin_regions record is modified, 
   * THE System SHALL log the change to the audit_log table
   */
  it('should create audit log entries for INSERT operations on admin_regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          regionType: fc.constantFrom('palika' as const)
        }),
        async (testData) => {
          // Create a unique admin for this test
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: `test-admin-${Date.now()}-${Math.random()}@example.com`,
            password: 'TestPassword123!',
            email_confirm: true
          })

          if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`)
          }

          const { data: admin, error: adminError } = await supabase
            .from('admin_users')
            .insert({
              id: authUser.user.id,
              full_name: 'Test Admin',
              role: 'palika_admin',
              hierarchy_level: 'palika',
              palika_id: testPalikaId,
              is_active: true
            })
            .select()
            .single()

          if (adminError) {
            throw new Error(`Failed to create admin user: ${adminError.message}`)
          }

          // Insert an admin_regions record
          const { data: inserted, error } = await supabase
            .from('admin_regions')
            .insert({
              admin_id: admin.id,
              region_type: testData.regionType,
              region_id: testPalikaId
            })
            .select()
            .single()

          if (error) {
            throw new Error(`Failed to insert admin_regions: ${error.message}`)
          }

          // Wait a moment for trigger to fire
          await new Promise(resolve => setTimeout(resolve, 200))

          // Verify audit log entry was created (Requirement 4.4)
          const { data: allAuditLogs, error: auditError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('entity_type', 'admin_regions')
            .eq('action', 'INSERT')
            .order('created_at', { ascending: false })
            .limit(10)

          if (auditError) {
            throw new Error(`Failed to fetch audit log: ${auditError.message}`)
          }

          // Find the audit log entry for this specific entity
          const auditLogs = allAuditLogs.filter(log => log.entity_id === inserted.id.toString())

          // Verify audit log entry exists
          expect(auditLogs).toBeDefined()
          expect(auditLogs.length).toBeGreaterThan(0)
          
          const auditLog = auditLogs[0]
          
          // Verify entity_type is admin_regions
          expect(auditLog.entity_type).toBe('admin_regions')
          
          // Verify action is INSERT
          expect(auditLog.action).toBe('INSERT')
          
          // Verify entity_id matches the inserted record
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          
          // Verify changes contains the inserted data
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
          expect(auditLog.changes).toHaveProperty('admin_id')
          expect(auditLog.changes).toHaveProperty('region_type')
          expect(auditLog.changes).toHaveProperty('region_id')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create audit log entries for UPDATE operations on admin_regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          regionType: fc.constantFrom('palika' as const)
        }),
        async (testData) => {
          // Create a unique admin for this test
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: `test-admin-${Date.now()}-${Math.random()}@example.com`,
            password: 'TestPassword123!',
            email_confirm: true
          })

          if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`)
          }

          const { data: admin, error: adminError } = await supabase
            .from('admin_users')
            .insert({
              id: authUser.user.id,
              full_name: 'Test Admin',
              role: 'palika_admin',
              hierarchy_level: 'palika',
              palika_id: testPalikaId,
              is_active: true
            })
            .select()
            .single()

          if (adminError) {
            throw new Error(`Failed to create admin user: ${adminError.message}`)
          }

          // Insert an admin_regions record
          const { data: inserted, error: insertError } = await supabase
            .from('admin_regions')
            .insert({
              admin_id: admin.id,
              region_type: testData.regionType,
              region_id: testPalikaId
            })
            .select()
            .single()

          if (insertError) {
            throw new Error(`Failed to insert admin_regions: ${insertError.message}`)
          }

          // Wait for insert trigger
          await new Promise(resolve => setTimeout(resolve, 200))

          // Update the admin_regions record
          const { error: updateError } = await supabase
            .from('admin_regions')
            .update({
              region_type: testData.regionType
            })
            .eq('id', inserted.id)

          if (updateError) {
            throw new Error(`Failed to update admin_regions: ${updateError.message}`)
          }

          // Wait for update trigger
          await new Promise(resolve => setTimeout(resolve, 200))

          // Verify audit log entry was created for UPDATE (Requirement 4.4)
          const { data: allAuditLogs, error: auditError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('entity_type', 'admin_regions')
            .eq('action', 'UPDATE')
            .order('created_at', { ascending: false })
            .limit(10)

          if (auditError) {
            throw new Error(`Failed to fetch audit log: ${auditError.message}`)
          }

          // Find the audit log entry for this specific entity
          const auditLogs = allAuditLogs.filter(log => log.entity_id === inserted.id.toString())

          // Verify audit log entry exists
          expect(auditLogs).toBeDefined()
          expect(auditLogs.length).toBeGreaterThan(0)
          
          const auditLog = auditLogs[0]
          
          // Verify entity_type is admin_regions
          expect(auditLog.entity_type).toBe('admin_regions')
          
          // Verify action is UPDATE
          expect(auditLog.action).toBe('UPDATE')
          
          // Verify entity_id matches the updated record
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          
          // Verify changes contains both old and new state
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
          expect(auditLog.changes).toHaveProperty('old')
          expect(auditLog.changes).toHaveProperty('new')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create audit log entries for DELETE operations on admin_regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          regionType: fc.constantFrom('palika' as const)
        }),
        async (testData) => {
          // Create a unique admin for this test
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: `test-admin-${Date.now()}-${Math.random()}@example.com`,
            password: 'TestPassword123!',
            email_confirm: true
          })

          if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`)
          }

          const { data: admin, error: adminError } = await supabase
            .from('admin_users')
            .insert({
              id: authUser.user.id,
              full_name: 'Test Admin',
              role: 'palika_admin',
              hierarchy_level: 'palika',
              palika_id: testPalikaId,
              is_active: true
            })
            .select()
            .single()

          if (adminError) {
            throw new Error(`Failed to create admin user: ${adminError.message}`)
          }

          // Insert an admin_regions record
          const { data: inserted, error: insertError } = await supabase
            .from('admin_regions')
            .insert({
              admin_id: admin.id,
              region_type: testData.regionType,
              region_id: testPalikaId
            })
            .select()
            .single()

          if (insertError) {
            throw new Error(`Failed to insert admin_regions: ${insertError.message}`)
          }

          // Wait for insert trigger
          await new Promise(resolve => setTimeout(resolve, 200))

          // Delete the admin_regions record
          const { error: deleteError } = await supabase
            .from('admin_regions')
            .delete()
            .eq('id', inserted.id)

          if (deleteError) {
            throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)
          }

          // Wait for delete trigger
          await new Promise(resolve => setTimeout(resolve, 200))

          // Verify audit log entry was created for DELETE (Requirement 4.4)
          const { data: allAuditLogs, error: auditError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('entity_type', 'admin_regions')
            .eq('action', 'DELETE')
            .order('created_at', { ascending: false })
            .limit(10)

          if (auditError) {
            throw new Error(`Failed to fetch audit log: ${auditError.message}`)
          }

          // Find the audit log entry for this specific entity
          const auditLogs = allAuditLogs.filter(log => log.entity_id === inserted.id.toString())

          // Verify audit log entry exists
          expect(auditLogs).toBeDefined()
          expect(auditLogs.length).toBeGreaterThan(0)
          
          const auditLog = auditLogs[0]
          
          // Verify entity_type is admin_regions
          expect(auditLog.entity_type).toBe('admin_regions')
          
          // Verify action is DELETE
          expect(auditLog.action).toBe('DELETE')
          
          // Verify entity_id matches the deleted record
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          
          // Verify changes contains the deleted data
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})
