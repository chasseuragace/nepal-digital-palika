# Scripts Reorganization - Before & After

## Before: Flat Structure

```
database/scripts/
├── seed-subscription-tiers.ts
├── seed-business-types.ts
├── seed-business-categories-direct.ts
├── seed-marketplace-categories-direct.ts
├── seed-admin-users.ts
├── enroll-palikas-tiers.ts
├── seed-complete-flow.ts
├── seed-marketplace-proper.ts
├── seed-marketplace-test-data.ts
└── ... (other scripts)
```

**Issues**:
- No clear execution order
- Dependencies not obvious
- Hard to understand what each stage does
- Difficult to run partial seeding

---

## After: 5-Stage Pipeline

```
STAGE 1: Infrastructure Setup
├── seed-subscription-tiers.ts
│   └─ Creates: 3 tiers, 27 features, 57 tier-feature mappings
├── seed-business-types.ts
│   └─ Creates: 96 business type categories (8 per palika)
├── seed-business-categories-direct.ts
│   └─ Creates: 8 business categories
└── seed-marketplace-categories-direct.ts
    └─ Creates: 26 marketplace categories (tier-gated)

STAGE 2: Admin Setup
└── seed-admin-users.ts
    └─ Creates: 1 super admin, 2 palika admins, 2 moderators

STAGE 3: Palika Tier Assignment
└── enroll-palikas-tiers.ts
    └─ Assigns: 5 palikas to tiers (Basic, Tourism, Premium)

STAGE 4: Palika User Creation
└── seed-marketplace-proper.ts
    └─ Creates: 8 users → 8 profiles → 8 businesses → 16 products

STAGE 5: Marketplace Product Creation
└── seed-marketplace-test-data.ts
    └─ Creates: Additional products, threaded comments
```

---

## Script Mapping

### Stage 1: Infrastructure Setup

| Script | Purpose | Output |
|--------|---------|--------|
| `seed-subscription-tiers.ts` | Create subscription tiers with features | 3 tiers, 27 features |
| `seed-business-types.ts` | Create business type categories for all palikas | 96 categories (8 × 12 palikas) |
| `seed-business-categories-direct.ts` | Create business categories | 8 categories |
| `seed-marketplace-categories-direct.ts` | Create marketplace categories (tier-gated) | 26 categories |

**Dependencies**: None (post db-reset)

**Key Tables**:
- `subscription_tiers`
- `features`
- `tier_features`
- `categories` (entity_type = 'business')
- `business_categories`
- `marketplace_categories`

---

### Stage 2: Admin Setup

| Script | Purpose | Output |
|--------|---------|--------|
| `seed-admin-users.ts` | Create admin users for platform management | 5 admin users |

**Dependencies**: Stage 1 (needs palikas to exist)

**Key Tables**:
- `auth.users`
- `admin_users`

**Admins Created**:
- 1 Super Admin (national)
- 2 Palika Admins (Kathmandu, Bhaktapur)
- 2 Content Moderators (Kathmandu, Bhaktapur)

---

### Stage 3: Palika Tier Assignment

| Script | Purpose | Output |
|--------|---------|--------|
| `enroll-palikas-tiers.ts` | Assign subscription tiers to palikas | 5 tier assignments |

**Dependencies**: Stage 1 & 2

**Key Tables**:
- `palikas` (subscription_tier_id)
- `tier_assignment_log`

**Assignments**:
```
Palika 1 (Rajbiraj)   → Premium (Tier 3)
Palika 2 (Kanyam)     → Tourism (Tier 2)
Palika 3 (Tilawe)     → Tourism (Tier 2)
Palika 4 (Itahari)    → Basic (Tier 1)
Palika 10 (Bhaktapur) → Tourism (Tier 2)
```

---

### Stage 4: Palika User Creation

| Script | Purpose | Output |
|--------|---------|--------|
| `seed-marketplace-proper.ts` | Create test users with businesses and products | 8 users, 8 businesses, 16 products |

**Dependencies**: Stage 1, 2, 3

**Key Tables**:
- `auth.users`
- `profiles` (with default_palika_id)
- `businesses` (with owner_user_id)
- `marketplace_products` (with business_id)
- `marketplace_product_comments`

**Flow for Each User**:
```
1. Create auth user
   ↓
2. Create profile with default_palika_id
   ↓
3. Create business with owner_user_id
   ↓
4. Create products with business_id
   ↓
5. Create threaded comments
```

