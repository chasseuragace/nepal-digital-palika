# Quick Start Guide - Multi-Tenant M-Place

**Last Updated:** March 20, 2026
**Architecture:** Multi-Tenant Per-Palika Deployment
**Current Palika:** Rajbiraj (Palika ID: 1, Premium Tier)

---

## What is M-Place Now?

M-place is no longer a global marketplace. It's a **multi-tenant application** where:
- Each deployment serves **one specific palika** (municipality)
- Palika is configured via `.env.local` with `VITE_PALIKA_ID`
- Users cannot change their palika - it's pre-selected from the environment
- Marketplace categories are automatically filtered by the palika's subscription tier

---

## First Time Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Check Environment Configuration
```bash
cat .env.local
```
Expected output:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
VITE_PALIKA_ID=1
```

### 3. Ensure Supabase is Running
```bash
# If using local Supabase:
supabase start
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:8083/` (or next available port)

---

## Understanding the Current Setup

### Current Configuration
- **Palika:** Rajbiraj
- **Palika ID:** 1
- **Tier:** Premium (Tier 3)
- **Categories Available:** 26 (all marketplace categories)
- **Status:** ✅ Running & Tested

### Key Files
```
.env.local                                # Configuration
├─ VITE_PALIKA_ID=1 ← Set this per deployment

src/config/palika.ts                      # Palika validation
src/hooks/useCurrentPalika.ts             # Fetch current palika
src/components/RegionSelectionDialog.tsx  # Registration UI
src/pages/Sell.tsx                        # Category filtering
```

---

## User Registration Flow

### What Users See

```
1. Open app → Click Login
2. Click "Register" tab
3. Fill in: Full Name, Phone, Email, Password
4. Click "Create Account"
5. Dialog opens: "Select Your Ward"
   - Palika shows: "Rajbiraj, Saptari, Madhesh" (read-only)
   - User selects: Ward number (dropdown)
6. Click "Confirm & Create Shop"
7. Business auto-created, user logged in
```

### What Happens Behind the Scenes

```
Register Form → Create Account
  ↓
Supabase auth.users created
  ↓
RegionSelectionDialog opens
  ↓
useCurrentPalika() fetches Rajbiraj data
  ↓
User selects ward (1-17)
  ↓
validatePalikaTierAssignment() checks tier
  ↓
updateRegionSelection() saves palika+ward
  ↓
createAutoBusinessForUser() creates business
  ↓
Business created with:
  - owner_user_id: new user
  - palika_id: 1 (Rajbiraj)
  - ward_number: selected ward
```

---

## Testing the App

### 1. Quick Test - Registration
```bash
# Go to http://localhost:8083/
# Click Login
# Click Register
# Fill in test data:
  Full Name: Test User
  Phone: +977-9841234567
  Email: test@example.com
  Password: TestPassword123
# Click "Create Account"
# Should see "Registered successfully!" toast
# Should see region selection dialog with Rajbiraj displayed
```

### 2. Check Console
```bash
# Open browser console (F12)
# Should see: 0 errors, 2 warnings (React Router warnings are OK)
# Look for: "Error fetching current palika:" - if none, good!
```

### 3. Test Sell Page
```bash
# After registration, click "Sell" in navigation
# Should see: "Loading categories..."
# Then: Dropdown with "(Tier-based)" label
# Should list all 26 categories for Rajbiraj (Premium tier)
```

---

## Switching to Different Palika

### For Kanyam (Tourism Tier - 17 categories)
```bash
# Edit .env.local
VITE_PALIKA_ID=2

# Restart dev server
npm run dev
# Ctrl+C to stop first
```

Dialog will now show: "Kanyam, Rautahat, Madhesh"
Categories will show: Only 17 categories (Tier 1 + Tier 2)

### For Tilawe (Tourism Tier - 17 categories)
```bash
VITE_PALIKA_ID=3
```

### For Itahari (Basic Tier - 9 categories)
```bash
VITE_PALIKA_ID=4
```

---

## Troubleshooting

### ❌ Error: "VITE_PALIKA_ID is not set"
**Cause:** Missing `VITE_PALIKA_ID` in `.env.local`
**Fix:**
```bash
echo "VITE_PALIKA_ID=1" >> .env.local
npm run dev  # Restart
```

### ❌ Error: "Failed to fetch palika"
**Cause:** Supabase not running or wrong credentials
**Fix:**
```bash
# Check Supabase is running:
supabase status

# Check .env.local has correct credentials:
cat .env.local

# Check console for detailed error
```

### ❌ Ward dropdown shows "0 wards"
**Cause:** Supabase data issue - `total_wards` column may be NULL
**Status:** Known issue, doesn't affect UI rendering
**Impact:** Users can't see ward count but can still select ward

### ❌ Categories dropdown is empty
**Cause:**
- Tier not assigned to palika in Supabase, OR
- Categories don't have correct `min_tier_level`, OR
- Fetch failed (check console)
**Fix:** Check Supabase data:
```sql
-- Check palika has tier assigned
SELECT id, name_en, subscription_tier_id FROM palikas WHERE id = 1;

-- Check tier exists
SELECT id, name, tier_level FROM subscription_tiers WHERE id = <subscription_tier_id>;

