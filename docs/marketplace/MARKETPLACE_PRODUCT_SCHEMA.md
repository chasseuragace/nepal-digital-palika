# Marketplace Product Schema Design
## Database Structure for Tier-Gated Marketplace Products

**Date:** March 18, 2026
**Status:** Design Phase (no implementation yet)
**Focus:** Database relationships and tier-based access control

---

## Problem Statement

Current state:
- We have generic `categories` table for heritage_sites, events, blog_posts, **businesses**
- Business listing requires knowing: "What TYPE of business?" (hotel, restaurant, shop, producer, etc.)
- But separately: "What PRODUCTS can this business SELL in the marketplace?"
- Different Palikas (tiers) should see different marketplace categories
- Products can only be added by someone with an existing business profile

---

## Current Issues with Existing Design

### Issue 1: Business Type is Generic Category
```sql
-- Current (PROBLEMATIC):
businesses.business_type_id → categories (entity_type='business')
-- Problem: Generic categories table mixes business types with content types
```

### Issue 2: No Product Listing Structure
```sql
-- Currently missing:
-- No marketplace_products table
-- No marketplace_categories table
-- No tier → category → product mapping
```

### Issue 3: Category Access Not Tier-Aware
```sql
-- Currently:
-- categories exist but have no tier association
-- No way to restrict "Tier 1 users can only list agriculture products"
```

---

## Proposed Solution: New Tables

### 1. `business_categories` (NEW - for business type)

```sql
CREATE TABLE IF NOT EXISTS business_categories (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_ne VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  description_ne TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug)
);

-- Examples:
-- id=1: name_en="Accommodation", slug="accommodation"
-- id=2: name_en="Food & Beverage", slug="food_beverage"
-- id=3: name_en="Producer", slug="producer"
-- id=4: name_en="Tour Guide", slug="tour_guide"
-- id=5: name_en="Professional Service", slug="professional_service"
-- id=6: name_en="Artisan Workshop", slug="artisan_workshop"
-- id=7: name_en="Transportation", slug="transportation"
-- id=8: name_en="Retail Shop", slug="retail_shop"

CREATE INDEX idx_business_categories_active ON business_categories(is_active);
CREATE INDEX idx_business_categories_slug ON business_categories(slug);
```

**Purpose:** Define WHAT TYPE OF BUSINESS (hotel, restaurant, etc.)

---

### 2. `marketplace_categories` (NEW - for product type, tier-aware)

