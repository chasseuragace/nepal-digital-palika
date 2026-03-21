# Phase 6 - Quick Start Guide

**Date:** 2026-03-21  
**For:** Developers implementing Phase 6 features

---

## What's Been Implemented

### Phase 6.1: Analytics Dashboard ✅
- User registration analytics
- Business registration analytics
- Product marketplace analytics
- 30-day trend charts
- Category breakdowns
- Verification status breakdown

### Phase 6.2: Product Management ✅
- Product listing with pagination
- Advanced filtering and sorting
- Product verification workflow
- Product rejection workflow

---

## How to Use

### 1. Analytics Dashboard

**URL:** `/marketplace/analytics`

**What it shows:**
- Total users, businesses, products in your palika
- New registrations this week
- 30-day growth trends
- Category breakdowns
- Verification status breakdown

**API Endpoints:**
```bash
# Get all analytics
GET /api/analytics/summary?palika_id=1

# Get specific metrics
GET /api/analytics/users?palika_id=1
GET /api/analytics/businesses?palika_id=1
GET /api/analytics/products?palika_id=1
```

### 2. Product Management

**URL:** `/marketplace/products`

**What you can do:**
- View all products in your palika
- Search by product title
- Filter by verification status (Pending, Verified, Rejected)
- Sort by newest, oldest, most viewed, price
- Verify pending products
- Reject products with reason

**API Endpoints:**
```bash
# List products
GET /api/products?palika_id=1&page=1&limit=25&sort=newest

# Get product details
GET /api/products/{id}?palika_id=1

# Verify product
PUT /api/products/{id}/verify?palika_id=1
Body: { "notes": "Looks good" }

# Reject product
PUT /api/products/{id}/reject?palika_id=1
Body: { "reason": "Inappropriate content" }
```

---

## File Locations

### Services
- `admin-panel/services/marketplace-analytics.service.ts` - Analytics logic
- `admin-panel/services/marketplace-products.service.ts` - Product logic

### API Routes
- `admin-panel/app/api/analytics/` - Analytics endpoints
- `admin-panel/app/api/products/` - Product endpoints

### Pages
- `admin-panel/app/marketplace/analytics/page.tsx` - Analytics dashboard
- `admin-panel/app/marketplace/products/page.tsx` - Product listing

### Components
- `admin-panel/components/SummaryCard.tsx` - Metric cards
- `admin-panel/components/TrendChart.tsx` - Trend charts
- `admin-panel/components/CategoryBreakdown.tsx` - Category charts
- `admin-panel/components/VerificationStatusChart.tsx` - Status chart
- `admin-panel/components/ProductTable.tsx` - Product table
- `admin-panel/components/ProductFilters.tsx` - Filter controls
- `admin-panel/components/Pagination.tsx` - Pagination

---

## Important: Auth Context Integration

**Current Status:** Using hardcoded `palika_id = 1`

**What needs to be done:**
1. Get palika_id from authenticated admin user
2. Update all pages to use actual palika_id
3. Update all API calls to pass correct palika_id

**Files to update:**
- `admin-panel/app/marketplace/analytics/page.tsx` (line 48)
- `admin-panel/app/marketplace/products/page.tsx` (line 35)

**Example:**
```typescript
// Before
const palikaId = 1 // Placeholder

// After
const { user } = useAuth() // Get from auth context
const palikaId = user?.palika_id
```

---

## Testing the Implementation

### 1. Start the admin panel
```bash
cd admin-panel
npm run dev
```

### 2. Navigate to analytics
```
http://localhost:3000/marketplace/analytics
```

### 3. Navigate to products
```
http://localhost:3000/marketplace/products
```

### 4. Test API endpoints
```bash
# Test analytics
curl "http://localhost:3000/api/analytics/summary?palika_id=1"

# Test products
curl "http://localhost:3000/api/products?palika_id=1"
```

---

## Database Requirements

### Tables Used
- `profiles` - User data
- `businesses` - Business data
- `marketplace_products` - Product data
- `marketplace_categories` - Category data

### Required Columns
**marketplace_products:**
- `id` - Product ID
- `title` - Product title
- `business_id` - Business ID
- `category` - Category
- `price` - Price
- `image_url` - Image URL
- `verification_status` - Status (pending, verified, rejected)
- `view_count` - View count
- `created_at` - Created date
- `verification_notes` - Verification notes
- `rejection_reason` - Rejection reason
- `verified_at` - Verified date
- `rejected_at` - Rejected date

---

## Common Tasks

### Add a new metric to analytics
1. Add method to `MarketplaceAnalyticsService`
2. Create API endpoint in `app/api/analytics/`
3. Add component to display metric
4. Add to analytics page

### Add a new filter to products
1. Add filter option to `ProductFilters` interface
2. Update `ProductFiltersComponent` UI
3. Update `listProducts` method to handle filter
4. Test filtering

### Change sorting options
1. Update `ProductFilters` interface
2. Update `ProductFiltersComponent` dropdown
3. Update `getSortField` and `getSortAscending` methods
4. Test sorting

---

## Performance Tips

### For Analytics
- Trend data is calculated for 30 days
- Consider caching if queries are slow
- Use database indexes on palika_id, created_at

### For Products
- Pagination defaults to 25 items
- Search uses ILIKE (case-insensitive)
- Sorting is done at database level

### Optimization Ideas
- Add Redis caching for analytics
- Implement real-time updates with Supabase subscriptions
- Add CSV export for reports
- Optimize images with next/image

---

## Troubleshooting

### No data showing
1. Check palika_id is correct
2. Verify data exists in database
3. Check RLS policies
4. Check browser console for errors

### Slow performance
1. Check database indexes
2. Verify query optimization
3. Check network tab for slow requests
4. Consider caching

### Verification not working
1. Check product exists
2. Verify palika_id matches
3. Check database permissions
4. Check API response in network tab

---

## Next Steps

### Phase 6.3: Testing & Stabilization
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Performance testing
- [ ] Bug fixes

### Phase 6.4: Business Profile Management
- [ ] Integrate with m-place
- [ ] Add admin controls
- [ ] Testing

---

## Resources

- **Phase 6 Requirements:** `PHASE_6_ADMIN_PANEL_REQUIREMENTS.md`
- **Implementation Summary:** `PHASE_6_1_IMPLEMENTATION_SUMMARY.md`
- **Admin Panel README:** `admin-panel/README.md`

---

**Last Updated:** 2026-03-21  
**Status:** ✅ Ready for Development
