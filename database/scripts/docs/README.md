# Database Seeding Scripts Documentation

This folder contains comprehensive documentation for the database seeding pipeline and scripts.

## Quick Navigation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide for running seeds
- **[PIPELINE_OVERVIEW.md](./PIPELINE_OVERVIEW.md)** - 5-stage pipeline overview

### Detailed Guides
- **[SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md)** - Complete pipeline documentation
- **[SCRIPTS_REORGANIZATION.md](./SCRIPTS_REORGANIZATION.md)** - Before/after comparison
- **[USER_BUSINESS_CREATION_FLOW.md](./USER_BUSINESS_CREATION_FLOW.md)** - How users and businesses are created

### Reference
- **[PIPELINE_DIAGRAM.txt](./PIPELINE_DIAGRAM.txt)** - Visual architecture
- **[STAGE_REFERENCE.md](./STAGE_REFERENCE.md)** - Quick reference for each stage
- **[SCRIPT_INDEX.md](./SCRIPT_INDEX.md)** - Index of all seeding scripts

### Execution
- **[EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)** - How to run the scripts
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide

---

## 5-Stage Pipeline

```
Stage 1: Infrastructure Setup
    ↓
Stage 2: Admin Setup
    ↓
Stage 3: Palika Tier Assignment
    ↓
Stage 4: Palika User Creation
    ↓
Stage 5: Marketplace Product Creation
```

---

## Quick Commands

```bash
# Run all stages
bash session-2026-03-21/run-seeds.sh

# Verify setup
bash session-2026-03-21/verify-setup.sh

# Run individual stage
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

---

## File Structure

```
database/scripts/
├── docs/                                    # This folder
│   ├── README.md                           # This file
│   ├── QUICK_START.md                      # Quick start
│   ├── PIPELINE_OVERVIEW.md                # Pipeline overview
│   ├── SEEDING_PIPELINE.md                 # Detailed guide
│   ├── SCRIPTS_REORGANIZATION.md           # Before/after
│   ├── USER_BUSINESS_CREATION_FLOW.md      # User creation flow
│   ├── PIPELINE_DIAGRAM.txt                # Visual diagram
│   ├── STAGE_REFERENCE.md                  # Stage reference
│   ├── SCRIPT_INDEX.md                     # Script index
│   ├── EXECUTION_GUIDE.md                  # Execution guide
│   └── TROUBLESHOOTING.md                  # Troubleshooting
│
├── seed-subscription-tiers.ts              # Stage 1
├── seed-business-types.ts                  # Stage 1
├── seed-business-categories-direct.ts      # Stage 1
├── seed-marketplace-categories-direct.ts   # Stage 1
├── seed-admin-users.ts                     # Stage 2
├── enroll-palikas-tiers.ts                 # Stage 3
├── seed-marketplace-proper.ts              # Stage 4
├── seed-marketplace-test-data.ts           # Stage 5
└── seed-complete-flow.ts                   # Quick test
```

---

## Documentation by Stage

### Stage 1: Infrastructure Setup
- Scripts: 4
- Output: Tiers, features, categories
- Docs: See SEEDING_PIPELINE.md → Stage 1

### Stage 2: Admin Setup
- Scripts: 1
- Output: Admin users
- Docs: See SEEDING_PIPELINE.md → Stage 2

### Stage 3: Palika Tier Assignment
- Scripts: 1
- Output: Tier assignments
- Docs: See SEEDING_PIPELINE.md → Stage 3

### Stage 4: Palika User Creation
- Scripts: 1
- Output: Users, businesses, products
- Docs: See USER_BUSINESS_CREATION_FLOW.md

### Stage 5: Marketplace Product Creation
- Scripts: 1
- Output: Additional products, comments
- Docs: See SEEDING_PIPELINE.md → Stage 5

---

## Key Concepts

### User → Business → Product Flow
```
Auth User → Profile (palika_id) → Business → Products
```

### Tier Constraints
- **Tier 1 (Basic)**: Limited categories, auto-approved
- **Tier 2 (Tourism)**: More categories, approval workflow
- **Tier 3 (Premium)**: All categories, approval workflow

### Palika Assignments
```
Palika 1 (Rajbiraj)   → Premium
Palika 2 (Kanyam)     → Tourism
Palika 3 (Tilawe)     → Tourism
Palika 4 (Itahari)    → Basic
Palika 10 (Bhaktapur) → Tourism
```

---

## Test Credentials

**Super Admin**:
- Email: superadmin@nepaltourism.dev
- Password: SuperSecurePass123!

**Palika Admins**:
- Kathmandu: palika.admin@kathmandu.gov.np / KathmanduAdmin456!
- Bhaktapur: palika.admin@bhaktapur.gov.np / BhaktapurAdmin456!

**Test Users**:
- Format: [name]@test.com
- Password: TestPassword123!@#

---

## Next Steps

1. Read **QUICK_START.md** for immediate setup
2. Review **PIPELINE_OVERVIEW.md** for high-level understanding
3. Check **EXECUTION_GUIDE.md** for running scripts
4. Refer to **TROUBLESHOOTING.md** if issues arise

---

## Related Documentation

- Main session docs: `session-2026-03-21/`
- Database schema: `database/docs/schema.md`
- RLS policies: `database/docs/rls-policies.md`