```sql
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id SERIAL PRIMARY KEY,

  -- Category identity
  name_en VARCHAR(150) NOT NULL,
  name_ne VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  description_ne TEXT,

  -- Tier association (CRITICAL)
  min_tier_level INTEGER NOT NULL CHECK (min_tier_level IN (1, 2, 3)),
  -- min_tier_level=1: Available in Tier 1, 2, 3
  -- min_tier_level=2: Available in Tier 2, 3 only
  -- min_tier_level=3: Available in Tier 3 only

  -- Hierarchy (optional parent for subcategories)
  parent_id INTEGER REFERENCES marketplace_categories(id),

  -- Display
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug, min_tier_level)
);

-- TIER 1 CATEGORIES (Basic goods - Agriculture, animal products, essentials)
INSERT INTO marketplace_categories (name_en, name_ne, slug, min_tier_level, display_order) VALUES
('Agriculture Products', 'कृषि उत्पादन', 'agriculture', 1, 1),
('Animal Products', 'पशु उत्पादन', 'animal_products', 1, 2),
('Essential Daily Items', 'दैनिक आवश्यक वस्तु', 'essentials', 1, 3),
('Grains & Cereals', 'अनाज र सीरिल', 'grains', 1, 4),
('Vegetables & Fruits', 'तरकारी र फल', 'vegetables', 1, 5),
('Honey & Bee Products', 'मह र मधु उत्पादन', 'honey', 1, 6),
('Tea & Coffee', 'चिया र कफी', 'tea_coffee', 1, 7),
('Dairy Products', 'दुग्ध उत्पादन', 'dairy', 1, 8),
('Spices & Herbs', 'मसला र जडिबुटी', 'spices', 1, 9),
('Nuts & Seeds', 'नट र बीज', 'nuts', 1, 10);

-- TIER 2 CATEGORIES (Manufactured, specialized - Clothing, electronics, etc.)
INSERT INTO marketplace_categories (name_en, name_ne, slug, min_tier_level, display_order) VALUES
('Handwoven Textiles', 'हातको कपडा', 'textiles', 2, 1),
('Traditional Crafts', 'परम्परागत कला', 'crafts', 2, 2),
('Clothing & Apparel', 'कपडा र परिधान', 'clothing', 2, 3),
('Footwear', 'जुत्ता', 'footwear', 2, 4),
('Household Goods', 'घरको सामान', 'household', 2, 5),
('Electronics & Accessories', 'इलेक्ट्रोनिक्स', 'electronics', 2, 6),
('Beauty & Personal Care', 'सौन्दर्य उत्पादन', 'beauty', 2, 7),
('Books & Media', 'किताब र मीडिया', 'books', 2, 8),
('Toys & Games', 'खेलना र खेल', 'toys', 2, 9),
('Sports Equipment', 'खेलकुद उपकरण', 'sports', 2, 10);

-- TIER 3 CATEGORIES (Premium, specialized services - Luxury, high-value)
INSERT INTO marketplace_categories (name_en, name_ne, slug, min_tier_level, display_order) VALUES
('Luxury Items', 'विलासी वस्तु', 'luxury', 3, 1),
('Premium Jewelry', 'प्रीमियम गहना', 'jewelry', 3, 2),
('Artisan Premium Crafts', 'प्रीमियम कला', 'premium_crafts', 3, 3),
('High-End Fashion', 'उच्च स्तरीय फ्यासन', 'fashion_premium', 3, 4),
('Specialized Services', 'विशेषीकृत सेवा', 'services', 3, 5),
('Consulting & Expert Services', 'सलाह सेवा', 'consulting', 3, 6),
('Premium Accommodation Experiences', 'प्रीमियम आवास', 'premium_accommodation', 3, 7),
('Exclusive Tours & Experiences', 'एक्सक्लुसिभ भ्रमण', 'exclusive_tours', 3, 8);

CREATE INDEX idx_marketplace_categories_tier ON marketplace_categories(min_tier_level);
CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);
CREATE INDEX idx_marketplace_categories_parent ON marketplace_categories(parent_id);
CREATE INDEX idx_marketplace_categories_active ON marketplace_categories(is_active);
```

**Purpose:** Define WHAT PRODUCTS CAN BE SOLD, with tier gating

---

### 3. Update `businesses` table - Use Business Category

```sql
-- OLD (using generic categories):
ALTER TABLE businesses DROP COLUMN business_type_id;

-- NEW (using specific business_categories):
ALTER TABLE businesses ADD COLUMN business_category_id INTEGER NOT NULL
  REFERENCES business_categories(id);

-- Example data:
-- business_id=1: Mountain View Homestay → business_category_id=1 (Accommodation)
-- business_id=2: Organic Honey Farm → business_category_id=3 (Producer)
-- business_id=3: Local Restaurant → business_category_id=2 (Food & Beverage)

CREATE INDEX idx_businesses_category ON businesses(business_category_id);
```

**Effect:** Now businesses are clearly categorized (what TYPE of business)

---

### 4. `marketplace_products` (NEW - actual products being sold)

