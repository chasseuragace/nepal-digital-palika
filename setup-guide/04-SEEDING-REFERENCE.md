# Seeding Reference

Complete reference for all data that gets seeded into the database.

## Overview

The seeding process populates the database with:
1. **Infrastructure data** - Required for system operation
2. **Test data** - For development and testing

## Infrastructure Data

### Provinces (7 records)

Nepal's 7 provinces with Nepali and English names.

**Table:** `provinces`

| ID | Name (English) | Name (Nepali) |
|----|----------------|---------------|
| 1 | Koshi Province | कोशी प्रदेश |
| 2 | Madhesh Province | मधेश प्रदेश |
| 3 | Bagmati Province | बागमती प्रदेश |
| 4 | Gandaki Province | गण्डकी प्रदेश |
| 5 | Lumbini Province | लुम्बिनी प्रदेश |
| 6 | Karnali Province | कर्णाली प्रदेश |
| 7 | Sudurpashchim Province | सुदूरपश्चिम प्रदेश |

---

### Districts (77 records)

All 77 districts of Nepal, linked to their provinces.

**Table:** `districts`

Examples:
- Kathmandu (Province 3)
- Bhaktapur (Province 3)
- Lalitpur (Province 3)
- Morang (Province 1)
- Chitwan (Province 3)

**Total:** 77 districts across 7 provinces

---

### Palikas (372 records)

All municipalities and rural municipalities.

**Table:** `palikas`

**Types:**
- Metropolitan (5)
- Sub-Metropolitan (11)
- Municipality (276)
- Rural Municipality (460)

**Examples:**
- Kathmandu Metropolitan
- Bhaktapur Municipality
- Lalitpur Metropolitan
- Pokhara Metropolitan
- Bharatpur Metropolitan

**Total:** 372 palikas (sample set, not all 753)

---

### Subscription Tiers (3 records)

Three tiers for palika subscriptions.

**Table:** `subscription_tiers`

| Tier | Level | Price | Features |
|------|-------|-------|----------|
| Basic | 1 | Free | 10 features |
| Tourism | 2 | Paid | 20 features |
| Premium | 3 | Paid | 27 features |

**Features by Tier:**
- **Basic:** Essential features for all palikas
- **Tourism:** Tourism-focused features
- **Premium:** All features including marketplace

---

### Platform Features (27 records)

Features available across different tiers.

**Table:** `features`

**Categories:**
1. **Core Features** (all tiers)
   - Heritage site management
   - Event management
   - Basic analytics

2. **Tourism Features** (Tourism+ tiers)
   - Advanced analytics
   - Blog management
   - Tourism promotion

3. **Premium Features** (Premium only)
   - Marketplace
   - Business verification
   - Advanced marketplace features

**Total:** 27 features with tier-based access

---

### User Roles (6 records)

Role-based access control system.

**Table:** `roles`

| Role | Description |
|------|-------------|
| super_admin | Full system access |
| palika_admin | Palika-level administration |
| content_editor | Content creation and editing |
| content_reviewer | Content review and approval |
| support_agent | User support |
| moderator | Content moderation |

---

### Permissions (12 records)

Granular permissions for role-based access.

**Table:** `permissions`

1. manage_heritage_sites
2. manage_events
3. manage_businesses
4. manage_blog_posts
5. manage_users
6. manage_admins
7. manage_sos
8. manage_support
9. moderate_content
10. view_analytics
11. manage_categories
12. send_notifications

---

### Content Categories (27 records)

Categories for different content types.

**Table:** `categories`

**Heritage Categories:**
- Temple
- Monastery
- Palace
- Fort
- Museum
- Archaeological Site
- Natural Heritage

**Event Categories:**
- Festival
- Cultural
- Sports
- Religious
- Food
- Music
- Educational

**Business Categories:**
- Accommodation
- Restaurant
- Tour Operator
- Transport
- Shopping
- Entertainment
- Emergency Services
- Government Office

**Blog Categories:**
- Tourism News
- Cultural Stories
- Local Events
- Heritage Updates
- Community News

---

### Marketplace Categories (26 records)

Tier-gated product categories.

**Table:** `marketplace_categories`

**Tier 1 (Basic) - 9 categories:**
- Fresh Vegetables
- Fresh Fruits
- Dairy Products
- Eggs & Poultry
- Grains & Pulses
- Spices & Herbs
- Honey & Bee Products
- Handicrafts
- Textiles & Fabrics

**Tier 2 (Tourism) - 8 categories:**
- Organic Products
- Processed Foods
- Pickles & Preserves
- Tea & Coffee
- Traditional Snacks
- Herbal Products
- Wooden Crafts
- Pottery & Ceramics

**Tier 3 (Premium) - 9 categories:**
- Premium Handicrafts
- Jewelry & Accessories
- Art & Paintings
- Musical Instruments
- Religious Items
- Antiques & Collectibles
- Premium Textiles
- Leather Goods
- Metal Crafts

---

### Business Categories (8 records)

Types of businesses that can be registered.

**Table:** `business_categories`

1. **Accommodation** - Hotels, guesthouses, homestays
2. **Food & Beverage** - Restaurants, cafes, food stalls
3. **Producer** - Farmers, manufacturers
4. **Tour Guide** - Tourism services
5. **Professional Service** - Consultants, services
6. **Artisan Workshop** - Craftspeople, workshops
7. **Transportation** - Transport services
8. **Retail Shop** - Shops, stores

---

## Test Data

