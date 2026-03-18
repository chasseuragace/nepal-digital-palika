# Marketplace Testing Checklist
## Complete Step-by-Step Testing Guide

**Date:** March 18, 2026
**Status:** Ready to Execute
**Estimated Time:** 2-3 hours

---

## Phase 1: Environment Setup (30 minutes)

### Step 1.1: Database Reset
```bash
# Reset database to clean state
supabase db reset

# Expected output:
# ✓ Dropped schema public
# ✓ Created schema public
# ✓ Granted new grants
```

**Verify:**
```sql
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public';
-- Should have ~20 tables
```

**Status:** ☐ PASS ☐ FAIL

---

### Step 1.2: Run Migrations (in order)
```bash
# Run all existing migrations first
supabase migration list
supabase db push

# Verify migration status
# Expected: All migrations applied successfully
```

**Verify:**
```sql
SELECT name FROM _supabase_migrations ORDER BY executed_at DESC LIMIT 5;
-- Should show latest migrations
```

**Status:** ☐ PASS ☐ FAIL

---

### Step 1.3: Create New Tables (Marketplace)
```bash
# Create migrations for:
# - business_categories
# - marketplace_categories
# - marketplace_products
# - marketplace_product_comments

# Then run migrations
supabase db push
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'business_categories',
  'marketplace_categories',
  'marketplace_products',
  'marketplace_product_comments'
)
ORDER BY table_name;
-- Expected: 4 rows (all tables present)
```

**Status:** ☐ PASS ☐ FAIL

---

### Step 1.4: Seed Tiers & Categories
```bash
npx ts-node database/scripts/seed-subscription-tiers.ts

# Expected output:
# ✅ Seeded tier: Basic
# ✅ Seeded tier: Tourism
# ✅ Seeded tier: Premium
# ✅ Seeded 4 marketplace features
# ✅ Mapped ... features for tier: tourism
# ✅ Mapped ... features for tier: premium
```

**Verify:**
```sql
-- Check tiers
SELECT COUNT(*) FROM subscription_tiers;
-- Expected: 3

-- Check marketplace categories
SELECT COUNT(*) FROM marketplace_categories;
-- Expected: 26

-- Check tier 1 categories (should be 9)
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level = 1;
-- Expected: 9

-- Check tier 2+ categories (should be 17: 9+8)
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 2;
-- Expected: 17

-- Check tier 3 (should be 26: all)
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 3;
-- Expected: 26
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 2: Tier Enrollment (15 minutes)

### Step 2.1: Verify Existing Palikas
```bash
# Check if palikas exist
psql
```

```sql
SELECT id, name_en, district_id FROM palikas LIMIT 4;
-- Expected: At least 4 palikas
```

**Status:** ☐ PASS ☐ FAIL

---

### Step 2.2: Enroll Palikas into Tiers
```sql
-- Get tier IDs
SELECT id, name FROM subscription_tiers;

-- Assign tiers (adjust IDs based on actual values)
UPDATE palikas SET subscription_tier_id = (
  SELECT id FROM subscription_tiers WHERE name='premium'
) WHERE id=1;

UPDATE palikas SET subscription_tier_id = (
  SELECT id FROM subscription_tiers WHERE name='tourism'
) WHERE id IN (2, 3);

UPDATE palikas SET subscription_tier_id = (
  SELECT id FROM subscription_tiers WHERE name='basic'
) WHERE id=4;
```

**Verify:**
```sql
SELECT
  p.id,
  p.name_en,
  st.name as tier_name
FROM palikas p
LEFT JOIN subscription_tiers st ON p.subscription_tier_id = st.id
WHERE p.id IN (1, 2, 3, 4)
ORDER BY p.id;

-- Expected:
-- id=1, Tier=premium
-- id=2, Tier=tourism
-- id=3, Tier=tourism
-- id=4, Tier=basic
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 3: User & Business Creation (30 minutes)

### Step 3.1: Seed Test Data
```bash
npx ts-node database/scripts/seed-marketplace-test-data.ts

# Expected output:
# ✅ Created auth user: Ramesh Sharma
# ✅ Created auth user: Sita Poudel
# ... (8 users total)
# ✅ Created 8 user profiles
# ✅ Created 8 test businesses
# ✅ Created X test products
# ✅ Created X test comments
```