```sql
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  palika_id INTEGER NOT NULL REFERENCES palikas(id),
  -- Denormalize palika_id for easier queries (from business.palika_id)

  -- Product Identity
  name_en VARCHAR(300) NOT NULL,
  name_ne VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,

  -- Category (marketplace, tier-aware)
  marketplace_category_id INTEGER NOT NULL
    REFERENCES marketplace_categories(id),

  -- Description
  short_description TEXT,
  short_description_ne TEXT,
  full_description TEXT,
  full_description_ne TEXT,

  -- Media
  featured_image TEXT,
  images JSONB DEFAULT '[]',

  -- Pricing
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NPR',
  unit VARCHAR(50), -- "per kg", "per bottle", "per item", etc.
  discount_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Stock/Availability
  quantity_available INTEGER,
  unit_of_measurement VARCHAR(100), -- "kg", "pieces", "liters", etc.
  is_in_stock BOOLEAN DEFAULT true,

  -- Product Details (flexible)
  details JSONB DEFAULT '{}',
  -- Example: {
  --   "origin": "Ward 5, Pokhara",
  --   "organic": true,
  --   "certification": "NPOP Certified",
  --   "harvest_date": "2025-03-01",
  --   "shelf_life": "6 months",
  --   "ingredients": ["honey", "herbs"]
  -- }

  -- Status & Publishing
  status VARCHAR(40) DEFAULT 'published'
    CHECK (status IN ('published', 'archived', 'out_of_stock')),
    -- NOTE: Tier 1 palikas auto-publish (no 'draft' state)
    --       Tier 2+ palikas can have draft/pending if they enable approval
  is_featured BOOLEAN DEFAULT false,

  -- Verification (Optional - Tier 2+ only)
  requires_approval BOOLEAN DEFAULT false,
    -- Set based on palika tier and palika's approval preference
    -- Tier 1: always false (auto-publish)
    -- Tier 2+: configurable by palika
  is_approved BOOLEAN DEFAULT true,
    -- Tier 1: always true (published immediately)
    -- Tier 2+ with approval: depends on admin approval
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug, palika_id)
);

-- CRITICAL INDEX: For tier-based category visibility
CREATE INDEX idx_marketplace_products_category ON marketplace_products(marketplace_category_id);
CREATE INDEX idx_marketplace_products_business ON marketplace_products(business_id);
CREATE INDEX idx_marketplace_products_palika ON marketplace_products(palika_id);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_approved ON marketplace_products(is_approved);
CREATE INDEX idx_marketplace_products_featured ON marketplace_products(is_featured);
```

**Purpose:** Store actual products being sold in marketplace

---

### 5. `marketplace_product_comments` (NEW - threaded comments on products)

```sql
CREATE TABLE IF NOT EXISTS marketplace_product_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Product Being Commented On
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  palika_id INTEGER NOT NULL REFERENCES palikas(id),

  -- Commenter
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(200), -- Denormalized from profiles for history

  -- Comment Content
  comment_text TEXT NOT NULL,

  -- Nested Comments (Threading)
  parent_comment_id UUID REFERENCES marketplace_product_comments(id) ON DELETE CASCADE,
  -- NULL = top-level comment
  -- UUID = reply to another comment

  -- Business Owner Reply Flag
  is_owner_reply BOOLEAN DEFAULT false,
  -- true = comment is from business owner (or marked as response)

  -- Visibility & Moderation
  is_approved BOOLEAN DEFAULT true, -- Auto-approve by default
  is_hidden BOOLEAN DEFAULT false, -- Palika staff can hide if needed
  moderation_reason TEXT, -- Why hidden (if is_hidden=true)

  -- Engagement
  helpful_count INTEGER DEFAULT 0, -- Users can mark as helpful
  unhelpful_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_edited BOOLEAN DEFAULT false,

  INDEX idx_product_comments_product(product_id),
  INDEX idx_product_comments_parent(parent_comment_id),
  INDEX idx_product_comments_user(user_id),
  INDEX idx_product_comments_owner_reply(is_owner_reply),
  INDEX idx_product_comments_approved(is_approved, is_hidden)
);
```