**Test Users Created**:
```
Tier 1 (Itahari - Palika 4):
  - Raj Kumar (Producer)
  - Priya Singh (Retail Shop)

Tier 2 (Kanyam/Tilawe - Palikas 2,3):
  - Amit Patel (Tour Guide)
  - Neha Sharma (Artisan Workshop)
  - Vikram Singh (Food & Beverage)
  - Priya Patel (Accommodation)

Tier 3 (Rajbiraj - Palika 1):
  - Vikram Singh (Accommodation)
  - Ananya Sharma (Professional Service)
```

---

### Stage 5: Marketplace Product Creation

| Script | Purpose | Output |
|--------|---------|--------|
| `seed-marketplace-test-data.ts` | Create additional marketplace products | Additional products, comments |

**Dependencies**: Stage 4

**Key Tables**:
- `marketplace_products`
- `marketplace_product_comments`

**Features**:
- Respects tier constraints
- Creates threaded comments
- Validates category access

---

## Execution Flow

### Complete Pipeline
```bash
bash session-2026-03-21/run-seeds.sh
```

Runs all 5 stages in order:
1. Infrastructure Setup (4 scripts)
2. Admin Setup (1 script)
3. Palika Tier Assignment (1 script)
4. Palika User Creation (1 script)
5. Marketplace Product Creation (1 script)

### Individual Stages
```bash
# Stage 1 only
cd database
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts

# Stage 2 only
npx ts-node scripts/seed-admin-users.ts

# Stage 3 only
npx ts-node scripts/enroll-palikas-tiers.ts

# Stage 4 only
npx ts-node scripts/seed-marketplace-proper.ts

# Stage 5 only
npx ts-node scripts/seed-marketplace-test-data.ts
```

---

## Data Dependencies

```
Stage 1 Output
├─ subscription_tiers (3)
├─ features (27)
├─ tier_features (57)
├─ categories (96)
├─ business_categories (8)
└─ marketplace_categories (26)
    ↓
Stage 2 Output
├─ auth.users (5)
└─ admin_users (5)
    ↓
Stage 3 Output
├─ palikas.subscription_tier_id (5)
└─ tier_assignment_log (5)
    ↓
Stage 4 Output
├─ auth.users (8 more)
├─ profiles (8)
├─ businesses (8)
├─ marketplace_products (16)
└─ marketplace_product_comments (24)
    ↓
Stage 5 Output
├─ marketplace_products (additional)
└─ marketplace_product_comments (additional)
```

---

## Benefits of This Organization

✅ **Clear Execution Order**: Each stage depends on previous stages

✅ **Logical Grouping**: Related scripts grouped by purpose

✅ **Easy to Understand**: Each stage has a clear responsibility

✅ **Flexible Execution**: Can run individual stages or full pipeline

✅ **Better Debugging**: Easier to identify which stage failed

✅ **Scalable**: Easy to add new stages or scripts

✅ **Documentation**: Clear what each stage does

✅ **Testing**: Can test each stage independently

---

## Future Enhancements

### Potential Stage 6: Content Creation
```
seed-heritage-sites.ts
seed-events.ts
seed-blog-posts.ts
```

### Potential Stage 7: User Interactions
```
seed-reviews.ts
seed-inquiries.ts
seed-favorites.ts
```

### Potential Stage 8: Analytics
```
seed-view-counts.ts
seed-engagement-metrics.ts
```

---

## Quick Reference

| Stage | Scripts | Output | Time |
|-------|---------|--------|------|
| 1 | 4 | Infrastructure | ~5s |
| 2 | 1 | Admins | ~2s |
| 3 | 1 | Tier Assignments | ~1s |
| 4 | 1 | Users & Businesses | ~10s |
| 5 | 1 | Products & Comments | ~5s |
| **Total** | **8** | **Complete Setup** | **~23s** |

---

## Verification Checklist

After each stage, verify:

### Stage 1
- [ ] 3 subscription tiers exist
- [ ] 27 features exist
- [ ] 96 business type categories exist
- [ ] 26 marketplace categories exist

### Stage 2
- [ ] 5 admin users exist
- [ ] Super admin created
- [ ] Palika admins created

### Stage 3
- [ ] 5 palikas have tier assignments
- [ ] Tier assignment log populated

### Stage 4
- [ ] 8 test users created
- [ ] 8 profiles with palika assignments
- [ ] 8 businesses created
- [ ] 16 products created

### Stage 5
- [ ] Additional products created
- [ ] Comments created
- [ ] Tier constraints respected
