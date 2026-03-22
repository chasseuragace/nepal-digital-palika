# M-Place Seeding Status & Next Steps

**Status:** ✅ Critical data present | 🔴 Test data seeding blocked by RLS
**Date:** March 21, 2026

---

## ✅ Current Data State

### Critical Requirements (ALL MET)
- ✅ 3 subscription tiers (basic, tourism, premium)
- ✅ 26 marketplace categories (tier-gated)
- ✅ 8 business categories
- ✅ 4 palikas with tier assignments

### Existing Test Data
- ⚠️ 2 user profiles (existing, no palika assigned)
- ❌ 0 businesses
- ❌ 0 products
- ❌ 0 comments

---

## 🔴 Blocker: RLS Policies Prevent Test Data Seeding

### The Problem
When trying to seed test data via the anon key:
```
Error: new row violates row-level security policy for table "businesses"
```

**Why:** The RLS policy `businesses_owner_access` requires:
```sql
owner_user_id = auth.uid()
```

But the anon key trying to insert doesn't have an authenticated user context.

### Solutions

#### Option 1: Use Service Role Key (Recommended)
**What:** Use Supabase's service role key to bypass RLS during seeding
**How:**
```bash
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
npx tsx database/scripts/seed-marketplace-proper.ts
```

**Pros:**
- Seeds all test data in one go
- Respects tier constraints
- Creates businesses, products, and comments
- Takes ~30 seconds

**How to get service role key:**
1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to Settings → API
3. Copy `service_role key`
4. Run script with environment variable

#### Option 2: Create Users Through UI
**What:** Manually register test users in the m-place UI
**How:**
1. Start m-place: `cd m-place && npm run dev`
2. Click "Sign Up" button
3. Register 8 test users (one per tier):
   - **Tier 3 (Palika 1):** Ramesh Sharma, Sita Poudel
   - **Tier 2 (Palika 2):** Deepak Niroula, Maya Gurung
   - **Tier 2 (Palika 3):** Pradeep Singh, Anita Rai
   - **Tier 1 (Palika 4):** Keshav Prasad, Bishnu Lamsal

4. Each user automatically creates a business
5. Then manually create products through UI

**Pros:** Tests the full registration/business creation flow
**Cons:** Takes 30+ minutes, no test products created automatically

#### Option 3: Temporarily Disable RLS (Not Recommended for Production)
**What:** Drop RLS temporarily, seed data, then re-enable
**How:**
```sql
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products DISABLE ROW LEVEL SECURITY;
-- Run seeding
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
```

**Pros:** Quick seeding
**Cons:** Security risk, requires direct SQL access

---

## 📋 What We've Prepared

### Seeding Scripts Created
1. **`database/scripts/seed-marketplace-proper.ts`** ✅
   - Uses correct column names
   - Respects tier constraints
   - Creates 8 users, 8 businesses, 16 products, comments
   - Ready to run with service role key

### Verification Script
**`m-place/verify-requirements.ts`** ✅
- Checks all data is present
- Shows distribution by tier
- Verifies RLS policies work

---

## 🚀 Recommended Path Forward

### Immediate (Next 5 minutes)
1. **Get service role key:**
   - Go to Supabase Studio
   - Copy service role key
   - Run: `export SUPABASE_SERVICE_ROLE_KEY="<key>"`

2. **Seed test data:**
   ```bash
   cd database
   SUPABASE_SERVICE_ROLE_KEY="<key>" npx tsx scripts/seed-marketplace-proper.ts
   ```

3. **Verify seeding worked:**
   ```bash
   cd m-place
   npx tsx verify-requirements.ts
   ```

### Then (Next 15 minutes)
1. Start m-place dev server: `npm run dev`
2. Test marketplace browsing:
   - View categories
   - View products
   - Check pagination
3. Test as different palikas:
   - Change `VITE_PALIKA_ID` in `.env.local`
   - Restart dev server
   - Verify tier-specific categories shown

---

## 📊 Expected Data After Seeding

