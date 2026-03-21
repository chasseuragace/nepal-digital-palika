# Phase 6 - Admin Panel Requirements & Specifications

**Date:** 2026-03-21  
**Phase:** 6 - Admin Panel Analytics & Product Management  
**Status:** 🔵 Planning  
**Timeline:** 2026-04-01 to 2026-05-30

---

## Overview

Phase 6 focuses on building comprehensive analytics and product management capabilities in the **admin panel** (where palika admins log in). This is separate from the platform admin panel and the marketplace (m-place).

**Key Context:**
- Palika admins manage heritage sites, events, blogs, and now marketplace analytics
- They need visibility into marketplace activity (users, businesses, products)
- They can manage product verification status
- All data is scoped to their palika

---

## Phase 6 Breakdown

### Phase 6.1: Admin Dashboard Analytics (Apr 1 - Apr 15)

**Objective:** Build analytics dashboard for palika admins to see marketplace activity

**Features:**

#### 1. User Registration Analytics
- **Metric:** Total users registered in palika
- **Display:** 
  - Total count
  - Trend (new users this week/month)
  - Growth chart
- **Scope:** Only users in this palika
- **API Endpoint:** `GET /api/analytics/users`
- **Query:** Count profiles where palika_id = current_palika_id

#### 2. Business Registration Analytics
- **Metric:** Total businesses registered in palika
- **Display:**
  - Total count
  - By category breakdown
  - Trend (new businesses this week/month)
  - Growth chart
- **Scope:** Only businesses in this palika
- **API Endpoint:** `GET /api/analytics/businesses`
- **Query:** Count businesses where palika_id = current_palika_id

#### 3. Marketplace Product Analytics
- **Metric:** Total products in marketplace
- **Display:**
  - Total count
  - By category breakdown
  - By verification status (pending, verified, rejected)
  - Most viewed products
  - Recent products
  - Trend chart
- **Scope:** Only products from businesses in this palika
- **API Endpoint:** `GET /api/analytics/products`
- **Query:** Count marketplace_products where business_id IN (SELECT id FROM businesses WHERE palika_id = current_palika_id)

#### 4. Dashboard Summary Card
- **Display:**
  - Total Users
  - Total Businesses
  - Total Products
  - Verification Pending Count
- **Refresh:** Real-time or every 5 minutes
- **Location:** Main dashboard page

**API Endpoints Needed:**

```typescript
// GET /api/analytics/users
{
  total: number;
  newThisWeek: number;
  newThisMonth: number;
  trend: Array<{ date: string; count: number }>;
}

// GET /api/analytics/businesses
{
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  newThisWeek: number;
  newThisMonth: number;
  trend: Array<{ date: string; count: number }>;
}

// GET /api/analytics/products
{
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byVerificationStatus: {
    pending: number;
    verified: number;
    rejected: number;
  };
  mostViewed: Array<{ id: string; title: string; views: number }>;
  recent: Array<{ id: string; title: string; createdAt: string }>;
  trend: Array<{ date: string; count: number }>;
}
```

**Database Queries:**

```sql
-- Users in palika
SELECT COUNT(*) FROM profiles WHERE default_palika_id = $1;

-- Businesses in palika
SELECT COUNT(*) FROM businesses WHERE palika_id = $1;

-- Products in palika
SELECT COUNT(*) FROM marketplace_products mp
WHERE mp.business_id IN (
  SELECT id FROM businesses WHERE palika_id = $1
);

-- Products by verification status
SELECT verification_status, COUNT(*) FROM marketplace_products mp
WHERE mp.business_id IN (
  SELECT id FROM businesses WHERE palika_id = $1
)
GROUP BY verification_status;
```

**UI Components:**

1. **Analytics Dashboard Page**
   - Summary cards (Users, Businesses, Products, Pending)
   - Charts (trends, breakdowns)
   - Real-time data

2. **Summary Cards Component**
   - Icon + number + label
   - Trend indicator (up/down)
   - Click to drill down

3. **Chart Components**
   - Line chart for trends
   - Pie chart for categories
   - Bar chart for verification status

**Success Criteria:**
- ✅ All metrics scoped to palika
- ✅ Real-time data from Supabase
- ✅ Charts display correctly
- ✅ Performance optimized (< 1s load)
- ✅ RLS enforces palika scope

---

### Phase 6.2: Product Listing & Management (Apr 15 - May 1)

**Objective:** Allow palika admins to browse and manage marketplace products

**Features:**

#### 1. Product Listing Page
- **Display:** Table/grid of all products in palika marketplace
- **Columns:**
  - Product image (thumbnail)
  - Product title
  - Business name
  - Category
  - Price
  - Verification status (badge)
  - View count
  - Created date
  - Actions (View, Edit, Verify/Reject)
- **Scope:** Only products from businesses in this palika
- **Pagination:** 10/25/50 items per page
- **API Endpoint:** `GET /api/products?page=1&limit=25&sort=newest`

#### 2. Sorting Options
- **By Verification Status:**
  - Pending first
  - Verified
  - Rejected