**Purpose:** Nested comment discussion on products (like product reviews but threaded, public visibility)

---

## Entity Relationship Diagram

```
                    palikas (1 Palika)
                        |
                        | subscription_tier_id
                        ↓
                subscription_tiers (1 Tier)
                        |
                        | 1:M
                        ↓
                  tier_features (M Features per Tier)
                        |
                        | min_tier_level
                        ↓
          marketplace_categories (Categories available for tier)
                        |
                        | 1:M
                        ↓
          marketplace_products (Products listed by business)
                        ↑
                        | business_id
                        |
                    businesses (1 Business)
                        |
                        | owner_user_id
                        ↓
                    profiles (User/Business Owner)
```

---

## Key Constraints & Rules

### Rule 1: User → Palika → Tier → Categories

```sql
-- When a user (business owner) tries to list a product:
-- 1. Get user's palika_id from profiles.default_palika_id (immutable)
-- 2. Get palika's subscription_tier_id
-- 3. Get available marketplace_categories WHERE min_tier_level <= palika.tier
-- 4. User can ONLY choose from those categories

-- Example:
-- User belongs to Palika ID 1
-- Palika 1 has subscription_tier_id = UUID for "Tourism" (Tier 2)
-- User can list products from categories where min_tier_level IN (1, 2)
-- User CANNOT list from Tier 3 categories
```

### Rule 2: Business Prerequisite

```sql
-- A user can only list marketplace_products IF:
-- 1. They have a profile (auth.users + profiles)
-- 2. They have a business record (businesses)
-- 3. They own that business (profiles.id = businesses.owner_user_id)

-- Enforced in RLS:
USING (
  business_id IN (
    SELECT id FROM businesses
    WHERE owner_user_id = auth.uid()
  )
)
```

### Rule 3: One Palika Per User (Immutable)

```sql
-- profiles.default_palika_id is set once during registration
-- Cannot be changed afterward
-- All products user lists must be for that palika_id

-- In marketplace_products:
-- palika_id = business.palika_id = user's default_palika_id
```

### Rule 4: Tier-Based Category Access

```sql
-- When user adds product:
-- SELECT marketplace_categories
-- WHERE min_tier_level <= (
--   SELECT tier_level FROM subscription_tiers
--   WHERE id = (
--     SELECT subscription_tier_id FROM palikas
--     WHERE id = current_user_palika_id
--   )
-- )
```

---

## Helper Functions

### 1. Get Available Categories for User

```sql
CREATE OR REPLACE FUNCTION get_available_marketplace_categories(
  p_user_id UUID
)
RETURNS TABLE (
  id INTEGER,
  name_en VARCHAR,
  name_ne VARCHAR,
  slug VARCHAR,
  min_tier_level INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    mc.id,
    mc.name_en,
    mc.name_ne,
    mc.slug,
    mc.min_tier_level
  FROM marketplace_categories mc
  WHERE mc.min_tier_level <= (
    SELECT st.tier_level
    FROM palikas p
    JOIN subscription_tiers st ON p.subscription_tier_id = st.id
    WHERE p.id = (
      SELECT default_palika_id FROM profiles WHERE id = p_user_id
    )
  )
  AND mc.is_active = true
  ORDER BY mc.display_order;
$$;

-- Usage:
-- SELECT * FROM get_available_marketplace_categories(auth.uid());
```

### 2. Check if User Can List in Category

```sql
CREATE OR REPLACE FUNCTION user_can_list_in_category(
  p_user_id UUID,
  p_category_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM marketplace_categories mc
    WHERE mc.id = p_category_id
    AND mc.min_tier_level <= (
      SELECT st.tier_level
      FROM palikas p
      JOIN subscription_tiers st ON p.subscription_tier_id = st.id
      WHERE p.id = (
        SELECT default_palika_id FROM profiles WHERE id = p_user_id
      )
    )
  );
$$;

-- Usage:
-- SELECT user_can_list_in_category(auth.uid(), 5);
```