**Verify:**
```sql
-- Check auth users
SELECT COUNT(*) FROM auth.users WHERE email LIKE '%.com';
-- Expected: 8 (test users)

-- Check profiles
SELECT COUNT(*) FROM profiles WHERE user_type='business_owner';
-- Expected: 8

-- Check businesses
SELECT COUNT(*) FROM businesses;
-- Expected: 8

-- Check products
SELECT COUNT(*) FROM marketplace_products;
-- Expected: ~16 (2 per business)

-- Check comments
SELECT COUNT(*) FROM marketplace_product_comments;
-- Expected: ~15 (3 per product in sample)
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 4: Constraint Validation (1.5 hours)

### Constraint 1: Tier-Based Category Access

#### Test 1.1: Tier 1 User Can Only See Tier 1 Categories
```sql
-- Get a Tier 1 user (Keshav Prasad)
SELECT id FROM profiles WHERE name='Keshav Prasad';
-- Note the user_id

-- Simulate user query: Available categories
SELECT COUNT(*) FROM marketplace_categories
WHERE min_tier_level <= (
  SELECT st.tier_level
  FROM palikas p
  JOIN subscription_tiers st ON p.subscription_tier_id = st.id
  WHERE p.id = (
    SELECT default_palika_id FROM profiles WHERE name='Keshav Prasad'
  )
);
-- Expected: 9 (Tier 1 categories only)
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 1.2: Tier 2 User Can See Tier 1 + 2 Categories
```sql
-- Get a Tier 2 user (Deepak Niroula)
SELECT COUNT(*) FROM marketplace_categories
WHERE min_tier_level <= (
  SELECT st.tier_level
  FROM palikas p
  JOIN subscription_tiers st ON p.subscription_tier_id = st.id
  WHERE p.id = (
    SELECT default_palika_id FROM profiles WHERE name='Deepak Niroula'
  )
);
-- Expected: 17 (Tier 1+2 categories)
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 1.3: Tier 3 User Can See All Categories
```sql
-- Get a Tier 3 user (Ramesh Sharma)
SELECT COUNT(*) FROM marketplace_categories
WHERE min_tier_level <= (
  SELECT st.tier_level
  FROM palikas p
  JOIN subscription_tiers st ON p.subscription_tier_id = st.id
  WHERE p.id = (
    SELECT default_palika_id FROM profiles WHERE name='Ramesh Sharma'
  )
);
-- Expected: 26 (All categories)
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 1.4: Tier 1 User CANNOT Create Tier 2 Product
```sql
-- Check if any Tier 1 products are Tier 2+ categories
SELECT COUNT(*) FROM marketplace_products mp
JOIN marketplace_categories mc ON mp.marketplace_category_id = mc.id
WHERE mp.palika_id = 4 -- Palika 4 is Tier 1
AND mc.min_tier_level > 1;
-- Expected: 0 (no tier 2+ products for tier 1 palikas)
```

**Status:** ☐ PASS ☐ FAIL

---

### Constraint 2: Business Ownership

#### Test 2.1: User Can Only Edit Own Products
```sql
-- Get user 2A's ID and check their products
SELECT
  mp.id,
  mp.business_id,
  b.owner_user_id,
  mp.name
FROM marketplace_products mp
JOIN businesses b ON mp.business_id = b.id
WHERE b.owner_user_id = (SELECT id FROM profiles WHERE name='Deepak Niroula')
LIMIT 1;

-- Verify business owner
SELECT owner_user_id FROM businesses WHERE id = 'business_id_from_above';
-- Expected: Same as user_id above
```

**Status:** ☐ PASS ☐ FAIL

---

### Constraint 3: One Palika Per User (Immutable)

#### Test 3.1: Check Default Palika Set
```sql
SELECT name, default_palika_id FROM profiles WHERE user_type='business_owner' ORDER BY name;

-- Expected: All users have a single default_palika_id set
-- Tier 1 users: palika_id=4
-- Tier 2 users: palika_id=2 or 3
-- Tier 3 users: palika_id=1
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 3.2: Verify Palika Is Immutable
```sql
-- Try to update a user's palika (should fail or stay same)
UPDATE profiles SET default_palika_id = 1
WHERE name='Keshav Prasad';

