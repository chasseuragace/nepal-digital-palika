/**
 * Audit Logging Integration Tests
 * Property-based tests for audit log completeness and audit logging on specific tables
 * 
 * Tests the following properties:
 * - Property 12: Audit Log Completeness (Requirements 4.1, 4.2, 4.3)
 * - Property 13: Admin Regions Audit Logging (Requirements 4.4)
 * - Property 14: Admin Users Audit Logging (Requirements 4.5)
 * 
 * IMPORTANT: These tests use authenticated clients to properly trigger audit logging.
 * The audit_log_trigger function checks auth.uid() to get the admin ID.
 * Service role bypasses this, so we must use authenticated clients.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase, createAuthenticatedClient } from '../setup/integration-setup'
import { SupabaseClient } from '@supabase/supabase-js'

describe('Audit Logging Integration Tests', () => {
  let testAdminId: string
  let testPalikaId: number
  let testAdminEmail: string
  let testAdminPassword: string
  let authenticatedClient: SupabaseClient

  beforeAll(async () => {
    // First, create test data if needed
    // Create a test palika
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
          code: 'TEST_PROV'
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
          code: 'TEST_DIST'
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
          code: 'TEST_PAL'
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

    // Create a test admin user with unique credentials
    testAdminEmail = `test-audit-admin-${Date.now()}@example.com`
    testAdminPassword = 'TestPassword123!'

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testAdminEmail,
      password: testAdminPassword,
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    // Create admin_users record
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        full_name: 'Test Audit Admin',
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

    // Create authenticated client for this admin
    authenticatedClient = await createAuthenticatedClient(testAdminEmail, testAdminPassword)
  })

  afterEach(async () => {
    // Clean up test data after each test
    // Delete any test heritage sites created
    await supabase
      .from('heritage_sites')
      .delete()
      .like('name_en', 'Test Heritage Site %')

    // Delete any test admin regions created
    await supabase
      .from('admin_regions')
      .delete()
      .eq('admin_id', testAdminId)

    // Delete any test admin users created
    await supabase
      .from('admin_users')
      .delete()
      .like('email', 'test-audit-%@example.com')

    // Clear audit logs for test data
    await supabase
      .from('audit_log')
      .delete()
      .eq('admin_id', testAdminId)
  })

  describe('Property 12: Audit Log Completeness', () => {
    /**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     * 
     * For any INSERT, UPDATE, or DELETE operation on a tracked table, 
     * an audit_log entry should be created with admin_id, action, entity_type, 
     * entity_id, and changes fields populated.
     */
    it('should create audit log entries for INSERT operations on tracked tables', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name_en: fc.string({ minLength: 1, maxLength: 100 }),
            name_ne: fc.string({ minLength: 1, maxLength: 100 }),
            short_description: fc.string({ minLength: 1, maxLength: 200 })
          }),
          async (testData) => {
            // Generate a unique slug
            const slug = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`

            // Insert a heritage site using authenticated client (so audit trigger fires)
            const { data: inserted, error } = await authenticatedClient
              .from('heritage_sites')
              .insert({
                name_en: `Test Heritage Site ${testData.name_en}`,
                name_ne: testData.name_ne,
                short_description: testData.short_description,
                short_description_ne: 'परीक्षण विवरण',
                slug: slug,
                palika_id: testPalikaId,
                category_id: 1,
                status: 'published',
                location: 'POINT(0 0)'
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to insert heritage site: ${error.message}`)
            }

            // Wait a moment for trigger to fire
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created (use service role to read audit log)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'heritage_sites')
              .eq('entity_id', inserted.id)
              .eq('action', 'INSERT')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry exists
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBe(testAdminId)
            expect(auditLog.action).toBe('INSERT')
            expect(auditLog.entity_type).toBe('heritage_sites')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains the inserted data
            expect(auditLog.changes).toHaveProperty('name_en')
            expect(auditLog.changes.name_en).toContain('Test Heritage Site')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for UPDATE operations with before/after state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            newName: fc.string({ minLength: 1, maxLength: 100 }),
            newDescription: fc.string({ minLength: 1, maxLength: 200 })
          }),
          async (testData) => {
            // Generate a unique slug
            const slug = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`

            // First, insert a heritage site using authenticated client
            const { data: inserted, error: insertError } = await authenticatedClient
              .from('heritage_sites')
              .insert({
                name_en: 'Original Name',
                name_ne: 'मूल नाम',
                short_description: 'Original description',
                short_description_ne: 'मूल विवरण',
                slug: slug,
                palika_id: testPalikaId,
                category_id: 1,
                status: 'published',
                location: 'POINT(0 0)'
              })
              .select()
              .single()

            if (insertError) {
              throw new Error(`Failed to insert heritage site: ${insertError.message}`)
            }

            // Wait for insert trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Update the heritage site using authenticated client
            const { error: updateError } = await authenticatedClient
              .from('heritage_sites')
              .update({
                name_en: `Updated ${testData.newName}`,
                short_description: testData.newDescription
              })
              .eq('id', inserted.id)

            if (updateError) {
              throw new Error(`Failed to update heritage site: ${updateError.message}`)
            }

            // Wait for update trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for UPDATE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'heritage_sites')
              .eq('entity_id', inserted.id)
              .eq('action', 'UPDATE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry exists
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBe(testAdminId)
            expect(auditLog.action).toBe('UPDATE')
            expect(auditLog.entity_type).toBe('heritage_sites')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains both old and new state
            expect(auditLog.changes).toHaveProperty('old')
            expect(auditLog.changes).toHaveProperty('new')
            expect(auditLog.changes.old).toHaveProperty('name_en')
            expect(auditLog.changes.new).toHaveProperty('name_en')
            expect(auditLog.changes.old.name_en).toBe('Original Name')
            expect(auditLog.changes.new.name_en).toContain('Updated')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for DELETE operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name_en: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            // Generate a unique slug
            const slug = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`

            // First, insert a heritage site using authenticated client
            const { data: inserted, error: insertError } = await authenticatedClient
              .from('heritage_sites')
              .insert({
                name_en: `Test Heritage Site ${testData.name_en}`,
                name_ne: 'परीक्षण विरासत स्थल',
                short_description: 'Test description',
                short_description_ne: 'परीक्षण विवरण',
                slug: slug,
                palika_id: testPalikaId,
                category_id: 1,
                status: 'published',
                location: 'POINT(0 0)'
              })
              .select()
              .single()

            if (insertError) {
              throw new Error(`Failed to insert heritage site: ${insertError.message}`)
            }

            // Wait for insert trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Delete the heritage site using authenticated client
            const { error: deleteError } = await authenticatedClient
              .from('heritage_sites')
              .delete()
              .eq('id', inserted.id)

            if (deleteError) {
              throw new Error(`Failed to delete heritage site: ${deleteError.message}`)
            }

            // Wait for delete trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for DELETE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'heritage_sites')
              .eq('entity_id', inserted.id)
              .eq('action', 'DELETE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry exists
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBe(testAdminId)
            expect(auditLog.action).toBe('DELETE')
            expect(auditLog.entity_type).toBe('heritage_sites')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains the deleted data
            expect(auditLog.changes).toHaveProperty('name_en')
            expect(auditLog.changes.name_en).toContain('Test Heritage Site')
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 13: Admin Regions Audit Logging', () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * For any INSERT, UPDATE, or DELETE operation on the admin_regions table, 
     * an audit_log entry should be created recording the change.
     */
    it('should create audit log entries for admin_regions INSERT operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            regionType: fc.constantFrom('palika' as const)
          }),
          async (testData) => {
            // Create a unique admin for this test with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin_users record using service role (admin operation)
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

            // Create authenticated client for this admin using the same credentials
            const adminClient = await createAuthenticatedClient(adminEmail, adminPassword)

            // Insert an admin_regions record using authenticated client
            const { data: inserted, error } = await adminClient
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

            // Wait for trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_regions')
              .eq('entity_id', inserted.id.toString())
              .eq('action', 'INSERT')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('INSERT')
            expect(auditLog.entity_type).toBe('admin_regions')
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains the admin_regions data
            expect(auditLog.changes).toHaveProperty('admin_id')
            expect(auditLog.changes).toHaveProperty('region_type')
            expect(auditLog.changes).toHaveProperty('region_id')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for admin_regions UPDATE operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            regionType: fc.constantFrom('palika' as const)
          }),
          async (testData) => {
            // Create a unique admin for this test with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin_users record using service role (admin operation)
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

            // Create authenticated client for this admin using the same credentials
            const adminClient = await createAuthenticatedClient(adminEmail, adminPassword)

            // Insert an admin_regions record using authenticated client
            const { data: inserted, error: insertError } = await adminClient
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
            await new Promise(resolve => setTimeout(resolve, 100))

            // Update the admin_regions record using authenticated client
            const { error: updateError } = await adminClient
              .from('admin_regions')
              .update({
                region_type: testData.regionType
              })
              .eq('id', inserted.id)

            if (updateError) {
              throw new Error(`Failed to update admin_regions: ${updateError.message}`)
            }

            // Wait for update trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for UPDATE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_regions')
              .eq('entity_id', inserted.id.toString())
              .eq('action', 'UPDATE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('UPDATE')
            expect(auditLog.entity_type).toBe('admin_regions')
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains both old and new state
            expect(auditLog.changes).toHaveProperty('old')
            expect(auditLog.changes).toHaveProperty('new')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for admin_regions DELETE operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            regionType: fc.constantFrom('palika' as const)
          }),
          async (testData) => {
            // Create a unique admin for this test with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create admin_users record using service role (admin operation)
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

            // Create authenticated client for this admin using the same credentials
            const adminClient = await createAuthenticatedClient(adminEmail, adminPassword)

            // Insert an admin_regions record using authenticated client
            const { data: inserted, error: insertError } = await adminClient
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
            await new Promise(resolve => setTimeout(resolve, 100))

            // Delete the admin_regions record using authenticated client
            const { error: deleteError } = await adminClient
              .from('admin_regions')
              .delete()
              .eq('id', inserted.id)

            if (deleteError) {
              throw new Error(`Failed to delete admin_regions: ${deleteError.message}`)
            }

            // Wait for delete trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for DELETE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_regions')
              .eq('entity_id', inserted.id.toString())
              .eq('action', 'DELETE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('DELETE')
            expect(auditLog.entity_type).toBe('admin_regions')
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 14: Admin Users Audit Logging', () => {
    /**
     * **Validates: Requirements 4.5**
     * 
     * For any INSERT, UPDATE, or DELETE operation on the admin_users table, 
     * an audit_log entry should be created recording the change.
     */
    it('should create audit log entries for admin_users INSERT operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hierarchyLevel: fc.constantFrom('palika' as const)
          }),
          async (testData) => {
            // Create a unique auth user with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Create authenticated client for this admin using the same credentials
            const adminClient = await createAuthenticatedClient(adminEmail, adminPassword)

            // Insert an admin_users record using service role (admin operation)
            const { data: inserted, error } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: 'Test Admin',
                role: 'palika_admin',
                hierarchy_level: testData.hierarchyLevel,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              throw new Error(`Failed to insert admin_users: ${error.message}`)
            }

            // Wait for trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_users')
              .eq('entity_id', inserted.id)
              .eq('action', 'INSERT')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('INSERT')
            expect(auditLog.entity_type).toBe('admin_users')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains the admin_users data
            expect(auditLog.changes).toHaveProperty('role')
            expect(auditLog.changes).toHaveProperty('hierarchy_level')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for admin_users UPDATE operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            newRole: fc.constantFrom('palika_admin' as const)
          }),
          async (testData) => {
            // Create a unique auth user with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Insert an admin_users record using service role (admin operation)
            const { data: inserted, error: insertError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: 'Test Admin',
                role: 'moderator',
                hierarchy_level: 'palika',
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (insertError) {
              throw new Error(`Failed to insert admin_users: ${insertError.message}`)
            }

            // Wait for insert trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Update the admin_users record using service role (admin operation)
            const { error: updateError } = await supabase
              .from('admin_users')
              .update({
                role: testData.newRole
              })
              .eq('id', inserted.id)

            if (updateError) {
              throw new Error(`Failed to update admin_users: ${updateError.message}`)
            }

            // Wait for update trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for UPDATE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_users')
              .eq('entity_id', inserted.id)
              .eq('action', 'UPDATE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('UPDATE')
            expect(auditLog.entity_type).toBe('admin_users')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains both old and new state
            expect(auditLog.changes).toHaveProperty('old')
            expect(auditLog.changes).toHaveProperty('new')
            expect(auditLog.changes.old).toHaveProperty('role')
            expect(auditLog.changes.new).toHaveProperty('role')
            expect(auditLog.changes.old.role).toBe('moderator')
            expect(auditLog.changes.new.role).toBe(testData.newRole)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should create audit log entries for admin_users DELETE operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hierarchyLevel: fc.constantFrom('palika' as const)
          }),
          async (testData) => {
            // Create a unique auth user with consistent credentials
            const adminEmail = `test-admin-${Date.now()}-${Math.random()}@example.com`
            const adminPassword = 'TestPassword123!'

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: adminEmail,
              password: adminPassword,
              email_confirm: true
            })

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`)
            }

            // Insert an admin_users record using service role (admin operation)
            const { data: inserted, error: insertError } = await supabase
              .from('admin_users')
              .insert({
                id: authUser.user.id,
                full_name: 'Test Admin',
                role: 'palika_admin',
                hierarchy_level: testData.hierarchyLevel,
                palika_id: testPalikaId,
                is_active: true
              })
              .select()
              .single()

            if (insertError) {
              throw new Error(`Failed to insert admin_users: ${insertError.message}`)
            }

            // Wait for insert trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Delete the admin_users record using service role (admin operation)
            const { error: deleteError } = await supabase
              .from('admin_users')
              .delete()
              .eq('id', inserted.id)

            if (deleteError) {
              throw new Error(`Failed to delete admin_users: ${deleteError.message}`)
            }

            // Wait for delete trigger
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify audit log entry was created for DELETE (use service role to read)
            const { data: auditLogs, error: auditError } = await supabase
              .from('audit_log')
              .select('*')
              .eq('entity_type', 'admin_users')
              .eq('entity_id', inserted.id)
              .eq('action', 'DELETE')
              .order('created_at', { ascending: false })
              .limit(1)

            if (auditError) {
              throw new Error(`Failed to fetch audit log: ${auditError.message}`)
            }

            // Verify audit log entry
            expect(auditLogs).toBeDefined()
            expect(auditLogs.length).toBeGreaterThan(0)
            const auditLog = auditLogs[0]
            expect(auditLog.admin_id).toBeDefined()
            expect(auditLog.action).toBe('DELETE')
            expect(auditLog.entity_type).toBe('admin_users')
            expect(auditLog.entity_id).toBe(inserted.id)
            expect(auditLog.changes).toBeDefined()
            expect(auditLog.created_at).toBeDefined()

            // Verify changes contains the deleted data
            expect(auditLog.changes).toHaveProperty('role')
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
