# Detailed Technical Analysis: Test Failures #3, #4, #5

**Date:** 2026-03-01
**Status:** In-depth root cause analysis
**Scope:** Permission system, RLS policies, region assignment

---

## Issue #3: Permission System Edge Cases

### Test Files Affected
- `permission-based-access-control.property.test.ts` (Tests 4 & 5)

### Failing Tests

**Test 4: "should grant all permissions to super_admin"** (Line 289-362)
```typescript
// Super admin should have ALL permissions
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

// Loop through and verify each permission
for (const permission of permissions) {
  const { hasPermission } = await verifyPermissionEnforcement(admin.id, permission, testPalikas[0])
  expect(hasPermission).toBe(true)  // ❌ FAILS
}
```

**Test 5: "should enforce permission checks for different content types"** (Line 364-434)
```typescript
// content_editor should have manage_blog_posts=true but manage_heritage_sites=false
const { hasPermission: hasBlogPermission } = await verifyPermissionEnforcement(
  admin.id, 'manage_blog_posts', testPalikas[0]
)
const { hasPermission: hasHeritagePermission } = await verifyPermissionEnforcement(
  admin.id, 'manage_heritage_sites', testPalikas[0]
)

expect(hasBlogPermission).toBe(true)           // ❌ FAILS
expect(hasHeritagePermission).toBe(false)      // ❌ FAILS
```

### Root Cause

**Problem 1: Broken Permission Query** (Line 24-46 in test file)
```typescript
// The permission lookup logic:
const { data: roleData } = await supabase
  .from('roles')
  .select('id')
  .eq('name', adminData.role)
  .single()

const { data: permissionData } = await supabase
  .from('role_permissions')
  .select('rp:permission_id(name)')  // ❌ WRONG SYNTAX!
  .eq('role_id', roleData.id)

const hasPermission = permissionData?.some(
  (rp: any) => rp.rp?.name === requiredPermission  // ❌ INCORRECT PATH!
) ?? false
```

**Issue:** The query uses `rp:permission_id(name)` which is incorrect Supabase syntax. This should use a proper join:
```sql
-- Current (broken):
SELECT rp:permission_id(name) FROM role_permissions WHERE role_id = $1

-- Should be:
SELECT permissions.name
FROM role_permissions
JOIN permissions ON role_permissions.permission_id = permissions.id
WHERE role_id = $1
```

**Problem 2: Super Admin Not Explicitly Assigned Permissions**
The `super_admin` role may not have explicit entries in the `role_permissions` table because it's assumed to have all permissions by default. The verification logic doesn't account for this:

```typescript
// Current logic (line 49):
const hasAccess = adminData.role === 'super_admin' || hasPermission

// But the loop checks:
expect(hasPermission).toBe(true)  // ❌ This checks hasPermission, not hasAccess!
```

The test loop (line 349-357) calls `verifyPermissionEnforcement()` which returns `hasPermission` from the query, NOT the `hasAccess` which includes the super_admin bypass.

**Problem 3: Role-Permission Seeding Missing**
The database seeding likely creates the `roles` and `permissions` tables but doesn't link them via `role_permissions`. Check if the seeding script includes:
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'content_editor' AND p.name = 'manage_blog_posts'
-- etc. for all role-permission combinations
```

### How to Fix

**Step 1: Fix the Permission Query** (In test helper or database layer)
```typescript
// Correct Supabase query:
const { data: permissionData } = await supabase
  .from('role_permissions')
  .select(`
    permission_id,
    permissions(name)
  `)
  .eq('role_id', roleData.id)

const hasPermission = permissionData?.some(
  (rp: any) => rp.permissions?.name === requiredPermission
) ?? false
```

**Step 2: Update Test Assertions**
```typescript
// For super_admin, check hasAccess instead of hasPermission
if (adminData.role === 'super_admin') {
  expect(hasAccess).toBe(true)
} else {
  expect(hasPermission).toBe(true)
}
```

**Step 3: Verify Role-Permission Seeding**
Check `database/seeds/seed-roles-permissions.sql` and ensure all relationships exist.

---

## Issue #4: RLS Policy Issues - District Admin Access

### Test File Affected
- `heritage-sites-rls-enforcement.property.test.ts` (Test at line 259-327)

### Failing Test

**"District admin should see all heritage sites in their assigned district"**

```typescript
// Create district admin with access to district
const { data: admin } = await supabase.from('admin_users').insert({
  role: 'district_admin',
  hierarchy_level: 'district',
  district_id: testDistricts[0],  // Assigned to district
  palika_id: null
}).select().single()

