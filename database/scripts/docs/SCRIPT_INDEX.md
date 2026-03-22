# Seeding Scripts Index

## Stage 1: Infrastructure Setup

### seed-subscription-tiers.ts
**Purpose**: Create subscription tiers and platform features

**Output**:
- 3 subscription tiers (Basic, Tourism, Premium)
- 27 platform features
- 57 tier-feature mappings

**Run**:
```bash
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

**Key Tables**:
- `subscription_tiers`
- `features`
- `tier_features`

---

### seed-business-types.ts
**Purpose**: Create business type categories for all palikas

**Output**:
- 96 business type categories (8 per palika × 12 palikas)

**Run**:
```bash
cd database
npx ts-node scripts/seed-business-types.ts
```

**Key Tables**:
- `categories` (entity_type = 'business')

**Dependencies**:
- Palikas must exist (from migrations)

---

### seed-business-categories-direct.ts
**Purpose**: Create business categories

**Output**:
- 8 business categories (Accommodation, Food & Beverage, etc.)

**Run**:
```bash
cd database
npx ts-node scripts/seed-business-categories-direct.ts
```

**Key Tables**:
- `business_categories`

---

### seed-marketplace-categories-direct.ts
**Purpose**: Create marketplace categories (tier-gated)

**Output**:
- 26 marketplace categories
- Tier 1: 9 categories
- Tier 2: 8 categories
- Tier 3: 9 categories

**Run**:
```bash
cd database
npx ts-node scripts/seed-marketplace-categories-direct.ts
```

**Key Tables**:
- `marketplace_categories`

**Features**:
- Tier-gated access
- Hierarchical categories

---

## Stage 2: Admin Setup

### seed-admin-users.ts
**Purpose**: Create admin users for platform management

**Output**:
- 1 Super Admin (national level)
- 2 Palika Admins (Kathmandu, Bhaktapur)
- 2 Content Moderators (Kathmandu, Bhaktapur)

**Run**:
```bash
cd database
npx ts-node scripts/seed-admin-users.ts
```

**Key Tables**:
- `auth.users`
- `admin_users`

**Dependencies**:
- Palikas must exist (KTM001, BHK001)

**Credentials Created**:
```
superadmin@nepaltourism.dev / SuperSecurePass123!
palika.admin@kathmandu.gov.np / KathmanduAdmin456!
content.moderator@kathmandu.gov.np / ModeratorSecure789!
palika.admin@bhaktapur.gov.np / BhaktapurAdmin456!
content.moderator@bhaktapur.gov.np / BhaktapurModerator789!
```

---

## Stage 3: Palika Tier Assignment

### enroll-palikas-tiers.ts
**Purpose**: Assign subscription tiers to palikas

**Output**:
- 5 palikas with tier assignments
- Tier assignment log entries

**Run**:
```bash
cd database
npx ts-node scripts/enroll-palikas-tiers.ts
```

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

**Dependencies**:
- Subscription tiers must exist (Stage 1)
- Palikas must exist (from migrations)

---

## Stage 4: Palika User Creation

### seed-marketplace-proper.ts
**Purpose**: Create comprehensive test users with businesses and products

**Output**:
- 8 test users
- 8 businesses
- 16 marketplace products
- 24 threaded comments

**Run**:
```bash
cd database
npx ts-node scripts/seed-marketplace-proper.ts
```

**Key Tables**:
- `auth.users`
- `profiles`
- `businesses`
- `marketplace_products`
- `marketplace_product_comments`

**Test Data Distribution**:
```
Tier 1 (Itahari - Palika 4):
  - 2 users (Raj Kumar, Priya Singh)
  - 2 businesses (Producer, Retail Shop)
  - 4 products

Tier 2 (Kanyam/Tilawe - Palikas 2,3):
  - 4 users (Amit Patel, Neha Sharma, etc.)
  - 4 businesses (Tour Guide, Artisan, Food, etc.)
  - 8 products

Tier 3 (Rajbiraj - Palika 1):
  - 2 users (Vikram Singh, Ananya Sharma)
  - 2 businesses (Accommodation, Professional Service)
  - 4 products
```

**Flow for Each User**:
```
1. Create auth user
2. Create profile with default_palika_id
3. Create business with owner_user_id
4. Create products with business_id
5. Create threaded comments
```

**Dependencies**:
- All Stage 1, 2, 3 scripts must run first
- Subscription tiers
- Admin users
- Tier assignments

---

## Stage 5: Marketplace Product Creation

### seed-marketplace-test-data.ts
**Purpose**: Create additional marketplace products and comments

**Output**:
- Additional marketplace products
- Threaded comments with owner replies
- Tier constraint validation

**Run**:
```bash
cd database
npx ts-node scripts/seed-marketplace-test-data.ts
```

**Key Tables**:
- `marketplace_products`
- `marketplace_product_comments`

**Features**:
- Respects tier constraints
- Creates threaded comments
- Validates category access

**Dependencies**:
- Stage 4 (users and businesses must exist)

---

## Utility Scripts

### seed-complete-flow.ts
**Purpose**: Quick test with single user (all stages in one script)

**Output**:
- 1 test user
- 1 business
- 5 marketplace products

**Run**:
```bash
cd database
npx ts-node scripts/seed-complete-flow.ts
```

**Use Case**: Quick testing without running full pipeline

---

### seed-database.ts
**Purpose**: Legacy comprehensive seeding (deprecated)

**Status**: Deprecated in favor of 5-stage pipeline

**Note**: Use individual stage scripts instead

---

## Execution Patterns

### Run All Stages
```bash
bash session-2026-03-21/run-seeds.sh
```

### Run Individual Stage
```bash
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

### Run Multiple Stages
```bash
cd database
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts
```

### Quick Test
```bash
cd database
npx ts-node scripts/seed-complete-flow.ts
```

---

## Script Dependencies

```
Stage 1 (Infrastructure)
├─ seed-subscription-tiers.ts
├─ seed-business-types.ts
├─ seed-business-categories-direct.ts
└─ seed-marketplace-categories-direct.ts
    ↓
Stage 2 (Admin)
└─ seed-admin-users.ts
    ↓
Stage 3 (Tier Assignment)
└─ enroll-palikas-tiers.ts
    ↓
Stage 4 (User Creation)
└─ seed-marketplace-proper.ts
    ↓
Stage 5 (Products)
└─ seed-marketplace-test-data.ts
```

---

## Error Handling

### Duplicate Key Errors
- Expected on re-runs
- Data is already seeded correctly
- Safe to ignore

### Missing Dependencies
- Check that previous stages completed
- Verify database migrations applied
- Check Supabase is running

### Connection Errors
- Verify Supabase is running: `supabase status`
- Check environment variables in `.env`
- Verify database is accessible

---

## Performance

| Script | Time | Records |
|--------|------|---------|
| seed-subscription-tiers.ts | ~2s | 87 |
| seed-business-types.ts | ~3s | 96 |
| seed-business-categories-direct.ts | ~1s | 8 |
| seed-marketplace-categories-direct.ts | ~2s | 26 |
| seed-admin-users.ts | ~2s | 5 |
| enroll-palikas-tiers.ts | ~1s | 5 |
| seed-marketplace-proper.ts | ~10s | 56 |
| seed-marketplace-test-data.ts | ~5s | 40+ |
| **Total** | **~26s** | **300+** |

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Related Documentation

- [SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md) - Detailed pipeline guide
- [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md) - How to run scripts
- [USER_BUSINESS_CREATION_FLOW.md](./USER_BUSINESS_CREATION_FLOW.md) - User creation details