- **By Most Viewed:**
  - Highest view count first
- **By Recent:**
  - Newest first
- **By Category:**
  - Group by category
- **By Price:**
  - Low to high
  - High to low

#### 3. Filtering Options
- **Filter by Verification Status:**
  - Pending
  - Verified
  - Rejected
- **Filter by Category:**
  - Dropdown of categories
- **Filter by Date Range:**
  - Created between dates
- **Search:**
  - Search by product title
  - Search by business name

#### 4. Product Details View
- **Display:**
  - Product image gallery
  - Product title
  - Business name (link to business profile)
  - Category
  - Price
  - Description
  - View count
  - Created date
  - Verification status
  - Verification notes (if rejected)
- **Actions:**
  - Verify product
  - Reject product (with reason)
  - View in marketplace
  - Edit product (if admin)

#### 5. Product Verification Management (Tier-Gated)
- **Tier 1 (Basic):** NO verification workflow available
  - Products auto-publish immediately
  - No verify/reject buttons shown
  - No approval workflow
- **Tier 2 (Tourism):** Optional verification workflow
  - Available only if palika has `approval_required = true`
  - Verify Product: Change status to "verified", add note, update timestamp
  - Reject Product: Change status to "rejected", add reason, update timestamp
- **Tier 3 (Premium):** Optional verification workflow
  - Available only if palika has `approval_required = true`
  - Same as Tier 2
- **API Endpoints (Tier-Gated):**
  - `PUT /api/products/:id/verify?palika_id=X` - Verify product (checks tier)
  - `PUT /api/products/:id/reject?palika_id=X` - Reject product (checks tier)
  - Returns 403 if tier not eligible or approval not enabled

**API Endpoints Needed:**

```typescript
// GET /api/products
{
  data: Array<{
    id: string;
    title: string;
    businessName: string;
    category: string;
    price: number;
    image: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    viewCount: number;
    createdAt: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/products/:id
{
  id: string;
  title: string;
  businessId: string;
  businessName: string;
  category: string;
  price: number;
  images: string[];
  description: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  viewCount: number;
  createdAt: string;
  verificationNotes?: string;
  rejectionReason?: string;
}

// PUT /api/products/:id/verify
{
  verificationStatus: 'verified';
  verificationNotes?: string;
  verified_at: timestamp;
}

// PUT /api/products/:id/reject
{
  verificationStatus: 'rejected';
  rejectionReason: string;
  rejected_at: timestamp;
}
```

**Database Queries:**

```sql
-- List products in palika
SELECT mp.*, b.business_name FROM marketplace_products mp
JOIN businesses b ON mp.business_id = b.id
WHERE b.palika_id = $1
ORDER BY mp.created_at DESC
LIMIT $2 OFFSET $3;

-- Get product details
SELECT mp.*, b.business_name FROM marketplace_products mp
JOIN businesses b ON mp.business_id = b.id
WHERE mp.id = $1 AND b.palika_id = $2;

-- Update verification status
UPDATE marketplace_products
SET verification_status = $1, verified_at = NOW()
WHERE id = $2 AND business_id IN (
  SELECT id FROM businesses WHERE palika_id = $3
);
```

**UI Components:**

1. **Product Listing Page**
   - Table with sorting/filtering
   - Pagination controls
   - Search bar
   - Filter sidebar

2. **Product Row Component**
   - Image thumbnail
   - Product info
   - Status badge
   - Action buttons

3. **Product Details Modal/Page**
   - Image gallery
   - Product info
   - Verification controls
   - Action buttons

4. **Verification Dialog**
   - Reason/notes input
   - Confirm button
   - Cancel button

**Success Criteria:**
- ✅ All products scoped to palika
- ✅ Sorting works correctly
- ✅ Filtering works correctly
- ✅ Pagination works correctly
- ✅ Verification status updates (only for eligible tiers)
- ✅ Performance optimized
- ✅ RLS enforces palika scope
- ✅ Tier 1 palikas cannot access verification workflow
- ✅ Tier 2/3 palikas can only verify if approval_required = true
- ✅ Appropriate error messages for ineligible tiers

---

### Phase 6.3: Admin Panel Commit & Stabilization (May 1 - May 15)

**Objective:** Finalize and commit admin panel code

**Activities:**

1. **Code Review**
   - Review all Phase 6.1 and 6.2 code
   - Check for security issues
   - Verify RLS enforcement
   - Check performance

2. **Testing**
   - Unit tests for API endpoints
   - Component tests for UI
   - Integration tests for full flow
   - E2E tests with Playwright
   - Target: 95%+ pass rate

3. **Documentation**
   - API documentation
   - Component documentation
   - Setup guide
   - User guide for palika admins

4. **Performance Optimization**
   - Database query optimization
   - Caching strategies
   - Image optimization
   - Bundle size optimization

5. **Bug Fixes**
   - Fix any issues found during testing
   - Performance improvements
   - UX refinements

6. **Deployment Preparation**
   - Environment configuration
   - Deployment scripts
   - Rollback procedures
   - Monitoring setup

