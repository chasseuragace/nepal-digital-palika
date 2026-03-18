# Marketplace Categories Seeding Guide

## Quick Start

### Prerequisites
- Tables created by migrations:
  - `business_categories`
  - `marketplace_categories`
  - `subscription_tiers` (already exists)
  - `features` (already exists)
  - `tier_features` (already exists)

### Run the Seeding Script

```bash
npx ts-node database/scripts/seed-marketplace-categories.ts
```

### What Gets Seeded

#### 1. Business Categories (8)
```
✅ Accommodation
✅ Food & Beverage
✅ Producer
✅ Tour Guide & Activities
✅ Professional Service
✅ Artisan Workshop
✅ Transportation
✅ Retail Shop
```

#### 2. Marketplace Categories (26 total)

**TIER 1 (Basic Palikas) - 9 categories:**
- Agriculture Products
- Animal Products
- Essential Daily Items
- Vegetables & Fruits
- Honey & Bee Products
- Tea & Coffee
- Dairy Products
- Spices & Herbs
- Nuts & Seeds

**TIER 2 (Tourism Palikas) - 8 additional categories:**
- Handwoven Textiles
- Traditional Crafts
- Clothing & Apparel
- Footwear
- Household Goods
- Electronics & Accessories
- Beauty & Personal Care
- Sports Equipment

**TIER 3 (Premium Palikas) - 9 additional categories:**
- Luxury Items
- Premium Jewelry
- Premium Crafts
- High-End Fashion
- Specialized Services
- Consulting & Expert Services
- Premium Accommodation Experiences
- Exclusive Tours & Experiences

#### 3. Marketplace Features (4)
- marketplace_listing
- marketplace_approval_workflow
- marketplace_comments
- marketplace_analytics

#### 4. Tier-Feature Mappings
```
Tier 1 (Basic):     No marketplace features (none enabled)
Tier 2 (Tourism):   marketplace_listing + marketplace_comments
Tier 3 (Premium):   All 4 marketplace features
```

---

## Script Structure

### Step 1: Seed Business Categories
- Inserts 8 business types
- Each has name_en, name_ne, slug, description, icon_url

### Step 2: Seed Marketplace Categories
- Inserts 26 product categories
- Each has:
  - `min_tier_level` (1, 2, or 3) - determines availability
  - `name_en`, `name_ne` - bilingual names
  - `slug` - unique identifier
  - `icon_url` - UI icon
  - `display_order` - sorting

### Step 3: Seed Features
- Inserts 4 marketplace-specific features
- Links to feature codes (already handled)

### Step 4: Map Features to Tiers
- Tourism tier gets: marketplace_listing + comments
- Premium tier gets: all features
- Basic tier gets: none (no marketplace)

---

## Database Flow

```
After seeding:

palikas (tier_id)
  ↓
subscription_tiers
  ↓
tier_features
  ↓
features (code='marketplace_listing', etc.)

+

marketplace_categories (min_tier_level)
  ↓
When business owner creates product:
  GET palika.subscription_tier → Get min_tier_level
  FILTER marketplace_categories WHERE min_tier_level <= tier_level
  → Only show allowed categories
```

---

## Environment Setup

Make sure `.env` has:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Customization

### Add/Remove Categories
Edit the arrays in the script:
- `businessCategories` - business types
- `marketplaceCategories` - product types

### Change Tier Mappings
Edit `tierFeatureMappings`:
```typescript
const tierFeatureMappings = {
  basic: [...],      // Tier 1
  tourism: [...],    // Tier 2
  premium: [...],    // Tier 3
}
```

### Update Icon URLs
Replace `/icons/*.svg` with actual icon paths

---

## Output Example

```
🛍️  Seeding marketplace categories...

📁 Seeding business categories...
✅ Seeded business category: Accommodation
✅ Seeded business category: Food & Beverage
... (6 more)

🏪 Seeding marketplace categories...
✅ Seeded marketplace category: Agriculture Products (Tier 1)
✅ Seeded marketplace category: Animal Products (Tier 1)
... (24 more)

🎁 Seeding marketplace features and tier mappings...
✅ Seeded 4 marketplace features

🔗 Mapping marketplace features to tiers...
✅ Mapped 2 marketplace features for tier: tourism
✅ Mapped 4 marketplace features for tier: premium

✨ Marketplace category seeding complete!

📊 Summary:
   ✅ Business Categories: 8
   ✅ Marketplace Categories: 26 (Tier 1: 9, Tier 2: 8, Tier 3: 9)
   ✅ Marketplace Features: 4
   ✅ Tier-Feature Mappings: Tourism + Premium
```

---

## Verification

After seeding, verify in Supabase:

```sql
-- Check business categories
SELECT COUNT(*) FROM business_categories;
-- Expected: 8

-- Check marketplace categories
SELECT COUNT(*) FROM marketplace_categories;
-- Expected: 26

-- Check tier 1 access
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level = 1;
-- Expected: 9

-- Check tier 2 access
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 2;
-- Expected: 17 (9+8)

-- Check tier 3 access
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 3;
-- Expected: 26 (all)

-- Check feature mappings
SELECT tier_id, COUNT(*) as feature_count
FROM tier_features
WHERE feature_id IN (SELECT id FROM features WHERE category='marketplace')
GROUP BY tier_id;
-- Expected: tourism(2), premium(4)
```

---

## Next Steps

After seeding categories, you're ready for:

1. **Create Migrations** for the new tables (business_categories, marketplace_categories, marketplace_products, marketplace_product_comments)

2. **Create API Endpoints**:
   - `GET /api/marketplace/categories` - Get available categories for user
   - `POST /api/marketplace/products` - Create product (category pre-filtered)
   - `GET /api/marketplace/products` - Browse products
   - `POST /api/marketplace/products/:id/comments` - Add comment

3. **Create Admin UI**:
   - Manage business categories
   - Manage marketplace categories (tier-aware)
   - Category display configuration

4. **Create Business Owner UI**:
   - Product listing form with tier-filtered categories
   - Product dashboard
   - Comment management

---

**Status:** ✅ Ready to run
**Dependencies:** Tables must exist (from migrations)
**Time to complete:** < 1 minute
