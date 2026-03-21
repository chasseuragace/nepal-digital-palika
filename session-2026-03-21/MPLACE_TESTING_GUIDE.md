# m-place Testing Guide - Multi-Palika Setup

**Purpose:** Guide for testing m-place across multiple palikas with configurable seeding  
**Date:** 2026-03-21  
**Status:** 🔵 Ready for Testing

---

## Overview

This guide explains how to:
1. Set up the complete infrastructure
2. Seed users to multiple palikas
3. Launch m-place targeting different palikas
4. Test tier-based marketplace categories
5. Verify data scoping and RLS enforcement

---

## Prerequisites

### Required
- ✅ Supabase running locally
- ✅ All 34 migrations applied
- ✅ Infrastructure seeded (palikas, categories, tiers)
- ✅ Palika admins created
- ✅ Environment variables configured

### Verify Prerequisites
```bash
./verify-setup.sh
```

---

## Complete Setup Flow

### Step 1: Start Supabase
```bash
supabase start
```

**Verify:**
```bash
supabase status
# Should show: supabase local development setup is running
```

### Step 2: Reset Database (Clean Start)
```bash
supabase db reset --linked
```

**Verify:**
```bash
ls -1 supabase/migrations/*.sql | wc -l
# Should show: 34
```

### Step 3: Seed Infrastructure
```bash
cd database
npm run seed:infrastructure
```

**Verify:**
```bash
npm run check-status
# Should show: Infrastructure seeded ✓
```

### Step 4: Assign Palika Tiers
```bash
cd database
npm run seed:palika-tiers
```

**Verify:**
```bash
npm run verify:palika -- --palika=kathmandu
# Should show: Tier assigned ✓
```

### Step 5: Create Palika Admins
```bash
cd database
npm run seed:palika-admins
```

**Verify:**
```bash
npm run check-status
# Should show: Palika admins created ✓
```

### Step 6: Configure Specific Palikas
```bash
cd database

# Configure Kathmandu as Premium
npm run configure:palika -- --palika=kathmandu --tier=Premium

# Configure Bhaktapur as Tourism
npm run configure:palika -- --palika=bhaktapur --tier=Tourism

# Configure Lalitpur as Basic
npm run configure:palika -- --palika=lalitpur --tier=Basic
```

**Verify:**
```bash
npm run verify:palika -- --palika=kathmandu --verbose
# Should show: Tier assigned, Categories enabled
```

### Step 7: Seed Users to Palikas
```bash
cd database

# Seed 10 users to each palika
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
```

**Verify:**
```bash
npm run verify:palika -- --palika=kathmandu
# Should show: Users seeded: 10, Business profiles: 10
```

### Step 8: Verify Complete Setup
```bash
cd database

# Verify each palika
npm run verify:palika -- --palika=kathmandu --verbose
npm run verify:palika -- --palika=bhaktapur --verbose
npm run verify:palika -- --palika=lalitpur --verbose
```

---

## Testing Scenarios

### Scenario 1: Single Palika Testing

**Goal:** Test m-place with a single palika

**Setup:**
```bash
cd database
npm run seed:users -- --count=5 --palikas=kathmandu
```

**Launch m-place:**
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

**Expected:**
- m-place loads at http://localhost:5173
- Shows only Kathmandu data
- 5 users registered
- 5 business profiles created
- Premium tier categories available

**Test Cases:**
- [ ] Can browse products
- [ ] Can view business profiles
- [ ] Categories match Premium tier
- [ ] Data scoped to Kathmandu only

---

### Scenario 2: Multiple Palika Testing (Sequential)

**Goal:** Test m-place with different palikas sequentially

**Setup:**
```bash
cd database
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
```

**Launch m-place for Kathmandu:**
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

**Test:**
- [ ] Browse Kathmandu products
- [ ] Verify Premium tier categories
- [ ] Check user count (10)
- [ ] Check business count (10)

**Stop and switch to Bhaktapur:**
```bash
# Stop previous instance (Ctrl+C)
# Launch for Bhaktapur
VITE_PALIKA_ID=bhaktapur npm run dev
```

**Test:**
- [ ] Browse Bhaktapur products
- [ ] Verify Tourism tier categories
- [ ] Check user count (10)
- [ ] Check business count (10)

