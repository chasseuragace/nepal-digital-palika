# Admin Panel Overview - Phase 6 Context

**Date:** 2026-03-21  
**Repository:** `admin-panel`  
**Purpose:** Palika admin management interface

---

## What is the Admin Panel?

The **Admin Panel** is where **palika admins** (administrators of individual palikas/municipalities) log in to manage their palika's content and marketplace activity.

**Key Distinction:**
- **Platform Admin Panel** (`platform-admin-panel`) - For super admins managing the entire system
- **Admin Panel** (`admin-panel`) - For palika admins managing their specific palika ← THIS IS PHASE 6
- **Marketplace** (`m-place`) - For regular users buying/selling products

---

## Current Admin Panel Features (Existing)

The admin panel already has:
- ✅ Heritage sites management (CRUD)
- ✅ Events management (CRUD)
- ✅ Blog posts management (CRUD)
- ✅ User management
- ✅ Authentication
- ✅ Dashboard

---

## Phase 6 - What We're Adding

### Phase 6.1: Analytics Dashboard (Apr 1-15)

**New Feature:** Analytics dashboard showing marketplace activity

**What admins will see:**
- Total users registered in their palika
- Total businesses registered in their palika
- Total products in their marketplace
- Breakdown by category
- Breakdown by verification status
- Trends and charts
- Most viewed products
- Recent products

**Example Dashboard:**
```
┌─────────────────────────────────────────────────────┐
│ Analytics Dashboard                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Users    │  │Businesses│  │ Products │         │
│  │   245    │  │    32    │  │   1,240  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Products by Verification Status              │  │
│  │ ████ Verified (1,100)                        │  │
│  │ ██ Pending (120)                             │  │
│  │ █ Rejected (20)                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ User Registration Trend (Last 30 days)       │  │
│  │ ╱╲                                            │  │
│  │╱  ╲╱╲                                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Phase 6.2: Product Management (Apr 15-May 1)

**New Feature:** Browse and manage marketplace products

**What admins will do:**
- View all products in their marketplace
- Sort by: verification status, most viewed, recent, category, price
- Filter by: verification status, category, date range
- Search by: product title, business name
- View product details
- Verify products (change status to verified)
- Reject products (with reason)
- Add verification notes

**Example Product Listing:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Products                                                        │
├─────────────────────────────────────────────────────────────────┤
│ Sort: [Newest ▼]  Filter: [All ▼]  Search: [________]         │
├─────────────────────────────────────────────────────────────────┤
│ Image │ Title              │ Business    │ Category │ Status    │
├───────┼────────────────────┼─────────────┼──────────┼───────────┤
│ [IMG] │ Wooden Handicraft  │ Craft Shop  │ Crafts   │ ✓ Verified│
│ [IMG] │ Trekking Package   │ Trek Tours  │ Tourism  │ ⏳ Pending │
│ [IMG] │ Souvenir Set       │ Gift Store  │ Gifts    │ ✓ Verified│
│ [IMG] │ Local Spices       │ Spice House │ Food     │ ✗ Rejected│
└───────┴────────────────────┴─────────────┴──────────┴───────────┘
```

---

## How It Works - Data Flow

### User Registration Flow
```
User registers in marketplace (m-place)
    ↓
User profile created in Supabase
    ↓
Business profile auto-created
    ↓
Admin sees new user in analytics
```

### Business Registration Flow
```
User creates business in marketplace
    ↓
Business record created in Supabase
    ↓
Admin sees new business in analytics
```

### Product Listing Flow
```
User lists product in marketplace
    ↓
Product record created in Supabase
    ↓
Product status = "pending" (needs verification)
    ↓
Admin sees product in product listing
    ↓
Admin verifies or rejects product
    ↓
Product status updated
    ↓
User sees product in marketplace (if verified)
```

---

## Database Tables Used

### Existing Tables
- `profiles` - User data
- `businesses` - Business data
- `marketplace_products` - Product data
- `marketplace_categories` - Category data
- `admin_users` - Admin data (for authentication)

### No New Tables Needed
All data already exists in the database. Phase 6 just adds UI and API endpoints to view and manage it.

---

## API Endpoints to Create

### Analytics Endpoints
```
GET /api/analytics/users
  Returns: { total, newThisWeek, newThisMonth, trend }

GET /api/analytics/businesses
  Returns: { total, byCategory, newThisWeek, newThisMonth, trend }

GET /api/analytics/products
  Returns: { total, byCategory, byVerificationStatus, mostViewed, recent, trend }
```

