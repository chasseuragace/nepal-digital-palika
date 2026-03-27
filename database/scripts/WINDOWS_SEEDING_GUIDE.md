# 🪟 Windows Seeding Guide
## Nepal Digital Palika - Complete Database Setup

This guide provides Windows-specific instructions for seeding the database with all necessary data including infrastructure, admin users, marketplace, and Bhaktapur-specific content.

---

## 📋 Prerequisites

### Required Software
- ✅ **Windows 10/11** with PowerShell 5.1+
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **Supabase CLI** - [Installation Guide](https://supabase.com/docs/guides/cli)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

### Verify Installation
```powershell
# Check Node.js
node --version  # Should show v18.x.x or higher

# Check Supabase CLI
supabase --version  # Should show v2.x.x

# Check Docker
docker --version  # Should show Docker version
```

---

## 🚀 Quick Start (Recommended)

### Option 1: Automated PowerShell Script

```powershell
# Navigate to the database directory
cd D:\nepal-digital-palika\database

# Run the complete seeding script
.\scripts\seed-all-windows.ps1
```

This will seed:
- ✅ Infrastructure (tiers, categories, palikas)
- ✅ Admin users
- ✅ Marketplace (users, businesses, products)
- ✅ Bhaktapur-specific data
- ✅ Optional: Tourism content

### Option 2: Selective Seeding

```powershell
# Skip certain phases
.\scripts\seed-all-windows.ps1 -SkipBhaktapur
.\scripts\seed-all-windows.ps1 -SkipAdmin
.\scripts\seed-all-windows.ps1 -TestDataOnly
```

---

## 📦 Manual Step-by-Step Seeding

If you prefer to run each step manually:

### Step 1: Start Supabase
```powershell
cd D:\nepal-digital-palika
supabase start
```

Wait for Supabase to fully start. You should see:
```
Started supabase local development setup.
Studio: http://127.0.0.1:54323
```

### Step 2: Set Environment Variables
```powershell
$env:SUPABASE_URL = "http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
```

### Step 3: Install Dependencies
```powershell
cd D:\nepal-digital-palika\database
npm install
```

### Step 4: Run Seeding Scripts

#### Phase 1: Infrastructure
```powershell
# Subscription tiers (3 tiers + 27 features)
npx tsx scripts/seed-subscription-tiers.ts

# Business categories (8 categories)
npx tsx scripts/seed-business-categories-direct.ts

# Marketplace categories (26 categories)
npx tsx scripts/seed-marketplace-categories-direct.ts

# Enroll palikas in tiers
npx tsx scripts/enroll-palikas-tiers.ts
```

#### Phase 2: Admin Users
```powershell
# Create 3 admin users
npx tsx scripts/seed-admin-users.ts
```

#### Phase 3: Marketplace Data
```powershell
# Seed users, businesses, and products
npx tsx scripts/seed-marketplace-proper.ts

# Optional: Additional test data
npx tsx scripts/seed-marketplace-test-data.ts
```

#### Phase 4: Bhaktapur-Specific
```powershell
# Bhaktapur users and businesses
npx tsx scripts/seed-bhaktapur-users.ts
```

#### Phase 5: Tourism Content (Optional)
```powershell
# Heritage sites and events
npx tsx scripts/seed-content.ts
```

---

## 🔍 Verification

### Check Seeded Data

```powershell
# Open Supabase Studio
Start-Process "http://127.0.0.1:54323"

# Or use the verification script
npx tsx scripts/verify-marketplace-setup.ts
```

### Expected Data Counts

| Table | Expected Count | Description |
|-------|----------------|-------------|
| `subscription_tiers` | 3 | Basic, Standard, Premium |
| `subscription_tier_features` | 27 | Feature definitions |
| `business_categories` | 8 | Business types |
| `marketplace_categories` | 26 | Product categories |
| `palikas` | 8+ | Major municipalities |
| `admin_users` | 3 | System administrators |
| `businesses` | 8+ | Sample businesses |
| `marketplace_products` | 16+ | Sample products |

---

## 🐛 Troubleshooting

### Issue: "Supabase is not running"
```powershell
# Start Supabase
cd D:\nepal-digital-palika
supabase start

# Check status
supabase status
```

### Issue: "Cannot find module"
```powershell
# Reinstall dependencies
cd D:\nepal-digital-palika\database
Remove-Item node_modules -Recurse -Force
npm install
```

### Issue: "Permission denied"
```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → Run as Administrator
```

### Issue: "Execution policy" error
```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Database already has data
```powershell
# Reset the database (WARNING: Deletes all data)
cd D:\nepal-digital-palika
supabase db reset
```

---

## 📚 Related Documentation

### In `D:\nepal-digital-palika\database\docs\`:
- `SEEDING-SUMMARY.md` - Overview of seeding strategy
- `CONTENT-SEEDING-PLAN.md` - Content seeding details
- `ADMIN-SETUP-GUIDE.md` - Admin user setup

### In `D:\nepal-digital-palika\docs\`:
- `INFRASTRUCTURE_SEEDING_OVERVIEW.md` - Complete seeding guide
- `DATABASE-SETUP-GUIDE.md` - Database setup instructions

### In `D:\mktplace\`:
- `RLS_FIX_COMPLETE.md` - RLS policy fixes
- `SELLER_VISIBILITY_FIX.md` - Seller visibility issue resolution

---

## 🎯 What Gets Seeded

### Infrastructure Data
- ✅ 3 subscription tiers (Basic, Standard, Premium)
- ✅ 27 tier features
- ✅ 8 business categories
- ✅ 26 marketplace categories
- ✅ 7 provinces
- ✅ 9 major districts
- ✅ 8 major palikas

### Admin & Users
- ✅ 3 admin users (super admin, palika admin, content editor)
- ✅ 8 marketplace users
- ✅ Bhaktapur-specific users

### Marketplace
- ✅ 8 businesses (various categories)
- ✅ 16 products (with images and descriptions)
- ✅ Product comments and reviews
- ✅ Business verification status

### Tourism Content (Optional)
- ✅ 4 heritage sites (UNESCO World Heritage)
- ✅ 3 major festivals/events
- ✅ Blog posts and articles

---

## ✨ Post-Seeding Steps

1. **Open Marketplace**
   ```powershell
   Start-Process "http://localhost:8080"
   ```

2. **Test Login**
   - Email: `test@example.com`
   - Password: `password123`

3. **Verify Seller Information**
   - Navigate to any product detail page
   - Seller information should be visible to all users

4. **Check RLS Policies**
   - Open Supabase Studio
   - Go to Database → Policies
   - Verify `businesses_public_read` and `businesses_authenticated_read` exist

---

## 🔐 Security Notes

- The service role key shown here is for **local development only**
- Never commit real service role keys to version control
- For production, use environment variables and secrets management
- Change default passwords before deploying to production

---

## 💡 Tips

- Run seeding scripts in order (infrastructure → admin → marketplace)
- Use `-SkipX` flags to skip phases you don't need
- Check Supabase Studio after each phase to verify data
- Keep the PowerShell window open to see progress
- If a script fails, check the error message and fix before continuing

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the error messages carefully
3. Verify all prerequisites are installed
4. Check that Supabase is running
5. Consult the related documentation

---

**Last Updated:** March 27, 2026
**Platform:** Windows 10/11
**Supabase Version:** Local Development