SELECT default_palika_id FROM profiles WHERE name='Keshav Prasad';
-- Expected: Still 4 (unchanged)
```

**Status:** ☐ PASS ☐ FAIL

---

### Constraint 4: Auto-Publishing by Tier

#### Test 4.1: Tier 1 Products Auto-Publish
```sql
-- Check Tier 1 products
SELECT COUNT(*) as total_products,
       COUNT(CASE WHEN status='published' THEN 1 END) as published,
       COUNT(CASE WHEN is_approved=true THEN 1 END) as approved
FROM marketplace_products
WHERE palika_id = 4; -- Tier 1

-- Expected: All published and approved
-- total_products = published = approved
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 4.2: Tier 2 Products Auto-Publish (Default)
```sql
-- Check Tier 2 products
SELECT COUNT(*) as total_products,
       COUNT(CASE WHEN status='published' THEN 1 END) as published,
       COUNT(CASE WHEN requires_approval=false THEN 1 END) as no_approval_required
FROM marketplace_products
WHERE palika_id IN (2, 3); -- Tier 2

-- Expected: All published and requires_approval=false
```

**Status:** ☐ PASS ☐ FAIL

---

### Constraint 5: Public Comments Visibility

#### Test 5.1: Comments Auto-Approve
```sql
SELECT COUNT(*) as total_comments,
       COUNT(CASE WHEN is_approved=true THEN 1 END) as approved,
       COUNT(CASE WHEN is_hidden=false THEN 1 END) as not_hidden
FROM marketplace_product_comments;

-- Expected: All comments are approved and not hidden
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 5.2: Comments Are Threaded
```sql
SELECT COUNT(*) as total_comments,
       COUNT(CASE WHEN parent_comment_id IS NULL THEN 1 END) as top_level,
       COUNT(CASE WHEN parent_comment_id IS NOT NULL THEN 1 END) as replies
FROM marketplace_product_comments;

-- Expected: replies > 0 (some threaded comments)
```

**Status:** ☐ PASS ☐ FAIL

---

#### Test 5.3: Owner Replies Marked
```sql
SELECT COUNT(*) as owner_replies
FROM marketplace_product_comments
WHERE is_owner_reply = true;

-- Expected: owner_replies > 0
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 5: RLS Policy Testing (45 minutes)

### RLS Test 1: Authenticated User Can See Published Products
```sql
-- Simulate authenticated user query
SELECT COUNT(*) FROM marketplace_products
WHERE status='published' AND is_approved=true;

-- Expected: Number > 0 (published products visible)
```

**Status:** ☐ PASS ☐ FAIL

---

### RLS Test 2: Unauthenticated User Can See Published Products
```sql
-- Same query (no auth context)
SELECT COUNT(*) FROM marketplace_products
WHERE status='published' AND is_approved=true;

-- Expected: Same as above (public visibility)
```

**Status:** ☐ PASS ☐ FAIL

---

### RLS Test 3: Business Owner Can Edit Own Products
```sql
-- Simulate business owner query
SELECT id FROM businesses WHERE id='biz_2a_id';

-- Expected: Can see and edit own products
```

**Status:** ☐ PASS ☐ FAIL

---

### RLS Test 4: User Cannot See Other User's Draft Products
```sql
-- User 2A should not see User 3A's products (even if friends)
SELECT COUNT(*) FROM marketplace_products
WHERE business_id IN (
  SELECT id FROM businesses WHERE owner_user_id = 'user_3a_id'
)
AND status='draft';

-- Expected: 0 (cannot see draft products of others)
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 6: Integration Tests (30 minutes)

### Integration Test 1: Full Product Lifecycle (Tier 1)
```
Scenario: Keshav Prasad (Tier 1) creates, publishes, and receives comments

1. ✅ Create business (already done)
   SELECT * FROM businesses WHERE owner_user_id='user_4a_id'

2. ✅ List available categories (9 Tier 1)
   Already verified in Constraint 1.1

3. ✅ Create product in Tier 1 category
   Already created in test data

4. ✅ Product auto-publishes
   SELECT status, is_approved FROM marketplace_products
   WHERE business_id=(SELECT id FROM businesses WHERE owner_user_id='user_4a_id')
   LIMIT 1;
   Expected: status='published', is_approved=true

5. ✅ Public can see product
   (Same query, public visibility)

