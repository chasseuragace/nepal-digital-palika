# Phase 6: Admin Panel Analytics & Product Management - Detailed Plan

**Phase:** 6  
**Status:** 🔵 Next (Starting 2026-04-01)  
**Duration:** 6 weeks (2026-04-01 to 2026-05-15)  
**Target:** Complete admin panel with analytics and product management

---

## Overview

Phase 6 focuses on building the **Palika Admin Panel** - where palika owners/admins log in to manage their marketplace and view analytics. This is distinct from the **Platform Admin Panel** (for internal platform management).

### Key Distinction
- **Platform Admin Panel:** Internal tool for managing platform-level configuration (admins, roles, permissions)
- **Palika Admin Panel:** User-facing tool for palika owners to manage their marketplace and view analytics

### Current State
- ✅ Marketplace (m-place) verified working with Supabase
- ✅ Database fully operational with 34 migrations
- ✅ RLS policies enforce palika-scoped data access
- ✅ Platform admin panel complete
- 🔵 Palika admin panel needs analytics and product management

---

## Phase 6.1: Admin Dashboard Analytics (2026-04-01 to 2026-04-15)

### Objective
Build analytics dashboard showing key metrics for palika admins

### Features

#### 1. User Registration Analytics
- **Metric:** Total users registered in palika
- **Display:** Count, trend, growth rate
- **Scope:** Palika-only (RLS enforced)
- **Query:** Count users where palika_id = current_palika

#### 2. Business Registration Analytics
- **Metric:** Total businesses registered in palika
- **Display:** Count, trend, growth rate
- **Scope:** Palika-only (RLS enforced)
- **Query:** Count businesses where palika_id = current_palika

#### 3. Product Count Analytics
- **Metric:** Total products in marketplace
- **Display:** Count by verification status, trend
- **Scope:** Palika-only (RLS enforced)
- **Query:** Count products where business.palika_id = current_palika

#### 4. Key Metrics Dashboard
- **Layout:** Cards showing each metric
- **Real-time:** Data from Supabase
- **Responsive:** Mobile-friendly design
- **Performance:** Optimized queries with caching

### API Endpoints

```typescript
// GET /api/analytics/users
// Returns: { count: number, trend: number, growth: number }
// Scope: Current palika only

// GET /api/analytics/businesses
// Returns: { count: number, trend: number, growth: number }
// Scope: Current palika only

// GET /api/analytics/products
// Returns: { 
//   total: number, 
//   verified: number, 
//   pending: number, 
//   rejected: number,
//   trend: number 
// }
// Scope: Current palika only

// GET /api/analytics/dashboard
// Returns: All metrics combined
// Scope: Current palika only
```

### Implementation Details

**Database Queries:**
```sql
-- User count by palika
SELECT COUNT(*) FROM users WHERE palika_id = $1;

-- Business count by palika
SELECT COUNT(*) FROM businesses WHERE palika_id = $1;

-- Product count by palika and status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified,
  COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected
FROM products p
JOIN businesses b ON p.business_id = b.id
WHERE b.palika_id = $1;
```

**Frontend Components:**
- `AnalyticsDashboard.tsx` - Main dashboard layout
- `MetricCard.tsx` - Individual metric display
- `TrendIndicator.tsx` - Trend visualization
- `LoadingState.tsx` - Loading skeleton

**Testing:**
- Unit tests for API endpoints
- Integration tests with real Supabase
- RLS enforcement tests (verify palika scoping)
- Performance tests (query optimization)

### Success Criteria
- ✅ All metrics display correctly
- ✅ Data scoped to current palika only
- ✅ RLS policies enforced
- ✅ Queries optimized (< 500ms)
- ✅ 95%+ test pass rate
- ✅ Mobile responsive

---

## Phase 6.2: Product Listing & Management (2026-04-15 to 2026-05-01)

### Objective
Build product browsing and management interface for palika admins

### Features

#### 1. Product Listing
- **Display:** Table/grid of all products in palika
- **Columns:** Product name, business, price, status, views, created date
- **Scope:** Palika-only (RLS enforced)
- **Pagination:** 10/25/50 items per page

