/**
 * RBAC scope enforcement for the palika-facing admin-panel.
 *
 * This panel is used by palika-level admins and their content team. Platform-
 * level roles (super_admin, province_admin, district_admin) belong to the
 * separate platform-admin-panel. The rules below reflect that scoping.
 */

import type { CallerContext } from './session'

/** Roles a palika_admin is allowed to create/manage in this panel. */
export const PALIKA_MANAGEABLE_ROLES = [
  'palika_admin',
  'moderator',
  'support_agent',
  'content_editor',
  'content_reviewer',
] as const

export type PalikaManageableRole = (typeof PALIKA_MANAGEABLE_ROLES)[number]

/** Roles that are out of scope for this panel (belong to platform-admin-panel). */
export const PLATFORM_ROLES = ['super_admin', 'province_admin', 'district_admin'] as const

export interface TargetAdminInput {
  role: string
  hierarchy_level: string
  palika_id: number | null
  district_id: number | null
  province_id: number | null
}

export interface ExistingAdminRecord {
  id: string
  role: string
  hierarchy_level: string | null
  palika_id: number | null
  district_id: number | null
  province_id: number | null
}

export type AuthzResult =
  | { ok: true }
  | { ok: false; rule: string; reason: string; status: 401 | 403 }

function isPalikaManageable(role: string): role is PalikaManageableRole {
  return (PALIKA_MANAGEABLE_ROLES as readonly string[]).includes(role)
}

function isPlatformRole(role: string): boolean {
  return (PLATFORM_ROLES as readonly string[]).includes(role)
}

/**
 * Rule 1: caller must be authenticated, active, and be a palika_admin.
 * Super_admin bypasses for emergency access — documented, not a mistake.
 */
function assertCallerCanManageAdmins(caller: CallerContext | null): AuthzResult {
  if (!caller) {
    return {
      ok: false,
      rule: 'rule-1-authentication',
      reason: 'Caller is not authenticated',
      status: 401,
    }
  }
  if (!caller.is_active) {
    return {
      ok: false,
      rule: 'rule-1-active',
      reason: 'Caller account is inactive',
      status: 401,
    }
  }
  if (caller.role_name === 'super_admin') return { ok: true }
  if (caller.role_name !== 'palika_admin') {
    return {
      ok: false,
      rule: 'rule-2-caller-role',
      reason:
        'Only palika_admin can manage admins in this panel. Content team accounts cannot create or modify admins.',
      status: 403,
    }
  }
  if (caller.palika_id == null) {
    return {
      ok: false,
      rule: 'rule-2-caller-scope',
      reason: 'palika_admin caller has no palika_id assigned; cannot determine scope',
      status: 403,
    }
  }
  return { ok: true }
}

export function assertCallerCanCreate(
  caller: CallerContext | null,
  target: TargetAdminInput
): AuthzResult {
  const base = assertCallerCanManageAdmins(caller)
  if (!base.ok) return base
  if (!caller) return base // unreachable; narrows type
  if (caller.role_name === 'super_admin') return { ok: true }

  if (isPlatformRole(target.role)) {
    return {
      ok: false,
      rule: 'rule-3-target-role-platform',
      reason: `Cannot create platform-level role '${target.role}' from this panel. Use platform-admin-panel.`,
      status: 403,
    }
  }
  if (!isPalikaManageable(target.role)) {
    return {
      ok: false,
      rule: 'rule-3-target-role-unknown',
      reason: `Role '${target.role}' is not manageable from this panel`,
      status: 403,
    }
  }
  if (target.hierarchy_level !== 'palika') {
    return {
      ok: false,
      rule: 'rule-4-target-hierarchy',
      reason: `Target hierarchy_level must be 'palika' (got '${target.hierarchy_level}')`,
      status: 403,
    }
  }
  if (target.palika_id !== caller.palika_id) {
    return {
      ok: false,
      rule: 'rule-5-target-region',
      reason: `Target palika_id (${target.palika_id}) must match caller's palika_id (${caller.palika_id})`,
      status: 403,
    }
  }
  return { ok: true }
}

export function assertCallerCanUpdate(
  caller: CallerContext | null,
  existing: ExistingAdminRecord,
  patch: Partial<TargetAdminInput>
): AuthzResult {
  const base = assertCallerCanManageAdmins(caller)
  if (!base.ok) return base
  if (!caller) return base
  if (caller.role_name === 'super_admin') return { ok: true }

  if (isPlatformRole(existing.role)) {
    return {
      ok: false,
      rule: 'rule-4-existing-platform',
      reason: `Cannot modify platform-level admin (${existing.role}) from this panel`,
      status: 403,
    }
  }
  if (existing.palika_id !== caller.palika_id) {
    return {
      ok: false,
      rule: 'rule-5-existing-region',
      reason: 'Target admin is outside caller palika scope',
      status: 403,
    }
  }
  if (patch.role && patch.role !== existing.role) {
    if (isPlatformRole(patch.role) || !isPalikaManageable(patch.role)) {
      return {
        ok: false,
        rule: 'rule-3-role-change',
        reason: `Cannot change role to '${patch.role}' from this panel`,
        status: 403,
      }
    }
  }
  if (patch.hierarchy_level && patch.hierarchy_level !== 'palika') {
    return {
      ok: false,
      rule: 'rule-4-hierarchy-change',
      reason: `hierarchy_level cannot be changed to '${patch.hierarchy_level}' from this panel`,
      status: 403,
    }
  }
  if (patch.palika_id != null && patch.palika_id !== caller.palika_id) {
    return {
      ok: false,
      rule: 'rule-5-palika-change',
      reason: `palika_id cannot be changed outside caller palika (${caller.palika_id})`,
      status: 403,
    }
  }
  return { ok: true }
}

export function assertCallerCanDelete(
  caller: CallerContext | null,
  existing: ExistingAdminRecord
): AuthzResult {
  const base = assertCallerCanManageAdmins(caller)
  if (!base.ok) return base
  if (!caller) return base
  if (caller.role_name === 'super_admin') return { ok: true }

  if (existing.id === caller.id) {
    return {
      ok: false,
      rule: 'rule-self-delete',
      reason: 'Cannot delete your own account',
      status: 403,
    }
  }
  if (isPlatformRole(existing.role)) {
    return {
      ok: false,
      rule: 'rule-4-existing-platform',
      reason: `Cannot delete platform-level admin (${existing.role}) from this panel`,
      status: 403,
    }
  }
  if (existing.palika_id !== caller.palika_id) {
    return {
      ok: false,
      rule: 'rule-5-existing-region',
      reason: 'Target admin is outside caller palika scope',
      status: 403,
    }
  }
  return { ok: true }
}
