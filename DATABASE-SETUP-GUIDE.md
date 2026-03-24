# Database Setup Guide

Complete guide to set up a clean Supabase database with all required data.

## Quick Start

### Windows (PowerShell)
```powershell
.\setup-clean-db.ps1
```

### Linux/Mac (Bash)
```bash
bash setup-clean-db.sh
```

## What This Does

The setup script performs these steps in order:

1. **Checks Prerequisites**
   - Supabase CLI installed
   - Node.js and npm installed

2. **Starts Supabase**
   - Starts local Supabase instance if not running
   - Verifies connection

3. **Resets Database (Clean Slate)**
   - Drops all existing data
   - Applies all migrations from `supabase/migrations/`
   - Creates fresh schema with RLS policies

4. **Installs Dependencies**
   - Installs npm packages in `database/` folder

5. **Runs Seeding Pipeline**
   - Stage 1: Infrastructure (tiers, features, categories)
   - Stage 2: Admin users (super admin, palika admins, moderators)
   - Stage 3: Palika tier assignments
   - Stage 4: Test users and businesses
   - Stage 5: Marketplace products and comments

6. **Verifies Setup**
   - Checks all tables exist
   - Displays record counts

## Prerequisites

### 1. Install Supabase CLI

**Windows (using Scoop):**
```powershell
scoop install supabase
```

**Windows (Manual):**
Download from: https://github.com/supabase/cli/releases

**Mac:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

### 2. Install Node.js

Download from: https://nodejs.org/ (v18 or higher)

## Manual Setup (Step by Step)

If you prefer to run each step manually:

### 1. Start Supabase
```bash
supabase start
```

### 2. Reset Database
```bash
supabase db reset
```

### 3. Install Dependencies
```bash
cd database
npm install
```

### 4. Run Seeding Scripts

**Option A: Run all at once**
```bash
bash session-2026-03-21/run-seeds.sh
```

**Option B: Run individually**
```bash
cd database

# Stage 1: Infrastructure
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts

# Stage 2: Admin Users
npx ts-node scripts/seed-admin-users.ts

# Stage 3: Tier Assignment
npx ts-node scripts/enroll-palikas-tiers.ts

# Stage 4: Users & Businesses
npx ts-node scripts/seed-marketplace-proper.ts

# Stage 5: Products
npx ts-node scripts/seed-marketplace-test-data.ts
```

### 5. Verify Setup
```bash
cd database
npx ts-node scripts/quick-table-check.ts
```

## What Gets Created

### Infrastructure Data
- **3 Subscription Tiers**: Basic, Tourism, Premium
- **27 Platform Features**: Marketplace, analytics, etc.
- **96 Business Type Categories**: 8 per palika
- **8 Business Categories**: Accommodation, Food & Beverage, etc.
- **26 Marketplace Categories**: Tier-gated product categories

### Admin Users
- **1 Super Admin**: Full system access
  - Email: `superadmin@nepaltourism.dev`
  - Password: `SuperSecurePass123!`

- **2 Palika Admins**: Kathmandu and Bhaktapur
  - Kathmandu: `palika.admin@kathmandu.gov.np` / `KathmanduAdmin456!`
  - Bhaktapur: `palika.admin@bhaktapur.gov.np` / `BhaktapurAdmin456!`

- **2 Content Moderators**: Content management only
  - Kathmandu: `content.moderator@kathmandu.gov.np` / `ModeratorSecure789!`
  - Bhaktapur: `content.moderator@bhaktapur.gov.np` / `BhaktapurModerator789!`

### Test Data
- **5 Palikas** with tier assignments
- **8 Test Users** with profiles
- **8 Businesses** across different tiers
- **16+ Marketplace Products**
- **24+ Product Comments** (threaded)

## Accessing the System

### Admin Panel
```bash
cd admin-panel
npm run dev
```
Access at: http://localhost:3000

### Supabase Studio
Access at: http://127.0.0.1:54323

### Database Connection
- URL: `http://127.0.0.1:54321`
- Service Role Key: Check `.env` in database folder

## Troubleshooting

### Supabase CLI Not Found
```powershell
# Windows - Install with Scoop
scoop install supabase

# Or download manually from:
# https://github.com/supabase/cli/releases
```

### Supabase Won't Start
```bash
# Stop and restart
supabase stop
supabase start
```

### Database Reset Fails
```bash
# Try with debug flag
supabase db reset --debug
```

### Seeding Script Fails
```bash
# Check database is running
supabase status

# Check environment variables
cat database/.env

# Verify migrations applied
supabase db reset
```

### Duplicate Key Errors
These are expected on re-runs. The scripts use upsert operations, so existing data won't be duplicated.

### Connection Errors
1. Verify Supabase is running: `supabase status`
2. Check `.env` file in `database/` folder
3. Ensure service role key is correct

## Environment Configuration

The database scripts use `.env` file in the `database/` folder:

```env
# Local Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Environment
NODE_ENV=development
```

Get your service role key from:
```bash
supabase status
```

## Verification Checklist

After setup, verify these tables have data:

- [ ] `subscription_tiers` (3 rows)
- [ ] `features` (27 rows)
- [ ] `tier_features` (57 rows)
- [ ] `business_categories` (8 rows)
- [ ] `marketplace_categories` (26 rows)
- [ ] `categories` (96 rows for business types)
- [ ] `admin_users` (5 rows)
- [ ] `palikas` (5+ rows with tier assignments)
- [ ] `profiles` (8+ rows)
- [ ] `businesses` (8+ rows)
- [ ] `marketplace_products` (16+ rows)
- [ ] `marketplace_product_comments` (24+ rows)

Check in Supabase Studio: http://127.0.0.1:54323

## Next Steps

1. **Test Admin Login**
   - Start admin panel: `cd admin-panel && npm run dev`
   - Login with super admin credentials
   - Verify dashboard loads

2. **Explore Data**
   - Open Supabase Studio
   - Browse tables in Table Editor
   - Check authentication users

3. **Start Development**
   - Admin panel is ready for content management
   - Marketplace data is seeded for testing
   - All APIs are functional

## Related Documentation

- [Database README](database/README.md) - Detailed seeding documentation
- [Script Index](database/scripts/docs/SCRIPT_INDEX.md) - All available scripts
- [Quick Start](database/scripts/docs/QUICK_START.md) - 5-minute setup guide

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review script output for error messages
3. Verify all prerequisites are installed
4. Check Supabase status: `supabase status`

---

**Ready to go!** Run the setup script and you'll have a clean, fully-seeded database in minutes.