#### 2. Sorting Options
- **By Verification Status:** Verified → Pending → Rejected
- **By Most Viewed:** Highest views first
- **By Recent:** Newest first
- **By Price:** Low to high / High to low
- **By Business:** Alphabetical

#### 3. Filtering
- **By Status:** Verified, Pending, Rejected, All
- **By Business:** Dropdown of businesses
- **By Date Range:** Created between dates
- **By Price Range:** Min/max price

#### 4. Product Details View
- **Display:** Full product information
- **Actions:** View, Edit, Delete, Verify/Reject
- **Scope:** Palika-only (RLS enforced)

#### 5. Verification Management
- **Admin Action:** Approve/Reject products
- **Status Update:** Verified → Pending → Rejected
- **Reason:** Optional rejection reason
- **Audit:** Logged in audit_log

### API Endpoints

```typescript
// GET /api/products
// Query params: page, limit, sort, filter, search
// Returns: { products: [], total: number, pages: number }
// Scope: Current palika only

// GET /api/products/[id]
// Returns: Full product details
// Scope: Current palika only

// PUT /api/products/[id]/verify
// Body: { status: 'verified' | 'rejected', reason?: string }
// Returns: Updated product
// Scope: Current palika only

// DELETE /api/products/[id]
// Returns: Success message
// Scope: Current palika only

// GET /api/products/stats
// Returns: { total, verified, pending, rejected, mostViewed, recent }
// Scope: Current palika only
```

### Implementation Details

**Database Queries:**
```sql
-- List products with sorting/pagination
SELECT p.*, b.name as business_name, COUNT(v.id) as view_count
FROM products p
JOIN businesses b ON p.business_id = b.id
LEFT JOIN product_views v ON p.id = v.product_id
WHERE b.palika_id = $1
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- Update verification status
UPDATE products 
SET verification_status = $1, updated_at = NOW()
WHERE id = $2 AND business_id IN (
  SELECT id FROM businesses WHERE palika_id = $3
);
```

**Frontend Components:**
- `ProductListing.tsx` - Main product list
- `ProductTable.tsx` - Table display
- `ProductFilters.tsx` - Filter controls
- `ProductDetails.tsx` - Detail view
- `VerificationModal.tsx` - Approve/reject dialog
- `Pagination.tsx` - Pagination controls

**Testing:**
- Unit tests for sorting/filtering
- Integration tests with real Supabase
- RLS enforcement tests
- Pagination tests
- Verification workflow tests

### Success Criteria
- ✅ All sorting options work correctly
- ✅ Pagination works smoothly
- ✅ Filtering accurate
- ✅ Data scoped to current palika only
- ✅ Verification workflow complete
- ✅ 95%+ test pass rate
- ✅ Performance optimized (< 1s load time)

---

## Phase 6.3: Admin Panel Commit & Stabilization (2026-05-01 to 2026-05-15)

### Objective
Finalize and commit admin panel code, prepare for SOS integration

### Tasks

#### 1. Code Review
- Review all new code
- Check for best practices
- Verify RLS enforcement
- Optimize performance

#### 2. Testing
- Run full test suite
- Integration tests with real data
- Performance testing
- Security testing (RLS, authorization)

#### 3. Documentation
- Update CLAUDE.md with new features
- Document API endpoints
- Create user guide for palika admins
- Update ROADMAP.md

#### 4. Performance Optimization
- Optimize database queries
- Add caching where appropriate
- Minimize API calls
- Optimize frontend rendering

#### 5. Bug Fixes
- Fix any issues found during testing
- Handle edge cases
- Improve error handling
- Add user feedback messages

#### 6. Prepare for SOS Integration
- Document current architecture
- Identify integration points
- Plan module structure
- Prepare for Phase 7

### Deliverables
- ✅ Complete admin panel with analytics and product management
- ✅ All tests passing (95%+)
- ✅ Code committed to repository
- ✅ Documentation updated
- ✅ Performance optimized
- ✅ Ready for SOS integration

---

## Architecture & Design

### Admin Panel Structure

