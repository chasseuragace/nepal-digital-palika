# Marketplace Testing - Quick Start Guide
## Execute Testing in 5 Commands

**Estimated Time:** 2-3 hours
**Prerequisites:** Supabase CLI, Node.js, .env configured

---

## 🚀 One-Command Quick Start (If All Migrations Ready)

```bash
# 1. Reset database
supabase db reset

# 2. Run all migrations
supabase db push

# 3. Seed tiers and categories
npx ts-node database/scripts/seed-subscription-tiers.ts

# 4. Enroll palikas into tiers (SQL commands below)
# Run the SQL from section "Tier Enrollment"

# 5. Seed test data
npx ts-node database/scripts/seed-marketplace-test-data.ts

# Done! Now run tests from TESTING_CHECKLIST.md
```

---

## 📋 Manual Step-by-Step

### Step 1: Reset & Migrate (5 minutes)
```bash
supabase db reset
supabase db push
# ✅ All tables created, RLS policies applied
```

### Step 2: Seed Categories (2 minutes)
```bash
npx ts-node database/scripts/seed-subscription-tiers.ts
# ✅ 3 tiers, 26 marketplace categories, 8 business categories
```

### Step 3: Enroll Palikas (2 minutes)
```sql
-- Copy-paste into psql or Supabase SQL editor
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='premium') WHERE id=1;
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='tourism') WHERE id IN (2,3);
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='basic') WHERE id=4;

-- Verify
SELECT p.id, p.name_en, st.name FROM palikas p LEFT JOIN subscription_tiers st ON p.subscription_tier_id = st.id WHERE p.id<=4;
```

### Step 4: Create Test Users & Businesses (5 minutes)
```bash
npx ts-node database/scripts/seed-marketplace-test-data.ts
# ✅ 8 users, 8 businesses, ~16 products, ~15 comments
```

### Step 5: Run Constraint Tests (60 minutes)
Open `TESTING_CHECKLIST.md` and follow each test with ☐ checkboxes

---

## ✅ Key Tests to Run

### Test 1: Tier-Based Category Access
```sql
-- Tier 1: Should see 9 categories
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 1;
-- ✅ Expected: 9

-- Tier 2: Should see 17 categories (9+8)
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 2;
-- ✅ Expected: 17

-- Tier 3: Should see all 26 categories
SELECT COUNT(*) FROM marketplace_categories WHERE min_tier_level <= 3;
-- ✅ Expected: 26
```

### Test 2: Tier 1 Cannot Create Tier 2 Products
```sql
-- Check no Tier 1 products are Tier 2+
SELECT COUNT(*) FROM marketplace_products mp
JOIN marketplace_categories mc ON mp.marketplace_category_id = mc.id
WHERE mp.palika_id = 4 AND mc.min_tier_level > 1;
-- ✅ Expected: 0
```

### Test 3: Auto-Publishing Works
```sql
-- Tier 1 products should be published
SELECT COUNT(*), COUNT(CASE WHEN status='published' THEN 1 END)
FROM marketplace_products WHERE palika_id=4;
-- ✅ Expected: Both same (all published)
```

### Test 4: Comments Are Public
```sql
-- All comments should be approved
SELECT COUNT(*), COUNT(CASE WHEN is_approved=true THEN 1 END)
FROM marketplace_product_comments;
-- ✅ Expected: Both same (all approved)
```

### Test 5: Comments Are Threaded
```sql
-- Some comments should have parents
SELECT COUNT(CASE WHEN parent_comment_id IS NOT NULL THEN 1 END)
FROM marketplace_product_comments;
-- ✅ Expected: > 0
```

---

## 📊 Expected Test Data

After running all scripts, you should have:

```
USERS (8):
✅ Palika 1 (Tier 3): Ramesh Sharma, Sita Poudel
✅ Palika 2 (Tier 2): Deepak Niroula, Maya Gurung
✅ Palika 3 (Tier 2): Pradeep Singh, Anita Rai
✅ Palika 4 (Tier 1): Keshav Prasad, Bishnu Lamsal

BUSINESSES (8):
✅ 1 per user, correct category assignments

PRODUCTS (16-20):
✅ Tier 1 Palika: 2-4 products (Tier 1 categories only)
✅ Tier 2 Palikas: 8 products (Tier 1 + 2 categories)
✅ Tier 3 Palika: 4 products (All categories)

COMMENTS:
✅ ~15 comments (threaded replies included)
✅ All auto-approved
✅ Owner replies marked
```

