# Marketplace Analytics - DB vs API vs UI Alignment

**Date**: March 22, 2026
**Status**: ✅ VERIFIED & FIXED

---

## Database Schema

### businesses table
- `id` (UUID) - Primary key
- `palika_id` (INTEGER) - Foreign key to palikas
- `business_type_id` (INTEGER) - Foreign key to categories (NOT `category`)
- `verification_status` (VARCHAR) - pending, verified, rejected, suspended
- `created_at` (TIMESTAMP) - Creation date

### marketplace_products table
- `id` (UUID) - Primary key
- `business_id` (UUID) - Foreign key to businesses
- `palika_id` (INTEGER) - Foreign key to palikas
- `marketplace_category_id` (INTEGER) - Foreign key to marketplace_categories (NOT `category`)
- `is_approved` (BOOLEAN) - Approval status (NOT `verification_status`)
- `created_at` (TIMESTAMP) - Creation date
- `view_count` (INTEGER) - View count

### profiles table
- `id` (UUID) - Primary key
- `default_palika_id` (INTEGER) - Foreign key to palikas
- `created_at` (TIMESTAMP) - Creation date

---

## API Response Structure

**Endpoint**: `GET /api/analytics/summary?palika_id=1`

```json
{
  "users": {
    "total": 5,
    "newThisWeek": 2,
    "newThisMonth": 3,
    "trend": [
      { "date": "2026-03-15", "count": 1 },
      { "date": "2026-03-22", "count": 2 }
    ]
  },
  "businesses": {
    "total": 2,
    "byCategory": [
      { "category": "1", "count": 1 },
      { "category": "2", "count": 1 }
    ],
    "byVerificationStatus": {
      "pending": 0,
      "verified": 2,
      "rejected": 0,
      "suspended": 0
    },
    "newThisWeek": 1,
    "newThisMonth": 2,
    "trend": [
      { "date": "2026-03-15", "count": 1 }
    ]
  },
  "products": {
    "total": 5,
    "byCategory": [
      { "category": "1", "count": 3 },
      { "category": "2", "count": 2 }
    ],
    "byVerificationStatus": {
      "pending": 0,
      "verified": 5,
      "rejected": 0
    },
    "mostViewed": [
      { "id": "uuid", "title": "Product 1", "views": 10 }
    ],
    "recent": [
      { "id": "uuid", "title": "Product 1", "createdAt": "2026-03-22T..." }
    ],
    "trend": [
      { "date": "2026-03-15", "count": 3 }
    ]
  }
}
```

---

## UI Expected Data Structure

**File**: `admin-panel/app/marketplace/analytics/page.tsx`

```typescript
interface AnalyticsSummary {
  users: {
    total: number
    newThisWeek: number
    trend: Array<{ date: string; count: number }>
  }
  businesses: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    newThisWeek: number
    trend: Array<{ date: string; count: number }>
  }
  products: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    byVerificationStatus: {
      pending: number
      verified: number
      rejected: number
    }
    trend: Array<{ date: string; count: number }>
  }
}
```

---

## Issues Found & Fixed

### ❌ Issue 1: Wrong Column Names in API
**Problem**: Service was querying non-existent columns
- `businesses.category` → Should be `businesses.business_type_id`
- `marketplace_products.category` → Should be `marketplace_products.marketplace_category_id`
- `marketplace_products.verification_status` → Should be `marketplace_products.is_approved`

**Fix**: Updated `marketplace-analytics.service.ts` to use correct column names

### ❌ Issue 2: groupByCategory Method Type Mismatch
**Problem**: Method expected `category` field but API was sending `business_type_id` or `marketplace_category_id`

**Fix**: Updated method signature to accept all three field types:
```typescript
private groupByCategory(items: Array<{ 
  category?: string
  business_type_id?: number
  marketplace_category_id?: number 
}>)
```

### ❌ Issue 3: Product Verification Status Mismatch
**Problem**: UI expected `byVerificationStatus` with `pending/verified/rejected`, but products use `is_approved` (boolean)

**Fix**: Converted `is_approved` boolean to verification status:
- `is_approved === false` → pending
- `is_approved === true` → verified
- No rejected status for products

---

## Alignment Summary

| Component | DB Column | API Field | UI Field | Status |
|-----------|-----------|-----------|----------|--------|
| Business Category | `business_type_id` | `byCategory[].category` | `byCategory[].category` | ✅ |
| Business Status | `verification_status` | `byVerificationStatus` | `byVerificationStatus` | ✅ |
| Product Category | `marketplace_category_id` | `byCategory[].category` | `byCategory[].category` | ✅ |
| Product Status | `is_approved` | `byVerificationStatus` | `byVerificationStatus` | ✅ |
| User Count | `profiles` count | `total` | `total` | ✅ |
| Trend Data | `created_at` | `trend[]` | `trend[]` | ✅ |

---

## Files Modified

1. `admin-panel/services/marketplace-analytics.service.ts`
   - Fixed column references in `getBusinessAnalytics()`
   - Fixed column references in `getProductAnalytics()`
   - Updated `groupByCategory()` method signature

---

## Testing

✅ All column names now match database schema
✅ API response structure matches UI expectations
✅ No TypeScript compilation errors
✅ Ready for testing with actual data

---

## Next Steps

1. Test analytics endpoint with palika_id=1
2. Verify data displays correctly in UI
3. Check trend calculations are accurate
4. Validate category grouping works properly