```
admin-panel/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── users/route.ts
│   │   │   ├── businesses/route.ts
│   │   │   ├── products/route.ts
│   │   │   └── dashboard/route.ts
│   │   └── products/
│   │       ├── route.ts
│   │       ├── [id]/route.ts
│   │       └── [id]/verify/route.ts
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── products/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── layout.tsx
├── components/
│   ├── AnalyticsDashboard.tsx
│   ├── MetricCard.tsx
│   ├── ProductListing.tsx
│   ├── ProductTable.tsx
│   ├── ProductFilters.tsx
│   └── VerificationModal.tsx
├── services/
│   ├── analytics.service.ts
│   ├── products.service.ts
│   └── __tests__/
│       ├── analytics.test.ts
│       └── products.test.ts
└── lib/
    └── supabase.ts
```

### Data Flow

```
Palika Admin Login
    ↓
Dashboard Page
    ↓
Fetch Analytics (GET /api/analytics/dashboard)
    ↓
Display Metrics
    ↓
User clicks "Products"
    ↓
Fetch Products (GET /api/products)
    ↓
Display Product List
    ↓
User clicks Product
    ↓
Fetch Product Details (GET /api/products/[id])
    ↓
Display Details + Verification Options
    ↓
User Verifies/Rejects
    ↓
Update Status (PUT /api/products/[id]/verify)
    ↓
Audit Log Entry
    ↓
Refresh List
```

### RLS Enforcement

All queries must be scoped to current palika:

```typescript
// Example: Get current palika from auth
const { data: { user } } = await supabase.auth.getUser();
const { data: admin } = await supabase
  .from('admin_users')
  .select('admin_regions(palika_id)')
  .eq('id', user.id)
  .single();

const palikaId = admin.admin_regions[0].palika_id;

// All queries use palikaId for scoping
```

---

## Timeline & Milestones

### Week 1-2: Analytics Dashboard (2026-04-01 to 2026-04-15)
- [ ] Design analytics dashboard
- [ ] Implement API endpoints
- [ ] Build frontend components
- [ ] Write tests
- [ ] Deploy and test

### Week 3-4: Product Management (2026-04-15 to 2026-05-01)
- [ ] Design product listing
- [ ] Implement sorting/filtering
- [ ] Implement pagination
- [ ] Build product details view
- [ ] Implement verification workflow
- [ ] Write tests
- [ ] Deploy and test

### Week 5-6: Stabilization (2026-05-01 to 2026-05-15)
- [ ] Code review
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation
- [ ] Final testing
- [ ] Commit to repository

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Test Pass Rate | 95%+ | 🔵 Pending |
| Query Performance | < 500ms | 🔵 Pending |
| Page Load Time | < 1s | 🔵 Pending |
| RLS Enforcement | 100% | 🔵 Pending |
| Code Coverage | 80%+ | 🔵 Pending |
| Documentation | Complete | 🔵 Pending |

---

## Dependencies & Prerequisites

### Required
- ✅ Database with 34 migrations
- ✅ RLS policies for palika scoping
- ✅ Supabase running locally
- ✅ Admin authentication working

### Optional
- 🔵 Caching layer (Redis)
- 🔵 Analytics library (for trends)
- 🔵 Charting library (for visualizations)

---

## Next Phase Preview (Phase 7)

After Phase 6 is complete:
1. SOS code will be brought into workspace
2. SOS frontend will be built as separate module
3. m-place will be renamed to Digital Palika Frontend
4. SOS will be integrated as module within Digital Palika Frontend

---

## Notes

### Important Reminders
- All queries must be scoped to current palika (RLS)
- Use service role for admin operations (RLS bypass)
- Log all verification actions to audit_log
- Test with real Supabase data
- Optimize queries before deployment

### Potential Challenges
- Complex sorting/filtering logic
- Performance with large product lists
- RLS policy edge cases
- Pagination with filters

### Mitigation Strategies
- Use database-level sorting/filtering
- Implement query caching
- Comprehensive RLS testing
- Pagination offset optimization

---

**Phase 6 Plan Created:** 2026-03-21  
**Next Review:** 2026-04-01 (Phase 6 Start)
