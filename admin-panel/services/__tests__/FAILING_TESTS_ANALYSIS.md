# Analysis of 3 Failing Tests (465/468 = 99.4%)

## Executive Summary

| Test | File | Status | Issue Type | Impact |
|------|------|--------|-----------|--------|
| Test 1 | region-assignment-deletion | ❌ FAILING | RLS Logic Flaw | **HIGH** |
| Test 2 | region-assignment-deletion | ❌ FAILING | RLS Logic Flaw | **HIGH** |
| Test 3 | update-state-capture | ❌ FAILING | Audit Mechanism | **MEDIUM** |

---

# Test 1: Region Assignment Deletion - Part 1

**File:** `region-assignment-deletion.property.test.ts` (Line 79-225)
**Test Name:** "should revoke access immediately after deleting admin_regions record"
**Requirement:** 1.7 (Region assignment deletion revokes access)

## What The Test Does

```
1. Create a DRAFT heritage site in palika A
   ├─ Status: 'draft' (not published)
   └─ Only accessible via admin_read RLS policy

2. Create admin with access to palika A
   ├─ Step 1: Auth user created
   ├─ Step 2: admin_users record created
   └─ Step 3: admin_regions entry created

3. Verify admin CAN see the draft site ✅

4. DELETE the admin_regions record
   ├─ Removes the admin's region assignment
   └─ Triggers: admin_regions audit log entry

5. Expect admin CANNOT see the draft site anymore ❌
   └─ FAILS: Admin can still see the site!

6. Verify audit log recorded the deletion
```

## Why It's Failing

**Current Behavior:**
```
After deleting admin_regions:
- Admin queries heritage_sites with eq('id', site.id)
- Query returns: { Object (id) } ← Site IS visible
- Test expects: null ← Site should NOT be visible
- Result: AssertionError at line 199
```

**Root Cause Analysis:**

The admin can still see the draft site even after losing region access. This suggests:

### Hypothesis 1: Auth Session Caching
```typescript
// After deleting admin_regions, we refresh session:
await adminClient.auth.refreshSession()
await new Promise(resolve => setTimeout(resolve, 100))

// But Supabase RLS might cache permissions
// The session refresh might not invalidate RLS cache
```

### Hypothesis 2: Admin Still Has Permission
```sql
-- RLS Policy for heritage_sites (admin_read):
CREATE POLICY heritage_sites_admin_read ON heritage_sites FOR SELECT
USING (
  get_user_role() = 'super_admin' OR (
    user_has_access_to_palika(palika_id) AND
    user_has_permission('manage_heritage_sites')
  )
)

-- Even if admin_regions is deleted, the admin might still be in admin_users
-- with role='palika_admin' which grants permissions
-- The RLS policy might not be calling user_has_access_to_palika correctly
```

### Hypothesis 3: RLS Policy Not Checking admin_regions
```sql
-- Is user_has_access_to_palika() actually checking admin_regions?
-- Or is it falling back to admin_users.palika_id?

-- If it checks admin_users.palika_id directly:
WHERE admin_users.palika_id = heritage_sites.palika_id
-- Then deleting admin_regions won't revoke access!
```

## Why This Matters (Impact: HIGH 🔴)

### Security Issue
This is a **critical access control bug** if true:
- Admins whose region assignment is deleted can still access content
- Violates: Least privilege principle
- Scenario: HR deletes palika_admin's assignment but they retain access
- Risk: Unauthorized data access, compliance violation

### Business Impact
```
Scenario: Palika admin is fired
Action:   Delete their admin_regions entry
Expected: They lose all access immediately
Actual:   They can still see everything (if test is right)
Result:   Data breach, compliance failure
```

### Requirement 1.7
```
"For any admin with an admin_regions record, deleting that record
should immediately revoke the admin's access to that region"

Status: MAYBE BROKEN ❌
```

## Investigation Steps Needed

1. **Check user_has_access_to_palika() function**
   - What table does it query? admin_regions or admin_users?
   - Is it still using the old palika_id shortcut?

2. **Test RLS policy directly**
   ```sql
   SELECT * FROM heritage_sites
   WHERE <admin_id> has access to <palika_id>
   -- Before/after deleting admin_regions
   ```

3. **Check if it's a timing issue**
   - RLS policies are typically evaluated instantly
   - But there might be query caching
   - Or JWT token caching at the Supabase level

---

# Test 2: Region Assignment Deletion - Part 2

**File:** `region-assignment-deletion.property.test.ts` (Line 227-358)
**Test Name:** "should allow re-access after re-assigning the region"
**Related to:** Requirement 1.7

## What The Test Does

```
1. Create draft heritage site in palika A ✅

2. Create admin with access to palika A ✅
   └─ admin_regions entry created

3. Verify admin CAN see the site ✅

4. DELETE admin_regions entry ❌
   └─ (Same issue as Test 1)

5. Verify admin CANNOT see the site
   └─ FAILS: Admin can still see it!

6. RE-CREATE admin_regions entry
   └─ Add admin back to palika A

7. Verify admin CAN see the site again ✅
```

## Why It's Failing

Same root cause as Test 1 - admin can still see site after deletion.

The test fails at step 5 (line 333: `expect(visibleAfterDelete).toBeNull()`), so it never reaches the re-assignment test.

## Why This Matters (Impact: HIGH 🔴)

