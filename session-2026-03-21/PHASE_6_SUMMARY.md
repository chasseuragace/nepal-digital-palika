# Phase 6 - Admin Panel Analytics & Product Management - Summary

**Date:** 2026-03-21  
**Phase:** 6 - Admin Panel Analytics & Product Management  
**Status:** 🔵 Planning Complete  
**Timeline:** 2026-04-01 to 2026-05-30 (2 months)

---

## What is Phase 6?

Phase 6 focuses on building **analytics and product management** capabilities in the **admin panel** (where palika admins log in to manage their palika's content).

**Key Distinction:**
- **Platform Admin Panel** - For super admins managing the entire system
- **Admin Panel** - For palika admins managing their specific palika (THIS IS PHASE 6)
- **Marketplace (m-place)** - For regular users buying/selling products

---

## Phase 6 Breakdown

### Phase 6.1: Admin Dashboard Analytics (Apr 1 - Apr 15)

**What:** Build analytics dashboard showing marketplace activity in the palika

**Metrics to Display:**
1. **User Registration Analytics**
   - Total users registered in palika
   - New users this week/month
   - Trend chart

2. **Business Registration Analytics**
   - Total businesses registered in palika
   - Breakdown by category
   - New businesses this week/month
   - Trend chart

3. **Marketplace Product Analytics**
   - Total products in marketplace
   - Breakdown by category
   - Breakdown by verification status (pending, verified, rejected)
   - Most viewed products
   - Recent products
   - Trend chart

4. **Dashboard Summary Card**
   - Total Users
   - Total Businesses
   - Total Products
   - Verification Pending Count

**API Endpoints Needed:**
- `GET /api/analytics/users` - User count and trends
- `GET /api/analytics/businesses` - Business count and trends
- `GET /api/analytics/products` - Product count, status breakdown, trends

**UI Components:**
- Analytics dashboard page
- Summary cards (Users, Businesses, Products, Pending)
- Trend charts
- Category breakdown charts

**Success Criteria:**
- ✅ All metrics scoped to palika
- ✅ Real-time data from Supabase
- ✅ Charts display correctly
- ✅ Performance < 1s load time
- ✅ RLS enforces palika scope

---

### Phase 6.2: Product Listing & Management (Apr 15 - May 1)

**What:** Allow palika admins to browse and manage marketplace products

**Features:**

1. **Product Listing Page**
   - Table/grid of all products in palika marketplace
   - Columns: Image, Title, Business, Category, Price, Status, Views, Date
   - Pagination (10/25/50 items per page)

2. **Sorting Options**
   - By verification status (pending first)
   - By most viewed
   - By recent
   - By category
   - By price

3. **Filtering Options**
   - Filter by verification status
   - Filter by category
   - Filter by date range
   - Search by product title or business name

4. **Product Details View**
   - Image gallery
   - Product info
   - Business info
   - Verification status
   - View count
   - Created date

5. **Product Verification Management**
   - Verify product (change status to verified)
   - Reject product (with reason)
   - Add verification notes

**API Endpoints Needed:**
- `GET /api/products` - List products with sorting/pagination
- `GET /api/products/:id` - Product details
- `PUT /api/products/:id/verify` - Verify product
- `PUT /api/products/:id/reject` - Reject product

**UI Components:**
- Product listing page
- Product row component
- Product details modal
- Verification dialog
- Filter sidebar

**Success Criteria:**
- ✅ All products scoped to palika
- ✅ Sorting works correctly
- ✅ Filtering works correctly
- ✅ Pagination works correctly
- ✅ Verification status updates
- ✅ Performance optimized
- ✅ RLS enforces palika scope

---

### Phase 6.3: Admin Panel Commit & Stabilization (May 1 - May 15)

**What:** Finalize and commit admin panel code

**Activities:**
1. Code review
2. Testing (target 95%+ pass rate)
3. Documentation
4. Performance optimization
5. Bug fixes
6. Deployment preparation

**Deliverables:**
- ✅ All code committed
- ✅ Tests passing (95%+)
- ✅ Documentation complete
- ✅ Performance optimized
- ✅ Ready for production

---

### Phase 6.4: Business Profile Management (May 15 - May 30)

**Note:** This is in m-place, not admin panel. Already completed in this session!

---

## Key Differences from Other Repos

### Admin Panel (Phase 6) vs Platform Admin Panel (Phase 4)
| Aspect | Admin Panel | Platform Admin Panel |
|--------|------------|----------------------|
| Users | Palika admins | Super admins |
| Scope | Single palika | All palikas |
| Features | Analytics, product management | User management, system config |
| Data | Marketplace data | Admin users, system data |

### Admin Panel vs Marketplace (m-place)
| Aspect | Admin Panel | Marketplace |
|--------|------------|-------------|
| Users | Palika admins | Regular users |
| Purpose | Manage marketplace | Buy/sell products |
| Features | Analytics, verification | Browse, purchase, sell |
| Data | All products in palika | User's own products |

---

## Database Queries

### Analytics Queries

**User Count:**
```sql
SELECT COUNT(*) FROM profiles WHERE default_palika_id = $1;
```

**Business Count:**
```sql
SELECT COUNT(*) FROM businesses WHERE palika_id = $1;
```

**Product Count:**
```sql
SELECT COUNT(*) FROM marketplace_products mp
WHERE mp.business_id IN (
  SELECT id FROM businesses WHERE palika_id = $1
);
```

**Products by Verification Status:**
```sql
SELECT verification_status, COUNT(*) FROM marketplace_products mp
WHERE mp.business_id IN (
  SELECT id FROM businesses WHERE palika_id = $1
)
GROUP BY verification_status;
```

### Product Listing Query

**List Products:**
```sql
SELECT mp.*, b.business_name FROM marketplace_products mp
JOIN businesses b ON mp.business_id = b.id
WHERE b.palika_id = $1
ORDER BY mp.created_at DESC
LIMIT $2 OFFSET $3;
```

---

## RLS & Security

### Palika Scope Enforcement

All queries must be scoped to the current admin's palika:

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

### Existing RLS Policies

The database already has RLS policies that enforce:
- Palika admins can only see data from their palika
- Super admins can see all data
- No cross-palika data access

---

## Implementation Checklist

### Phase 6.1: Analytics Dashboard
- [ ] Create analytics API endpoints
- [ ] Create dashboard page component
- [ ] Create summary card components
- [ ] Create chart components
- [ ] Implement data fetching
- [ ] Add real-time updates
- [ ] Write tests
- [ ] Optimize performance

### Phase 6.2: Product Management
- [ ] Create product listing API endpoint
- [ ] Create product details API endpoint
- [ ] Create verification API endpoints
- [ ] Create product listing page
- [ ] Create product details modal
- [ ] Create verification dialog
- [ ] Implement sorting/filtering
- [ ] Implement pagination
- [ ] Write tests
- [ ] Optimize performance

### Phase 6.3: Commit & Stabilization
- [ ] Code review
- [ ] Run full test suite
- [ ] Write documentation
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Deployment preparation

---

## Timeline

| Phase | Dates | Duration | Status |
|-------|-------|----------|--------|
| 6.1 | Apr 1-15 | 2 weeks | 🔵 Planned |
| 6.2 | Apr 15-May 1 | 2.5 weeks | 🔵 Planned |
| 6.3 | May 1-15 | 2 weeks | 🔵 Planned |
| 6.4 | May 15-30 | 2 weeks | ✅ Complete (m-place) |

**Total Duration:** 8.5 weeks (2 months)

---

## Success Metrics

### Phase 6.1
- ✅ Analytics dashboard displays correctly
- ✅ All metrics scoped to palika
- ✅ Real-time data from Supabase
- ✅ Charts render correctly
- ✅ Performance < 1s load time

### Phase 6.2
- ✅ Product listing displays all products
- ✅ Sorting/filtering works correctly
- ✅ Pagination works correctly
- ✅ Verification status updates
- ✅ All data scoped to palika

### Phase 6.3
- ✅ All code committed
- ✅ Tests passing (95%+)
- ✅ Documentation complete
- ✅ Performance optimized

---

## Next Steps

1. **Prepare Development Environment**
   - Install dependencies in admin-panel repo
   - Configure environment variables
   - Setup database connection

2. **Create API Endpoints**
   - Analytics endpoints (Phase 6.1)
   - Product endpoints (Phase 6.2)

3. **Build UI Components**
   - Dashboard page
   - Product listing page
   - Charts and cards

4. **Implement Testing**
   - Unit tests
   - Component tests
   - Integration tests

5. **Documentation**
   - API documentation
   - Component documentation
   - User guide

---

## Related Documentation

- `ROADMAP.md` - Full project roadmap
- `PHASE_6_ADMIN_PANEL_REQUIREMENTS.md` - Detailed requirements
- `BUSINESS_PROFILE_IMPLEMENTATION.md` - Phase 6.4 (m-place)

---

**Status:** 🔵 Ready for Implementation  
**Start Date:** 2026-04-01  
**End Date:** 2026-05-30

