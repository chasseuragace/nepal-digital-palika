# Marketplace Feature: Planned vs. Implemented

**Date:** March 18, 2026
**Status:** Core infrastructure implemented, feature gating in place
**Tier-Dependent:** Marketplace is a tier-gated feature (Premium tier)

---

## Strategic Context

From **CORE_FEATURES_FOCUS.md**, the marketplace is one of **three core features** that define the platform:
1. Smart Notifications (all tiers)
2. Emergency SOS System (all tiers)
3. **Digital Marketplace** (Premium tier+ only)

### Target Vision
> "Digital platform connecting farmers, artisans, and service providers to customers worldwide. Direct sales mean more revenue stays in the community."

**Year 1 Target:** 2,500+ registered businesses on platform

---

## What Was PLANNED (from Project Proposal & Business Model)

### For "Palika Digital Services Bundle" (Non-Tourism Palikas)

**Local Economy Support Section:**
- Local marketplace (producers, artisans, services)
- Business and entrepreneur profiles
- Agricultural product showcases
- Local service provider directory

**For Whom:**
- Farmers
- Artisans and craftspeople
- Small entrepreneurs
- Service providers
- Homestay operators

**For Tourism Bundle Palikas:**
- Accommodation and service listings
- Local business visibility
- Enhanced commerce capabilities

---

## What Was IMPLEMENTED in Supabase

### Core Tables (Migration 20250125000002)

#### 1. **`businesses`** - Main marketplace directory
```sql
-- Attributes
id UUID PRIMARY KEY
palika_id INTEGER (geo-hierarchical)
owner_user_id UUID (actual business owner)
business_name VARCHAR(300) + Nepali
business_type_id INTEGER (references categories)
phone, email, address, location (PostGIS)
ward_number INTEGER (1-35)

-- Marketplace Attributes
price_range JSONB {min, max, currency, unit}
operating_hours JSONB (per day of week)
facilities JSONB {parking, wifi, restaurant, guide_service}
languages_spoken TEXT[] {en, ne}
details JSONB (flexible schema for business-specific data)

-- Content & Media
featured_image TEXT
images JSONB[] (array of image URLs)
description TEXT (500-1000 chars typically)

-- Social Proof
rating_average NUMERIC(3,2) (0.00-5.00)
rating_count INTEGER
view_count INTEGER
contact_count INTEGER
inquiry_count INTEGER

-- Verification & Publishing
verification_status VARCHAR(50) [pending, verified, rejected, suspended]
verified_at TIMESTAMPTZ
verified_by UUID (admin_users reference)
is_published BOOLEAN
is_active BOOLEAN
is_featured BOOLEAN (for homepage)

-- Audit
created_by, updated_by UUID (auth.users)
created_at, updated_at TIMESTAMPTZ
```

#### 2. **`business_images`** - Image management
```sql
id UUID PRIMARY KEY
business_id UUID REFERENCES businesses
image_url VARCHAR(512)
is_featured BOOLEAN (for cover image)
sort_order INTEGER (gallery ordering)
created_at TIMESTAMPTZ
UNIQUE(business_id, image_url)
```

#### 3. **`categories`** - Generic category system
```sql
id SERIAL PRIMARY KEY
palika_id INTEGER (null = system-wide categories)
entity_type VARCHAR(50) ['business', 'heritage_site', 'event', 'blog_post']
name_en, name_ne VARCHAR(100)
slug VARCHAR(100) UNIQUE
parent_id INTEGER (hierarchical - allows subcategories)
description, icon_url TEXT
display_order INTEGER
is_active BOOLEAN
created_at TIMESTAMPTZ

-- Example categories for businesses:
- Accommodation
  ├─ Hotels
  ├─ Homestays
  ├─ Guest Houses
  └─ Hostels
- Food & Drink
  ├─ Restaurants
  ├─ Cafes
  ├─ Local Eateries
  └─ Street Food
- Shopping
  ├─ Handicrafts
  ├─ Local Products
  ├─ Souvenirs
  └─ Groceries
- Services
  ├─ Tour Guides
  ├─ Transportation
  ├─ Photography
  └─ Equipment Rental
- Local Products (Marketplace Specific)
  ├─ Honey Producers
  ├─ Tea Gardens
  ├─ Organic Farms
  └─ Artisan Workshops
- Activities
  ├─ Trekking Guides
  ├─ Paragliding
  ├─ Boating
  └─ Cycling Tours
- Healthcare
  ├─ Hospitals
  ├─ Clinics
  ├─ Pharmacies
  └─ Ayurvedic Centers
- Professional Services
  ├─ Lawyers
  ├─ Accountants
  ├─ IT Services
  └─ Consultants
```

