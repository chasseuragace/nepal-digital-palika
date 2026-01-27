/**
 * Property 4: Role Hierarchy Level Assignment
 * 
 * **Validates: Requirements 2.2**
 * 
 * For any role creation, the role should have a valid hierarchy_level 
 * (national, province, district, or palika) assigned.
 * 
 * Verify:
 * 1. super_admin has hierarchy_level = 'national'
 * 2. province_admin has hierarchy_level = 'province'
 * 3. district_admin has hierarchy_level = 'district'
 * 4. palika_admin has hierarchy_level = 'palika'
 * 5. moderator has hierarchy_level = 'palika'
 * 6. support_agent has hierarchy_level = 'palika'
 * 7. content_editor has hierarchy_level = 'palika'
 * 8. content_reviewer has hierarchy_level = 'palika'
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

describe('Property 4: Role Hierarchy Level Assignment', () => {
  const expectedRoleHierarchies: Record<string, string> = {
    super_admin: 'national',
    province_admin: 'province',
    district_admin: 'district',
    palika_admin: 'palika',
    moderator: 'palika',
    support_agent: 'palika',
    content_editor: 'palika',
    content_reviewer: 'palika'
  }

  beforeAll(async () => {
    // Verify that all expected roles exist in the database
    const { data: roles, error } = await supabase
      .from('roles')
      .select('name, hierarchy_level')

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`)
    }

    if (!roles || roles.length === 0) {
      throw new Error('No roles found in database')
    }
  })

  describe('Requirement 2.2: All roles have correct hierarchy_level', () => {
    it('should have all 8 roles with correct hierarchy levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Fetch all roles from database
            const { data: roles, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .order('name')

            if (error) {
              throw new Error(`Failed to fetch roles: ${error.message}`)
            }

            if (!roles) {
              throw new Error('No roles returned from database')
            }

            // Verify each expected role exists with correct hierarchy_level
            for (const [roleName, expectedLevel] of Object.entries(expectedRoleHierarchies)) {
              const role = roles.find(r => r.name === roleName)

              expect(role).toBeDefined()
              expect(role?.name).toBe(roleName)
              expect(role?.hierarchy_level).toBe(expectedLevel)
            }

            // Verify we have at least the 8 expected roles
            expect(roles.length).toBeGreaterThanOrEqual(8)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have super_admin with national hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'super_admin')
              .single()

            if (error) {
              throw new Error(`Failed to fetch super_admin role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('super_admin')
            expect(role?.hierarchy_level).toBe('national')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have province_admin with province hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'province_admin')
              .single()

            if (error) {
              throw new Error(`Failed to fetch province_admin role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('province_admin')
            expect(role?.hierarchy_level).toBe('province')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have district_admin with district hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'district_admin')
              .single()

            if (error) {
              throw new Error(`Failed to fetch district_admin role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('district_admin')
            expect(role?.hierarchy_level).toBe('district')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have palika_admin with palika hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'palika_admin')
              .single()

            if (error) {
              throw new Error(`Failed to fetch palika_admin role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('palika_admin')
            expect(role?.hierarchy_level).toBe('palika')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have moderator with palika hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'moderator')
              .single()

            if (error) {
              throw new Error(`Failed to fetch moderator role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('moderator')
            expect(role?.hierarchy_level).toBe('palika')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have support_agent with palika hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'support_agent')
              .single()

            if (error) {
              throw new Error(`Failed to fetch support_agent role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('support_agent')
            expect(role?.hierarchy_level).toBe('palika')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have content_editor with palika hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'content_editor')
              .single()

            if (error) {
              throw new Error(`Failed to fetch content_editor role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('content_editor')
            expect(role?.hierarchy_level).toBe('palika')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have content_reviewer with palika hierarchy level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: role, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')
              .eq('name', 'content_reviewer')
              .single()

            if (error) {
              throw new Error(`Failed to fetch content_reviewer role: ${error.message}`)
            }

            expect(role).toBeDefined()
            expect(role?.name).toBe('content_reviewer')
            expect(role?.hierarchy_level).toBe('palika')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have all roles with valid hierarchy levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const { data: roles, error } = await supabase
              .from('roles')
              .select('name, hierarchy_level')

            if (error) {
              throw new Error(`Failed to fetch roles: ${error.message}`)
            }

            if (!roles) {
              throw new Error('No roles returned from database')
            }

            const validLevels = ['national', 'province', 'district', 'palika']

            // Verify each role has a valid hierarchy_level
            for (const role of roles) {
              expect(role.hierarchy_level).toBeDefined()
              expect(validLevels).toContain(role.hierarchy_level)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
