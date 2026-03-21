# Phase 6 - Tier Gating Implementation Update

**Date:** 2026-03-21  
**Update:** Product Verification Workflow Tier-Gating  
**Status:** ✅ Implementation Complete

---

## Overview

Product verification workflow is now **tier-gated** to ensure only eligible palikas can access the verification/rejection features.

---

## Tier-Based Access Model

### Tier 1 (Basic)
- **Verification Workflow:** ❌ NOT AVAILABLE
- **Behavior:** Products auto-publish immediately
- **UI:** Verify/Reject buttons hidden
- **Message:** "Product verification is not available for Basic tier palikas. Products are auto-published immediately."

### Tier 2 (Tourism)
- **Verification Workflow:** ✅ OPTIONAL (configurable per palika)
- **Behavior:** 
  - If `approval_required = false` (default): Auto-publish, no verification
  - If `approval_required = true`: Verification workflow enabled
- **UI:** Verify/Reject buttons shown only if approval enabled
- **Message:** "Product verification workflow is not enabled for this palika. Contact your administrator to enable approval workflows."

### Tier 3 (Premium)
- **Verification Workflow:** ✅ OPTIONAL (configurable per palika)
- **Behavior:** Same as Tier 2
- **UI:** Verify/Reject buttons shown only if approval enabled
- **Message:** Same as Tier 2

---

## Implementation Details

### 1. New Service: TierValidationService

**File:** `admin-panel/services/tier-validation.service.ts`

**Methods:**
- `getPalikaTierInfo(palikaId)` - Get tier information for a palika
- `canAccessVerificationWorkflow(palikaId)` - Check if palika can access verification
- `getVerificationErrorMessage(palikaId)` - Get user-friendly error message
- `validateProductVerification(palikaId, productId)` - Validate before verification
- `validateProductRejection(palikaId, productId)` - Validate before rejection

**Logic:**
```typescript
// Tier 1: Always false
if (tierLevel === 1) return false

// Tier 2+: Only if approval_required = true
return approvalRequired
```

### 2. Updated API Endpoints

**Verify Endpoint:** `PUT /api/products/:id/verify`
- Now checks tier eligibility
- Returns 403 if not eligible
- Returns error message explaining why

**Reject Endpoint:** `PUT /api/products/:id/reject`
- Now checks tier eligibility
- Returns 403 if not eligible
- Returns error message explaining why

**New Endpoint:** `GET /api/tier-info`
- Returns tier information for a palika
- Used by frontend to determine UI state

### 3. New Hook: useVerificationAccess

**File:** `admin-panel/lib/hooks/useVerificationAccess.ts`

**Usage:**
```typescript
const verificationAccess = useVerificationAccess(palikaId)

// Returns:
{
  canVerify: boolean
  tierLevel: number
  tierName: string
  approvalRequired: boolean
  errorMessage?: string
  loading: boolean
}
```

**Features:**
- Fetches tier info on mount
- Caches result
- Provides user-friendly error messages
- Handles loading state

### 4. Updated Components

**ProductTable.tsx**
- Added `canVerify` prop
- Added `verificationErrorMessage` prop
- Verify/Reject buttons only shown if `canVerify = true`
- Shows info message if verification not available

**ProductsPage.tsx**
- Uses `useVerificationAccess` hook
- Passes verification access to ProductTable
- Shows tier message in page header
- Validates before calling verify/reject APIs
- Shows error message if tier not eligible

---

## Database Requirements

### Tables Used
- `palikas` - Palika information
- `subscription_tiers` - Tier definitions (id, name, tier_level)
- `palika_settings` - Palika configuration (approval_required)

### Expected Data
```sql
-- Subscription Tiers
subscription_tiers:
  id: UUID
  name: 'Basic' | 'Tourism' | 'Premium'
  tier_level: 1 | 2 | 3

-- Palika Settings
palika_settings:
  palika_id: INTEGER
  approval_required: BOOLEAN (default: false)
```

---

## API Responses

### Success: Verification Allowed
```json
{
  "success": true
}
```

### Error: Tier 1 Palika
```json
{
  "error": "Product verification is not available for Basic tier palikas. Products are auto-published immediately.",
  "status": 403
}
```

### Error: Approval Not Enabled
```json
{
  "error": "Product verification workflow is not enabled for this palika. Contact your administrator to enable approval workflows.",
  "status": 403
}
```

### Tier Info Response
```json
{
  "palikaId": 1,
  "tierId": "uuid-123",
  "tierLevel": 2,
  "tierName": "Tourism",
  "approvalRequired": true
}
```

