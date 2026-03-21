# M-Place Product Approval Integration

**Date:** 2026-03-21  
**Feature:** Integrate product approval status display in M-Place  
**Status:** ✅ Implementation Plan

---

## Overview

Integrate the product approval workflow components into M-Place seller dashboard and product detail pages so product owners can see approval status and rejection reasons.

---

## Integration Points

### 1. Seller Dashboard (Profile.tsx)
**Location:** `/profile` - My Listings Dashboard

**Current State:**
- Shows product listing with status badges (Active, Hidden, Pending, Out of Stock)
- Already has `isApproved` field in product data
- Already filters by `pending` tab

**Integration:**
- ✅ Already shows "Pending Approval" status for unapproved products
- ✅ Already has pending tab with count
- TODO: Add rejection reason display in product card
- TODO: Add "View Rejection Details" button for rejected products

**Changes:**
```tsx
// In product card, add rejection details section:
{!product.isApproved && product.rejectionReason && (
  <ProductRejectionDetails productId={product.id} />
)}
```

### 2. Product Detail Page (ProductDetail.tsx)
**Location:** `/product/:id` - Product view page

**Current State:**
- Shows product details, seller info, comments
- No approval status display

**Integration:**
- TODO: Add ProductApprovalStatus component at top
- TODO: Show rejection reason if rejected
- TODO: Show "Pending Approval" message if pending

**Changes:**
```tsx
// Add near top of product details:
<ProductApprovalStatus productId={id} showDetails={true} />
```

### 3. Product Edit Page (Sell.tsx)
**Location:** `/sell?edit=:id` - Product edit form

**Current State:**
- Shows product form for editing
- No approval status display

**Integration:**
- TODO: Show approval status banner at top
- TODO: Show rejection reason if rejected
- TODO: Show message about resubmission after edit

**Changes:**
```tsx
// Add near top of form:
{isEditMode && (
  <ProductApprovalStatus productId={editProductId} showDetails={true} />
)}
```

---

## Files to Modify

### 1. Profile.tsx
**Path:** `m-place/src/pages/Profile.tsx`

**Changes:**
- Import ProductRejectionDetails component
- Add rejection details display in product card
- Add "View Rejection Details" button for rejected products

**Lines to modify:**
- Around line 180-200 (product card rendering)

### 2. ProductDetail.tsx
**Path:** `m-place/src/pages/ProductDetail.tsx`

**Changes:**
- Import ProductApprovalStatus component
- Add approval status display at top of product details
- Add rejection reason display if applicable

**Lines to modify:**
- Around line 150-160 (after product title section)

### 3. Sell.tsx
**Path:** `m-place/src/pages/Sell.tsx`

**Changes:**
- Import ProductApprovalStatus component
- Add approval status banner in edit mode
- Add message about resubmission

**Lines to modify:**
- Around line 200-220 (after header section)

---

## Component Usage

### ProductApprovalStatus
```tsx
import { ProductApprovalStatus } from '@/components/ProductApprovalStatus';

// In component:
<ProductApprovalStatus 
  productId={product.id} 
  showDetails={true}  // Show full details
/>
```

**Props:**
- `productId` (string, required) - Product ID
- `showDetails` (boolean, optional) - Show full details or just badge

**Displays:**
- ✅ Approved: Green badge with date
- ❌ Rejected: Red badge with reason
- ⏳ Pending: Yellow badge with message

### ProductRejectionDetails
```tsx
import { ProductRejectionDetails } from '@/components/ProductRejectionDetails';

// In component:
<ProductRejectionDetails productId={product.id} />
```

**Props:**
- `productId` (string, required) - Product ID

**Displays:**
- Rejection reason (highlighted)
- Admin name who rejected
- Date/time of rejection
- Action items (what to do next)

### useProductApprovalStatus Hook
```tsx
import { useProductApprovalStatus } from '@/hooks/useProductApprovalStatus';

// In component:
const approvalStatus = useProductApprovalStatus(productId);

if (approvalStatus.status === 'rejected') {
  return <ProductRejectionDetails productId={productId} />
}
```

**Returns:**
```typescript
{
  status: 'approved' | 'rejected' | 'pending'
  message: string
  rejectionReason?: string
  isApproved: boolean
  requiresApproval: boolean
  loading: boolean
}
```

---

## Implementation Steps

### Step 1: Update Profile.tsx (Seller Dashboard)
1. Import ProductRejectionDetails component
2. Add rejection details display in product card
3. Add button to view full rejection details
4. Test with rejected products

