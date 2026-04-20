import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  assertCallerCanCreate,
  assertCallerCanUpdate,
  assertCallerCanDelete,
  PALIKA_MANAGEABLE_ROLES,
  PLATFORM_ROLES,
} from '@/lib/server/rbac'
import type { CallerContext } from '@/lib/server/session'

function caller(overrides: Partial<CallerContext> = {}): CallerContext {
  return {
    id: 'caller-1',
    role_name: 'palika_admin',
    hierarchy_level: 'palika',
    palika_id: 5,
    district_id: 301,
    province_id: 3,
    permissions: ['manage_admins'],
    is_active: true,
    ...overrides,
  }
}

describe('RBAC scope enforcement (palika-scoped panel)', () => {
  describe('assertCallerCanCreate', () => {
    it('rejects unauthenticated caller', () => {
      const r = assertCallerCanCreate(null, {
        role: 'moderator',
        hierarchy_level: 'palika',
        palika_id: 5,
        district_id: 301,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.status).toBe(401)
    })

    it('rejects inactive caller', () => {
      const r = assertCallerCanCreate(caller({ is_active: false }), {
        role: 'moderator',
        hierarchy_level: 'palika',
        palika_id: 5,
        district_id: 301,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/active/)
    })

    it('rejects content_editor caller (content team cannot create admins)', () => {
      const r = assertCallerCanCreate(caller({ role_name: 'content_editor' }), {
        role: 'moderator',
        hierarchy_level: 'palika',
        palika_id: 5,
        district_id: 301,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-2-caller-role/)
    })

    it('rejects target with platform role', () => {
      for (const target of PLATFORM_ROLES) {
        const r = assertCallerCanCreate(caller(), {
          role: target,
          hierarchy_level: 'palika',
          palika_id: 5,
          district_id: 301,
          province_id: 3,
        })
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.rule).toMatch(/rule-3-target-role-platform/)
      }
    })

    it('rejects target with unknown role', () => {
      const r = assertCallerCanCreate(caller(), {
        role: 'wizard',
        hierarchy_level: 'palika',
        palika_id: 5,
        district_id: 301,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-3-target-role-unknown/)
    })

    it('rejects target outside caller palika', () => {
      const r = assertCallerCanCreate(caller(), {
        role: 'moderator',
        hierarchy_level: 'palika',
        palika_id: 10,
        district_id: 303,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-5-target-region/)
    })

    it('rejects target with non-palika hierarchy_level', () => {
      const r = assertCallerCanCreate(caller(), {
        role: 'moderator',
        hierarchy_level: 'district',
        palika_id: 5,
        district_id: 301,
        province_id: 3,
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-4-target-hierarchy/)
    })

    it('accepts in-scope palika-manageable target', () => {
      for (const target of PALIKA_MANAGEABLE_ROLES) {
        const r = assertCallerCanCreate(caller(), {
          role: target,
          hierarchy_level: 'palika',
          palika_id: 5,
          district_id: 301,
          province_id: 3,
        })
        expect(r.ok).toBe(true)
      }
    })

    it('super_admin caller bypasses scope rules', () => {
      const r = assertCallerCanCreate(caller({ role_name: 'super_admin', hierarchy_level: 'national', palika_id: null, district_id: null, province_id: null }), {
        role: 'palika_admin',
        hierarchy_level: 'palika',
        palika_id: 10,
        district_id: 303,
        province_id: 3,
      })
      expect(r.ok).toBe(true)
    })
  })

  describe('assertCallerCanUpdate', () => {
    const existing = {
      id: 'target-1',
      role: 'moderator',
      hierarchy_level: 'palika' as string | null,
      palika_id: 5,
      district_id: 301,
      province_id: 3,
    }

    it('rejects when target is in a different palika', () => {
      const r = assertCallerCanUpdate(caller(), { ...existing, palika_id: 10 }, {})
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-5-existing-region/)
    })

    it('rejects role change to platform role', () => {
      const r = assertCallerCanUpdate(caller(), existing, { role: 'super_admin' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-3-role-change/)
    })

    it('rejects hierarchy change away from palika', () => {
      const r = assertCallerCanUpdate(caller(), existing, { hierarchy_level: 'district' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-4-hierarchy-change/)
    })

    it('rejects palika_id change to another palika', () => {
      const r = assertCallerCanUpdate(caller(), existing, { palika_id: 10 })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-5-palika-change/)
    })

    it('accepts in-scope updates', () => {
      const r = assertCallerCanUpdate(caller(), existing, { role: 'content_editor' })
      expect(r.ok).toBe(true)
    })
  })

  describe('assertCallerCanDelete', () => {
    const existing = {
      id: 'target-1',
      role: 'moderator',
      hierarchy_level: 'palika' as string | null,
      palika_id: 5,
      district_id: 301,
      province_id: 3,
    }

    it('rejects self-delete', () => {
      const c = caller()
      const r = assertCallerCanDelete(c, { ...existing, id: c.id })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-self-delete/)
    })

    it('rejects deleting platform admin', () => {
      const r = assertCallerCanDelete(caller(), { ...existing, role: 'super_admin' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-4-existing-platform/)
    })

    it('rejects deleting out-of-scope admin', () => {
      const r = assertCallerCanDelete(caller(), { ...existing, palika_id: 10 })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.rule).toMatch(/rule-5-existing-region/)
    })

    it('accepts deleting in-scope palika admin', () => {
      const r = assertCallerCanDelete(caller(), existing)
      expect(r.ok).toBe(true)
    })
  })

  describe('Property: every (caller_role, target_role) pair matches policy', () => {
    const allRoles = [
      ...PLATFORM_ROLES,
      ...PALIKA_MANAGEABLE_ROLES,
    ] as const

    it('always rejects when caller is not palika_admin/super_admin', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<string>(...PALIKA_MANAGEABLE_ROLES.filter((r) => r !== 'palika_admin')),
          fc.constantFrom<string>(...PALIKA_MANAGEABLE_ROLES),
          (callerRole, targetRole) => {
            const c = caller({ role_name: callerRole })
            const r = assertCallerCanCreate(c, {
              role: targetRole,
              hierarchy_level: 'palika',
              palika_id: c.palika_id!,
              district_id: c.district_id,
              province_id: c.province_id,
            })
            return !r.ok
          }
        )
      )
    })

    it('always rejects when target is a platform role (non-super caller)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<string>(...PLATFORM_ROLES),
          (targetRole) => {
            const c = caller()
            const r = assertCallerCanCreate(c, {
              role: targetRole,
              hierarchy_level: 'palika',
              palika_id: c.palika_id!,
              district_id: c.district_id,
              province_id: c.province_id,
            })
            return !r.ok
          }
        )
      )
    })

    it('always rejects cross-palika targets (non-super caller)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom<string>(...PALIKA_MANAGEABLE_ROLES),
          (callerPalika, targetPalika, targetRole) => {
            fc.pre(callerPalika !== targetPalika)
            const c = caller({ palika_id: callerPalika })
            const r = assertCallerCanCreate(c, {
              role: targetRole,
              hierarchy_level: 'palika',
              palika_id: targetPalika,
              district_id: c.district_id,
              province_id: c.province_id,
            })
            return !r.ok
          }
        )
      )
    })

    it('always accepts in-scope palika-manageable targets for palika_admin caller', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<string>(...PALIKA_MANAGEABLE_ROLES),
          (targetRole) => {
            const c = caller()
            const r = assertCallerCanCreate(c, {
              role: targetRole,
              hierarchy_level: 'palika',
              palika_id: c.palika_id!,
              district_id: c.district_id,
              province_id: c.province_id,
            })
            return r.ok === true
          }
        )
      )
    })
  })
})
