# Nepal Digital Tourism - Complete Setup Guide

This directory contains all documentation and scripts needed to set up the project from scratch in a fresh environment.

## 📁 Directory Contents

### Documentation Files
- **00-QUICK-START.md** - Fastest way to get started (5 minutes)
- **01-PREREQUISITES.md** - Required software and installation
- **02-DATABASE-SETUP.md** - Complete database setup process
- **03-TROUBLESHOOTING.md** - Common issues and solutions
- **04-SEEDING-REFERENCE.md** - Database seeding details
- **05-LESSONS-LEARNED.md** - Issues encountered and solutions

### Scripts
- **check-prerequisites.ps1** - Verify all prerequisites are installed
- **setup-database.ps1** - Automated database setup (Windows)
- **setup-database.sh** - Automated database setup (Linux/Mac)

### Reference Files
- **database-schema.md** - Database structure overview
- **seeding-order.md** - Correct order for running seed scripts
- **environment-config.md** - Environment variable configuration

## 🚀 Quick Start

For a brand new setup, follow these steps:

### 1. Check Prerequisites
```powershell
.\check-prerequisites.ps1
```

### 2. Install Missing Prerequisites
If Supabase CLI is missing:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 3. Run Database Setup
```powershell
.\setup-database.ps1
```

### 4. Start Admin Panel
```powershell
cd ..\admin-panel
npm install
npm run dev
```

## 📖 Detailed Documentation

For step-by-step instructions, read the documentation files in order:
1. Start with **00-QUICK-START.md**
2. If you encounter issues, check **03-TROUBLESHOOTING.md**
3. For understanding the database, see **04-SEEDING-REFERENCE.md**
4. Learn from past issues in **05-LESSONS-LEARNED.md**

## 🎯 What Gets Set Up

- ✅ Supabase local instance
- ✅ Database with all migrations applied
- ✅ 7 provinces, 77 districts, 372 palikas
- ✅ 3 subscription tiers with 27 features
- ✅ 6 roles, 12 permissions
- ✅ 27 content categories
- ✅ 26 marketplace categories (tier-gated)
- ✅ 8 business categories
- ✅ Test data: 8 users, 8 businesses, 16 products

## 🔗 Access Points

After setup:
- **Supabase Studio:** http://127.0.0.1:54323
- **Database:** http://127.0.0.1:54321
- **Admin Panel:** http://localhost:3000 (after starting)

## ⚠️ Important Notes

1. **Always run scripts from project root** - Not from subdirectories
2. **Supabase must be running** - Check with `supabase status`
3. **Docker must be running** - Required for Supabase
4. **Follow seeding order** - See seeding-order.md for correct sequence
5. **Don't skip migrations** - They must be applied before seeding

## 🆘 Getting Help

If you encounter issues:
1. Check **03-TROUBLESHOOTING.md** first
2. Review **05-LESSONS-LEARNED.md** for similar issues
3. Verify prerequisites with `.\check-prerequisites.ps1`
4. Check Supabase status with `supabase status`

## 📝 Version Information

- **Created:** March 23, 2026
- **Supabase CLI:** v2.78.1
- **Node.js:** v18+ required
- **Platform:** Windows, Linux, Mac

---

**Ready to start?** Run `.\check-prerequisites.ps1` to begin!