### Product Endpoints
```
GET /api/products
  Query params: page, limit, sort, filter, search
  Returns: { data: [], meta: { page, limit, total, totalPages } }

GET /api/products/:id
  Returns: { id, title, businessName, category, price, images, description, ... }

PUT /api/products/:id/verify
  Body: { verificationNotes? }
  Returns: { verificationStatus: 'verified', verified_at }

PUT /api/products/:id/reject
  Body: { rejectionReason }
  Returns: { verificationStatus: 'rejected', rejected_at }
```

---

## Security & Scope

### Palika Scope
All data is scoped to the admin's palika:
- Admin can only see users from their palika
- Admin can only see businesses from their palika
- Admin can only see products from businesses in their palika
- Admin cannot see data from other palikas

### RLS Enforcement
The database has RLS policies that enforce:
- Palika admins can only access their palika's data
- Super admins can access all data
- No cross-palika data access

### Implementation
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

---

## UI Components to Create

### Phase 6.1: Analytics
- `AnalyticsDashboard.tsx` - Main dashboard page
- `SummaryCard.tsx` - Summary card (Users, Businesses, Products, Pending)
- `TrendChart.tsx` - Line chart for trends
- `CategoryChart.tsx` - Pie chart for categories
- `VerificationChart.tsx` - Bar chart for verification status

### Phase 6.2: Product Management
- `ProductListing.tsx` - Product listing page
- `ProductRow.tsx` - Product row in table
- `ProductDetails.tsx` - Product details modal
- `VerificationDialog.tsx` - Verification dialog
- `FilterSidebar.tsx` - Filter sidebar

---

## File Structure

```
admin-panel/
├── src/
│   ├── api/
│   │   ├── analytics.ts (NEW - Phase 6.1)
│   │   ├── products.ts (NEW - Phase 6.2)
│   │   └── ... (existing)
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx (NEW - Phase 6.1)
│   │   ├── SummaryCard.tsx (NEW - Phase 6.1)
│   │   ├── TrendChart.tsx (NEW - Phase 6.1)
│   │   ├── ProductListing.tsx (NEW - Phase 6.2)
│   │   ├── ProductDetails.tsx (NEW - Phase 6.2)
│   │   └── ... (existing)
│   ├── pages/
│   │   ├── Analytics.tsx (NEW - Phase 6.1)
│   │   ├── Products.tsx (NEW - Phase 6.2)
│   │   └── ... (existing)
│   └── ... (existing)
└── ... (existing)
```

---

## Timeline

| Phase | Dates | Duration | What |
|-------|-------|----------|------|
| 6.1 | Apr 1-15 | 2 weeks | Analytics dashboard |
| 6.2 | Apr 15-May 1 | 2.5 weeks | Product management |
| 6.3 | May 1-15 | 2 weeks | Testing & commit |
| 6.4 | May 15-30 | 2 weeks | Business profiles (m-place) |

---

## Success Criteria

### Phase 6.1: Analytics
- ✅ Dashboard displays correctly
- ✅ All metrics scoped to palika
- ✅ Real-time data from Supabase
- ✅ Charts render correctly
- ✅ Performance < 1s load time

### Phase 6.2: Product Management
- ✅ Product listing displays all products
- ✅ Sorting/filtering works correctly
- ✅ Pagination works correctly
- ✅ Verification status updates
- ✅ All data scoped to palika

### Phase 6.3: Commit
- ✅ All code committed
- ✅ Tests passing (95%+)
- ✅ Documentation complete
- ✅ Performance optimized

---

## Related Repositories

| Repo | Purpose | Phase |
|------|---------|-------|
| `admin-panel` | Palika admin interface | 6 (THIS) |
| `platform-admin-panel` | Super admin interface | 4 |
| `m-place` | Marketplace for users | 6.4 |

---

## Next Steps

1. **Understand Current Admin Panel**
   - Review existing code
   - Understand authentication
   - Understand RLS enforcement

2. **Create Analytics Endpoints**
   - User count query
   - Business count query
   - Product count query
   - Trend queries

3. **Build Analytics Dashboard**
   - Summary cards
   - Charts
   - Real-time updates

4. **Create Product Endpoints**
   - Product listing query
   - Product details query
   - Verification update query

5. **Build Product Management UI**
   - Product listing page
   - Sorting/filtering
   - Verification dialog

---

## Documentation

- `ROADMAP.md` - Full project roadmap
- `PHASE_6_ADMIN_PANEL_REQUIREMENTS.md` - Detailed requirements
- `PHASE_6_SUMMARY.md` - Phase 6 summary

---

**Status:** 🔵 Ready for Implementation  
**Start Date:** 2026-04-01  
**Repository:** `admin-panel`

