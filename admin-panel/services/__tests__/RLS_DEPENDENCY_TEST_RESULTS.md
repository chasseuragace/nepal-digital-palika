# RLS Admin Regions Dependency - Test Results

## Test Purpose
Verify that RLS policies depend on `admin_regions` table exclusively, NOT on `admin_users.palika_id`, `admin_users.district_id`, or `admin_users.province_id` shortcuts.

## Test File
`rls-admin-regions-dependency.property.test.ts`

---

## 🔴 CRITICAL FINDING: Bug Confirmed!

### Test: "should revoke access when admin_regions entry is deleted"

```
✅ STEP 1: Created admin with admin_regions entry
   - admin_id: 9aeaa549-b468-49ed-a405-c3253371ba10
   - region_type: 'palika'
   - region_id: 1

✅ STEP 2: Created draft site (requires RLS access)
   - site_id: 34a718dc-3152-450e-a398-f3d602722cea
   - status: 'draft' (not public)

✅ STEP 3: BEFORE deletion - admin CAN see draft site
   "Before admin_regions deletion - admin sees site: true"

✅ STEP 4: Deleted admin_regions entry
   "Deleted admin_regions entry"

❌ STEP 5: AFTER deletion - admin STILL SEES draft site!
   "After admin_regions deletion - admin sees site: true"
   Expected: null (NO access)
   Got: { Object (id) } (HAS access)
```

### Test: "should verify admin_users.palika_id is not used for access control"

```
Admin state BEFORE deletion:
  - admin_users.palika_id = 1 (still exists)
  - admin_regions entry = EXISTS

Action: Delete admin_regions entry

Admin state AFTER deletion:
  - admin_users.palika_id = 1 (STILL EXISTS!)
  - admin_regions entry = DELETED

Expected behavior: Admin CANNOT see site (depends on admin_regions)
Actual behavior: Admin CAN see site (depends on admin_users.palika_id)

Conclusion: ❌ RLS is still checking admin_users.palika_id!
```

---

## 🔍 Root Cause Analysis

### Where the Bug Is

**File:** `supabase/migrations/20250301000020_fix_rls_function_volatility.sql`

**Function:** `user_has_access_to_palika()`

**Current Code (BROKEN):**
```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.palika_id = palika_id_param          ← ❌ BUG #1: SHORTCUT
      OR (ar.region_type = 'palika' AND ar.region_id = palika_id_param)
      OR (
        ar.region_type = 'district' AND
        EXISTS (
          SELECT 1 FROM public.palikas p
          WHERE p.id = palika_id_param
          AND p.district_id = ar.region_id
        )
      )
      OR (
        ar.region_type = 'province' AND
        EXISTS (
          SELECT 1 FROM public.palikas p
          JOIN public.districts d ON p.district_id = d.id
          WHERE p.id = palika_id_param
          AND d.province_id = ar.region_id
        )
      )
    )
  );
END;
```

**The Problem:**
- Line: `OR au.palika_id = palika_id_param`
- Even if `admin_regions` entry is deleted, this line allows access!
- When `admin_regions` doesn't exist, the LEFT JOIN returns NULL
- But the `OR au.palika_id = palika_id_param` still evaluates to TRUE

### Similar Issues

Same bug exists in:
1. `user_has_access_to_district()` - Line `OR au.district_id = district_id_param`
2. `user_has_access_to_province()` - Line `OR au.province_id = province_id_param`

---

## 🔧 The Fix

### Migration: `20250306000037_fix_user_access_functions_admin_regions_only.sql`

**Changes:**
1. Remove `OR au.palika_id = palika_id_param` shortcut
2. Remove `OR au.district_id = district_id_param` shortcut
3. Remove `OR au.province_id = province_id_param` shortcut
4. Now ONLY checks `admin_regions` table

