# Phase 6.2.2: Business Management - M-Place (Pending)

**Date:** 2026-03-21  
**Feature:** Business approval status display in M-Place  
**Status:** 🔵 PENDING  
**Estimated Time:** 2-3 hours

---

## Overview

Phase 6.2.2 requires integrating business approval status display into M-Place so business owners can see their business approval status and rejection reasons, similar to how product owners see product approval status.

---

## What's Incomplete

### 1. Business Approval Service (M-Place) ❌
**File:** `m-place/src/services/business-approval.service.ts` (NOT CREATED)

**Required Methods:**
```typescript
- getBusinessApprovalStatus(businessId: string): Promise<BusinessApprovalStatus>
- getAdminName(adminId: string): Promise<string>
- formatApprovalStatus(status: BusinessApprovalStatus): FormattedStatus
```

**Purpose:** Fetch business approval status from database and format for display

**Reference:** `m-place/src/services/product-approval.service.ts` (already exists for products)

**Estimated Time:** 30 minutes

---

### 2. Business Approval Status Component (M-Place) ❌
**File:** `m-place/src/components/BusinessApprovalStatus.tsx` (NOT CREATED)

**Required Props:**
```typescript
interface BusinessApprovalStatusProps {
  businessId: string
  showDetails?: boolean
}
```

**Display:**
- ✅ Approved: Green badge with approval date
- ❌ Rejected: Red badge with rejection reason
- ⏳ Pending: Yellow badge with waiting message
- ⏳ Suspended: Gray badge with suspension message

**Purpose:** Display business approval status badge in business profile/listing

**Reference:** `m-place/src/components/ProductApprovalStatus.tsx` (already exists for products)

**Estimated Time:** 45 minutes

---

### 3. Business Rejection Details Component (M-Place) ❌
**File:** `m-place/src/components/BusinessRejectionDetails.tsx` (NOT CREATED)

**Required Props:**
```typescript
interface BusinessRejectionDetailsProps {
  businessId: string
}
```

**Display:**
- Rejection reason (highlighted)
- Admin name who rejected
- Date/time of rejection
- Action items (what to do next)

**Purpose:** Show full rejection details to business owner

**Reference:** `m-place/src/components/ProductRejectionDetails.tsx` (already exists for products)

**Estimated Time:** 45 minutes

---

### 4. Business Approval Status Hook (M-Place) ❌
**File:** `m-place/src/hooks/useBusinessApprovalStatus.ts` (NOT CREATED)

**Required Return:**
```typescript
{
  status: 'approved' | 'rejected' | 'pending' | 'suspended'
  message: string
  rejectionReason?: string
  isApproved: boolean
  requiresApproval: boolean
  loading: boolean
}
```

**Purpose:** React hook to fetch and manage business approval status

**Reference:** `m-place/src/hooks/useProductApprovalStatus.ts` (already exists for products)

**Estimated Time:** 30 minutes

---

### 5. Business Profile Page Integration ❌
**File:** `m-place/src/pages/BusinessProfile.tsx` (NEEDS UPDATE)

**Required Changes:**
1. Import `BusinessApprovalStatus` component
2. Add approval status display at top of profile
3. Show rejection details if rejected
4. Show pending message if awaiting approval

**Location:** Near business name/header section

**Reference:** `m-place/src/pages/ProductDetail.tsx` (already done for products)

**Estimated Time:** 30 minutes

---

### 6. Business Edit Page Integration ❌
**File:** `m-place/src/pages/BusinessProfileEdit.tsx` (NEEDS UPDATE)

**Required Changes:**
1. Import `BusinessApprovalStatus` component
2. Add approval status banner at top of form
3. Show rejection details if rejected
4. Show message about resubmission after edit

**Location:** Near form header

**Reference:** `m-place/src/pages/Sell.tsx` (already done for products)

**Estimated Time:** 30 minutes

---

## Implementation Checklist

### Services
- [ ] Create `business-approval.service.ts`
  - [ ] `getBusinessApprovalStatus()` method
  - [ ] `getAdminName()` method
  - [ ] `formatApprovalStatus()` method
  - [ ] Error handling
  - [ ] TypeScript types