---

## 🔍 Verification Queries

Quick copy-paste queries to verify everything:

```sql
-- 1. All tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema='public' AND table_name LIKE 'marketplace_%';
-- ✅ Expected: 4

-- 2. Tiers assigned
SELECT COUNT(DISTINCT subscription_tier_id) FROM palikas WHERE subscription_tier_id IS NOT NULL;
-- ✅ Expected: 3

-- 3. Test users exist
SELECT COUNT(*) FROM auth.users WHERE email LIKE '%.com';
-- ✅ Expected: 8

-- 4. Test businesses exist
SELECT COUNT(*) FROM businesses;
-- ✅ Expected: 8

-- 5. Products created (respecting tiers)
SELECT COUNT(*) FROM marketplace_products;
-- ✅ Expected: 16+

-- 6. Comments created
SELECT COUNT(*) FROM marketplace_product_comments;
-- ✅ Expected: 15+

-- 7. No tier violations
SELECT COUNT(*) FROM marketplace_products mp
JOIN marketplace_categories mc ON mp.marketplace_category_id = mc.id
WHERE mp.palika_id NOT IN (
  SELECT id FROM palikas WHERE subscription_tier_id IN (
    SELECT id FROM subscription_tiers WHERE tier_level >= mc.min_tier_level
  )
);
-- ✅ Expected: 0 (no violations)
```

---

## 🎯 Pass/Fail Criteria

**PASS** if:
- ✅ All tables created successfully
- ✅ All tiers assigned
- ✅ Test data seeded without errors
- ✅ Tier 1 users see 9 categories
- ✅ Tier 2 users see 17 categories
- ✅ Tier 3 users see 26 categories
- ✅ No products cross tier boundaries
- ✅ Tier 1 products auto-publish
- ✅ Comments work and are threaded
- ✅ No orphaned records

**FAIL** if:
- ❌ Migrations have errors
- ❌ Test users not created
- ❌ Tier violations (Tier 1 user creates Tier 2 product)
- ❌ Products don't auto-publish
- ❌ Comments not visible
- ❌ Orphaned records exist

---

## 🐛 Debugging

### Common Issues

**Issue: "Table does not exist"**
```bash
# Solution: Make sure migrations were created and applied
supabase migration list
supabase db push
```

**Issue: "Auth user creation failed"**
```bash
# Check .env has correct SUPABASE_URL and SERVICE_ROLE_KEY
cat .env | grep SUPABASE
```

**Issue: "Tier assignment shows NULL"**
```bash
# Make sure palikas 1-4 exist
SELECT * FROM palikas WHERE id <= 4;
```

**Issue: "Products created with wrong category"**
```bash
# Check marketplace_categories exist
SELECT COUNT(*) FROM marketplace_categories;
-- Should be 26
```

---

## 📝 Testing Notes

### Document the Results

As you run tests, fill in this template:

```markdown
# Testing Report - [DATE]

## Setup Phase
- [x] Database reset
- [x] Migrations applied
- [x] Categories seeded
- [x] Tiers assigned
- [x] Test data created

## Constraint Tests
- [x] Tier 1 category access (9 categories)
- [x] Tier 2 category access (17 categories)
- [x] Tier 3 category access (26 categories)
- [x] Tier crossing blocked
- [x] Auto-publish working
- [x] Comments functional
- [x] RLS policies enforced

## Issues Found
- None / [List issues]

## Ready for Next Phase
- [ ] API Development
- [ ] UI Implementation
```

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Create API Endpoints**
   ```bash
   POST /api/marketplace/products
   GET /api/marketplace/categories
   GET /api/marketplace/products
   POST /api/marketplace/products/:id/comments
   ```

2. **Create Admin UI**
   - Category management
   - Business approval workflow
   - Product moderation

3. **Create User Dashboard**
   - Product listing form
   - Business profile
   - Comment management

4. **Deploy to Production**
   - Run migration scripts
   - Seed production categories
   - Verify RLS policies

---

## 📞 Support

If tests fail:
1. Check TESTING_CHECKLIST.md for detailed test steps
2. Review MARKETPLACE_PRODUCT_SCHEMA.md for schema
3. Check migration logs: `supabase migration list`
4. Verify .env configuration

---

**Status:** Ready to Execute
**Time Estimate:** 2-3 hours
**Priority:** High (Foundation for marketplace features)
