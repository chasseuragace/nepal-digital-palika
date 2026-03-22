# Seeding Scripts Documentation - Complete Index

## Overview

This folder contains comprehensive documentation for the database seeding pipeline and all related scripts.

## Documentation Files

### Getting Started
1. **[README.md](./README.md)** - Overview and navigation
2. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide

### Pipeline Documentation
3. **[SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md)** - Complete pipeline documentation
4. **[PIPELINE_OVERVIEW.md](./PIPELINE_OVERVIEW.md)** - High-level pipeline overview
5. **[PIPELINE_DIAGRAM.txt](./PIPELINE_DIAGRAM.txt)** - Visual architecture diagram

### Script Documentation
6. **[SCRIPT_INDEX.md](./SCRIPT_INDEX.md)** - Index of all seeding scripts
7. **[STAGE_REFERENCE.md](./STAGE_REFERENCE.md)** - Quick reference for each stage

### Implementation Details
8. **[USER_BUSINESS_CREATION_FLOW.md](./USER_BUSINESS_CREATION_FLOW.md)** - How users and businesses are created
9. **[SCRIPTS_REORGANIZATION.md](./SCRIPTS_REORGANIZATION.md)** - Before/after comparison

### Execution & Troubleshooting
10. **[EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)** - How to run the scripts
11. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide

---

## Quick Navigation by Task

### I want to...

**Get started quickly**
→ Read [QUICK_START.md](./QUICK_START.md)

**Understand the pipeline**
→ Read [PIPELINE_OVERVIEW.md](./PIPELINE_OVERVIEW.md) then [SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md)

**See all scripts**
→ Read [SCRIPT_INDEX.md](./SCRIPT_INDEX.md)

**Run the scripts**
→ Read [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)

**Understand user creation**
→ Read [USER_BUSINESS_CREATION_FLOW.md](./USER_BUSINESS_CREATION_FLOW.md)

**Fix an issue**
→ Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**See the architecture**
→ Read [PIPELINE_DIAGRAM.txt](./PIPELINE_DIAGRAM.txt)

---

## 5-Stage Pipeline Overview

```
Stage 1: Infrastructure Setup
  ├─ seed-subscription-tiers.ts
  ├─ seed-business-types.ts
  ├─ seed-business-categories-direct.ts
  └─ seed-marketplace-categories-direct.ts
         ↓
Stage 2: Admin Setup
  └─ seed-admin-users.ts
         ↓
Stage 3: Palika Tier Assignment
  └─ enroll-palikas-tiers.ts
         ↓
Stage 4: Palika User Creation
  └─ seed-marketplace-proper.ts
         ↓
Stage 5: Marketplace Product Creation
  └─ seed-marketplace-test-data.ts
```

---

## Key Information

### Test Credentials
- Super Admin: superadmin@nepaltourism.dev / SuperSecurePass123!
- Kathmandu Admin: palika.admin@kathmandu.gov.np / KathmanduAdmin456!
- Bhaktapur Admin: palika.admin@bhaktapur.gov.np / BhaktapurAdmin456!

### Available Palikas
- Palika 1 (Rajbiraj) - Premium
- Palika 2 (Kanyam) - Tourism
- Palika 3 (Tilawe) - Tourism
- Palika 4 (Itahari) - Basic
- Palika 10 (Bhaktapur) - Tourism

### Quick Commands
```bash
# Run all stages
bash session-2026-03-21/run-seeds.sh

# Verify setup
bash session-2026-03-21/verify-setup.sh

# Run individual script
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

---

## Documentation Structure

```
database/scripts/docs/
├── README.md                          # Overview
├── INDEX.md                           # This file
├── QUICK_START.md                     # 5-minute setup
├── PIPELINE_OVERVIEW.md               # Pipeline overview
├── SEEDING_PIPELINE.md                # Detailed guide
├── PIPELINE_DIAGRAM.txt               # Visual diagram
├── SCRIPT_INDEX.md                    # All scripts
├── STAGE_REFERENCE.md                 # Stage reference
├── USER_BUSINESS_CREATION_FLOW.md     # User creation
├── SCRIPTS_REORGANIZATION.md          # Before/after
├── EXECUTION_GUIDE.md                 # How to run
└── TROUBLESHOOTING.md                 # Troubleshooting
```

---

## Related Documentation

- Main session docs: `session-2026-03-21/`
- Database schema: `database/docs/schema.md`
- RLS policies: `database/docs/rls-policies.md`

---

## File Locations

### Scripts
- Location: `database/scripts/`
- Documentation: `database/scripts/docs/` (this folder)

### Session Documentation
- Location: `session-2026-03-21/`
- Contains: Setup status, verification scripts, session notes

### Execution Scripts
- `session-2026-03-21/run-seeds.sh` - Run all stages
- `session-2026-03-21/verify-setup.sh` - Verify setup

---

## Getting Help

1. **Quick questions** → Check [QUICK_START.md](./QUICK_START.md)
2. **How to run** → Check [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)
3. **Issues** → Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. **Details** → Check [SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md)
5. **Scripts** → Check [SCRIPT_INDEX.md](./SCRIPT_INDEX.md)

---

## Last Updated

March 22, 2026

## Status

✅ All documentation complete and organized
✅ All scripts tested and working
✅ Database seeding pipeline operational