**Stop and switch to Lalitpur:**
```bash
# Stop previous instance (Ctrl+C)
# Launch for Lalitpur
VITE_PALIKA_ID=lalitpur npm run dev
```

**Test:**
- [ ] Browse Lalitpur products
- [ ] Verify Basic tier categories
- [ ] Check user count (10)
- [ ] Check business count (10)

---

### Scenario 3: Multiple Palika Testing (Parallel)

**Goal:** Test m-place with multiple palikas running simultaneously

**Setup:**
```bash
cd database
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
```

**Terminal 1: Kathmandu**
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
# Runs on http://localhost:5173
```

**Terminal 2: Bhaktapur**
```bash
cd m-place
VITE_PALIKA_ID=bhaktapur PORT=5174 npm run dev
# Runs on http://localhost:5174
```

**Terminal 3: Lalitpur**
```bash
cd m-place
VITE_PALIKA_ID=lalitpur PORT=5175 npm run dev
# Runs on http://localhost:5175
```

**Test:**
- [ ] Open all three instances in different browser tabs
- [ ] Verify each shows correct palika data
- [ ] Verify categories match tier
- [ ] Verify no data leakage between palikas
- [ ] Verify RLS enforcement

**Verification Queries:**
```sql
-- Check data isolation
SELECT DISTINCT palika_id FROM users;
SELECT DISTINCT palika_id FROM businesses;
SELECT DISTINCT b.palika_id FROM products p JOIN businesses b ON p.business_id = b.id;
```

---

### Scenario 4: Tier-Based Categories Testing

**Goal:** Verify marketplace categories are based on palika tier

**Setup:**
```bash
cd database

# Configure different tiers
npm run configure:palika -- --palika=kathmandu --tier=Premium
npm run configure:palika -- --palika=bhaktapur --tier=Tourism
npm run configure:palika -- --palika=lalitpur --tier=Basic

# Seed users
npm run seed:users -- --count=5 --palikas=kathmandu,bhaktapur,lalitpur
```

**Test Kathmandu (Premium):**
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

**Expected Categories:**
- Handicrafts
- Textiles
- Food & Beverages
- Tourism Services
- Accommodation
- Transportation

**Test Bhaktapur (Tourism):**
```bash
# Stop Kathmandu instance
VITE_PALIKA_ID=bhaktapur PORT=5174 npm run dev
```

**Expected Categories:**
- Handicrafts
- Textiles
- Food & Beverages
- Tourism Services

**Test Lalitpur (Basic):**
```bash
# Stop Bhaktapur instance
VITE_PALIKA_ID=lalitpur PORT=5175 npm run dev
```

**Expected Categories:**
- Handicrafts
- Textiles

**Verification:**
- [ ] Kathmandu shows all 6 categories
- [ ] Bhaktapur shows 4 categories
- [ ] Lalitpur shows 2 categories
- [ ] Categories match tier configuration

---

### Scenario 5: User Registration & Business Profile Creation

**Goal:** Verify business profiles are auto-created when users register

**Setup:**
```bash
cd database
npm run seed:users -- --count=3 --palikas=kathmandu
```

**Test:**
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

**Expected:**
- 3 users registered
- 3 business profiles auto-created
- Each user linked to their business
- Each business linked to palika

**Verification Queries:**
```sql
-- Check user-business relationship
SELECT u.id, u.email, b.id, b.name, b.palika_id
FROM users u
LEFT JOIN businesses b ON u.id = b.user_id
WHERE u.palika_id = 'kathmandu';

-- Should show 3 rows with matching palika_id
```

---

### Scenario 6: RLS Enforcement Testing

**Goal:** Verify RLS policies prevent cross-palika data access

**Setup:**
```bash
cd database
npm run seed:users -- --count=5 --palikas=kathmandu,bhaktapur
```

**Test:**
```bash
# Try to access Bhaktapur data while logged in as Kathmandu user
# This should fail due to RLS policies
```

**Verification:**
- [ ] Users can only see their palika's data
- [ ] RLS policies enforced at database level
- [ ] No data leakage between palikas

---

## Environment Configuration

### m-place/.env.local

```bash
# Supabase Configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=[get-from-supabase-status]

# Palika Configuration
VITE_PALIKA_ID=kathmandu