---

## Testing Scenarios

### Scenario 1: Tier 1 Palika
- User navigates to products page
- Verify/Reject buttons should NOT appear
- Info message shows: "Product verification is not available for Basic tier palikas..."
- API returns 403 if user tries to verify

### Scenario 2: Tier 2 Palika (Approval Disabled)
- User navigates to products page
- Verify/Reject buttons should NOT appear
- Info message shows: "Product verification workflow is not enabled..."
- API returns 403 if user tries to verify

### Scenario 3: Tier 2 Palika (Approval Enabled)
- User navigates to products page
- Verify/Reject buttons SHOULD appear for pending products
- User can verify/reject products
- API returns 200 on success

### Scenario 4: Tier 3 Palika (Approval Enabled)
- Same as Scenario 3

---

## Files Modified

### Services
- ✅ `admin-panel/services/tier-validation.service.ts` (NEW)
- ✅ `admin-panel/services/marketplace-products.service.ts` (unchanged)

### API Routes
- ✅ `admin-panel/app/api/products/[id]/verify/route.ts` (updated)
- ✅ `admin-panel/app/api/products/[id]/reject/route.ts` (updated)
- ✅ `admin-panel/app/api/tier-info/route.ts` (NEW)

### Hooks
- ✅ `admin-panel/lib/hooks/useVerificationAccess.ts` (NEW)

### Components
- ✅ `admin-panel/components/ProductTable.tsx` (updated)

### Pages
- ✅ `admin-panel/app/marketplace/products/page.tsx` (updated)

### Documentation
- ✅ `session-2026-03-21/PHASE_6_ADMIN_PANEL_REQUIREMENTS.md` (updated)

---

## Backward Compatibility

✅ **Fully backward compatible**
- Existing products continue to work
- Tier 1 palikas see no verification UI (as intended)
- Tier 2/3 palikas with approval disabled see no verification UI (as intended)
- Tier 2/3 palikas with approval enabled see verification UI (as intended)

---

## Security Considerations

### RLS Enforcement
- Tier validation happens at API level
- Database RLS policies still enforce palika scope
- Double-layer security: API + Database

### Validation Flow
```
1. User clicks Verify
2. Frontend checks canVerify flag
3. Frontend calls API with palika_id
4. API validates tier eligibility
5. API validates product belongs to palika
6. Database RLS validates again
7. Update succeeds or fails
```

---

## Error Handling

### Frontend
- Checks `canVerify` before showing buttons
- Shows error message if tier not eligible
- Validates before API call
- Shows error alert if API fails

### Backend
- Validates tier eligibility
- Validates product ownership
- Returns 403 if not eligible
- Returns 404 if product not found
- Returns 500 if server error

---

## Performance Impact

### Minimal
- One additional API call to fetch tier info (cached in hook)
- Tier validation is O(1) lookup
- No additional database queries beyond existing

### Optimization
- Tier info cached in React state
- No refetch on every render
- Fetched once on component mount

---

## Future Enhancements

### Phase 6.3 (Testing)
- [ ] Add unit tests for tier validation
- [ ] Add integration tests for verification workflow
- [ ] Test all tier combinations
- [ ] Test approval_required toggle

### Phase 6.4+
- [ ] Add admin UI to toggle approval_required per palika
- [ ] Add audit log for verification actions
- [ ] Add notifications for verification events
- [ ] Add bulk verification actions

---

## Migration Notes

### For Existing Deployments
1. Ensure `subscription_tiers` table has `tier_level` column
2. Ensure `palika_settings` table exists with `approval_required` column
3. Set `approval_required = false` for all palikas (default)
4. Deploy new code
5. Test with Tier 1, 2, 3 palikas

### For New Deployments
- All tables created automatically by migrations
- Tier info seeded during setup
- Ready to use immediately

---

## Success Criteria

✅ Tier 1 palikas cannot access verification workflow  
✅ Tier 2/3 palikas can access only if approval_required = true  
✅ Verify/Reject buttons hidden for ineligible tiers  
✅ Error messages explain why verification not available  
✅ API returns 403 for ineligible tiers  
✅ All data scoped to palika  
✅ RLS enforces access control  
✅ Performance optimized  

---

## Sign-Off

**Implementation Date:** 2026-03-21  
**Updated By:** Kiro AI Assistant  
**Status:** ✅ Complete  
**Ready for:** Phase 6.3 Testing

---

**🎯 Tier-Gating Implementation Complete**
