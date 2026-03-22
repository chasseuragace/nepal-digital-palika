# Database Seeding Pipeline - 5 Stages

## Overview

The seeding process is organized into 5 logical stages, each building on the previous one:

```
Stage 1: Infrastructure Setup
    ↓
Stage 2: Admin Setup
    ↓
Stage 3: Palika Tier Assignment
    ↓
Stage 4: Palika User Creation (with Business Profiles)
    ↓
Stage 5: Marketplace Product Creation
```

---

## Stage 1: Infrastructure Setup

**Purpose**: Set up core platform infrastructure

**Scripts**:
1. `seed-subscription-tiers.ts` - Create subscription tiers (Basic, Tourism, Premium)
2. `seed-business-types.ts` - Create business type categories for all palikas
3. `seed-business-categories-direct.ts` - Create business categories
4. `seed-marketplace-categories-direct.ts` - Create marketplace categories (tier-gated)

**Output**:
- ✅ 3 subscription tiers with features
- ✅ 8 business types per palika (96 total)
- ✅ 8 business categories
- ✅ 26 marketplace categories (tier-gated)

**Dependencies**: None (runs after db reset)

**Run**:
```bash
cd database
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts
```

---

## Stage 2: Admin Setup

**Purpose**: Create admin users for platform management

**Scripts**:
1. `seed-admin-users.ts` - Create super admin and palika admins

**Output**:
- ✅ 1 Super Admin (national level)
- ✅ 2 Palika Admins (Kathmandu, Bhaktapur)
- ✅ 2 Content Moderators (Kathmandu, Bhaktapur)

**Admin Credentials**:
```
Super Admin:
  Email: superadmin@nepaltourism.dev
  Password: SuperSecurePass123!

Kathmandu:
  Palika Admin: palika.admin@kathmandu.gov.np / KathmanduAdmin456!
  Moderator: content.moderator@kathmandu.gov.np / ModeratorSecure789!

Bhaktapur:
  Palika Admin: palika.admin@bhaktapur.gov.np / BhaktapurAdmin456!
  Moderator: content.moderator@bhaktapur.gov.np / BhaktapurModerator789!
```

**Dependencies**: Stage 1 (needs palikas to exist)

**Run**:
```bash
cd database
npx ts-node scripts/seed-admin-users.ts
```

---

## Stage 3: Palika Tier Assignment

**Purpose**: Assign subscription tiers to palikas

**Scripts**:
1. `enroll-palikas-tiers.ts` - Assign tiers to palikas

**Tier Assignments**:
```
Palika 1 (Rajbiraj)        → Premium (Tier 3)
Palika 2 (Kanyam)          → Tourism (Tier 2)
Palika 3 (Tilawe)          → Tourism (Tier 2)
Palika 4 (Itahari)         → Basic (Tier 1)
Palika 10 (Bhaktapur)      → Tourism (Tier 2)
```

**Output**:
- ✅ 5 palikas with tier assignments
- ✅ Tier features enabled per palika
- ✅ Marketplace category access configured

**Dependencies**: Stage 1 & 2 (needs tiers and palikas)

**Run**:
```bash
cd database
npx ts-node scripts/enroll-palikas-tiers.ts
```

---

## Stage 4: Palika User Creation

**Purpose**: Create test users, assign them to palikas, and create business profiles

**Scripts**:
1. `seed-marketplace-proper.ts` - Create comprehensive test users with businesses

**What It Does**:
```
For each test user:
  1. Create auth user
  2. Create profile with default_palika_id
  3. Create business (owner_user_id → profile.id)
  4. Create marketplace products
  5. Create threaded comments
```

**Test Data Created**:
```
Tier 1 (Itahari - Palika 4):
  - 2 users (Raj Kumar, Priya Singh)
  - 2 businesses (Producer, Retail Shop)
  - 4 products (tier-gated)

Tier 2 (Kanyam/Tilawe - Palikas 2,3):
  - 4 users (Amit Patel, Neha Sharma, etc.)
  - 4 businesses (Tour Guide, Artisan, Food, etc.)
  - 8 products (tier-gated)

Tier 3 (Rajbiraj - Palika 1):
  - 2 users (Vikram Singh, etc.)
  - 2 businesses (Accommodation, etc.)
  - 4 products (all categories available)
```

**User Credentials** (generated):
```
Email: [name]@test.com
Password: TestPassword123!@#
```

**Output**:
- ✅ 8 test users created
- ✅ 8 user profiles with palika assignments
- ✅ 8 businesses created
- ✅ 16 marketplace products
- ✅ Threaded comments on products

**Dependencies**: Stage 1, 2, 3 (needs tiers, admins, tier assignments)

**Run**:
```bash
cd database
npx ts-node scripts/seed-marketplace-proper.ts
```

---

## Stage 5: Marketplace Product Creation

**Purpose**: Create additional marketplace products for testing

**Scripts**:
1. `seed-marketplace-test-data.ts` - Create additional test products

**What It Does**:
- Creates products respecting tier constraints
- Creates threaded comments with owner replies
- Validates tier-gated category access