**Fixed Code:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      -- ❌ REMOVED: OR au.palika_id = palika_id_param
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'palika'
        AND ar.region_id = palika_id_param
      )
      -- ... rest of hierarchical checks using admin_regions only
    )
  );
END;
```

---

## ✅ Expected Test Results After Fix

### Test: "should revoke access when admin_regions entry is deleted"

```
✅ STEP 1: Created admin with admin_regions entry
✅ STEP 2: Created draft site
✅ STEP 3: BEFORE deletion - admin CAN see site
✅ STEP 4: Deleted admin_regions entry
✅ STEP 5: AFTER deletion - admin CANNOT see site
   Expected: null
   Got: null
   RESULT: PASS ✅
```

---

## 📊 Impact Assessment

### Security Impact: CRITICAL 🔴

**Without Fix:**
- Terminating admin doesn't revoke access immediately
- Admin can still access all resources they had before
- Violates least privilege principle
- Multi-tenant isolation is broken

**Scenario:**
```
1. Palika admin is fired
2. HR/Super admin deletes admin_regions entry
3. Expected: Admin loses access
4. Actual (bug): Admin STILL has access via admin_users.palika_id!
5. Result: Unauthorized access, data breach
```

**Compliance:** GDPR, SOX, audit trail violations

### Affected RLS Policies

These policies use `user_has_access_to_palika()`:
1. heritage_sites_admin_read/insert/update/delete
2. events_admin_read/insert/update/delete
3. blog_posts_admin_read/insert/update/delete
4. businesses_admin_read/insert/update/delete
5. sos_requests_admin_read/insert/update/delete
6. admin_users_managed_read

**Total: 20+ RLS policies affected**

---

## 🧪 Test Verification Checklist

### Before Applying Migration

- [x] Test confirms bug exists
- [x] Test shows admin CAN see site after admin_regions deleted (bug)
- [x] admin_users.palika_id still exists after deletion
- [x] But admin_regions is deleted
- [x] RLS is checking admin_users.palika_id, not admin_regions

### After Applying Migration

Run test again to verify fix:
```bash
npm test -- rls-admin-regions-dependency.property.test.ts
```

Expected results:
- [ ] "should revoke access when admin_regions entry is deleted" - ✅ PASS
- [ ] "should verify admin_users.palika_id is not used for access control" - ✅ PASS
- [ ] "should revoke access when admin_regions is deleted" (district) - ✅ PASS
- [ ] All 4 tests pass

---

## 🚀 Implementation Steps

1. **Backup current database** (optional but recommended)

2. **Apply migration:**
   ```bash
   supabase migration up 20250306000037
   ```

3. **Verify fix with test:**
   ```bash
   npm test -- rls-admin-regions-dependency.property.test.ts
   ```

4. **Run full test suite to check for regressions:**
   ```bash
   npm test
   ```

5. **Verify no regressions in other RLS tests:**
   - heritage-sites-rls-enforcement ✅
   - businesses-rls-enforcement ✅
   - events-rls-enforcement ✅
   - All admin tests ✅

---

## 📋 Summary

| Item | Finding |
|------|---------|
| **Bug Type** | RLS access function uses shortcut that bypasses admin_regions |
| **Severity** | CRITICAL - Security vulnerability |
| **Affected Functions** | 3 (user_has_access_to_palika, user_has_access_to_district, user_has_access_to_province) |
| **Affected Policies** | 20+ RLS policies |
| **Test Result** | ❌ CONFIRMED - Admin retains access after admin_regions deleted |
| **Fix Available** | ✅ Migration 20250306000037 |
| **Impact** | 100% - All admin access control broken without this fix |

---

## 🔐 Security Declaration

**This bug is critical and must be fixed before production deployment.**

Any system without this fix has a serious security vulnerability where:
- Access revocation doesn't work
- Admin termination doesn't prevent access
- Multi-tenant isolation is compromised
- Compliance requirements (GDPR, SOX) are violated

**Recommended:** Apply migration immediately after testing.
