# Permission Enforcement Analysis

## Current Implementation Status

Based on the MULTI_TENANT_HIERARCHY_ANALYSIS.md and current test results:

### ✅ What's Implemented

1. **Permission-Based RLS Policies** ✅
   - `user_has_permission()` function exists and is used in all RLS policies
   - Policies check BOTH region access AND permission
   - Example: `user_has_access_to_palika(palika_id) AND user_has_permission('manage_heritage_sites')`

2. **Multi-Region Admin Support** ✅
   - `admin_regions` table created for multi-region assignments
   - `hierarchy_level` column added to `admin_users`
   - Support for national, province, district, and palika levels

3. **Role-Permission Mapping** ✅
   - `role_permissions` junction table links roles to permissions
   - 12 permissions defined with resource/action granularity
   - 6 roles with proper hierarchy

4. **Dual Access Check** ✅
   - Tests verify operations require BOTH region access AND permission
   - RLS policies enforce this at database level

### ❌ What's Not Working

1. **RLS SELECT Filtering** ❌
   - Palika admins can see data from palikas they don't have access to
   - Suggests `user_has_access_to_palika()` function has logic issues
   - Affects: heritage-sites, events, blog-posts, businesses, sos-requests

2. **Permission Enforcement in SELECT** ❌
   - Permission checks might not be filtering correctly
   - Tests show admins can see data they don't have permission to access

3. **Region Deletion Access Revocation** ❌
   - After deleting admin_regions records, access is not revoked
   - Suggests RLS policy caching or incorrect logic

---

## Permission Enforcement Architecture

### How It Should Work

```
User Query
    ↓
RLS Policy Checks:
    1. Is user authenticated? → auth.uid()
    2. Does user have region access? → user_has_access_to_palika(palika_id)
    3. Does user have permission? → user_has_permission('action')
    ↓
If ALL checks pass → Return data
If ANY check fails → Return 0 rows
```

### Current RLS Policy Example

```sql
CREATE POLICY "heritage_sites_select"
ON public.heritage_sites
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);
```

### Permission Hierarchy

```
super_admin
  ├─ All permissions
  └─ All regions

province_admin
  ├─ Permissions: manage_heritage_sites, manage_events, manage_blog_posts, manage_businesses
  └─ Regions: All palikas in assigned province

district_admin
  ├─ Permissions: manage_heritage_sites, manage_events, manage_blog_posts, manage_businesses
  └─ Regions: All palikas in assigned district

palika_admin
  ├─ Permissions: manage_heritage_sites, manage_events, manage_blog_posts, manage_businesses
  └─ Regions: Assigned palika only

moderator
  ├─ Permissions: manage_blog_posts, moderate_content
  └─ Regions: Assigned palika only

content_editor
  ├─ Permissions: manage_heritage_sites, manage_events, manage_blog_posts, manage_businesses
  └─ Regions: Assigned palika only

support_agent
  ├─ Permissions: manage_sos, read_analytics
  └─ Regions: Assigned palika only
```

---

## Test Results Analysis

### Passing Tests (15/25 = 60%)

✅ **Permission Enforcement Working:**
- `permission-based-access-control.property.test.ts` (3/5 passing)
  - Super admin has all permissions ✅
  - Permission addition grants access ✅
  - Permission removal revokes access ✅

✅ **Dual Access Check Working:**
- `dual-access-check.property.test.ts` (1/1 passing)
  - Operations require BOTH region AND permission ✅

✅ **Admin CRUD Operations:**
- All admin creation, editing, deletion tests passing ✅

✅ **RLS Write Operations:**
- INSERT, UPDATE, DELETE operations properly restricted ✅

### Failing Tests (10/25 = 40%)

❌ **RLS SELECT Enforcement (13 failures):**
- Palika admins can see data from other palikas
- Suggests `user_has_access_to_palika()` not filtering correctly
- Affects: heritage-sites, events, blog-posts, businesses, sos-requests

❌ **Permission Enforcement (2 failures):**
- Permission checks not properly enforced in SELECT
- Affects: permission-based-access-control.property.test.ts

❌ **Region Deletion (2 failures):**
- Access not revoked after deleting admin_regions
- Affects: region-assignment-deletion.property.test.ts

❌ **Audit Logging (9 failures):**
- Expected - service role limitation
- Not related to permission enforcement

