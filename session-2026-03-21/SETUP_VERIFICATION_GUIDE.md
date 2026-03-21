# Setup Verification & Testing Guide

**Purpose:** Verify complete project setup and prepare for m-place testing across multiple palikas  
**Date:** 2026-03-21  
**Status:** 🔵 In Progress

---

## Setup Checklist

### 1. Supabase Running ✅

```bash
# Verify Supabase is running
supabase status

# Expected output:
# supabase local development setup is running
# Studio: http://127.0.0.1:54323
# API: http://127.0.0.1:54321
```

**If not running:**
```bash
supabase start
```

### 2. Database Migrations Applied ✅

```bash
# Verify all 34 migrations are applied
ls -1 supabase/migrations/*.sql | wc -l

# Expected: 34 files
```

**If migrations not applied:**
```bash
supabase db reset --linked
```

### 3. Infrastructure Seeded ✅

**What should be seeded:**
- ✅ Palikas (753 geographic units)
- ✅ Categories (heritage, events, businesses, etc.)
- ✅ Subscription Tiers (Basic, Tourism, Premium)
- ✅ RLS Policies & Functions
- ✅ Platform Admins (super_admin users)

**Verify:**
```bash
cd database
npm run check-status
```

**If not seeded:**
```bash
cd database
npm run seed:infrastructure
```

### 4. Palika Tier Assignment ✅

**What should be assigned:**
- Palikas assigned subscription tiers (Basic, Tourism, Premium)
- Tier determines available marketplace categories

**Verify:**
```bash
cd database
npm run check-status
```

**If not assigned:**
```bash
cd database
npm run seed:palika-tiers
```

### 5. Palika Admins Created ✅

**What should be created:**
- Admin users for each palika
- Assigned to correct geographic regions
- Proper role assignments

**Verify:**
```bash
cd database
npm run check-status
```

**If not created:**
```bash
cd database
npm run seed:palika-admins
```

---

## Environment Configuration

### Required Environment Variables

Create `.env` file in workspace root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get-from-supabase-status]
SUPABASE_SERVICE_ROLE_KEY=[get-from-supabase-status]

# Admin Panel Configuration
ADMIN_SESSION_SECRET=[random-32-char-string]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get Supabase keys:**
```bash
supabase status
# Copy ANON_KEY and SERVICE_ROLE_KEY values
```

### Per-Application Configuration

**admin-panel/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
ADMIN_SESSION_SECRET=[random-32-char-string]
```

**platform-admin-panel/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**m-place/.env.local:**
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=[anon-key]
```

---

## User & Business Seeding Strategy

### Current Flow (m-place)
1. User registers
2. Business profile auto-created (linked to palika)
3. User can create products
4. Products appear in marketplace

### Seeding Requirements

**What we need:**
- Configurable number of users (n)
- Configurable list of palikas (m)
- Palikas must have assigned tiers
- Marketplace categories depend on tier
- Business profile auto-created with user

### Seeding Script Structure

```bash
# Seed n users to m palikas
npm run seed:users -- --count=n --palikas=palika1,palika2,palika3

# Example: Seed 10 users to 3 palikas
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
```

---

## Marketplace Testing Setup

### Prerequisites
1. ✅ Supabase running
2. ✅ Infrastructure seeded (palikas, categories, tiers)
3. ✅ Palika tiers assigned
4. ✅ Users seeded to palikas
5. ✅ Business profiles auto-created

### Testing Scenarios

#### Scenario 1: Single Palika Testing
```bash
# Seed 5 users to Kathmandu Metropolitan
npm run seed:users -- --count=5 --palikas=kathmandu

# Launch m-place targeting Kathmandu
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

**Expected:**
- 5 users registered
- 5 business profiles created
- Marketplace shows products from Kathmandu only
- Categories based on Kathmandu's tier

#### Scenario 2: Multiple Palika Testing
```bash
# Seed 10 users to 3 palikas
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur

# Launch m-place targeting different palikas
# Terminal 1: Kathmandu
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev

# Terminal 2: Bhaktapur (different port)
cd m-place
VITE_PALIKA_ID=bhaktapur PORT=5174 npm run dev

# Terminal 3: Lalitpur (different port)
cd m-place
VITE_PALIKA_ID=lalitpur PORT=5175 npm run dev
```

**Expected:**
- Each instance shows only its palika's data
- Categories based on each palika's tier
- Users and products scoped correctly

#### Scenario 3: Tier-Based Categories
```bash
# Seed users to palikas with different tiers
npm run seed:users -- --count=5 --palikas=kathmandu,small-palika

# Kathmandu: Premium tier → All categories
# Small Palika: Basic tier → Limited categories

# Launch m-place for each
VITE_PALIKA_ID=kathmandu npm run dev
VITE_PALIKA_ID=small-palika PORT=5174 npm run dev
```

**Expected:**
- Kathmandu shows all marketplace categories
- Small Palika shows only basic categories
- Categories determined by tier

---

## Seeding Scripts to Create

### 1. User Seeding Script

**File:** `database/scripts/seed-users-configurable.ts`

```typescript
// Usage: npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur

interface SeedOptions {
  count: number;        // Number of users per palika
  palikas: string[];    // List of palika IDs
}