#### 4. **`reviews`** - Business ratings & reviews
```sql
id UUID PRIMARY KEY
business_id UUID REFERENCES businesses
user_id UUID REFERENCES profiles
rating INTEGER (1-5)
title VARCHAR(200)
comment TEXT
owner_response TEXT (business can respond)
owner_responded_at TIMESTAMPTZ
helpful_count INTEGER
is_approved BOOLEAN
created_at, updated_at TIMESTAMPTZ
UNIQUE(business_id, user_id) -- one review per user per business
```

#### 5. **`inquiries`** - Customer interest tracking
```sql
id UUID PRIMARY KEY
business_id UUID REFERENCES businesses
user_id UUID REFERENCES profiles
inquiry_code VARCHAR(40) UNIQUE -- tracking code for customer

-- Inquiry Status Workflow
inquiry_status VARCHAR(30) [new, contacted, confirmed, completed, cancelled]
inquiry_data JSONB -- flexible: {dates, guests, rooms, notes, etc.}
status_updated_at TIMESTAMPTZ
confirmed_at TIMESTAMPTZ
completed_at TIMESTAMPTZ

-- Economic Tracking
estimated_revenue NUMERIC(10,2) (admin estimate)
actual_revenue NUMERIC(10,2) (if disclosed)
internal_notes TEXT (private admin notes)

created_at, updated_at TIMESTAMPTZ
```

---

### Approval & Verification System (Migration 20250301000028)

#### 6. **`approval_workflows`** - Customizable per-Palika rules
```sql
id UUID PRIMARY KEY
palika_id INTEGER UNIQUE (one workflow per Palika)

-- Rules Engine
rules JSONB DEFAULT '[]'
  Example: [
    {id: '1', name: 'PAN Verification', enabled: true, order: 1, type: 'document'},
    {id: '2', name: 'Business License Check', enabled: true, order: 2, type: 'document'},
    {id: '3', name: 'Site Visit', enabled: true, order: 3, type: 'field_inspection'}
  ]

-- SLA Settings
sla_days INTEGER (approval deadline, e.g., 7 days)
auto_approve_after_days INTEGER (auto-approve if deadline passes)
requires_supervisor_review BOOLEAN

-- Configuration
settings JSONB (flexible palika-specific settings)
created_at, updated_at TIMESTAMPTZ
updated_by UUID REFERENCES admin_users
```

#### 7. **`approval_notes`** - Internal audit trail
```sql
id UUID PRIMARY KEY
business_id UUID REFERENCES businesses
content TEXT (review comment, rejection reason, etc.)
is_internal BOOLEAN (true = not visible to owner)
author_id UUID REFERENCES admin_users
created_at, updated_at TIMESTAMPTZ
```

---

### Tier-Gating System (Migration 20250301000034)

#### 8. **`subscription_tiers`** - Service tier definitions
```sql
id UUID PRIMARY KEY
name VARCHAR(50) UNIQUE [basic, tourism, premium]
display_name VARCHAR(100)
description TEXT
sort_order INT
cost_per_month NUMERIC(10,2)
cost_per_year NUMERIC(10,2)
is_active BOOLEAN

-- Example structure
basic:
  - display_name: "Palika Services"
  - features: [notifications, sos_system]

tourism:
  - display_name: "Tourism & Services"
  - features: [notifications, sos_system, basic_marketplace]

premium:
  - display_name: "Premium Edition"
  - features: [notifications, sos_system, full_marketplace, payment_integration, analytics]
```