### Tests Access Control Lifecycle
```
This tests the full admin assignment lifecycle:
  Assign → Access ✅ → Revoke → No Access ❌ → Re-assign → Access ✅
                                 ^^^^^^^^^^^^
                                 This part broken
```

### Verifies Immediate Effect
```
"immediately revoke" means:
- Not after a scheduled job
- Not after a cache timeout
- Not on next login
- RIGHT NOW when admin_regions is deleted

If the test is right, this is broken.
```

### Two-Phase Access Control
Tests verify that both phases work:
1. **Negative enforcement**: Removing access must work
2. **Positive enforcement**: Adding access back must work

If negative fails, positive testing becomes unreliable.

---

# Test 3: Update State Capture - Admin Regions Audit

**File:** `update-state-capture.property.test.ts` (Line 369-458)
**Test Name:** "should capture state for admin_regions UPDATE operations"
**Requirement:** 4.7 (UPDATE operations capture before/after state)

## What The Test Does

```
1. Create super_admin user ✅

2. Create a published heritage site as super_admin ✅

3. Query audit_log for the INSERT entry ✅
   └─ Should find audit log entry

4. Verify audit log captured:
   ├─ admin_id (WHO did it)
   ├─ changes.name_en (WHAT was created)
   └─ Other site fields ✅

5. Verify audit mechanism works ✅

Expected: All assertions pass
Actual:   Line 450 fails ❌
```

## The Failure

```typescript
// Line 450:
expect(auditLogs!.length).toBeGreaterThan(0)
// AssertionError: expected 0 to be greater than 0
// => auditLogs is empty!
```

**What this means:**
- Audit log INSERT entry was NOT captured
- Query returned 0 rows
- The audit trigger either:
  - Didn't fire
  - Has RLS blocking the query
  - Has a bug in the trigger

## Why This Matters (Impact: MEDIUM 🟡)

### Audit Trail Integrity
```
Audit logs are critical for:
- Compliance (GDPR, SOX, etc.)
- Forensics (Who did what, when?)
- Admin accountability
- Debugging production issues

If audit logs are missing:
→ Can't investigate security incidents
→ Compliance audit failures
→ No accountability trail
```

### Specifically for Admin Operations
```
The test specifically checks:
- super_admin creates a heritage_site
- Was this action logged?
- Can we prove who created it?

If admin operations aren't logged:
→ Super admins have no accountability
→ Can't track unauthorized access/changes
```

### Test Design Issue

The test comment (line 370-371) says:
```typescript
// Note: This test verifies that audit logs capture state for admin operations.
// We test with heritage_sites since admin_regions has RLS policy recursion issues
// when accessed through authenticated clients.
```

This suggests:
- The actual target is admin_regions audit
- But test uses heritage_sites as a proxy
- Why? **RLS policy recursion issues on admin_regions**

This is a red flag: Why are there recursion issues with admin_regions RLS?

---

## Comparison: Why These 3 Matter Differently

### Test 1 & 2: Access Control is Broken
```
Impact: HIGH - Potential security breach
Severity: Critical
If True: Admins can't be locked out of palikas
Timeline: Needs immediate investigation
```

### Test 3: Audit Mechanism Broken
```
Impact: MEDIUM - Compliance/Accountability issue
Severity: Important
If True: No audit trail for critical operations
Timeline: Needs investigation but not immediate security issue
```

---

## Recommended Actions

### Priority 1 (Critical)
```
Fix Tests 1 & 2:
1. Run RLS policy debug function on user_has_access_to_palika()
2. Verify it queries admin_regions, not admin_users.palika_id
3. Test the RLS policy directly with psql
4. Check for query caching at Supabase level
```

### Priority 2 (Important)
```
Fix Test 3:
1. Debug why audit_log is empty for the INSERT
2. Check if audit trigger is firing
3. Check if RLS is blocking audit_log queries
4. Investigate admin_regions RLS recursion issues
```

### Priority 3 (Preventive)
```
Improve Tests:
1. Add explicit logging of admin_regions state
2. Test RLS policies at database level, not just through client
3. Use admin_regions directly if RLS issue is fixed
4. Add timeout handling for RLS cache invalidation
```

---

## Summary Table

| Aspect | Test 1 & 2 | Test 3 |
|--------|-----------|--------|
| **What it tests** | Access revocation | Audit logging |
| **Failure mode** | Admin still sees site | Audit log is empty |
| **Root cause** | RLS policy issue | Audit trigger issue |
| **Security impact** | HIGH - Access control broken | MEDIUM - No accountability |
| **Business impact** | Can't fire admins | Compliance violation |
| **Fix complexity** | Medium | Medium |
| **Urgency** | Critical | Important |

---

## Next Steps

1. **Understand the failure:** These 3 tests reveal potential bugs in:
   - RLS access control validation
   - Audit mechanism for admin operations

2. **Investigate root causes:**
   - Is user_has_access_to_palika() broken?
   - Is audit trigger not firing?
   - Is there RLS caching preventing immediate revocation?

3. **Fix or verify:**
   - If bugs exist: Fix them
   - If test design is wrong: Fix tests to properly reflect requirements

4. **Document findings:**
   - What was the actual bug?
   - How was it fixed?
   - What's the correct behavior?

These tests are protecting critical functionality. The 0.6% failure rate suggests either:
- **Subtle bugs in core RLS logic**, or
- **Edge cases in test scenarios**

Either way, they deserve investigation before deploying to production.
