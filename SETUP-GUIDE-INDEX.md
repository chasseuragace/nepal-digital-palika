# Setup Guide - Quick Access

Complete setup documentation is located in the `setup-guide/` directory.

## 🚀 Quick Start

**For fastest setup (5 minutes):**
```powershell
cd setup-guide
.\check-prerequisites.ps1
.\setup-database.ps1
```

Then start the admin panel:
```powershell
cd ..\admin-panel
npm install
npm run dev
```

## 📚 Documentation

All setup documentation is in the **`setup-guide/`** directory:

### Essential Files
- **[setup-guide/README.md](setup-guide/README.md)** - Start here
- **[setup-guide/00-QUICK-START.md](setup-guide/00-QUICK-START.md)** - 5-minute setup
- **[setup-guide/03-TROUBLESHOOTING.md](setup-guide/03-TROUBLESHOOTING.md)** - Common issues
- **[setup-guide/05-LESSONS-LEARNED.md](setup-guide/05-LESSONS-LEARNED.md)** - Past issues and solutions

### Complete Index
See **[setup-guide/INDEX.md](setup-guide/INDEX.md)** for full documentation list.

## 🎯 What You Need

### Prerequisites
- Node.js v18+
- Docker Desktop (running)
- Supabase CLI

**Check prerequisites:**
```powershell
cd setup-guide
.\check-prerequisites.ps1
```

### If Supabase CLI is Missing
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## 📖 Documentation Structure

```
setup-guide/
├── README.md                    # Overview
├── INDEX.md                     # Complete index
├── 00-QUICK-START.md           # 5-minute setup
├── 01-PREREQUISITES.md         # Required software
├── 02-DATABASE-SETUP.md        # Detailed setup
├── 03-TROUBLESHOOTING.md       # Common issues
├── 04-SEEDING-REFERENCE.md     # Data reference
├── 05-LESSONS-LEARNED.md       # Past issues
├── seeding-order.md            # Script order
├── check-prerequisites.ps1     # Prerequisite checker
└── setup-database.ps1          # Automated setup
```

## ⚡ Quick Commands

```powershell
# Check prerequisites
cd setup-guide
.\check-prerequisites.ps1

# Setup database
.\setup-database.ps1

# Start admin panel
cd ..\admin-panel
npm run dev

# Check Supabase status
supabase status

# Open Supabase Studio
# http://127.0.0.1:54323
```

## 🆘 Having Issues?

1. Check **[setup-guide/03-TROUBLESHOOTING.md](setup-guide/03-TROUBLESHOOTING.md)**
2. Review **[setup-guide/05-LESSONS-LEARNED.md](setup-guide/05-LESSONS-LEARNED.md)**
3. Verify prerequisites: `.\check-prerequisites.ps1`
4. Check Supabase: `supabase status`

## 📊 What Gets Set Up

- ✅ 7 provinces, 77 districts, 372 palikas
- ✅ 3 subscription tiers with 27 features
- ✅ 26 marketplace categories, 8 business categories
- ✅ 8 test users, 8 businesses, 16 products
- ✅ Supabase Studio at http://127.0.0.1:54323
- ✅ Admin Panel at http://localhost:3000

## 🎓 For New Users

1. Go to `setup-guide/` directory
2. Read `README.md`
3. Follow `00-QUICK-START.md`
4. If issues, check `03-TROUBLESHOOTING.md`

## 🔧 For Experienced Users

```powershell
cd setup-guide
.\setup-database.ps1
cd ..\admin-panel
npm run dev
```

Done!

---

**Start here:** [setup-guide/README.md](setup-guide/README.md)