### 3. Validate Business Ownership

```sql
CREATE OR REPLACE FUNCTION user_owns_business(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id
    AND owner_user_id = p_user_id
  );
$$;
```

---

## RLS Policies

### 1. Marketplace Products - Owner Access

```sql
DROP POLICY IF EXISTS "marketplace_products_owner_access" ON marketplace_products;
CREATE POLICY "marketplace_products_owner_access" ON marketplace_products
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );
```

### 2. Marketplace Products - Palika Staff Access (Approval Only)

```sql
DROP POLICY IF EXISTS "marketplace_products_palika_staff" ON marketplace_products;
CREATE POLICY "marketplace_products_palika_staff" ON marketplace_products
  FOR ALL
  USING (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('manage_marketplace_products')
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('manage_marketplace_products')
    )
  );
```

### 3. Marketplace Products - Public Read (All Published Products)

```sql
DROP POLICY IF EXISTS "marketplace_products_public_read" ON marketplace_products;
CREATE POLICY "marketplace_products_public_read" ON marketplace_products
  FOR SELECT
  USING (
    status = 'published'
    -- NOTE: Tier 1 auto-publishes, Tier 2+ only shows if is_approved=true
    --       Apply is_approved check in application logic or use trigger
  );
```

### 4. Marketplace Categories - Public Read

```sql
DROP POLICY IF EXISTS "marketplace_categories_public_read" ON marketplace_categories;
CREATE POLICY "marketplace_categories_public_read" ON marketplace_categories
  FOR SELECT
  USING (is_active = true);
```

### 5. Marketplace Product Comments - User Post

```sql
DROP POLICY IF EXISTS "marketplace_comments_user_post" ON marketplace_product_comments;
CREATE POLICY "marketplace_comments_user_post" ON marketplace_product_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 6. Marketplace Product Comments - Owner Reply

```sql
DROP POLICY IF EXISTS "marketplace_comments_owner_reply" ON marketplace_product_comments;
CREATE POLICY "marketplace_comments_owner_reply" ON marketplace_product_comments
  FOR INSERT
  WITH CHECK (
    is_owner_reply = false OR (
      is_owner_reply = true AND
      product_id IN (
        SELECT id FROM marketplace_products mp
        WHERE mp.business_id IN (
          SELECT id FROM businesses WHERE owner_user_id = auth.uid()
        )
      )
    )
  );
```

### 7. Marketplace Product Comments - Public Read (Approved Only)

```sql
DROP POLICY IF EXISTS "marketplace_comments_public_read" ON marketplace_product_comments;
CREATE POLICY "marketplace_comments_public_read" ON marketplace_product_comments
  FOR SELECT
  USING (
    is_approved = true AND is_hidden = false
  );
```

### 8. Marketplace Product Comments - Edit Own

```sql
DROP POLICY IF EXISTS "marketplace_comments_edit_own" ON marketplace_product_comments;
CREATE POLICY "marketplace_comments_edit_own" ON marketplace_product_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 9. Marketplace Product Comments - Moderation (Palika Staff)

```sql
DROP POLICY IF EXISTS "marketplace_comments_moderation" ON marketplace_product_comments;
CREATE POLICY "marketplace_comments_moderation" ON marketplace_product_comments
  FOR UPDATE
  USING (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('moderate_marketplace_comments')
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('moderate_marketplace_comments')
    )
  );
```

---

## Data Flow Example

### Scenario: Farmer from Pokhara (Tier 2) Lists Honey

