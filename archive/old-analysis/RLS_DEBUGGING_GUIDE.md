# RLS Debugging Guide

## Problem Summary
RLS SELECT enforcement tests are failing. Palika admins can see data from palikas they don't have access to.

**Failing Pattern:**
- Super admin can see all data ✅
- District admin can see all data in their district ✅
- Palika admin can see data from OTHER palikas ❌ (should not be able to)

## Root Cause Analysis

The issue is in the `user_has_access_to_palika()` function. It's not properly filtering SELECT queries based on the `admin_regions` table.

### Current RLS Policy Logic
```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.palika_id = palika_id_param
      OR (ar.region_type = 'palika' AND ar.region_id = palika_id_param)
      OR (ar.region_type = 'district' AND ...)
      OR (ar.region_type = 'province' AND ...)
    )
  );
END;
```

### Suspected Issues
1. **LEFT JOIN might be returning NULL rows** - If admin_regions is empty, LEFT JOIN returns NULL, and NULL comparisons fail
2. **OR logic might be too permissive** - Multiple OR conditions might allow unintended access
3. **palika_id column might be NULL** - If admin is created without palika_id, the check fails

## Debugging Steps

### Step 1: Test RLS Function Directly

Open Supabase SQL Editor and run:

```sql
-- Test 1: Check if function exists and works
SELECT user_has_access_to_palika(1);

-- Test 2: Check what admin_users looks like
SELECT id, role, hierarchy_level, palika_id, is_active 
FROM admin_users 
LIMIT 5;

-- Test 3: Check what admin_regions looks like
SELECT admin_id, region_type, region_id 
FROM admin_regions 
LIMIT 10;

-- Test 4: Test with specific admin
-- First, get a test admin ID
SELECT id FROM admin_users WHERE role = 'palika_admin' LIMIT 1;

-- Then test the function with that admin
-- (You'll need to set the auth.uid() context)
```

### Step 2: Test RLS Policy on Heritage Sites

```sql
-- Check the RLS policy on heritage_sites
SELECT * FROM pg_policies 
WHERE tablename = 'heritage_sites';

-- View the policy definition
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'heritage_sites' AND policyname LIKE '%SELECT%';
```

### Step 3: Simulate Admin Query

```sql
-- Set auth context (replace with actual admin ID)
SET request.jwt.claims = '{"sub":"<admin-id>"}';

-- Now query as that admin
SELECT id, name_en, palika_id 
FROM heritage_sites 
WHERE user_has_access_to_palika(palika_id);

-- Check how many rows are returned
-- Should only return sites from palikas the admin has access to
```

### Step 4: Debug the Function Logic

```sql
-- Create a debug version of the function to see what's happening
CREATE OR REPLACE FUNCTION public.debug_user_access(palika_id_param INT)
RETURNS TABLE(
  admin_id UUID,
  admin_role TEXT,
  admin_palika_id INT,
  has_region_access BOOLEAN,
  region_type TEXT,
  region_id INT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.role,
    au.palika_id,
    (ar.region_type = 'palika' AND ar.region_id = palika_id_param)::BOOLEAN,
    ar.region_type,
    ar.region_id
  FROM public.admin_users au
  LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
  WHERE au.id = auth.uid()
  AND au.is_active = true;
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Run the debug function
SELECT * FROM debug_user_access(1);
```

## Common Issues and Fixes

### Issue 1: NULL Values in LEFT JOIN
**Problem:** If admin has no admin_regions records, LEFT JOIN returns NULL, and NULL comparisons fail

**Fix:** Use COALESCE or handle NULL explicitly
```sql
AND (
  au.role = 'super_admin'
  OR au.palika_id = palika_id_param
  OR (ar.region_type IS NOT NULL AND ar.region_type = 'palika' AND ar.region_id = palika_id_param)
  ...
)
```

### Issue 2: Multiple admin_regions Records
**Problem:** If admin has multiple region assignments, LEFT JOIN returns multiple rows

**Fix:** Use EXISTS instead of LEFT JOIN
```sql
RETURN EXISTS (
  SELECT 1 FROM public.admin_users au
  WHERE au.id = auth.uid()
  AND au.is_active = true
  AND (
    au.role = 'super_admin'
    OR au.palika_id = palika_id_param
    OR EXISTS (
      SELECT 1 FROM public.admin_regions ar
      WHERE ar.admin_id = au.id
      AND ar.region_type = 'palika'
      AND ar.region_id = palika_id_param
    )
    ...
  )
);
```

### Issue 3: RLS Policy Not Using Function
**Problem:** RLS policy might not be calling the function correctly

**Fix:** Check the RLS policy definition
```sql
-- Should look like:
CREATE POLICY "Admins can see heritage sites in their palikas"
  ON heritage_sites
  FOR SELECT
  USING (user_has_access_to_palika(palika_id));
```

## Testing Checklist

- [ ] Function returns TRUE for super_admin
- [ ] Function returns TRUE for admin with matching palika_id
- [ ] Function returns TRUE for admin with matching admin_regions record
- [ ] Function returns FALSE for admin without access
- [ ] Function handles NULL values correctly
- [ ] Function handles multiple admin_regions records
- [ ] RLS policy uses the function correctly
- [ ] SELECT queries are filtered by RLS policy

## Expected Behavior After Fix

```
Admin: palika_admin (palika_id = 1)
Region Assignments: admin_regions(palika_id=1)

Query: SELECT * FROM heritage_sites
Expected: Only sites with palika_id = 1
Actual: All sites (BUG)

After Fix: Only sites with palika_id = 1 ✅
```

## Files to Check

1. **RLS Policy Definition**
   - File: `supabase/migrations/20250126000005_update_rls_policies_hierarchical.sql`
   - Function: `user_has_access_to_palika()`
   - Policy: `heritage_sites` SELECT policy

2. **Test Files**
   - `admin-panel/services/__tests__/properties/heritage-sites-rls-enforcement.property.test.ts`
   - `admin-panel/services/__tests__/properties/blog-posts-rls-enforcement.property.test.ts`
   - etc.

## Next Steps

1. Run the debugging SQL queries above
2. Identify which part of the logic is failing
3. Fix the RLS function or policy
4. Re-run tests to verify fix
5. Check other content tables (events, businesses, etc.)

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Testing RLS Policies](https://supabase.com/docs/guides/auth/row-level-security#testing-policies)