### Step 2: Update ProductDetail.tsx (Product View)
1. Import ProductApprovalStatus component
2. Add approval status display at top
3. Add rejection reason display if rejected
4. Test with all approval states

### Step 3: Update Sell.tsx (Product Edit)
1. Import ProductApprovalStatus component
2. Add approval status banner in edit mode
3. Add message about resubmission
4. Test with rejected products

### Step 4: Testing
1. Test with approved products
2. Test with rejected products
3. Test with pending products
4. Test with products that don't require approval
5. Verify rejection reason displays correctly
6. Verify admin name displays correctly
7. Verify dates display correctly

---

## User Experience Flow

### Scenario 1: Product Owner Sees Rejection
```
1. Product owner logs into M-Place
2. Navigates to Profile (My Listings)
3. Sees product with red "Rejected" badge
4. Clicks "View Rejection Details" button
5. Sees:
   - Rejection reason (highlighted)
   - Admin name who rejected
   - Date/time of rejection
   - Action items (what to do next)
6. Navigates to product edit page
7. Sees rejection alert at top
8. Makes changes to product
9. Saves changes
10. Product goes back to "Pending Approval" status
```

### Scenario 2: Product Owner Sees Pending Approval
```
1. Product owner creates new product
2. Navigates to Profile
3. Sees product with yellow "Pending Approval" badge
4. Sees message: "Waiting for admin approval"
5. Waits for admin to approve
6. Product status changes to "Approved" (green badge)
```

### Scenario 3: Product Owner Sees Approved Product
```
1. Product owner navigates to Profile
2. Sees product with green "Approved" badge
3. Sees approval date
4. Product is visible in marketplace
```

---

## API Endpoints Used

### Get Product Approval Status
```
GET /api/products/:id/approval-status

Response:
{
  id: "uuid",
  isApproved: boolean,
  rejectionReason?: string,
  approvedBy?: string,
  approvedAt?: string,
  requiresApproval: boolean
}
```

---

## Testing Checklist

### Profile.tsx (Seller Dashboard)
- [ ] Approved products show green badge
- [ ] Rejected products show red badge
- [ ] Pending products show yellow badge
- [ ] "View Rejection Details" button appears for rejected products
- [ ] Rejection details display correctly
- [ ] Admin name displays correctly
- [ ] Rejection date displays correctly

### ProductDetail.tsx (Product View)
- [ ] Approval status displays at top
- [ ] Rejection reason displays if rejected
- [ ] Pending message displays if pending
- [ ] Approved message displays if approved
- [ ] Non-approval-required products don't show status

### Sell.tsx (Product Edit)
- [ ] Approval status banner shows in edit mode
- [ ] Rejection reason displays if rejected
- [ ] Resubmission message displays
- [ ] Banner doesn't show in create mode

---

## Performance Considerations

### Caching
- Approval status cached in component state
- Admin name fetched once and cached
- No N+1 queries

### Optimization
- Use `useProductApprovalStatus` hook for efficient data fetching
- Lazy load rejection details if needed
- Memoize components to prevent unnecessary re-renders

---

## Accessibility

### WCAG Compliance
- ✅ Color not only indicator (badges have text)
- ✅ Proper heading hierarchy
- ✅ Semantic HTML
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

### Considerations
- Rejection reason should be clearly visible
- Admin name should be identifiable
- Dates should be in user's timezone
- Action items should be clear and actionable

---

## Files Already Created

### Services
- ✅ `m-place/src/services/product-approval.service.ts`

### Components
- ✅ `m-place/src/components/ProductApprovalStatus.tsx`
- ✅ `m-place/src/components/ProductRejectionDetails.tsx`

### Hooks
- ✅ `m-place/src/hooks/useProductApprovalStatus.ts`

---

## Files to Modify

### Pages
- `m-place/src/pages/Profile.tsx` - Add rejection details display
- `m-place/src/pages/ProductDetail.tsx` - Add approval status display
- `m-place/src/pages/Sell.tsx` - Add approval status banner

---

## Next Steps

1. ✅ Create integration plan (THIS DOCUMENT)
2. TODO: Update Profile.tsx to show rejection details
3. TODO: Update ProductDetail.tsx to show approval status
4. TODO: Update Sell.tsx to show approval status banner
5. TODO: Test all integration points
6. TODO: Update roadmap to reflect completion

---

## Sign-Off

**Plan Date:** 2026-03-21  
**Status:** ✅ Ready for Implementation  
**Estimated Time:** 2-3 hours

---

**✅ M-Place Product Approval Integration Plan Complete**