```
1. FARMER REGISTRATION
   auth.users (id=user_123)
   ↓
   profiles (id=user_123, default_palika_id=2, user_type='business_owner')
   ↓
   businesses (id=biz_456, owner_user_id=user_123, palika_id=2,
               business_category_id=6 [Producer])

2. PALIKA CONFIGURATION
   palikas (id=2, name='Pokhara Metropolitan',
            subscription_tier_id=tier_uuid_2 [Tourism/Tier 2])
   ↓
   tier_features (tier_uuid_2 → feature_marketplace)

3. FARMER ADDS PRODUCT
   Query available categories:
   SELECT * FROM get_available_marketplace_categories(user_123)
   -- Returns categories with min_tier_level IN (1, 2)
   -- Includes: Agriculture (1), Animal Products (1), Honey (1),
   --           Textiles (2), Crafts (2), Clothing (2), etc.
   -- Excludes: Luxury (3), Jewelry (3), etc.

4. FARMER CREATES LISTING
   INSERT INTO marketplace_products
   (business_id=biz_456, palika_id=2,
    marketplace_category_id=6 [Honey],
    name='Pure Mountain Honey',
    price=800, unit='per kg',
    status='published',  -- Auto-published (Tier 2 = Tourism)
    requires_approval=false,  -- Tier 2 hasn't enabled approval
    is_approved=true)  -- Auto-approved (no approval needed)
   -- Product is IMMEDIATELY VISIBLE to public

5. CUSTOMER DISCOVERS PRODUCT
   SELECT * FROM marketplace_products
   WHERE palika_id=2 AND marketplace_category_id=6
   AND status='published' AND is_approved=true
   -- Product visible to public

6. CUSTOMER LEAVES COMMENT
   INSERT INTO marketplace_product_comments
   (product_id=product_123, user_id=customer_789,
    comment_text='How much is delivery to Ward 3?',
    is_owner_reply=false, is_approved=true)
   -- Comment posted publicly immediately

7. BUSINESS OWNER REPLIES
   INSERT INTO marketplace_product_comments
   (product_id=product_123, user_id=farmer_owner,
    parent_comment_id=comment_456,
    comment_text='We deliver for free to all wards!',
    is_owner_reply=true, is_approved=true)
   -- Reply visible to all (threaded under original comment)

8. ANOTHER CUSTOMER COMMENTS
   INSERT INTO marketplace_product_comments
   (product_id=product_123, user_id=customer_999,
    comment_text='Great! I'll order 5kg',
    is_owner_reply=false, is_approved=true)
   -- All comments visible in thread

---

ALTERNATIVE SCENARIO: Tier 1 Palika (No Approval Needed)
   -- Same flow, but even simpler
   -- No approval workflow at all
   -- Products auto-publish immediately
   -- Comments auto-appear immediately
```

---

## Approval Flow by Tier

### Tier 1 (Palika Services)
```
Product Created
  ↓
Auto-publish (requires_approval=false, is_approved=true)
  ↓
Immediately visible to public (status='published')
  ↓
NO approval workflow
```

### Tier 2 (Tourism & Services)
```
Product Created
  ↓
Palika configures: approval_required? (in palika_settings)
  ↓
IF approval_required=false (default):
  Auto-publish (status='published', is_approved=true)
  Immediately visible

IF approval_required=true:
  Set status='draft'
  Palika staff reviews
  Approves → status='published', is_approved=true, approved_at=NOW()
  Rejects → is_approved=false, rejection_reason set
```

### Tier 3 (Premium Edition)
```
Same as Tier 2
Palika can optionally enable approval workflow
```

---

## Summary: What's Different

| Aspect | Before | After |
|--------|--------|-------|
| Business Types | Generic `categories` | Dedicated `business_categories` |
| Products | None | New `marketplace_products` |
| Product Categories | None | New `marketplace_categories` (tier-aware) |
| Category Access | Not restricted | Tier-gated via `min_tier_level` |
| Product Approval | None | Tier-based: Tier 1 = auto-publish, Tier 2+ = optional |
| Product Discussion | None | New `marketplace_product_comments` (threaded) |
| Comment Visibility | N/A | All approved comments public, business owner replies marked |
| Ownership Requirement | Optional | Mandatory (must own business) |
| Tier Gating | Exists (features table) | Applied to categories & approval flow |

