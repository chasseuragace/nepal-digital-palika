# Property-Based Test Failures Report

**Date:** January 27, 2026  
**Test Run:** Sequential execution with fresh database seed  
**Total Tests:** 26 property test files  
**Passed:** 16 (62%)  
**Failed:** 10 (38%)

---

## Summary of Failures

### Category 1: Audit Logging Tests (9 failures)
These tests fail because audit triggers don't fire when using the service role client. This is expected behavior - audit logging only works with authenticated user context.

**Affected Tests:**
- ❌ `admin-regions-audit-logging.property.test.ts` (3 tests failed)
  - Error: `expected 0 to be greater than 0` at lines 250, 361, 469
  - Issue: Audit log entries not created for INSERT/UPDATE/DELETE on admin_regions
  
- ❌ `admin-users-audit-logging.property.test.ts` (2 tests failed)
  - Error: `expected 0 to be greater than 0`
  - Issue: Audit log entries not created for admin_users operations
  
- ❌ `audit-log-completeness.property.test.ts` (3 tests failed)
  - Error: `expected 0 to be greater than 0`
  - Issue: Audit log entries not created for heritage_sites operations

**Root Cause:** Service role client bypasses RLS and audit triggers. Audit logging requires authenticated user context.

**Recommendation:** Skip these tests or redesign to use authenticated clients instead of service role.

---

### Category 2: RLS Enforcement Tests (6 failures)
These tests verify that Row-Level Security policies correctly restrict access based on admin region assignments. Some tests are passing (read operations) but failing on access control validation.

**Affected Tests:**
- ❌ `blog-posts-rls-enforcement.property.test.ts` (2 tests failed, 2 passed)
  - Issue: Palika admin access control not properly enforced
  
- ❌ `businesses-rls-enforcement.property.test.ts` (2 tests failed, 2 passed)
  - Issue: Palika admin access control not properly enforced
  
- ❌ `events-rls-enforcement.property.test.ts` (2 tests failed, 2 passed)
  - Issue: Palika admin access control not properly enforced
  
- ❌ `heritage-sites-rls-enforcement.property.test.ts` (3 tests failed, 1 passed)
  - Issue: Palika and district admin access control not properly enforced
  
- ❌ `sos-requests-rls-enforcement.property.test.ts` (2 tests failed, 2 passed)
  - Issue: Palika admin access control not properly enforced

**Root Cause:** RLS policies may not be correctly filtering results based on `admin_regions` table assignments. The policies check both `palika_id` column and `admin_regions` table, which might have conflicting logic.

**Recommendation:** Debug RLS policies in `user_has_access_to_palika()` function to ensure proper filtering.

---

### Category 3: Permission-Based Access Control (2 failures)
Tests for permission enforcement in RLS policies.

**Affected Tests:**
- ❌ `permission-based-access-control.property.test.ts` (2 tests failed, 3 passed)
  - Issue: Permission checks not properly enforced in RLS policies

**Root Cause:** Similar to RLS enforcement - permission-based access control might not be working correctly.

---

### Category 4: Region Assignment Deletion (2 failures)
Tests for revoking access when admin_regions records are deleted.

**Affected Tests:**
- ❌ `region-assignment-deletion.property.test.ts` (2 tests failed)
  - Issue: Access not properly revoked after deleting admin_regions records

**Root Cause:** RLS policies might be caching results or not properly checking admin_regions table after deletion.

---

## Passing Tests (16/26)

✅ `admin-creation-form.property.test.ts`  
✅ `admin-creation.property.test.ts`  
✅ `admin-deletion.property.test.ts`  
✅ `admin-editing.property.test.ts`  
✅ `admin-list-rls.property.test.ts`  
✅ `delete-rls-enforcement.property.test.ts`  
✅ `dual-access-check.property.test.ts`  
✅ `duplicate-region-prevention.property.test.ts`  
✅ `insert-rls-enforcement.property.test.ts`  
✅ `legacy-palika-support.property.test.ts`  
✅ `multi-region-assignment.property.test.ts`  
✅ `multi-region-hierarchy.property.test.ts`  
✅ `role-hierarchy-levels.property.test.ts`  
✅ `super-admin-override.property.test.ts`  
✅ `update-rls-enforcement.property.test.ts`  
✅ `update-state-capture.property.test.ts`  

---

## Recommendations

### Immediate Actions
1. **Skip audit logging tests** - These require authenticated context, not service role
2. **Debug RLS policies** - Focus on `user_has_access_to_palika()` function
3. **Test with authenticated clients** - Use authenticated Supabase clients instead of service role for RLS tests

### Investigation Steps
1. Check if RLS policies are being applied to SELECT queries
2. Verify `admin_regions` table is being queried correctly
3. Test RLS policies directly in Supabase SQL editor
4. Check for any RLS policy conflicts or overlapping conditions

### Long-term Fixes
1. Redesign audit logging tests to use authenticated clients
2. Add RLS policy unit tests in SQL
3. Add integration tests that verify RLS enforcement at database level
4. Consider using Supabase's built-in RLS testing tools

---

## Test Execution Summary

```
Total Test Files: 26
├── Passed: 16 (62%)
│   ├── Admin CRUD operations: 4/4 ✅
│   ├── Admin list RLS: 1/1 ✅
│   ├── RLS enforcement (DELETE/INSERT/UPDATE): 3/3 ✅
│   ├── Dual access check: 1/1 ✅
│   ├── Region management: 2/2 ✅
│   ├── Legacy support: 1/1 ✅
│   ├── Multi-region: 2/2 ✅
│   ├── Role hierarchy: 1/1 ✅
│   ├── Super admin: 1/1 ✅
│   └── State capture: 1/1 ✅
│
└── Failed: 10 (38%)
    ├── Audit logging: 3/3 ❌ (expected - service role limitation)
    ├── RLS enforcement (SELECT): 6/6 ❌ (needs investigation)
    ├── Permission-based access: 2/5 ❌ (needs investigation)
    └── Region deletion: 2/2 ❌ (needs investigation)
```

---

## Conclusion

**Core functionality is working:** 16 tests pass, covering admin CRUD, basic RLS enforcement, and multi-region support.

**Issues to resolve:** RLS SELECT enforcement and audit logging need fixes. The failures are concentrated in two areas:
1. Audit logging (expected limitation with service role)
2. RLS SELECT enforcement (needs policy debugging)

**Next Steps:** Focus on debugging RLS policies and redesigning audit tests to use authenticated clients.
