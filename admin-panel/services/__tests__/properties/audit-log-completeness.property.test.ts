/**
 * Audit Log Completeness Property-Based Tests
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3**
 * 
 * Property 12: Audit Log Completeness
 * For any INSERT, UPDATE, or DELETE operation on a tracked table, 
 * an audit_log entry should be created with admin_id, action, entity_type, 
 * entity_id, and changes fields populated.
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

describe('Property 12: Audit Log Completeness', () => {
  let testAdminId: string
  let testPalikaId: number

  beforeAll(async () => {
    // Get or create a test palika
    const { data: existingPalikas } = await supabase
      .from('palikas')
      .select('id')
      .limit(1)

    if (!existingPalikas || existingPalikas.length === 0) {
      // Create test geographic data
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

      const { data: district, error: districtError } = await supabase
        .from('districts')
        .insert({
          province_id: province.id,
          name_en: 'Test District',
          name_ne: 'परीक्षण जिल्ला',
          code: `TEST_DIST_${Date.now()}`
        })
        .select()
        .single()

      if (districtError) {
        throw new Error(`Failed to create test district: ${districtError.message}`)
      }

      const { data: palika, error: palikaError } = await supabase
        .from('palikas')
        .insert({
          district_id: district.id,
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
   * **Validates: Requirements 4.1, 4.2, 4.3**
   * 
   * Requirement 4.1: WHEN an admin creates, updates, or deletes any record, 
   * THE System SHALL automatically log the action to the audit_log table
   * 
   * Requirement 4.2: WHEN an audit_log entry is created, THE System SHALL 
   * record the admin_id, action (INSERT/UPDATE/DELETE), entity_type, entity_id, 
   * and changes (JSONB)
   * 
   * Requirement 4.3: WHEN an audit_log entry is created, THE System SHALL 
   * record the timestamp (created_at) automatically
   */
  it('should create audit log entries for INSERT operations on tracked tables', async () => {
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

          // Insert an admin_regions record (tracked table)
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

          // Verify audit log entry was created (Requirement 4.1)
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
          
          // Verify all required fields are populated (Requirement 4.2)
          expect(auditLog.admin_id).toBeDefined()
          expect(auditLog.admin_id).not.toBeNull()
          expect(auditLog.action).toBe('INSERT')
          expect(auditLog.entity_type).toBe('admin_regions')
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
          
          // Verify timestamp is automatically set (Requirement 4.3)
          expect(auditLog.created_at).toBeDefined()
          expect(auditLog.created_at).not.toBeNull()

          // Verify changes contains the inserted data
          expect(auditLog.changes).toHaveProperty('admin_id')
          expect(auditLog.changes).toHaveProperty('region_type')
          expect(auditLog.changes).toHaveProperty('region_id')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create audit log entries for UPDATE operations with before/after state', async () => {
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

          // Verify audit log entry was created for UPDATE (Requirement 4.1)
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
          
          // Verify all required fields are populated (Requirement 4.2)
          expect(auditLog.admin_id).toBeDefined()
          expect(auditLog.admin_id).not.toBeNull()
          expect(auditLog.action).toBe('UPDATE')
          expect(auditLog.entity_type).toBe('admin_regions')
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
          
          // Verify timestamp is automatically set (Requirement 4.3)
          expect(auditLog.created_at).toBeDefined()
          expect(auditLog.created_at).not.toBeNull()

          // Verify changes contains both old and new state
          expect(auditLog.changes).toHaveProperty('old')
          expect(auditLog.changes).toHaveProperty('new')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create audit log entries for DELETE operations', async () => {
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

          // Verify audit log entry was created for DELETE (Requirement 4.1)
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
          
          // Verify all required fields are populated (Requirement 4.2)
          expect(auditLog.admin_id).toBeDefined()
          expect(auditLog.admin_id).not.toBeNull()
          expect(auditLog.action).toBe('DELETE')
          expect(auditLog.entity_type).toBe('admin_regions')
          expect(auditLog.entity_id).toBe(inserted.id.toString())
          expect(auditLog.changes).toBeDefined()
          expect(auditLog.changes).not.toBeNull()
          
          // Verify timestamp is automatically set (Requirement 4.3)
          expect(auditLog.created_at).toBeDefined()
          expect(auditLog.created_at).not.toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})
