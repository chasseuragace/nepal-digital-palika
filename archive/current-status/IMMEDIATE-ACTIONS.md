# Immediate Actions - Test Failures Analysis

> **Priority:** 🔴 IMMEDIATE
> **Blocking:** Everything else

## Current Situation

```
Test Files:  3 failed | 1 passed (4)
Tests:       13 failed | 85 passed (98)
```

**86% of tests passing** - The architecture is sound. The failures are systematic.

## Root Cause Analysis

All 13 failures share the same pattern:

### Pattern 1: Mock Client Returns Existing Data (Not New Data)
```typescript
// Test expects: 'Buddha Jayanti' (the input)
// Mock returns: 'Dashain Festival' (existing mock data)
```

The mock client's `insert()` method returns the first item from mock data, not the newly created record.

### Pattern 2: Mock Client Doesn't Mutate Data
```typescript
// Test expects: status = 'published' after publish()
// Mock returns: status = 'draft' (unchanged)
```

The mock client's `update()` doesn't actually modify the mock data store.

### Pattern 3: Permission Checking Logic
```typescript
// Moderator should have 'heritage_sites.create' permission
// Returns: false (permission not in role map)
```

The `ROLE_PERMISSIONS` constant may not include expected moderator permissions.

## Failing Tests Breakdown

| Service | Test | Issue |
|---------|------|-------|
| heritage-sites | create new site | Returns existing, not created |
| heritage-sites | generate slug | Returns existing slug |
| heritage-sites | update site | No actual mutation |
| heritage-sites | publish draft | Status not changing |
| heritage-sites | archive site | Status not changing |
| heritage-sites | toggleFeatured (x2) | Boolean not toggling |
| events | create event | Returns existing, not created |
| events | update event | No actual mutation |
| events | publish draft | Status not changing |
| events | archive event | Status not changing |
| auth | moderator permissions | Permission missing from role |
| auth | hasAnyPermission | Depends on above |

## Fix Strategy

### Option A: Fix Mock Client (Recommended)
Make the mock client actually simulate database behavior:

```typescript
// In database-client.ts mock implementation
insert(table: string, data: Record<string, unknown>) {
  const newRecord = {
    id: `${table}-${Date.now()}`,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  this.mockData[table].push(newRecord)
  return newRecord
}

update(table: string, id: string, data: Record<string, unknown>) {
  const index = this.mockData[table].findIndex(r => r.id === id)
  if (index >= 0) {
    this.mockData[table][index] = { ...this.mockData[table][index], ...data }
    return this.mockData[table][index]
  }
  return null
}
```

### Option B: Fix Tests (Not Recommended)
Change test expectations to match mock behavior - but this defeats the purpose of testing.

## Files to Modify

1. `services/database-client.ts` - Fix `createMockClient()` implementation
2. `services/auth.service.ts` - Verify `ROLE_PERMISSIONS` includes moderator perms

## Estimated Effort

- Mock client fix: ~30 minutes
- Permission map fix: ~10 minutes
- Re-run tests: ~5 minutes

**Total: ~45 minutes to green tests**

## Next Action

```bash
# After fixing, verify with:
cd 08-admin-panel && npm run test
```

---

## Decision Required

Before fixing: **Do you want the mock client to be a full in-memory database simulation, or minimal happy-path stubs?**

- Full simulation = More test coverage, more maintenance
- Minimal stubs = Faster tests, less coverage of edge cases

-------updates---------

# Implementation Status & Next Actions

> **Updated:** 2026-01-05
> **Test Status:** 98/98 passing ✅
> **Phase:** Post-test-fix assessment

## ✅ Completed (Today)

1. **Fixed auth.service.ts** - Empty permissions array fallback bug
2. **Fixed database-client.ts** - Mock now properly mutates and returns correct data
3. **All 13 test failures resolved** - Tests now pass 100%

## 🔍 Current Gaps Identified

Based on grounding exercises:

### 1. RBAC Enforcement Gaps
- **Palika scope check** NOT implemented in `hasPermission()`
- **RLS policies** NOT implemented in Supabase
- **Audit logging** NOT implemented

### 2. Dashboard Analytics Gaps
- Pending reviews moderation metrics
- SOS alert metrics
- Time-series trend data
- QR code scan tracking

### 3. Database Schema Gaps
- Some planned tables not yet in seed (check against requirements)
- RLS policies missing entirely

## 🎯 Immediate Next Actions

### Priority 1: RBAC Scope Enforcement
**File:** `services/auth.service.ts`
**Task:** Add palika_id check in `hasPermission()` for scoped permissions
**Impact:** Security/compliance - prevents cross-palika data access

### Priority 2: Missing Analytics Implementation  
**File:** `services/analytics.service.ts`
**Task:** Implement methods for:
- `getPendingReviewsCount()`
- `getSOSMetrics()`
- `getTimeSeriesData()`
- `getQRCodeScanMetrics()`

### Priority 3: Dashboard UI Build
**Task:** Create dashboard components using existing analytics service
**Reference:** `DASHBOARD-UI-SPEC.md`

## ⚠️ Decisions Needed

1. **Palika Scope Strategy:** How granular should permission scopes be?
   - Option A: Check palika_id in hasPermission() (tight control)
   - Option B: Rely on RLS only (database-level)

2. **Audit Logging:** Implement now (security) or later (MVP)?

## 📊 Effort Estimate

- Priority 1 (RBAC scope): ~2 hours
- Priority 2 (Analytics gaps): ~4 hours  
- Priority 3 (Dashboard UI): ~6 hours

**Total:** ~12 hours to MVP-complete dashboard

---

*Note: This replaces the previous IMMEDIATE-ACTIONS.md which was focused on test failures that are now resolved.*