### Components
- [ ] Create `BusinessApprovalStatus.tsx`
  - [ ] Status badge display
  - [ ] All status types (approved, rejected, pending, suspended)
  - [ ] Loading state
  - [ ] Error state
  - [ ] Props interface

- [ ] Create `BusinessRejectionDetails.tsx`
  - [ ] Rejection reason display
  - [ ] Admin name display
  - [ ] Date/time display
  - [ ] Action items
  - [ ] Styling

### Hooks
- [ ] Create `useBusinessApprovalStatus.ts`
  - [ ] Fetch approval status
  - [ ] Cache results
  - [ ] Error handling
  - [ ] Loading state
  - [ ] Return interface

### Pages
- [ ] Update `BusinessProfile.tsx`
  - [ ] Import components
  - [ ] Add approval status display
  - [ ] Add rejection details display
  - [ ] Test integration

- [ ] Update `BusinessProfileEdit.tsx`
  - [ ] Import components
  - [ ] Add approval status banner
  - [ ] Add rejection details display
  - [ ] Test integration

---

## Database Queries Needed

### Get Business Approval Status
```sql
SELECT 
  id,
  verification_status,
  verified_by,
  verified_at,
  rejection_reason,
  name
FROM businesses
WHERE id = $1
```

### Get Admin Name
```sql
SELECT 
  email,
  first_name,
  last_name
FROM admin_users
WHERE id = $1
```

---

## API Endpoints to Use

### Get Business Approval Status
```
GET /api/businesses/:id/approval-status

Response:
{
  id: "uuid",
  verificationStatus: "pending" | "verified" | "rejected" | "suspended",
  rejectionReason?: string,
  verifiedBy?: string,
  verifiedAt?: string,
  requiresApproval: boolean
}
```

**Note:** This endpoint may need to be created if it doesn't exist

---

## User Experience Flows

### Flow 1: Business Owner Sees Rejection
```
1. Business owner logs into M-Place
2. Navigates to Business Profile
3. Sees business with red "Rejected" badge
4. Sees rejection reason at top
5. Sees admin name who rejected
6. Sees date/time of rejection
7. Sees action items (what to do next)
8. Navigates to Business Edit page
9. Sees rejection alert at top
10. Makes changes to business
11. Saves changes
12. Business goes back to "Pending" status
```

### Flow 2: Business Owner Sees Pending Approval
```
1. Business owner creates new business (Tier 2+)
2. Navigates to Business Profile
3. Sees business with yellow "Pending Approval" badge
4. Sees message: "Waiting for admin approval"
5. Waits for admin to approve
6. Business status changes to "Approved" (green badge)
```

### Flow 3: Business Owner Sees Approved Business
```
1. Business owner navigates to Business Profile
2. Sees business with green "Approved" badge
3. Sees approval date
4. Business is visible in marketplace
```

---

## Component Structure

### BusinessApprovalStatus.tsx
```tsx
interface BusinessApprovalStatusProps {
  businessId: string
  showDetails?: boolean
}

export function BusinessApprovalStatus({
  businessId,
  showDetails = false,
}: BusinessApprovalStatusProps) {
  const approvalStatus = useBusinessApprovalStatus(businessId)
  
  // Display badge based on status
  // Optionally show full details
}
```

### BusinessRejectionDetails.tsx
```tsx
interface BusinessRejectionDetailsProps {
  businessId: string
}

export function BusinessRejectionDetails({
  businessId,
}: BusinessRejectionDetailsProps) {
  const approvalStatus = useBusinessApprovalStatus(businessId)
  
  // Display rejection reason, admin name, date, action items
}
```

### useBusinessApprovalStatus.ts
```tsx
export function useBusinessApprovalStatus(businessId: string) {
  const [status, setStatus] = useState<ApprovalStatus>()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Fetch approval status
    // Cache results
  }, [businessId])
  
  return { status, loading, ... }
}
```

---

## Integration Points

### BusinessProfile.tsx
```tsx
// Add near top of profile
<BusinessApprovalStatus businessId={business.id} showDetails={true} />

// Add if rejected
{approvalStatus.status === 'rejected' && (
  <BusinessRejectionDetails businessId={business.id} />
)}
```

### BusinessProfileEdit.tsx
```tsx
// Add near form header
{isEditMode && businessId && (
  <BusinessApprovalStatus businessId={businessId} showDetails={true} />
)}
```

