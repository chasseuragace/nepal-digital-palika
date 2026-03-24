# Complete Setup Instructions

Get your Nepal Digital Tourism Platform up and running with a clean, seeded database.

## 🚀 Quick Start (3 Steps)

### 1. Check Prerequisites
```powershell
.\check-prerequisites.ps1
```

This checks if you have:
- ✅ Supabase CLI
- ✅ Node.js (v18+)
- ✅ npm
- ✅ Docker (running)
- ✅ Project structure

### 2. Install Missing Prerequisites

If Supabase CLI is missing, install it:

**Using Scoop (Recommended):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or see:** [INSTALL-SUPABASE-CLI.md](INSTALL-SUPABASE-CLI.md) for other options

### 3. Run Database Setup
```powershell
.\setup-clean-db.ps1
```

This will:
- Start Supabase (if not running)
- Reset database to clean state
- Apply all migrations
- Seed infrastructure data
- Create admin users
- Add test data

**Done!** Your database is ready.

---

## 📋 What You Get

### Infrastructure
- 3 subscription tiers (Basic, Tourism, Premium)
- 27 platform features
- 96 business type categories
- 26 marketplace categories (tier-gated)

### Admin Accounts
Ready to use for testing:

**Super Admin** (Full Access)
- Email: `superadmin@nepaltourism.dev`
- Password: `SuperSecurePass123!`

**Kathmandu Palika Admin**
- Email: `palika.admin@kathmandu.gov.np`
- Password: `KathmanduAdmin456!`

**Bhaktapur Palika Admin**
- Email: `palika.admin@bhaktapur.gov.np`
- Password: `BhaktapurAdmin456!`

### Test Data
- 5 palikas with tier assignments
- 8 test users with profiles
- 8 businesses across different tiers
- 16+ marketplace products
- 24+ threaded comments

---

## 🎯 Access Your Applications

### Admin Panel
```powershell
cd admin-panel
npm install  # First time only
npm run dev
```
Access at: **http://localhost:3000**

### Supabase Studio
Access at: **http://127.0.0.1:54323**

Browse tables, run queries, manage auth users.

### Database Connection
- **URL:** `http://127.0.0.1:54321`
- **Service Role Key:** Check `database/.env`

---

## 🔧 Manual Setup (Alternative)

If you prefer step-by-step control:

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
```bash
# Run all at once
bash session-2026-03-21/run-seeds.sh

# Or run individually (see DATABASE-SETUP-GUIDE.md)
```

---

## 📚 Documentation

- **[DATABASE-SETUP-GUIDE.md](DATABASE-SETUP-GUIDE.md)** - Complete database setup guide
- **[INSTALL-SUPABASE-CLI.md](INSTALL-SUPABASE-CLI.md)** - Supabase CLI installation
- **[database/README.md](database/README.md)** - Detailed seeding documentation
- **[database/scripts/docs/](database/scripts/docs/)** - Script documentation

---

## 🐛 Troubleshooting

### Supabase CLI Not Found
```powershell
# Install with Scoop
scoop install supabase

# Or see INSTALL-SUPABASE-CLI.md
```

### Docker Not Running
```powershell
# Start Docker Desktop
# Wait for it to fully start
docker ps  # Verify it's running
```

### Database Reset Fails
```bash
# Stop and restart Supabase
supabase stop
supabase start
supabase db reset
```

### Seeding Script Fails
```bash
# Check Supabase is running
supabase status

# Check environment variables
cat database/.env

# Re-run specific script
cd database
npx ts-node scripts/seed-subscription-tiers.ts
```

### Port Already in Use
```bash
# Stop Supabase
supabase stop

# Start again
supabase start
```

---

## ✅ Verification

After setup, verify everything works:

### 1. Check Database Tables
```bash
cd database
npx ts-node scripts/quick-table-check.ts
```

### 2. Check Supabase Studio
Open: http://127.0.0.1:54323
- Browse tables in Table Editor
- Check Authentication → Users (should see 5 admin users)

### 3. Test Admin Login
1. Start admin panel: `cd admin-panel && npm run dev`
2. Open: http://localhost:3000
3. Login with super admin credentials
4. Dashboard should load with data

---

## 🔄 Reset and Re-seed

To start fresh:

```powershell
# Stop everything
supabase stop

# Start fresh
supabase start

# Run setup again
.\setup-clean-db.ps1
```

---

## 📊 Database Schema

The database includes these main tables:

**Infrastructure:**
- `subscription_tiers` - Tier definitions
- `features` - Platform features
- `tier_features` - Feature access by tier
- `business_categories` - Business types
- `marketplace_categories` - Product categories

**Admin & Auth:**
- `admin_users` - Admin accounts
- `auth.users` - Supabase authentication
- `profiles` - User profiles

**Content:**
- `palikas` - Municipalities
- `businesses` - Business listings
- `marketplace_products` - Products
- `marketplace_product_comments` - Comments

**See:** `supabase/migrations/` for complete schema

---

## 🎓 Next Steps

1. **Explore the Admin Panel**
   - Login with super admin
   - Browse businesses, products, users
   - Test content management

2. **Review the Data**
   - Open Supabase Studio
   - Explore table relationships
   - Check RLS policies

3. **Start Development**
   - Admin panel is ready
   - APIs are functional
   - Test data is available

4. **Customize**
   - Add more test data
   - Modify seeding scripts
   - Adjust tier configurations

---

## 💡 Tips

- **Use Supabase Studio** for quick data inspection
- **Check logs** in PowerShell for detailed error messages
- **Re-run scripts** safely - they use upsert operations
- **Backup data** before major changes: `supabase db dump`

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review script output for error messages
3. Verify all prerequisites: `.\check-prerequisites.ps1`
4. Check Supabase status: `supabase status`
5. Review documentation in `database/scripts/docs/`

---

**Ready to go!** Run `.\check-prerequisites.ps1` to get started.
