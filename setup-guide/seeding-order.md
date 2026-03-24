# Database Seeding Order

**CRITICAL:** Run these scripts in exactly this order. Dependencies matter!

## Prerequisites

Before running any seeding scripts:

1. ✅ Supabase is running: `supabase status`
2. ✅ Docker is running: `docker ps`
3. ✅ Database dependencies installed: `cd database && npm install`
4. ✅ You are in the `database` directory

## Seeding Sequence

### Step 1: Basic Infrastructure
```powershell
npx ts-node scripts/seed-database.ts
```

**Creates:**
- 7 provinces
- 77 districts
- 372 palikas
- 6 roles
- 12 permissions
- 27 content categories
- 2 app versions

**Time:** ~30 seconds

**Verify:**
```sql
SELECT COUNT(*) FROM provinces;  -- Should be 7
SELECT COUNT(*) FROM districts;  -- Should be 77
SELECT COUNT(*) FROM palikas;    -- Should be 372
```

---

### Step 2: Subscription Tiers
```powershell
npx ts-node scripts/seed-subscription-tiers.ts
```

**Creates:**
- 3 subscription tiers (Basic, Tourism, Premium)
- 27 platform features
- 57 tier-feature mappings

**Time:** ~5 seconds

**Verify:**
```sql
SELECT COUNT(*) FROM subscription_tiers;  -- Should be 3
SELECT COUNT(*) FROM features;            -- Should be 27
SELECT COUNT(*) FROM tier_features;       -- Should be 57
```

---

### Step 3: Marketplace Categories
```powershell
npx ts-node scripts/seed-marketplace-categories-direct.ts
```

**Creates:**
- 26 marketplace categories (tier-gated)
  - Tier 1: 9 categories
  - Tier 2: 8 categories
  - Tier 3: 9 categories

**Time:** ~3 seconds

**Verify:**
```sql
SELECT COUNT(*) FROM marketplace_categories;  -- Should be 26
SELECT min_tier_level, COUNT(*) FROM marketplace_categories GROUP BY min_tier_level;
```

---

### Step 4: Business Categories
```powershell
npx ts-node scripts/seed-business-categories-direct.ts
```

**Creates:**
- 8 business categories
  - Accommodation
  - Food & Beverage
  - Producer
  - Tour Guide
  - Professional Service
  - Artisan Workshop
  - Transportation
  - Retail Shop

**Time:** ~2 seconds

**Verify:**
```sql
SELECT COUNT(*) FROM business_categories;  -- Should be 8
```

---

### Step 5: Palika Tier Assignment
```powershell
npx ts-node scripts/enroll-palikas-tiers.ts
```

**Creates:**
- Tier assignments for 5 palikas
  - Palika 1 (Bhojpur) → Premium
  - Palika 2 (Shadananda) → Tourism
  - Palika 3 (Aamchok) → Tourism
  - Palika 4 (Arun) → Basic
  - Palika 10 (Dhankuta) → Tourism

**Time:** ~2 seconds

**Verify:**
```sql
SELECT id, name_en, subscription_tier_id FROM palikas WHERE subscription_tier_id IS NOT NULL;
```

---

### Step 6: Test Users and Businesses
```powershell
npx ts-node scripts/seed-marketplace-proper.ts
```

**Creates:**
- 8 test users (in auth.users)
- 8 user profiles
- 8 businesses
- 16 marketplace products
- 15 threaded comments

**Time:** ~10 seconds

**Verify:**
```sql
SELECT COUNT(*) FROM auth.users;                      -- Should be 8
SELECT COUNT(*) FROM profiles;                        -- Should be 8
SELECT COUNT(*) FROM businesses;                      -- Should be 8
SELECT COUNT(*) FROM marketplace_products;            -- Should be 16
SELECT COUNT(*) FROM marketplace_product_comments;    -- Should be 15
```

---

## Optional: Additional Test Data

### More Marketplace Products
```powershell
npx ts-node scripts/seed-marketplace-test-data.ts
```

**Creates:**
- Additional products
- More comments

**Note:** Only run if you need more test data.

---

## Quick Verification Script

Run this to check all tables:
```powershell
npx ts-node scripts/quick-table-check.ts
```

---

## Common Errors and Solutions

### Error: "No palikas found"
**Cause:** Step 1 not completed
**Solution:** Run `seed-database.ts` first

### Error: "No subscription tiers found"
**Cause:** Step 2 not completed
**Solution:** Run `seed-subscription-tiers.ts` first

### Error: "Could not find Kathmandu palika (KTM001)"
**Cause:** Admin seeding script looking for non-existent code
**Solution:** Skip admin seeding, it's not critical for basic setup

### Error: "Category not found"
**Cause:** Steps 3 or 4 not completed
**Solution:** Run marketplace and business category scripts

---

## Complete Setup Script

If you want to run everything at once:

```powershell
cd database

# Run all seeding scripts in order
npx ts-node scripts/seed-database.ts
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/enroll-palikas-tiers.ts
npx ts-node scripts/seed-marketplace-proper.ts

# Verify
npx ts-node scripts/quick-table-check.ts
```

**Total Time:** ~1 minute

---

## What Each Script Depends On

```
seed-database.ts
  ↓
  ├─ seed-subscription-tiers.ts
  │    ↓
  │    └─ enroll-palikas-tiers.ts
  │
  ├─ seed-marketplace-categories-direct.ts
  │    ↓
  │    └─ seed-marketplace-proper.ts
  │
  └─ seed-business-categories-direct.ts
       ↓
       └─ seed-marketplace-proper.ts
```

**Key Takeaway:** `seed-database.ts` must run first. Everything else depends on it.

---

## Troubleshooting

### Script Fails Midway
- Check error message carefully
- Verify previous steps completed successfully
- Check Supabase is still running: `supabase status`
- Try running the failed script again (they use upsert, so it's safe)

### Want to Start Over
```powershell
# WARNING: This deletes all data
supabase db reset

# Then run all seeding scripts again
```

### Check What's Already Seeded
Open Supabase Studio (http://127.0.0.1:54323) and browse tables.

---

**Remember:** Order matters! Follow this sequence exactly for successful setup.