6. ✅ User leaves comment
   Already created in test data

7. ✅ Comments visible
   SELECT COUNT(*) FROM marketplace_product_comments
   WHERE product_id='product_id'
   Expected: Count > 0
```

**Status:** ☐ PASS ☐ FAIL

---

### Integration Test 2: Tier-Gated Product Creation
```
Scenario: Verify tier constraints across multiple operations

1. ✅ Tier 1 user can create Tier 1 products
   (Verified in test data - Tier 1 users have products)

2. ✅ Tier 2 user can create Tier 1 + 2 products
   (Verified in test data - Tier 2 users have mixed products)

3. ✅ Tier 3 user can create all products
   (Verified in test data - Tier 3 users have products)

4. ✅ Cross-palika products blocked
   Check that products are only in their own palika
   SELECT COUNT(*) FROM marketplace_products
   WHERE palika_id != (
     SELECT default_palika_id FROM profiles WHERE id=created_by
   );
   Expected: 0
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 7: Data Integrity Tests (30 minutes)

### Test 7.1: No Orphaned Products
```sql
SELECT COUNT(*) FROM marketplace_products mp
WHERE NOT EXISTS (
  SELECT 1 FROM businesses b WHERE b.id = mp.business_id
);

-- Expected: 0 (all products have valid business)
```

**Status:** ☐ PASS ☐ FAIL

---

### Test 7.2: No Orphaned Comments
```sql
SELECT COUNT(*) FROM marketplace_product_comments mpc
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_products mp WHERE mp.id = mpc.product_id
);

-- Expected: 0 (all comments have valid product)
```

**Status:** ☐ PASS ☐ FAIL

---

### Test 7.3: Category Tier Levels Consistent
```sql
SELECT COUNT(DISTINCT min_tier_level) FROM marketplace_categories;

-- Expected: 3 (categories have tier levels 1, 2, 3)
```

**Status:** ☐ PASS ☐ FAIL

---

### Test 7.4: All Users Have Business
```sql
SELECT COUNT(*) FROM profiles p
WHERE user_type='business_owner'
AND NOT EXISTS (
  SELECT 1 FROM businesses b WHERE b.owner_user_id = p.id
);

-- Expected: 0 (all test users have businesses)
```

**Status:** ☐ PASS ☐ FAIL

---

## Phase 8: Summary & Sign-Off

### Final Verification Checklist

```
DATABASE SETUP:
☐ Tables created (4 new marketplace tables)
☐ Migrations applied successfully
☐ Data seeded (categories, tiers, users, products)

CONSTRAINT VALIDATION:
☐ Tier 1 category access (9 only)
☐ Tier 2 category access (17)
☐ Tier 3 category access (26)
☐ Tier 1 cannot create Tier 2+
☐ Business ownership enforced
☐ Palika immutable
☐ Auto-publishing works
☐ Comments public and threaded

RLS POLICIES:
☐ Owner can edit own
☐ Public sees published
☐ Draft hidden from others
☐ Category visibility by tier

INTEGRATION:
☐ Full lifecycle works
☐ Tier gating enforced
☐ Comments functional
☐ No breaking changes

DATA INTEGRITY:
☐ No orphaned records
☐ No constraint violations
☐ All references valid
☐ Audit trails complete

READY FOR:
☐ API Development
☐ UI Implementation
☐ Production Deploy
```

---

## Test Failure Troubleshooting

### If Tier Constraint Fails
```sql
-- Check tier assignment
SELECT p.id, st.name, st.tier_level FROM palikas p
JOIN subscription_tiers st ON p.subscription_tier_id = st.id;

-- Check category tier levels
SELECT COUNT(*), min_tier_level FROM marketplace_categories
GROUP BY min_tier_level;
```

### If Auto-Publish Fails
```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name='set_product_approval_status';

-- Check product fields
SELECT status, is_approved, requires_approval
FROM marketplace_products LIMIT 5;
```

### If RLS Fails
```sql
-- Check policies exist
SELECT * FROM information_schema.role_table_grants
WHERE table_name='marketplace_products';

-- Test policy directly
SELECT COUNT(*) FROM marketplace_products
WHERE status='published';
```

---

**Status:** Ready to Execute
**Last Updated:** March 18, 2026
**Next Step:** Start Phase 1
