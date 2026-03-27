# Marketplace Seeding Guide

## Status: Ready to Seed (User Registration Required)

The marketplace seeding script is ready and working. It will create:
- ✅ Business: "Ayush's Store" in Bhaktapur
- ✅ Product 1: "Ayush" (price: 852582)
- ✅ Product 2: "Traditional Pottery" (price: 1500)

## Prerequisites

Before running the marketplace seeding, you need to:

1. **Register a user account** at http://localhost:8080
   - This creates an entry in `auth.users` table
   - The script will use this user as the business owner

2. **Ensure Supabase is running**
   ```powershell
   cd D:\nepal-digital-palika
   supabase start
   ```

3. **Verify infrastructure data is seeded**
   - Provinces, districts, palikas
   - Subscription tiers
   - Business categories
   - Marketplace categories

## How to Seed Marketplace

### Option 1: After Registering an Account

1. Register at http://localhost:8080
2. Run the seeding script:
   ```powershell
   cd D:\nepal-digital-palika
   node database/scripts/seed-marketplace-direct.mjs
   ```

The script will:
- Find your registered user
- Create a profile if needed
- Create "Ayush's Store" business
- Create 2 products including "Ayush" (852582)

### Option 2: Complete Flow Seeding

Run the complete Windows seeding script:
```powershell
cd D:\nepal-digital-palika\database
.\scripts\seed-all-windows.ps1
```

This runs all seeding phases including marketplace.

## What Gets Created

### Business
- **Name**: Ayush's Store
- **Location**: Bhaktapur Durbar Square, Ward 1
- **Category**: Restaurant (ID: 16)
- **Status**: Approved and Published
- **Coordinates**: 85.4298°E, 27.6710°N (Bhaktapur)

### Products

#### Product 1: Ayush
- **Price**: NPR 852,582
- **Description**: Ayush test product
- **Status**: Published and Approved
- **In Stock**: Yes

#### Product 2: Traditional Pottery
- **Price**: NPR 1,500
- **Description**: Handmade pottery from Bhaktapur
- **Status**: Published and Approved
- **In Stock**: Yes

## Verification

After seeding, verify at:
- **Marketplace**: http://localhost:8080
- **Product Detail**: Click on "Ayush" product
- **Seller Info**: Should be visible to all users (RLS fix applied)

## Technical Details

### Script Features
- ✅ Uses PostgreSQL direct connection for PostGIS location field
- ✅ Checks for existing users automatically
- ✅ Creates profile if missing
- ✅ Handles ON CONFLICT gracefully
- ✅ Proper error messages

### Database Tables Modified
- `auth.users` (checked, not modified)
- `profiles` (created if needed)
- `businesses` (1 row inserted)
- `marketplace_products` (2 rows inserted)

### Dependencies
- `@supabase/supabase-js` v2.43.0
- `pg` v8.11.3

## Troubleshooting

### "No existing users found"
**Solution**: Register an account at http://localhost:8080 first

### "Business already exists"
**Solution**: The script uses `slug: 'ayush-store'` which must be unique. Either:
- Delete existing business: `DELETE FROM businesses WHERE slug = 'ayush-store';`
- Or modify the slug in the script

### "Location constraint violation"
**Solution**: The script uses PostGIS `ST_GeomFromText()` function. Ensure PostGIS extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### "Foreign key constraint violation"
**Solution**: Ensure infrastructure data is seeded first:
```powershell
npx tsx database/scripts/seed-database.ts
```

## Next Steps

1. ✅ Register account at http://localhost:8080
2. ✅ Run `node database/scripts/seed-marketplace-direct.mjs`
3. ✅ Browse marketplace and verify products
4. ✅ Check seller information visibility
5. ✅ Test product detail page

## Files

- **Seeding Script**: `database/scripts/seed-marketplace-direct.mjs`
- **Package Config**: `package.json` (with pg dependency)
- **Windows Guide**: `WINDOWS_QUICK_START.md`
- **RLS Fix**: `supabase/migrations/20250327000058_fix_businesses_public_read_for_marketplace.sql`