```
Users (Profiles):          8 total
├─ Tier 1 (Palika 4):     2 users
├─ Tier 2 (Palikas 2,3):  4 users
└─ Tier 3 (Palika 1):     2 users

Businesses:                8 total (1 per user)
├─ By palika:
│  ├─ Palika 1: 2 businesses
│  ├─ Palika 2: 2 businesses
│  ├─ Palika 3: 2 businesses
│  └─ Palika 4: 2 businesses
└─ Types: Accommodation, Producer, Tour Guide, Artisan, Food & Beverage, Retail

Products:                  16 total (2 per business)
├─ Tier 1 products:       4 products (9 categories available)
├─ Tier 2 products:       8 products (17 categories available)
└─ Tier 3 products:       4 products (26 categories available)

Comments:                  15 total (threaded)
├─ Top-level comments:    5
├─ Owner replies:         5
└─ User replies:          5
```

---

## ✨ What You Can Test After Seeding

### Marketplace Browsing
- ✅ See categories (tier-specific)
- ✅ See products in each category
- ✅ See product detail with seller info
- ✅ See business profile card
- ✅ See seller profile
- ✅ Threaded comments

### Tier Gating
- ✅ Tier 1 users see 9 categories
- ✅ Tier 2 users see 17 categories
- ✅ Tier 3 users see 26 categories
- ✅ Products respect tier constraints

### Product Management
- ✅ Sellers can create products (in tier categories)
- ✅ Products auto-publish (Tier 1)
- ✅ Products appear in marketplace

### Multi-Palika Deployment
- ✅ Change VITE_PALIKA_ID → different palika instance
- ✅ Each sees its own tier categories
- ✅ Each sees its own palika's businesses/products

---

## 🔑 Getting Service Role Key

### Via Supabase Studio (GUI)
1. Open: http://127.0.0.1:54323
2. Click "Settings" (bottom left)
3. Click "API" (left sidebar)
4. Find "Service role key"
5. Copy the key

### Via CLI
```bash
supabase status
# Find "service_role key" in output
```

### Example Output
```
🔑 Authentication Keys
├─ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
└─ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

---

## 📝 Proper Seeding Command

```bash
cd /Users/ajaydahal/Downloads/older/Nepal_Digital_Tourism_Infrastructure_Documentation/database

SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" \
SUPABASE_URL="http://127.0.0.1:54321" \
npm run seed:marketplace-test-data

# Or manually:
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" \
npx tsx scripts/seed-marketplace-proper.ts
```

---

## 🎯 Success Criteria

After seeding, verify with:

```bash
cd m-place
npx tsx verify-requirements.ts
```

Should show:
```
✅ ✅ Subscription Tiers (3 required)
✅ ✅ Marketplace Categories (26 required)
✅ ✅ Business Categories (8 required)
✅ ✅ Palikas with Tier Assignment
✅ ✅ Test Data - Businesses
✅ ✅ Test Data - Products
✅ ✅ Test Data - Users

🎉 CRITICAL REQUIREMENTS MET!
✅ Test data also exists - ready for full UI testing

🚀 READY TO START UI DEVELOPMENT!
```

---

## 📌 What's Next

Once seeding is complete:
1. ✅ Start m-place dev server
2. ✅ Test marketplace browsing
3. ✅ Test tier-gating
4. ✅ Test product creation
5. ✅ Begin UI enhancements (pagination, seller cards, comments)

---

## 💡 Troubleshooting

### "service_role key is not set"
**Solution:** Set the environment variable:
```bash
export SUPABASE_SERVICE_ROLE_KEY="<your-key>"
# Then run seed script
```

### "Invalid UUID" error
**Cause:** Profile IDs must be valid UUIDs
**Solution:** Script auto-generates them, shouldn't happen

### "RLS policy violation"
**Cause:** Using anon key instead of service role
**Solution:** Export service role key first

### Products not appearing
**Cause:** RLS public_read policy requires `status='published' AND is_approved=true`
**Solution:** Script sets both correctly

---

## 📞 Next Actions

1. **Get service role key** from Supabase Studio
2. **Run seeding command** with the key
3. **Verify seeding** with verification script
4. **Start m-place UI** testing

**Time estimate:** 10-15 minutes total

---

**Last Updated:** 2026-03-21
**Status:** Ready for service role key + seeding