#### 9. **`features`** - Granular feature definitions
```sql
id UUID PRIMARY KEY
code VARCHAR(100) UNIQUE [qr_print_support, business_registration, marketplace, payment_processing, etc.]
display_name VARCHAR(150)
description TEXT
category VARCHAR(50) [marketplace, tourism, citizen_services]
is_active BOOLEAN

-- Example marketplace features
- business_registration (can business owners register themselves?)
- marketplace_listings (can businesses be shown in marketplace?)
- business_verification (required verification before publishing?)
- merchant_analytics (can businesses see analytics of their listing?)
- payment_integration (can accept payments directly?)
- global_reach (promoted to international customers?)
```

#### 10. **`tier_features`** - Tier → Feature mapping
```sql
tier_id UUID REFERENCES subscription_tiers
feature_id UUID REFERENCES features
enabled BOOLEAN
unlocked_at_version VARCHAR(20) (e.g., "v1.2.0")
PRIMARY KEY (tier_id, feature_id)

-- Example mappings
tier=premium & feature=marketplace_listings → enabled=true
tier=tourism & feature=marketplace_listings → enabled=true (basic)
tier=basic & feature=marketplace_listings → enabled=false
tier=premium & feature=payment_integration → enabled=true
tier=tourism & feature=payment_integration → enabled=false
```

#### 11. **Helper Function** - Feature access checking
```sql
palika_has_feature(palika_id INTEGER, feature_code VARCHAR) → BOOLEAN
-- Usage: palika_has_feature(1, 'marketplace') returns true if tier allows it
```

#### 12. **`palikas` table updated**
```sql
ALTER TABLE palikas ADD subscription_tier_id UUID REFERENCES subscription_tiers
-- Now each Palika has a tier assignment that gates feature access
```

---

## User-Facing Features (from MOBILE_APP_SPECIFICATION.md)

### For Customers - Services Tab (🏪)

**Browse Marketplace:**
```
Categories:
🏨 Stay | 🍽️ Food | 🚗 Transport | 🏪 Shopping | 🎨 Artisans | 🥾 Activities
🏥 Healthcare | 🏛️ Government

Featured Businesses:
- Photo gallery + "Palika Verified" badge
- Rating & reviews (e.g., ⭐ 4.5 with 23 reviews)
- Distance from user (e.g., 2.3 km away)
- Price range (e.g., NPR 2000/night)
- Key attributes (WiFi, Meals, etc.)
- [View Details] button

Business Detail Page:
- Full photo gallery (swipeable)
- Facilities & amenities with checkmarks
- Room/product types & pricing
- Owner profile with experience
- Google Map embedded
- Customer reviews (sortable, filterable)
- Nearby attractions
- [Call] [Message] [Directions] buttons
```

### For Business Owners - Business Registration (5-Step Flow)

**Step 1: Business Type Selection**
```
Categories:
- Accommodation (Hotel/Homestay)
- Restaurant / Cafe
- Shop / Store
- Tour Guide / Activity
- Producer (Honey/Tea/Crafts)
- Professional Service
- Other
```

**Step 2: Basic Information**
```
- Business Name (en + ne)
- Owner Name
- Phone (verified)
- Email (optional)
- Ward Number (1-35)
- Address/Location
- 📍 Pin location on map
```

**Step 3: Business-Specific Details**
```
For Homestay:
- Number of rooms
- Room types (single, double, triple, dorm)
- Amenities (WiFi, hot water, meals, parking, garden, laundry)
- Price range (from X to Y per night)
- Description (max 500 words)

For Producer (Honey, Tea, etc.):
- Product details
- Quantity available
- Price
- Certification details

For Professional Service:
- Service description
- Experience/qualifications
- Service areas
- Rates
```