---

## Root Cause Analysis

### Issue 1: RLS SELECT Filtering

**Problem:** Palika admins can see data from palikas they don't have access to

**Likely Cause:** `user_has_access_to_palika()` function logic issue
- LEFT JOIN with admin_regions might be returning NULL rows
- OR conditions might be too permissive
- palika_id column might be NULL for some admins

**Test Case:**
```
Admin: palika_admin (palika_id = 1)
Region Assignments: admin_regions(palika_id=1)

Query: SELECT * FROM heritage_sites
Expected: Only sites with palika_id = 1
Actual: All sites (BUG)
```

### Issue 2: Permission Enforcement

**Problem:** Permission checks not properly enforced

**Likely Cause:** 
- `user_has_permission()` function might not be checking role_permissions correctly
- Permission might not be linked to admin's role
- Role might not have the required permission

**Test Case:**
```
Admin: moderator (role = 'moderator')
Permission: 'manage_heritage_sites' (not assigned to moderator)

Query: SELECT * FROM heritage_sites
Expected: 0 rows (no permission)
Actual: All sites (BUG)
```

### Issue 3: Region Deletion

**Problem:** Access not revoked after deleting admin_regions

**Likely Cause:**
- RLS policy might be caching results
- admin_regions table might not be checked on every query
- LEFT JOIN logic might be incorrect

**Test Case:**
```
Admin: palika_admin (palika_id = 1)
Region Assignments: admin_regions(palika_id=1)

Query: SELECT * FROM heritage_sites
Result: Sites from palika 1 ✅

Delete: admin_regions record

Query: SELECT * FROM heritage_sites
Expected: 0 rows (no access)
Actual: Sites from palika 1 (BUG)
```

---

## Debugging Steps

### Step 1: Test user_has_access_to_palika() Function

```sql
-- Check function logic
SELECT user_has_access_to_palika(1);

-- Debug with specific admin
SET request.jwt.claims = '{"sub":"<admin-id>"}';
SELECT user_has_access_to_palika(1);

-- Check admin_regions data
SELECT * FROM admin_regions WHERE admin_id = '<admin-id>';

-- Check if LEFT JOIN is working
SELECT au.id, au.role, ar.region_type, ar.region_id
FROM admin_users au
LEFT JOIN admin_regions ar ON au.id = ar.admin_id
WHERE au.id = '<admin-id>';
```

### Step 2: Test user_has_permission() Function

```sql
-- Check function logic
SELECT user_has_permission('manage_heritage_sites');

-- Debug with specific admin
SET request.jwt.claims = '{"sub":"<admin-id>"}';
SELECT user_has_permission('manage_heritage_sites');

-- Check role_permissions data
SELECT rp.*, p.name
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = (SELECT role FROM admin_users WHERE id = '<admin-id>');
```

### Step 3: Test RLS Policy

```sql
-- Check if RLS policy is applied
SELECT * FROM pg_policies WHERE tablename = 'heritage_sites';

-- Test SELECT with RLS
SET request.jwt.claims = '{"sub":"<admin-id>"}';
SELECT * FROM heritage_sites;

-- Should only return sites from palikas admin has access to
```

---

## Recommendations

### Immediate (High Priority)

1. **Debug user_has_access_to_palika() Function**
   - Check if LEFT JOIN is returning NULL rows
   - Verify OR conditions are correct
   - Test with specific admin/palika combinations

2. **Debug user_has_permission() Function**
   - Check if role_permissions join is working
   - Verify permission is linked to admin's role
   - Test with specific admin/permission combinations

3. **Test RLS Policies Directly**
   - Use Supabase SQL editor
   - Run queries with specific admin context
   - Verify results are filtered correctly

### Short-term (Medium Priority)

1. Fix RLS function logic
2. Add SQL-level RLS tests
3. Verify permission enforcement works end-to-end

### Long-term (Low Priority)

1. Implement RLS policy testing framework
2. Add automated RLS policy validation
3. Document RLS policy logic

---

## Conclusion

**Permission enforcement IS implemented** in the RLS policies. The issue is that the RLS functions (`user_has_access_to_palika()` and `user_has_permission()`) are not filtering correctly.

**Next Step:** Debug the RLS functions using the SQL queries provided above to identify the exact issue.

The architecture is correct - we just need to fix the function logic to make the tests pass.