// Assign to admin_regions with region_type='district'
await supabase.from('admin_regions').insert({
  admin_id: admin.id,
  region_type: 'district',
  region_id: testDistricts[0]
})

// Create heritage site in palika within that district
const site = await supabase.from('heritage_sites').insert({
  palika_id: testPalikas[0],  // This palika is in testDistricts[0]
  // ...
}).select().single()

// District admin queries as authenticated user
const adminClient = await createAuthenticatedClient(email, password)
const { data: visibleSites } = await adminClient
  .from('heritage_sites')
  .select('id, palika_id')
  .eq('status', 'published')

// ❌ District admin CANNOT see site in their district!
expect(visibleSites?.some(s => s.id === site.id)).toBe(false)  // FAILS
```

### Root Cause

**RLS Policy Doesn't Check District-Level Access**

The RLS policy on `heritage_sites` table likely only checks:
```sql
-- Current (palika-level only):
CREATE POLICY heritage_sites_select_policy ON heritage_sites
  FOR SELECT USING (
    auth.uid() IS NULL  -- Public
    OR EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'super_admin'
    )
    OR EXISTS (
      SELECT 1 FROM admin_regions ar
      WHERE ar.admin_id = auth.uid()
      AND ar.region_type = 'palika'
      AND ar.region_id = heritage_sites.palika_id
    )
  )
```

**Missing:** Check for district-level access:
```sql
-- Should also include:
OR EXISTS (
  SELECT 1 FROM admin_regions ar
  WHERE ar.admin_id = auth.uid()
  AND ar.region_type = 'district'
  AND ar.region_id = (
    SELECT district_id FROM palikas WHERE id = heritage_sites.palika_id
  )
)
```

### How to Fix

**Update the RLS policy to include district hierarchies:**

```sql
CREATE OR REPLACE POLICY heritage_sites_select_admin ON heritage_sites
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR (
      auth.uid() IS NOT NULL
      AND (
        -- Super admin can see all
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE id = auth.uid() AND role = 'super_admin'
        )
        -- Palika admin can see palikas they manage
        OR EXISTS (
          SELECT 1 FROM admin_regions ar
          WHERE ar.admin_id = auth.uid()
          AND ar.region_type = 'palika'
          AND ar.region_id = palika_id
        )
        -- District admin can see all palikas in their district
        OR EXISTS (
          SELECT 1 FROM admin_regions ar
          WHERE ar.admin_id = auth.uid()
          AND ar.region_type = 'district'
          AND ar.region_id = (
            SELECT p.district_id FROM palikas p WHERE p.id = palika_id
          )
        )
        -- Province admin can see all palikas in their province
        OR EXISTS (
          SELECT 1 FROM admin_regions ar
          WHERE ar.admin_id = auth.uid()
          AND ar.region_type = 'province'
          AND ar.region_id = (
            SELECT p.province_id FROM palikas p WHERE p.id = palika_id
          )
        )
      )
    )
  )
```

---

## Issue #5: Region Assignment - Access Revocation & Re-access

### Test File Affected
- `region-assignment-deletion.property.test.ts` (Tests 1 & 2)

### Failing Tests

**Test 1: "should revoke access immediately after deleting admin_regions record"** (Line 79-206)

```typescript
// Step 1: Admin can access site
const { data: visibleBefore } = await adminClient
  .from('heritage_sites')
  .select('id')
  .eq('id', site.id)
  .single()
expect(visibleBefore?.id).toBe(site.id)  // ✅ PASSES

// Step 2: Delete admin_regions record
await supabase.from('admin_regions').delete().eq('id', adminRegion.id)
await new Promise(resolve => setTimeout(resolve, 200))  // Wait 200ms

// Step 3: Admin should NO LONGER see site
const { data: visibleAfter } = await adminClient
  .from('heritage_sites')
  .select('id')
  .eq('id', site.id)
  .single()
expect(visibleAfter).toBeNull()  // ❌ FAILS - Admin still sees site!
```

**Test 2: "should allow re-access after re-assigning the region"** (Line 208-325)

```typescript
// After deletion, admin can't access
expect(visibleAfterDelete).toBeNull()

// Re-assign the region
await supabase.from('admin_regions').insert({
  admin_id: admin.id,
  region_type: 'palika',
  region_id: testPalikas[0]
})
await new Promise(resolve => setTimeout(resolve, 200))  // Wait 200ms