**Step 4: Media & Documents**
```
- Business photos (5-10 recommended)
- Business License (if applicable)
- License Number
- PAN Number
```

**Step 5: Review & Submit**
```
- Summary of all information
- Confirmation checkboxes
- Submit for Verification
- Get Request ID (e.g., #BUS-2025-5678)
- Status: PENDING VERIFICATION
```

### Business Dashboard (After Approval)

```
My Business Status:
- 🏨 Mountain View Homestay
- ⭐ Palika Verified badge
- Status: ACTIVE ●

Quick Stats (This Month):
- 👁️ 234 Views
- 📞 12 Contacts
- ⭐ 4.5 Rating (5 reviews)
- 📈 +15% vs last month

Actions:
- ✏️ Edit Business Info
- 📷 Update Photos
- 💬 View Reviews
- 📊 View Analytics

Recent Activity:
- New review (2 days ago)
- Contact inquiry (5 days ago)
- Photo updated (1 week ago)
```

### Inquiry Tracking System

**Customer Flow:**
```
1. Tourist browses "Mountain View Homestay"
2. Clicks [Contact Business]
3. System generates Inquiry Code: XYZ-1234
4. Options: [Call] [WhatsApp] [Send Message]
5. Tourist mentions code when contacting

Business Owner Flow:**
1. Receives notification: "New Inquiry #XYZ-1234"
2. Views customer details (name, contact, dates, notes)
3. Arranges booking via direct contact
4. Updates inquiry status:
   - [Booking Confirmed] → dates, guests, rooms
   - [Booking Completed]
   - [Customer Cancelled]
   - [Did Not Book]

Customer Confirmation (Optional):**
1. After checkout: "Did you stay at Mountain View?" (Inquiry #XYZ-1234)
2. [Yes, I stayed there] → prompts for review
3. [No, I didn't stay]
4. Transaction confirmed in system

Analytics (Admin View):**
- Total Inquiries: 45
- Confirmed Bookings: 23 (51%)
- Completed Stays: 20 (44%)
- Customer Verified: 18 (40%)
- Cancellations: 3 (7%)
- Estimated Revenue: NPR 100,000/month
```

---

## What's Connected in the Database

### Row-Level Security (RLS)

**Business Owner Access:**
```sql
-- Can manage only their own businesses
auth.uid() = owner_user_id
```

**Palika Staff Access:**
```sql
-- Can manage businesses in their assigned Palika
public.user_has_access_to_palika(palika_id)
AND public.user_has_permission('manage_businesses')
```

**Public Access:**
```sql
-- Can read published, approved businesses
is_published = true AND status = 'approved'
```

### Audit Trails

**Business Images RLS:**
```
- Owner: read/write own images
- Palika staff: read/write if managing business
- Public: read published images
```

**Approval Workflows RLS:**
```
- Palika admin: read/write their workflow
- Super admin: all access
```

**Approval Notes RLS:**
```
- Palika staff: read/write notes for their businesses
- Super admin: read all
```

---

## Status: What's Ready, What's Missing

### ✅ IMPLEMENTED
| Feature | Status | Details |
|---------|--------|---------|
| Business Directory Table | ✅ Complete | Full `businesses` table with all attributes |
| Multi-language Support | ✅ Complete | name_en, name_ne, description_ne fields |
| Category System | ✅ Complete | Hierarchical categories with icons |
| Reviews & Ratings | ✅ Complete | Full 5-star review system with owner response |
| Inquiry Tracking | ✅ Complete | inquiries table with status workflow |
| Image Management | ✅ Complete | business_images table with ordering |
| Verification Workflow | ✅ Complete | approval_workflows + approval_notes |
| Tier Gating | ✅ Complete | subscription_tiers + features + tier_features |
| RLS Security | ✅ Complete | Owner, staff, public access policies |
| Geographic Tagging | ✅ Complete | PostGIS location + ward_number |
| Audit Logging | ✅ Complete | created_by/updated_by + timestamps |

