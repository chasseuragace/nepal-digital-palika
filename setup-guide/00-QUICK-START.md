# Quick Start Guide

Get the Nepal Digital Tourism platform running in 5 minutes.

## Prerequisites Check

Run this first:
```powershell
cd setup-guide
.\check-prerequisites.ps1
```

## If Supabase CLI is Missing

Install with Scoop:
```powershell
# Install Scoop (if not installed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Setup Database

Run the automated setup:
```powershell
.\setup-database.ps1
```

This will:
1. Start Supabase (if not running)
2. Reset database to clean state
3. Apply all migrations
4. Seed infrastructure data
5. Create test data

## Start Admin Panel

```powershell
cd ..\admin-panel
npm install  # First time only
npm run dev
```

Access at: http://localhost:3000

## Test Credentials

**Test Users:**
- Email: ramesh.sharma@test.com
- Password: TestPassword123!@#

(8 test users total, all with same password)

## Access Points

- **Supabase Studio:** http://127.0.0.1:54323
- **Database:** http://127.0.0.1:54321
- **Admin Panel:** http://localhost:3000

## Verify Setup

Check Supabase is running:
```powershell
supabase status
```

Check database tables in Supabase Studio:
- provinces (7 rows)
- districts (77 rows)
- palikas (372 rows)
- subscription_tiers (3 rows)
- marketplace_categories (26 rows)
- businesses (8 rows)
- marketplace_products (16 rows)

## Next Steps

1. Explore data in Supabase Studio
2. Test admin panel functionality
3. Review database schema in **database-schema.md**
4. Check **04-SEEDING-REFERENCE.md** for data details

## If Something Goes Wrong

1. Check **03-TROUBLESHOOTING.md**
2. Verify Docker is running: `docker ps`
3. Restart Supabase: `supabase stop && supabase start`
4. Re-run setup: `.\setup-database.ps1`

---

**That's it!** You should now have a fully functional development environment.