---

## Next Steps

1. **Create these 4 tables:**
   - `business_categories`
   - `marketplace_categories`
   - `marketplace_products`
   - `marketplace_product_inquiries`

2. **Update existing table:**
   - `businesses` - swap `business_type_id` from generic categories to `business_category_id`

3. **Create helper functions & RLS policies** (as defined above)

4. **Seed initial data:**
   - 8 business categories
   - 18 marketplace categories (Tier 1, 2, 3)
   - Tier level assignments

5. **API endpoints** (later phase):
   - `POST /api/marketplace/products` - Create product (category pre-filtered)
   - `GET /api/marketplace/categories` - Get available categories for user
   - `GET /api/marketplace/products` - Browse products
   - `POST /api/marketplace/inquiries` - Customer inquiry

6. **UI/Admin Panel** (later phase):
   - Product listing form with category dropdown
   - Business owner dashboard
   - Palika approval workflow

---

## Comments vs. Inquiries: Key Differences

### **Inquiries** (Existing - businesses table)
- Purpose: Customer contacts business owner privately
- Visibility: Private (between customer and business)
- Status Workflow: new → replied → confirmed → completed
- Use Case: "I want to buy/book, let me contact directly"
- Example: "Can you deliver to my address?"

### **Comments** (New - marketplace_product_comments table)
- Purpose: Public discussion about a product
- Visibility: Public to all users
- Threading: Nested replies
- Status Workflow: created → auto-approved (or moderated if flagged)
- Use Case: "What's your opinion on this product?"
- Example: "Great quality! Has anyone tried this before?"
- Business Owner: Can mark their replies as "owner_reply" for clarity

### **Why Both?**
- **Comments** = product reviews/discussion (like YouTube comments)
- **Inquiries** = transaction initiation (like email/WhatsApp contact)
- **Separate concerns** = cleaner data model

---

## Helper Functions for Comments

### 1. Get Comment Thread (Nested)

```sql
CREATE OR REPLACE FUNCTION get_product_comment_thread(
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  comment_text TEXT,
  user_name VARCHAR,
  is_owner_reply BOOLEAN,
  parent_comment_id UUID,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  depth INT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
WITH RECURSIVE comment_tree AS (
  -- Base: Top-level comments
  SELECT
    id, comment_text, user_name, is_owner_reply, parent_comment_id,
    helpful_count, created_at,
    1 as depth
  FROM marketplace_product_comments
  WHERE product_id = p_product_id
    AND parent_comment_id IS NULL
    AND is_approved = true
    AND is_hidden = false

  UNION ALL

  -- Recursive: Nested replies
  SELECT
    mpc.id, mpc.comment_text, mpc.user_name, mpc.is_owner_reply,
    mpc.parent_comment_id, mpc.helpful_count, mpc.created_at,
    ct.depth + 1
  FROM marketplace_product_comments mpc
  JOIN comment_tree ct ON mpc.parent_comment_id = ct.id
  WHERE mpc.is_approved = true
    AND mpc.is_hidden = false
)
SELECT * FROM comment_tree
ORDER BY parent_comment_id, created_at;
$$;

-- Usage:
-- SELECT * FROM get_product_comment_thread('product_uuid_123');
```

### 2. Mark Comment as Helpful

```sql
CREATE OR REPLACE FUNCTION mark_comment_helpful(
  p_comment_id UUID,
  p_is_helpful BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE marketplace_product_comments
  SET helpful_count = CASE WHEN p_is_helpful THEN helpful_count + 1 ELSE helpful_count - 1 END
  WHERE id = p_comment_id;
  RETURN TRUE;
END;
$$;
```

---

**Author:** Database Design Phase (Updated)
**Status:** Ready for implementation
**Last Update:** March 18, 2026
**Depends On:** Existing tables (palikas, subscription_tiers, businesses, profiles, auth.users)