### ⚠️ PARTIALLY IMPLEMENTED
| Feature | Status | Details |
|---------|--------|---------|
| Payment Integration | ❌ Not in DB | Inquiry-based (no payment processing) |
| Merchant Analytics | ⚠️ Partial | can_see_stats but no analytics tables |
| API for Marketplace | ⚠️ Partial | Tables exist, API endpoints TBD |
| Search & Filter | ⚠️ Partial | Categories exist, search implementation TBD |

### ❌ NOT IMPLEMENTED
| Feature | Status | Reason |
|---------|--------|--------|
| In-App Payments | ❌ No | By design - marketplace is discovery only |
| Shipping/Logistics | ❌ No | Direct customer-business coordination |
| Dispute Resolution | ❌ No | Out of scope for MVP |
| Wishlist Feature | ⚠️ Partial | Uses generic `favorites` table |

---

## Tier-Based Feature Availability

### Tier: "Basic" (Palika Services)
- **Marketplace:** ❌ NOT INCLUDED
- Features: Notifications, SOS only
- Annual Cost: ~NPR 150,000

### Tier: "Tourism" (Tourism & Services)
- **Marketplace:** ✅ BASIC (included)
  - Business directory browsable
  - Inquiry tracking
  - Reviews visible
  - Limited to tourism-related businesses
- Additional Features: Heritage sites, events
- Annual Cost: ~NPR 200,000

### Tier: "Premium" (Premium Edition)
- **Marketplace:** ✅ FULL (complete implementation)
  - All marketplace features enabled
  - Producer/artisan profiles highlighted
  - Advanced business analytics
  - Payment integration ready (structural)
  - Global reach features
- Additional Features: All features + advanced analytics
- Annual Cost: ~NPR 250,000

---

## Helper Functions Available

```sql
-- Check if Palika has feature
palika_has_feature(palika_id, 'marketplace') → BOOLEAN

-- Get Palika's tier
get_palika_tier(palika_id) → UUID

-- Get pending businesses (for admin)
get_pending_businesses_for_palika(palika_id) → TABLE (...)

-- Check if user can see business
user_can_see_business(business_id) → BOOLEAN
```

---

## Summary: Marketplace Readiness

**Database Level:** ✅ **99% READY**
- All tables created
- RLS policies implemented
- Tier gating in place
- Audit trails complete

**API Level:** ⚠️ **TO BE IMPLEMENTED**
- Need GET /api/businesses endpoints
- Need POST /api/businesses (register)
- Need PUT /api/businesses/:id (manage)
- Need POST /api/inquiries
- Need business search/filter

**Admin Panel Level:** ⚠️ **PARTIALLY DONE**
- Business listing page exists
- Approval workflow exists
- Business CRUD exists (from platform-admin-panel)
- Category management needed
- Tier assignment management needed

**Mobile App Level:** ⚠️ **NOT STARTED**
- Services tab (🏪) designed but not built
- Business registration flow designed but not built
- Inquiry tracking designed but not built

---

## Next Steps for Implementation

### Phase 1: API Endpoints (Priority)
```
POST /api/businesses - Register new business
GET /api/businesses - List all (with filters)
GET /api/businesses/:id - Single business detail
PUT /api/businesses/:id - Edit (owner)
GET /api/categories - List categories
POST /api/inquiries - Create inquiry
GET /api/inquiries - Track inquiries
POST /api/reviews - Submit review
```

### Phase 2: Admin Features
```
- Business verification workflow UI
- Approval notes management
- Tier assignment management
- Category management
- Analytics dashboard
```

### Phase 3: Mobile App
```
- Services tab implementation
- Business registration forms
- Inquiry management
- Review submission
- Analytics view
```

---

**Created:** March 18, 2026
**For:** Nepal Digital Tourism Platform
**Status:** Core infrastructure ✅ | API/UI implementation 🔄