**Output**:
- ✅ Additional marketplace products
- ✅ Threaded comments with owner responses
- ✅ Validation of tier constraints

**Dependencies**: Stage 4 (needs users and businesses)

**Run**:
```bash
cd database
npx ts-node scripts/seed-marketplace-test-data.ts
```

---

## Complete Pipeline Execution

### Option 1: Run All Stages (Recommended)

```bash
bash session-2026-03-21/run-seeds.sh
```

This runs all stages in order:
1. Infrastructure Setup
2. Admin Setup
3. Palika Tier Assignment
4. Palika User Creation
5. Marketplace Product Creation

### Option 2: Run Individual Stages

```bash
# Stage 1: Infrastructure
cd database
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts

# Stage 2: Admin
npx ts-node scripts/seed-admin-users.ts

# Stage 3: Tier Assignment
npx ts-node scripts/enroll-palikas-tiers.ts

# Stage 4: User Creation
npx ts-node scripts/seed-marketplace-proper.ts

# Stage 5: Products
npx ts-node scripts/seed-marketplace-test-data.ts
```

### Option 3: Quick Test (Single User)

```bash
cd database
npx ts-node scripts/seed-complete-flow.ts
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Infrastructure Setup                               │
│ ├─ Subscription Tiers (3)                                   │
│ ├─ Business Types (96)                                      │
│ ├─ Business Categories (8)                                  │
│ └─ Marketplace Categories (26)                              │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Admin Setup                                        │
│ ├─ Super Admin (1)                                          │
│ ├─ Palika Admins (2)                                        │
│ └─ Content Moderators (2)                                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Palika Tier Assignment                             │
│ ├─ Palika 1 → Premium                                       │
│ ├─ Palika 2 → Tourism                                       │
│ ├─ Palika 3 → Tourism                                       │
│ ├─ Palika 4 → Basic                                         │
│ └─ Palika 10 → Tourism                                      │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: Palika User Creation                               │
│ For each user:                                              │
│ ├─ Create Auth User                                         │
│ ├─ Create Profile (default_palika_id)                       │
│ ├─ Create Business (owner_user_id)                          │
│ └─ Create Products (business_id)                            │
│                                                             │
│ Output: 8 users, 8 businesses, 16 products                  │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 5: Marketplace Product Creation                       │
│ ├─ Additional Products                                      │
│ ├─ Threaded Comments                                        │
│ └─ Owner Replies                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Database State After Each Stage

### After Stage 1
```
subscription_tiers: 3 rows
features: 27 rows
tier_features: 57 rows
categories: 96 rows (business types)
business_categories: 8 rows
marketplace_categories: 26 rows
```

### After Stage 2
```
auth.users: 5 rows (4 admins + 1 system)
admin_users: 5 rows
```

### After Stage 3
```
palikas: 12 rows (5 with tier assignments)
tier_assignment_log: 5 rows
```

### After Stage 4
```
auth.users: 13 rows (5 admins + 8 test users)
profiles: 8 rows
businesses: 8 rows
marketplace_products: 16 rows
marketplace_product_comments: 24 rows (threaded)
```

### After Stage 5
```
marketplace_products: 32+ rows
marketplace_product_comments: 48+ rows
```

---

## Verification Queries

### Check Infrastructure
```sql
SELECT COUNT(*) as tier_count FROM subscription_tiers;
SELECT COUNT(*) as business_type_count FROM categories WHERE entity_type = 'business';
SELECT COUNT(*) as marketplace_cat_count FROM marketplace_categories;
```

### Check Admins
```sql
SELECT full_name, role, palika_id FROM admin_users ORDER BY role;
```

### Check Tier Assignments
```sql
SELECT p.name_en, st.display_name as tier 
FROM palikas p 
LEFT JOIN subscription_tiers st ON p.subscription_tier_id = st.id 
WHERE p.subscription_tier_id IS NOT NULL;
```

### Check Users & Businesses
```sql
SELECT 
  pr.name,
  p.name_en as palika,
  b.business_name,
  COUNT(mp.id) as product_count
FROM profiles pr
LEFT JOIN palikas p ON pr.default_palika_id = p.id
LEFT JOIN businesses b ON pr.id = b.owner_user_id
LEFT JOIN marketplace_products mp ON b.id = mp.business_id
GROUP BY pr.id, p.id, b.id;
```

---

## Troubleshooting

### Stage 1 Fails
- Check: Database migrations applied successfully
- Check: `supabase db reset` completed

### Stage 2 Fails
- Check: Palikas exist (geographic seeding in migrations)
- Check: Palika codes are correct (KTM001, BHK001)

### Stage 3 Fails
- Check: Subscription tiers created (Stage 1)
- Check: Palikas exist with correct IDs

### Stage 4 Fails
- Check: All previous stages completed
- Check: Business categories exist
- Check: Marketplace categories exist

### Stage 5 Fails
- Check: Users and businesses created (Stage 4)
- Check: Marketplace categories exist (Stage 1)

---

## Next Steps

After seeding:
1. ✅ Verify data with queries above
2. ✅ Test RLS policies
3. ✅ Test marketplace functionality
4. ✅ Test admin panel
5. ✅ Test user authentication