---

## Testing Checklist

### Service
- [ ] `getBusinessApprovalStatus()` returns correct data
- [ ] `getAdminName()` returns correct name
- [ ] `formatApprovalStatus()` formats correctly
- [ ] Error handling works
- [ ] Caching works

### Components
- [ ] BusinessApprovalStatus displays correctly
- [ ] All status types display correctly
- [ ] Loading state displays
- [ ] Error state displays
- [ ] BusinessRejectionDetails displays correctly
- [ ] Rejection reason displays
- [ ] Admin name displays
- [ ] Date/time displays

### Hooks
- [ ] Hook fetches data correctly
- [ ] Hook caches results
- [ ] Hook handles errors
- [ ] Hook handles loading state

### Pages
- [ ] BusinessProfile shows approval status
- [ ] BusinessProfile shows rejection details if rejected
- [ ] BusinessProfileEdit shows approval status banner
- [ ] BusinessProfileEdit shows rejection details if rejected
- [ ] All integrations work correctly

### User Flows
- [ ] Business owner sees rejection reason
- [ ] Business owner sees pending message
- [ ] Business owner sees approved message
- [ ] Business owner can edit after rejection
- [ ] Business owner can resubmit after edit

---

## Comparison with Product Approval

| Aspect | Product Approval | Business Approval |
|--------|------------------|-------------------|
| Service | ✅ Created | ❌ Needs creation |
| Status Component | ✅ Created | ❌ Needs creation |
| Rejection Component | ✅ Created | ❌ Needs creation |
| Hook | ✅ Created | ❌ Needs creation |
| ProductDetail Integration | ✅ Done | 🔵 BusinessProfile pending |
| ProductEdit Integration | ✅ Done | 🔵 BusinessProfileEdit pending |
| Seller Dashboard | ✅ Done | 🔵 Pending |

---

## Files to Create

1. `m-place/src/services/business-approval.service.ts`
2. `m-place/src/components/BusinessApprovalStatus.tsx`
3. `m-place/src/components/BusinessRejectionDetails.tsx`
4. `m-place/src/hooks/useBusinessApprovalStatus.ts`

## Files to Update

1. `m-place/src/pages/BusinessProfile.tsx`
2. `m-place/src/pages/BusinessProfileEdit.tsx`

---

## Estimated Timeline

| Task | Time | Owner |
|------|------|-------|
| Create business-approval.service.ts | 30m | Backend |
| Create BusinessApprovalStatus.tsx | 45m | Frontend |
| Create BusinessRejectionDetails.tsx | 45m | Frontend |
| Create useBusinessApprovalStatus.ts | 30m | Frontend |
| Update BusinessProfile.tsx | 30m | Frontend |
| Update BusinessProfileEdit.tsx | 30m | Frontend |
| Testing | 1h | QA |
| **Total** | **~3.5 hours** | **Team** |

---

## Dependencies

### Required
- ✅ Business approval service (admin panel) - DONE
- ✅ Business approval API endpoints - DONE
- ✅ Database migration - DONE
- ✅ Product approval components (as reference) - DONE

### Optional
- 🔵 Email notifications (future)
- 🔵 Resubmission workflow (future)
- 🔵 Approval history (future)

---

## Success Criteria

✅ Business owners see approval status  
✅ Business owners see rejection reason  
✅ Business owners see who rejected and when  
✅ Business owners see action items  
✅ Business owners can edit after rejection  
✅ Professional UX  
✅ Consistent with product approval  
✅ All tests passing  

---

## Next Steps

1. Create business-approval.service.ts
2. Create BusinessApprovalStatus.tsx
3. Create BusinessRejectionDetails.tsx
4. Create useBusinessApprovalStatus.ts
5. Update BusinessProfile.tsx
6. Update BusinessProfileEdit.tsx
7. Test all integrations
8. Deploy to staging
9. Get stakeholder feedback
10. Deploy to production

---

## Sign-Off

**Phase:** 6.2.2 - Business Management (M-Place)  
**Status:** 🔵 PENDING  
**Estimated Time:** 2-3 hours  
**Ready for:** Implementation

---

**🔵 Phase 6.2.2 Pending - Ready for Implementation**