### Palika Tier Assignments (5 records)

Sample palikas with tier assignments for testing.

**Table:** `palikas` (subscription_tier_id updated)

| Palika ID | Name | Tier |
|-----------|------|------|
| 1 | Bhojpur Municipality | Premium |
| 2 | Shadananda Municipality | Tourism |
| 3 | Aamchok Rural Municipality | Tourism |
| 4 | Arun Rural Municipality | Basic |
| 10 | Dhankuta Municipality | Tourism |

---

### Test Users (8 records)

Test users for development and testing.

**Tables:** `auth.users`, `profiles`

**All users have password:** `TestPassword123!@#`

| Email | Name | Palika |
|-------|------|--------|
| ramesh.sharma@test.com | Ramesh Sharma | Arun (Basic) |
| sita.poudel@test.com | Sita Poudel | Arun (Basic) |
| deepak.niroula@test.com | Deepak Niroula | Shadananda (Tourism) |
| maya.gurung@test.com | Maya Gurung | Shadananda (Tourism) |
| pradeep.singh@test.com | Pradeep Singh | Aamchok (Tourism) |
| anita.rai@test.com | Anita Rai | Aamchok (Tourism) |
| keshav.prasad@test.com | Keshav Prasad | Bhojpur (Premium) |
| bishnu.lamsal@test.com | Bishnu Lamsal | Bhojpur (Premium) |

---

### Test Businesses (8 records)

One business per test user.

**Table:** `businesses`

**Distribution:**
- **Tier 1 (Basic):** 2 businesses
- **Tier 2 (Tourism):** 4 businesses
- **Tier 3 (Premium):** 2 businesses

**Business Types:**
- Producer
- Retail Shop
- Tour Guide
- Artisan Workshop
- Food & Beverage
- Professional Service
- Accommodation

---

### Test Products (16 records)

Marketplace products for testing.

**Table:** `marketplace_products`

**Distribution:**
- **Tier 1:** 4 products (basic categories)
- **Tier 2:** 8 products (tourism categories)
- **Tier 3:** 4 products (premium categories)

**Product Examples:**
- Fresh Vegetables
- Organic Products
- Handicrafts
- Premium Textiles
- Honey & Bee Products
- Traditional Snacks

---

### Test Comments (15 records)

Threaded comments on products.

**Table:** `marketplace_product_comments`

**Features:**
- Top-level comments
- Nested replies
- Owner replies (business owners responding)
- Approved and visible comments

---

## Data Relationships

### Province → District → Palika
```
Province (7)
  └─ District (77)
      └─ Palika (372)
```

### Tier → Features → Palika
```
Subscription Tier (3)
  ├─ Features (27)
  └─ Palika (assigned tier)
```

### User → Business → Product
```
User (auth.users)
  └─ Profile
      └─ Business
          └─ Product
              └─ Comments
```

### Role → Permission
```
Role (6)
  └─ Permissions (12)
```

---

## Verification Queries

Check data was seeded correctly:

```sql
-- Infrastructure
SELECT COUNT(*) FROM provinces;                    -- 7
SELECT COUNT(*) FROM districts;                    -- 77
SELECT COUNT(*) FROM palikas;                      -- 372
SELECT COUNT(*) FROM subscription_tiers;           -- 3
SELECT COUNT(*) FROM features;                     -- 27
SELECT COUNT(*) FROM tier_features;                -- 57
SELECT COUNT(*) FROM roles;                        -- 6
SELECT COUNT(*) FROM permissions;                  -- 12
SELECT COUNT(*) FROM categories;                   -- 27
SELECT COUNT(*) FROM marketplace_categories;       -- 26
SELECT COUNT(*) FROM business_categories;          -- 8

-- Test Data
SELECT COUNT(*) FROM auth.users;                   -- 8
SELECT COUNT(*) FROM profiles;                     -- 8
SELECT COUNT(*) FROM businesses;                   -- 8
SELECT COUNT(*) FROM marketplace_products;         -- 16
SELECT COUNT(*) FROM marketplace_product_comments; -- 15

-- Tier Assignments
SELECT COUNT(*) FROM palikas 
WHERE subscription_tier_id IS NOT NULL;            -- 5
```

---

## Data Sources

### Infrastructure Data
- **Geographic data:** Official Nepal government sources
- **Tiers & Features:** Product requirements
- **Roles & Permissions:** RBAC design
- **Categories:** Content taxonomy design

### Test Data
- **Users:** Generated test data
- **Businesses:** Sample businesses for testing
- **Products:** Sample products across tiers
- **Comments:** Sample threaded discussions

---

## Important Notes

### Palika Identification
- Palikas use **numeric IDs**, not codes
- No KTM001 or BHK001 codes exist
- Query by name: `SELECT id FROM palikas WHERE name_en = 'Kathmandu Metropolitan'`

### Tier Gating
- Marketplace categories are tier-gated
- Products can only use categories available to their palika's tier
- Enforced at application level

### Test Data Distribution
- Designed to test all three tiers
- Covers different business types
- Includes threaded comments for testing

### Upsert Operations
- All seeding scripts use upsert (INSERT ... ON CONFLICT)
- Safe to run multiple times
- Won't create duplicates

---

## Summary

**Total Records Seeded:**
- Infrastructure: ~600 records
- Test Data: ~50 records
- **Total: ~650 records**

**Time to Seed:** ~1 minute

**Storage:** <10 MB

---

**For verification:** Run `quick-table-check.ts` to confirm all data is present.