async function seedUsers(options: SeedOptions) {
  // 1. Validate palikas exist and have tiers assigned
  // 2. For each palika:
  //    - Create n users
  //    - Auto-create business profile for each user
  //    - Link to palika
  // 3. Log results
}
```

**What it does:**
- Creates n users per palika
- Auto-creates business profile for each user
- Links business to palika
- Assigns marketplace categories based on tier

### 2. Configuration Script

**File:** `database/scripts/configure-palika.ts`

```typescript
// Usage: npm run configure:palika -- --palika=kathmandu --tier=Premium

interface PalikaConfig {
  palikaId: string;
  tier: 'Basic' | 'Tourism' | 'Premium';
}

async function configurePalika(config: PalikaConfig) {
  // 1. Verify palika exists
  // 2. Assign tier
  // 3. Enable categories based on tier
  // 4. Log configuration
}
```

**What it does:**
- Assigns tier to palika
- Enables marketplace categories based on tier
- Verifies configuration

### 3. Verification Script

**File:** `database/scripts/verify-palika-setup.ts`

```typescript
// Usage: npm run verify:palika -- --palika=kathmandu

interface VerifyOptions {
  palikaId: string;
}

async function verifyPalikaSetup(options: VerifyOptions) {
  // 1. Check palika exists
  // 2. Check tier assigned
  // 3. Check categories enabled
  // 4. Check users exist
  // 5. Check business profiles exist
  // 6. Report status
}
```

**What it does:**
- Verifies palika setup is complete
- Checks tier assignment
- Checks users and businesses
- Reports any issues

---

## Complete Setup Flow

### Step 1: Start Supabase
```bash
supabase start
```

### Step 2: Verify Infrastructure
```bash
./verify-setup.sh
```

### Step 3: Seed Infrastructure
```bash
cd database
npm run seed:infrastructure
```

### Step 4: Assign Palika Tiers
```bash
cd database
npm run seed:palika-tiers
```

### Step 5: Create Palika Admins
```bash
cd database
npm run seed:palika-admins
```

### Step 6: Seed Users to Palikas
```bash
cd database
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
```

### Step 7: Verify Setup
```bash
cd database
npm run verify:palika -- --palika=kathmandu
```

### Step 8: Launch m-place
```bash
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev
```

---

## Environment Variables for m-place

### Single Palika Testing
```bash
# Target specific palika
VITE_PALIKA_ID=kathmandu npm run dev

# Or configure in .env.local
VITE_PALIKA_ID=kathmandu
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=[anon-key]
```

### Multiple Palika Testing
```bash
# Terminal 1: Kathmandu
cd m-place
VITE_PALIKA_ID=kathmandu npm run dev

# Terminal 2: Bhaktapur (different port)
cd m-place
VITE_PALIKA_ID=bhaktapur PORT=5174 npm run dev

# Terminal 3: Lalitpur (different port)
cd m-place
VITE_PALIKA_ID=lalitpur PORT=5175 npm run dev
```

---

## Verification Queries

### Check Palikas with Tiers
```sql
SELECT id, name, subscription_tier FROM palikas LIMIT 10;
```

### Check Users by Palika
```sql
SELECT COUNT(*) as user_count, palika_id 
FROM users 
GROUP BY palika_id;
```

### Check Business Profiles
```sql
SELECT COUNT(*) as business_count, palika_id 
FROM businesses 
GROUP BY palika_id;
```

### Check Products by Palika
```sql
SELECT COUNT(*) as product_count, b.palika_id 
FROM products p
JOIN businesses b ON p.business_id = b.id
GROUP BY b.palika_id;
```

### Check Categories by Tier
```sql
SELECT tier, COUNT(*) as category_count 
FROM marketplace_categories 
GROUP BY tier;
```

---

## Troubleshooting

### Issue: Supabase not running
```bash
supabase start
```

### Issue: Migrations not applied
```bash
supabase db reset --linked
```

### Issue: Infrastructure not seeded
```bash
cd database
npm run seed:infrastructure
```

### Issue: Palikas don't have tiers
```bash
cd database
npm run seed:palika-tiers
```

### Issue: Users not seeded
```bash
cd database
npm run seed:users -- --count=10 --palikas=kathmandu
```

### Issue: m-place not connecting to Supabase
- Check VITE_SUPABASE_URL is correct
- Check VITE_SUPABASE_ANON_KEY is correct
- Check Supabase is running

### Issue: m-place showing wrong palika data
- Check VITE_PALIKA_ID is set correctly
- Check RLS policies are enforced
- Verify palika exists in database

---

## Testing Checklist

- [ ] Supabase running
- [ ] All 34 migrations applied
- [ ] Infrastructure seeded
- [ ] Palika tiers assigned
- [ ] Palika admins created
- [ ] Users seeded to palikas
- [ ] Business profiles auto-created
- [ ] m-place environment variables configured
- [ ] m-place connects to Supabase
- [ ] m-place shows correct palika data
- [ ] Categories based on tier
- [ ] Multiple palikas can run simultaneously
- [ ] Data properly scoped by palika

---

## Next Steps

1. Create configurable seeding scripts
2. Create palika configuration script
3. Create verification script
4. Test with single palika
5. Test with multiple palikas
6. Test tier-based categories
7. Document findings
8. Prepare for Phase 6 development

---

**Created:** 2026-03-21  
**Status:** 🔵 Ready for Implementation