**Deliverables:**
- ✅ All code committed to repository
- ✅ Tests passing (95%+)
- ✅ Documentation complete
- ✅ Performance optimized
- ✅ Ready for production deployment

---

## Architecture & Implementation

### Database Schema

**Existing Tables Used:**
- `profiles` - User data
- `businesses` - Business data
- `marketplace_products` - Product data
- `marketplace_categories` - Category data

**New Tables (if needed):**
- None (use existing schema)

### API Layer

**Location:** `admin-panel/src/api/`

**Files to Create:**
- `analytics.ts` - Analytics endpoints
- `products.ts` - Product management endpoints

**Authentication:**
- Use existing admin authentication
- Verify palika_id from admin_users table
- Enforce RLS at database level

### Frontend Components

**Location:** `admin-panel/src/components/`

**Components to Create:**
- `AnalyticsDashboard.tsx` - Main dashboard
- `SummaryCard.tsx` - Summary card component
- `TrendChart.tsx` - Trend chart component
- `ProductListing.tsx` - Product listing page
- `ProductDetails.tsx` - Product details modal
- `VerificationDialog.tsx` - Verification dialog

### Pages

**Location:** `admin-panel/src/pages/`

**Pages to Create:**
- `Analytics.tsx` - Analytics dashboard page
- `Products.tsx` - Product listing page

---

## RLS & Security

### Palika Scope Enforcement

**All queries must be scoped to current admin's palika:**

```typescript
// Get current admin's palika_id
const adminPalikaId = admin.palika_id;

// All queries filtered by palika_id
const products = await supabase
  .from('marketplace_products')
  .select('*')
  .in('business_id', 
    supabase
      .from('businesses')
      .select('id')
      .eq('palika_id', adminPalikaId)
  );
```

### RLS Policies

**Existing policies should enforce:**
- Palika admins can only see data from their palika
- Super admins can see all data
- No cross-palika data access

---

## Testing Strategy

### Unit Tests
- API endpoint tests
- Query tests
- Utility function tests

### Component Tests
- Dashboard component tests
- Product listing tests
- Verification dialog tests

### Integration Tests
- Full analytics flow
- Full product management flow
- Verification workflow

### E2E Tests
- Admin login
- Navigate to analytics
- View analytics data
- Navigate to products
- Filter/sort products
- Verify product
- Reject product

---

## Performance Considerations

### Database Optimization
- Index on `palika_id` (already exists)
- Index on `verification_status`
- Index on `created_at`
- Use LIMIT/OFFSET for pagination

### Caching
- Cache analytics data (5-minute TTL)
- Cache product list (1-minute TTL)
- Invalidate on updates

### Frontend Optimization
- Lazy load charts
- Virtualize product list
- Optimize images
- Code splitting

---

## Timeline & Milestones

| Phase | Dates | Deliverables |
|-------|-------|--------------|
| 6.1 | Apr 1-15 | Analytics dashboard, API endpoints |
| 6.2 | Apr 15-May 1 | Product listing, verification management |
| 6.3 | May 1-15 | Testing, documentation, optimization |
| 6.4 | May 15-30 | Business profile management (m-place) |

---

## Success Criteria

### Phase 6.1
- ✅ Analytics dashboard displays correctly
- ✅ All metrics scoped to palika
- ✅ Real-time data from Supabase
- ✅ Charts render correctly
- ✅ Performance < 1s load time
- ✅ RLS enforces palika scope

### Phase 6.2
- ✅ Product listing displays all products
- ✅ Sorting works correctly
- ✅ Filtering works correctly
- ✅ Pagination works correctly
- ✅ Verification status updates
- ✅ All data scoped to palika
- ✅ Performance optimized

### Phase 6.3
- ✅ All code committed
- ✅ Tests passing (95%+)
- ✅ Documentation complete
- ✅ Performance optimized
- ✅ Ready for production

---

## Dependencies

### External Libraries
- React Query (data fetching)
- Chart.js or Recharts (charts)
- React Table (product listing)
- Supabase client (database)

### Internal Dependencies
- Existing admin authentication
- Existing RLS policies
- Existing database schema

---

## Known Constraints

1. **Palika Scope:** All data must be scoped to admin's palika
2. **RLS Enforcement:** Database-level security required
3. **Performance:** Analytics queries must be fast (< 1s)
4. **Real-time:** Data should be near real-time (< 5s delay)

---

## Next Steps

1. **Setup Development Environment**
   - Install dependencies
   - Configure environment variables
   - Setup database connection

2. **Create API Endpoints**
   - Analytics endpoints
   - Product endpoints
   - Verification endpoints

3. **Build UI Components**
   - Dashboard page
   - Product listing page
   - Charts and cards

4. **Implement Testing**
   - Unit tests
   - Component tests
   - Integration tests

5. **Documentation**
   - API docs
   - Component docs
   - User guide

---

**Status:** 🔵 Ready for Implementation  
**Start Date:** 2026-04-01  
**End Date:** 2026-05-30

