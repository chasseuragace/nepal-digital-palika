# RBAC Concerns - Role-Based Access Control

> **Priority:** 🟡 SHORT-TERM (Security concern)
> **Impact:** Data security, audit compliance

## Original Thought Stream

```
- rbac, where do I need to worry about this?
- in the database
```

## The Answer: Multiple Layers

RBAC is **not just database** - it's a defense-in-depth strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: UI                               │
│  Hide buttons/menu items user can't use                     │
│  ⚠️ Security by obscurity - NOT SUFFICIENT ALONE            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 2: API/Service                      │
│  Check permissions before executing operations              │
│  ✓ Your auth.service.ts handles this                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Database (RLS)                   │
│  Row-Level Security - ultimate gatekeeper                   │
│  ✓ Supabase RLS policies                                    │
└─────────────────────────────────────────────────────────────┘
```

## Your Current RBAC Implementation

**Grounded 2026-01-05** - Verified against `08-admin-panel/services/auth.service.ts`

### Service Layer (auth.service.ts)

```typescript
// Actual getRolePermissions() implementation
const rolePermissions: Record<string, string[]> = {
  super_admin: ['*'],
  palika_admin: [
    'heritage_sites.create', 'heritage_sites.read', 'heritage_sites.update', 'heritage_sites.delete',
    'events.create', 'events.read', 'events.update', 'events.delete',
    'blog_posts.create', 'blog_posts.read', 'blog_posts.update', 'blog_posts.delete',
    'businesses.read', 'businesses.verify',
    'users.read', 'users.manage',
    'analytics.read'
  ],
  moderator: [
    'heritage_sites.create', 'heritage_sites.read', 'heritage_sites.update',
    'events.create', 'events.read', 'events.update',
    'blog_posts.create', 'blog_posts.read', 'blog_posts.update',
    'businesses.read'
  ],
  support: [
    'heritage_sites.read',
    'events.read',
    'blog_posts.read',
    'businesses.read',
    'users.read'
  ]
}
```

### Database vs Service Mismatch

```
Database (roles table):     super_admin, palika_admin, content_editor,
                            content_reviewer, support_agent, moderator

admin_users.role CHECK:     super_admin, palika_admin, moderator, support

auth.service.ts:            super_admin, palika_admin, moderator, support
```

**Note:** The `roles` and `permissions` tables exist but aren't referenced by `admin_users`.
Roles are stored as string enum, permissions derived from `getRolePermissions()`.

### Where It's Used

```typescript
// hasPermission method (auth.service.ts:146-155)
hasPermission(permission: string): boolean {
  const user = this.getCurrentUser()
  if (!user) return false
  if (user.role === 'super_admin') return true
  return user.permissions.includes(permission) || user.permissions.includes('*')
}

// mapAdminUser uses role-based fallback (fixed 2026-01-05)
permissions: data.permissions?.length ? data.permissions : this.getRolePermissions(data.role)
```

## What's Missing?

### 1. Palika Scope Enforcement

Current: "Can user CREATE heritage sites?"
Missing: "Can user CREATE heritage sites **in this specific Palika**?"

```typescript
// Current check
hasPermission('heritage_sites.create')  // ✓ Role-based

// Needed check  
hasPermission('heritage_sites.create', { palika_id: 'xyz' })  // ✗ Scope-based
```

A `palika_admin` shouldn't create sites in other Palikas.

### 2. Database RLS Policies

Supabase should enforce even if service layer is bypassed:

```sql
-- Example RLS policy for heritage_sites
CREATE POLICY "palika_admin_own_palika" ON heritage_sites
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_profiles 
    WHERE role = 'super_admin'
    OR (role = 'palika_admin' AND palika_id = heritage_sites.palika_id)
  )
);
```

### 3. Audit Logging

Who did what, when?

```typescript
interface AuditLog {
  user_id: string
  action: 'create' | 'update' | 'delete' | 'publish'
  entity_type: 'heritage_site' | 'event' | 'blog_post'
  entity_id: string
  timestamp: Date
  changes?: Record<string, any>
}
```

## RBAC Implementation Checklist

### Already Done ✓
- [x] Role definitions (super_admin, palika_admin, moderator, support)
- [x] Permission constants (ROLE_PERMISSIONS)
- [x] Permission check methods (hasPermission, hasAnyPermission)
- [x] Session management

### To Do (Database Layer)
- [ ] RLS policy: super_admin can access all
- [ ] RLS policy: palika_admin limited to own Palika
- [ ] RLS policy: moderator limited to own Palika
- [ ] RLS policy: support read-only

### To Do (Service Layer)
- [ ] Add palika_id to permission checks
- [ ] Validate palika_id on create/update operations
- [ ] Add audit logging

### To Do (UI Layer)
- [ ] Conditional rendering based on permissions
- [ ] Disable/hide unavailable actions
- [ ] Clear error messages for denied operations

## Immediate Fix Needed

~~Your failing tests include:~~

```
should check specific permissions for moderator
expected false to be true
```

**✅ FIXED 2026-01-05**

The issue was in `mapAdminUser()` - empty array `[]` was truthy, so role permissions never loaded:

```typescript
// Before (broken)
permissions: data.permissions || this.getRolePermissions(data.role)

// After (fixed)
permissions: data.permissions?.length ? data.permissions : this.getRolePermissions(data.role)
```

All 98 tests now passing.

## Security Best Practice

```
                    ┌─────────────┐
                    │  Request    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Auth Check  │ Is user authenticated?
                    └──────┬──────┘
                           │ Yes
                    ┌──────▼──────┐
                    │ Role Check  │ Does role have permission?
                    └──────┬──────┘
                           │ Yes
                    ┌──────▼──────┐
                    │ Scope Check │ Is entity in user's scope?
                    └──────┬──────┘
                           │ Yes
                    ┌──────▼──────┐
                    │ RLS Policy  │ Database double-check
                    └──────┬──────┘
                           │ Pass
                    ┌──────▼──────┐
                    │   Execute   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Audit Log   │ Record the action
                    └─────────────┘
```

## Questions to Resolve

1. **Provincial coordinators?**
   - New role needed?
   - Access to multiple Palikas within province?

2. **Content ownership?**
   - Who can edit content created by others?
   - Approval workflow for moderator content?

3. **API key access?**
   - For MCP server / external integrations
   - Separate permission model?

---

## Next Actions

1. ~~**Immediate:** Fix `ROLE_PERMISSIONS` for moderator (failing tests)~~ ✅ Done
2. **This week:** Implement Supabase RLS policies for palika scope
3. **This week:** Add palika_id scope check to hasPermission()
4. **Later:** Add audit logging table and triggers
5. **Decision needed:** Reconcile roles/permissions tables with auth.service.ts