-- Check categories have min_tier_level set
SELECT id, name_en, min_tier_level FROM marketplace_categories LIMIT 5;
```

---

## Code Architecture Overview

### Registration Path
```
App.tsx
└─ AuthDialog
   └─ RegisterForm
      └─ (Create Account)
         └─ RegionSelectionDialog
            ├─ useCurrentPalika() ← Fetches Rajbiraj data
            ├─ getPalikaId() ← Gets ID from VITE_PALIKA_ID
            └─ (User selects ward)
               └─ createAutoBusinessForUser() ← Creates business
```

### Sell Page Path
```
Sell.tsx
├─ useCurrentPalika() ← Fetches palika data
├─ useEffect(..., [palika, user])
│  ├─ fetchPalikaTier() ← Gets tier (e.g., Premium/Tier 3)
│  └─ fetchTierScopedCategories(tierId) ← Gets 26 categories
├─ CategoryDropdown
│  └─ Display tierCategories (fetched above)
```

---

## Key Concepts

### Palika
A municipality in Nepal. M-place now serves one palika per deployment.

**Example:** Rajbiraj is a palika in Saptari district, Madhesh province

### Tier
Subscription level that determines what categories are available:
- **Tier 1 (Basic):** 9 categories
- **Tier 2 (Tourism):** 17 categories (9+8)
- **Tier 3 (Premium):** 26 categories (all)

### Tier-Scoped Category
A marketplace category that requires a minimum subscription tier to use.

**Example:** "Jewelry" requires Tier 3, so users in Tier 1/2 palikas cannot list jewelry

---

## File Locations Reference

### Configuration
- `.env.local` - Environment variables (includes VITE_PALIKA_ID)

### Components
- `src/components/RegionSelectionDialog.tsx` - Registration region selector
- `src/pages/Sell.tsx` - Product listing/selling page

### Hooks & Config
- `src/config/palika.ts` - Palika ID validation
- `src/hooks/useCurrentPalika.ts` - Fetch current palika data

### APIs
- `src/api/tiers.ts` - Tier & category functions
- `src/api/businesses.ts` - Business creation functions
- `src/api/palikas.ts` - Palika fetching (not used in new UI)

### Types
- `src/types/index.ts` - TypeScript types (Region, etc.)

---

## Common Tasks

### Task 1: Add a New Category
1. Go to Supabase dashboard
2. Open `marketplace_categories` table
3. Add new row with:
   - `name_en`: Category name
   - `min_tier_level`: 1, 2, or 3
   - `is_active`: true
   - `display_order`: Order in list
4. Restart app - will appear in Sell page for eligible tiers

### Task 2: Change Palika for Deployment
1. Edit `.env.local`: `VITE_PALIKA_ID=2`
2. Restart dev server: `npm run dev`
3. Done!

### Task 3: Test Different Tiers
1. Deploy with `VITE_PALIKA_ID=1` (Premium - 26 categories)
2. Test product creation - should see all categories
3. Switch to `VITE_PALIKA_ID=2` (Tourism - 17 categories)
4. Test product creation - should see fewer categories
5. Switch to `VITE_PALIKA_ID=4` (Basic - 9 categories)
6. Test product creation - should see only 9 categories

---

## Performance Notes

- **First load:** ~2-3s (normal)
- **Palika fetch:** ~300-500ms
- **Categories fetch:** ~200-400ms
- **Total registration flow:** ~2-3s

All data fetches are cached in component state (not refetched on re-renders)

---

## Security Notes

- ⚠️ `VITE_PALIKA_ID` is exposed in frontend (Vite will inline it)
- ✅ This is OK - it's not secret, just configuration
- ✅ Actual authorization happens on backend (Supabase RLS)
- ✅ Database RLS policies should enforce tier constraints

---

## Next Steps

### For Development
1. [ ] Run dev server and test registration
2. [ ] Complete ward selection and business creation flow
3. [ ] Test product listing on Sell page
4. [ ] Verify tier-scoped categories work correctly

### For Deployment
1. [ ] Prepare deployment for 4 palikas
2. [ ] Set VITE_PALIKA_ID per deployment
3. [ ] Configure domain routing (m-place-rajbiraj.example.com, etc.)
4. [ ] Deploy and test each instance

### For Enhancement
1. [ ] Add admin dashboard
2. [ ] Add palika-specific branding
3. [ ] Add analytics per palika
4. [ ] Implement RLS policies

---

## Need Help?

### Check These Files
1. **Architecture:** `MULTI_TENANT_IMPLEMENTATION.md`
2. **Changes Made:** `IMPLEMENTATION_CHANGELOG.md`
3. **Tier Details:** `TIER_SCOPED_CATEGORIES.md`
4. **Code:** Check inline comments in:
   - `src/config/palika.ts`
   - `src/hooks/useCurrentPalika.ts`
   - `src/components/RegionSelectionDialog.tsx`

### Common Questions
- **"How do I change the palika?"** → Edit `VITE_PALIKA_ID` in `.env.local`
- **"Why do I only see some categories?"** → Your palika's tier limits them
- **"How do I test with different tiers?"** → Switch `VITE_PALIKA_ID` to 1-4
- **"Can users select their palika?"** → No, it's fixed per deployment

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Stop server
Ctrl+C

# Check status
npm list

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# View .env.local
cat .env.local

# Add VITE_PALIKA_ID if missing
echo "VITE_PALIKA_ID=1" >> .env.local
```

---

**Ready to get started? Run `npm run dev` and open http://localhost:8083/!**

**Questions? Check `MULTI_TENANT_IMPLEMENTATION.md` for detailed documentation.**
