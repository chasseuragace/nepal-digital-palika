# Lessons Learned - Setup Session March 23, 2026

This document captures issues encountered during setup and their solutions to prevent them in future sessions.

## Issue 1: SQL Syntax Error in Migration

**Problem:**
```
ERROR: syntax error at or near "COMMENT" (SQLSTATE 42601)
```

**Location:** Migration file `20250322000048_create_palika_profiles_table.sql`

**Root Cause:**
PostgreSQL doesn't support inline `COMMENT` syntax in column definitions. The migration had:
```sql
highlights JSONB DEFAULT '[]'::jsonb COMMENT 'Array of {title, description} objects'
```

**Solution:**
Comments must be added separately:
```sql
-- Define column without inline comment
highlights JSONB DEFAULT '[]'::jsonb,

-- Add comment separately
COMMENT ON COLUMN palika_profiles.highlights IS 'Array of {title, description} objects';
```

**Prevention:**
- Always use separate `COMMENT ON` statements
- Test migrations locally before committing
- Run `supabase db reset` to catch syntax errors early

---

## Issue 2: Database Reset Failures

**Problem:**
`supabase db reset` failed with migration errors, blocking the entire setup process.

**Root Cause:**
- Invalid SQL syntax in migrations
- Migrations not tested individually
- No way to skip problematic migrations

**Solution:**
Instead of fixing migrations mid-setup:
1. Skip `supabase db reset` if it fails
2. Run seeding scripts directly (they work independently)
3. Use `seed-database.ts` which creates basic structure

**Prevention:**
- Test each migration file individually
- Use `supabase db reset --debug` to see detailed errors
- Keep a working backup of migrations
- Consider migration rollback strategy

---

## Issue 3: Missing Palika Codes

**Problem:**
```
❌ Could not find Kathmandu palika (KTM001). Run geographic seeding first.
```

**Root Cause:**
- Admin user seeding script looks for specific palika codes (KTM001, BHK001)
- These codes don't exist in the palikas table
- Palikas are identified by numeric IDs, not codes

**Solution:**
- Use numeric palika IDs instead of codes
- Query palikas by name: `SELECT id FROM palikas WHERE name_en = 'Kathmandu Metropolitan'`
- Update admin seeding script to use IDs

**Prevention:**
- Document palika identification method clearly
- Use consistent ID strategy across all scripts
- Add validation to check if palikas exist before referencing

---

## Issue 4: Seeding Order Dependencies

**Problem:**
Running seeding scripts out of order caused failures:
- `seed-business-types.ts` failed because no palikas existed
- Admin users couldn't be created without specific palikas

**Root Cause:**
- Scripts have dependencies but no clear documentation
- No validation of prerequisites before running
- Error messages don't clearly state what's missing

**Solution:**
Correct seeding order:
1. `seed-database.ts` - Creates provinces, districts, palikas, roles, permissions, categories
2. `seed-subscription-tiers.ts` - Creates tiers and features
3. `seed-marketplace-categories-direct.ts` - Creates marketplace categories
4. `seed-business-categories-direct.ts` - Creates business categories
5. `enroll-palikas-tiers.ts` - Assigns tiers to palikas
6. `seed-marketplace-proper.ts` - Creates test users, businesses, products

**Prevention:**
- Create a master seeding script that runs all in order
- Add dependency checks at start of each script
- Document dependencies clearly in script headers
- Use a unified `setup-complete.ts` script

---

## Issue 5: PowerShell Script Syntax Errors

**Problem:**
Custom PowerShell scripts had syntax errors:
- Function definitions being output as text
- String escaping issues with quotes
- Try-catch blocks not properly closed

**Root Cause:**
- Complex PowerShell syntax
- Mixing different quoting styles
- Not testing scripts before use

**Solution:**
- Use simpler PowerShell syntax
- Test scripts incrementally
- Use existing bash scripts when possible
- Stick to proven scripts from the repository

**Prevention:**
- Don't create new scripts mid-session
- Use existing tested scripts from `session-2026-03-21/`
- If creating scripts, test thoroughly first
- Keep scripts simple and focused

---

## Issue 6: Supabase CLI Not Installed

**Problem:**
Setup couldn't proceed without Supabase CLI.

**Solution:**
Install via Scoop:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Prevention:**
- Check prerequisites first with `check-prerequisites.ps1`
- Provide clear installation instructions
- Automate prerequisite installation where possible

---

## Best Practices Established

### 1. Always Check Prerequisites First
```powershell
.\check-prerequisites.ps1
```

### 2. Use Existing Scripts
Don't create new scripts. Use:
- `database/scripts/seed-database.ts`
- `database/scripts/seed-marketplace-categories-direct.ts`
- `database/scripts/seed-business-categories-direct.ts`
- `database/scripts/enroll-palikas-tiers.ts`
- `database/scripts/seed-marketplace-proper.ts`

### 3. Run Scripts in Correct Order
See `seeding-order.md` for the definitive sequence.

### 4. Verify After Each Step
- Check Supabase status: `supabase status`
- Check tables in Supabase Studio
- Run `quick-table-check.ts` to verify data

### 5. Don't Fix Migrations Mid-Setup
- If migrations fail, work around them
- Fix migrations in a separate session
- Use seeding scripts that work independently

---

## Commands That Work

### Start Supabase
```powershell
supabase start
```

### Check Status
```powershell
supabase status
```

### Seed Database (Correct Order)
```powershell
cd database

# 1. Basic infrastructure
npx ts-node scripts/seed-database.ts

# 2. Subscription tiers
npx ts-node scripts/seed-subscription-tiers.ts

# 3. Marketplace categories
npx ts-node scripts/seed-marketplace-categories-direct.ts

# 4. Business categories
npx ts-node scripts/seed-business-categories-direct.ts

# 5. Assign tiers to palikas
npx ts-node scripts/enroll-palikas-tiers.ts

# 6. Create test data
npx ts-node scripts/seed-marketplace-proper.ts
```

### Verify Setup
```powershell
cd database
npx ts-node scripts/quick-table-check.ts
```

---

## What NOT to Do

❌ Don't run `supabase db reset` if migrations have errors
❌ Don't create new PowerShell scripts mid-session
❌ Don't run seeding scripts out of order
❌ Don't skip prerequisite checks
❌ Don't try to fix migrations during setup
❌ Don't assume palika codes exist (use IDs)

## What TO Do

✅ Check prerequisites first
✅ Use existing tested scripts
✅ Follow documented seeding order
✅ Verify after each step
✅ Check Supabase status regularly
✅ Use Supabase Studio to inspect data
✅ Read error messages carefully
✅ Consult this document when stuck

---

## Summary

The key to successful setup:
1. **Check prerequisites** - Don't skip this
2. **Use existing scripts** - They're tested and work
3. **Follow the order** - Dependencies matter
4. **Verify each step** - Catch issues early
5. **Don't improvise** - Stick to the documented process

**Most Important:** When in doubt, refer to this document and `seeding-order.md`.