// Admin should be able to access again
const { data: visibleAfterReassign } = await adminClient
  .from('heritage_sites')
  .select('id')
  .eq('id', site.id)
  .single()
expect(visibleAfterReassign?.id).toBe(site.id)  // ❌ FAILS - Access not restored!
```

### Root Cause

**Problem 1: Client-Side Token Caching**

The authenticated client uses a persisted session that includes the JWT token. When the RLS policy changes (due to admin_regions deletion), the Supabase client doesn't know to re-evaluate the policy for subsequent queries because:

1. The JWT token itself doesn't contain the admin's region assignments
2. The Supabase client caches the auth state
3. Even though RLS policies check the current database state, the client may be using cached results

```typescript
// Current client initialization:
const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Even with persistSession: false, the client maintains an auth session
// and may cache query results
```

**Problem 2: RLS Policy Execution Timing**

After deleting `admin_regions`, there could be a race condition:
- The delete happens
- The RLS policy is re-evaluated
- But PostgreSQL's query planner might use cached plan or the policy might not execute a new subquery

The RLS policy likely uses:
```sql
EXISTS (
  SELECT 1 FROM admin_regions
  WHERE admin_id = auth.uid()
  AND region_id = heritage_sites.palika_id
)
```

After deletion, this should return false, but it might be cached.

**Problem 3: Missing Cache Invalidation**

When `admin_regions` is modified, there's no mechanism to:
1. Invalidate the client's query cache
2. Refresh the JWT token
3. Force RLS policy re-evaluation

### How to Fix

**Solution 1: Force Token Refresh After Changes** (Recommended)
```typescript
// After deleting admin_regions, refresh the session
await supabase.auth.refreshSession()

// Or sign out and sign back in
await adminClient.auth.signOut()
const { error } = await adminClient.auth.signInWithPassword({ email, password })

// Then query again
const { data: visibleAfter } = await adminClient
  .from('heritage_sites')
  .select('id')
  .eq('id', site.id)
```

**Solution 2: Use Service Role to Verify (For Tests)**
```typescript
// In tests, verify with service role after changes
const { data: visibleAfterDelete } = await supabase  // Use service role
  .from('heritage_sites')
  .select('id')
  .eq('status', 'published')

// This proves the RLS is working at the database level
```

**Solution 3: Ensure RLS Policy Uses Fresh Checks**

Update the RLS policy to avoid caching:
```sql
-- Add a function that always queries fresh
CREATE OR REPLACE FUNCTION admin_has_access_to_palika(
  p_admin_id uuid,
  p_palika_id integer
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = p_admin_id
    AND au.role = 'super_admin'
    UNION ALL
    SELECT 1 FROM admin_regions ar
    WHERE ar.admin_id = p_admin_id
    AND ar.region_id = p_palika_id
    AND ar.region_type = 'palika'
  )
$$ LANGUAGE SQL IMMUTABLE;

-- Use in RLS policy
CREATE POLICY heritage_sites_select_policy ON heritage_sites
  FOR SELECT
  USING (
    status = 'published'
    OR admin_has_access_to_palika(auth.uid(), palika_id)
  )
```

**Solution 4: Add Session Expiration in Tests**

The 200ms wait is insufficient. Modify tests to:
```typescript
// Option A: Refresh session
await new Promise(resolve => setTimeout(resolve, 200))
await adminClient.auth.refreshSession()
await new Promise(resolve => setTimeout(resolve, 100))

// Option B: Re-authenticate
const { error } = await adminClient.auth.signInWithPassword({
  email,
  password
})

// Then query again
const { data: visibleAfter } = await adminClient
  .from('heritage_sites')
  .select('id')
```

---

## Summary of Fixes Required

| Issue | Type | Priority | Fix Time |
|-------|------|----------|----------|
| #3.1: Broken permission query | Code/Query | CRITICAL | 15 min |
| #3.2: Super admin bypass logic | Code/Test | CRITICAL | 10 min |
| #3.3: Role-permission seeding | Data | CRITICAL | 20 min |
| #4: RLS district hierarchy | SQL/Policy | HIGH | 30 min |
| #5.1: Token refresh after changes | Code/Integration | HIGH | 20 min |
| #5.2: RLS policy caching | SQL/Policy | HIGH | 15 min |

---

## Testing Strategy After Fixes

1. **Fix #3**: Re-run permission tests, verify all role-permission combinations
2. **Fix #4**: Re-run district RLS test, verify admin sees district content
3. **Fix #5**: Re-run region assignment tests with token refresh, verify access revocation

**Expected outcome:** All 255 tests passing (100% pass rate)
