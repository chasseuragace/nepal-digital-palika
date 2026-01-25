# Local Supabase Setup - Step by Step

Supabase is running at: **http://127.0.0.1:54323**

## Step 1: Create Database Schema

Open Supabase Studio and execute SQL scripts in order.

### Part 1: Basic Tables
```bash
cd database
npm run copy-part1
```
This copies the SQL to your clipboard. Then:
1. Go to http://127.0.0.1:54323
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the SQL
5. Click **Run**

### Part 2: Content Tables
```bash
npm run copy-part2
```
Repeat the same process (paste in SQL Editor and run).

### Part 3: RLS Policies
```bash
npm run db:copy-rls
```
Repeat the same process (paste in SQL Editor and run).

## Step 2: Verify Schema
```bash
npm run check-status
```
Should show: `Total: 11/11 tables exist`

## Step 3: Seed Database
```bash
npm run seed:all
```

This will:
- Seed 7 provinces
- Seed 9 districts
- Seed 8 palikas
- Seed 27 categories
- Create admin users

## Step 4: Configure Admin Panel
```bash
cd ../admin-panel
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with these values:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
ADMIN_SESSION_SECRET=your-random-secret-key-here-change-in-production
```

## Step 5: Run Tests
```bash
# Unit tests (no database needed)
npm run test:unit

# Integration tests (requires seeded database)
npm run test:integration

# All tests
npm test
```

## Step 6: Start Frontend
```bash
npm run dev
```
Access at: http://localhost:3000

---

## Quick Reference

**Supabase Services:**
- Studio: http://127.0.0.1:54323
- API: http://127.0.0.1:54321
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres

**Keys:**
- Publishable: `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`
- Secret: `sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz`

**Commands:**
```bash
# Check Supabase status
supabase status

# Stop Supabase
supabase stop

# Start Supabase
supabase start
```