# Optional
VITE_API_URL=http://localhost:3000
```

### Get Supabase Keys

```bash
supabase status

# Copy these values:
# - ANON_KEY → VITE_SUPABASE_ANON_KEY
# - SERVICE_ROLE_KEY → SUPABASE_SERVICE_ROLE_KEY (for backend)
```

---

## Testing Checklist

### Infrastructure Setup
- [ ] Supabase running
- [ ] All 34 migrations applied
- [ ] Infrastructure seeded
- [ ] Palika tiers assigned
- [ ] Palika admins created

### User & Business Seeding
- [ ] Users seeded to palikas
- [ ] Business profiles auto-created
- [ ] Correct palika assignment
- [ ] Correct tier assignment

### m-place Configuration
- [ ] Environment variables set
- [ ] VITE_PALIKA_ID configured
- [ ] Supabase connection working
- [ ] RLS policies enforced

### Single Palika Testing
- [ ] m-place loads correctly
- [ ] Shows correct palika data
- [ ] Categories match tier
- [ ] Can browse products
- [ ] Can view businesses

### Multiple Palika Testing
- [ ] Sequential switching works
- [ ] Parallel instances work
- [ ] No data leakage
- [ ] Each shows correct data
- [ ] RLS enforced

### Tier-Based Categories
- [ ] Premium shows all categories
- [ ] Tourism shows 4 categories
- [ ] Basic shows 2 categories
- [ ] Categories match configuration

### Data Integrity
- [ ] Users linked to correct palika
- [ ] Businesses linked to correct palika
- [ ] Products linked to correct business
- [ ] No orphaned records

---

## Troubleshooting

### Issue: m-place not connecting to Supabase
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase is running
supabase status

# Check keys are correct
supabase status | grep ANON_KEY
```

### Issue: Wrong palika data showing
```bash
# Check VITE_PALIKA_ID is set
echo $VITE_PALIKA_ID

# Verify palika exists
cd database
npm run verify:palika -- --palika=kathmandu
```

### Issue: Categories not showing
```bash
# Check categories are configured
cd database
npm run verify:palika -- --palika=kathmandu --verbose

# Reconfigure if needed
npm run configure:palika -- --palika=kathmandu --tier=Premium
```

### Issue: Users not seeded
```bash
# Check seeding completed
cd database
npm run verify:palika -- --palika=kathmandu

# Reseed if needed
npm run seed:users -- --count=10 --palikas=kathmandu
```

---

## Performance Testing

### Load Testing
```bash
# Seed large number of users
cd database
npm run seed:users -- --count=100 --palikas=kathmandu

# Launch m-place and test performance
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev

# Monitor:
# - Page load time
# - Query performance
# - Memory usage
```

### Concurrent User Testing
```bash
# Launch multiple instances
VITE_PALIKA_ID=kathmandu npm run dev
VITE_PALIKA_ID=bhaktapur PORT=5174 npm run dev
VITE_PALIKA_ID=lalitpur PORT=5175 npm run dev

# Open all in browser and test simultaneously
```

---

## Verification Queries

### Check Palikas
```sql
SELECT id, name, subscription_tier FROM palikas LIMIT 10;
```

### Check Users by Palika
```sql
SELECT COUNT(*) as user_count, palika_id 
FROM users 
GROUP BY palika_id
ORDER BY user_count DESC;
```

### Check Business Profiles
```sql
SELECT COUNT(*) as business_count, palika_id 
FROM businesses 
GROUP BY palika_id
ORDER BY business_count DESC;
```

### Check Categories by Tier
```sql
SELECT tier, COUNT(*) as category_count 
FROM marketplace_categories 
GROUP BY tier;
```

### Check Products by Palika
```sql
SELECT COUNT(*) as product_count, b.palika_id 
FROM products p
JOIN businesses b ON p.business_id = b.id
GROUP BY b.palika_id
ORDER BY product_count DESC;
```

---

## Next Steps

1. Implement seeding scripts
2. Test single palika setup
3. Test multiple palika setup
4. Test tier-based categories
5. Test RLS enforcement
6. Document findings
7. Prepare for Phase 6 development

---

**Testing Guide Created:** 2026-03-21  
**Status:** 🔵 Ready for Testing
