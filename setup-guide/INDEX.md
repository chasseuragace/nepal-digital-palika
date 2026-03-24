# Setup Guide Index

Complete documentation for setting up the Nepal Digital Tourism platform from scratch.

## 📚 Documentation Files

### Getting Started
1. **[README.md](README.md)** - Overview and quick navigation
2. **[00-QUICK-START.md](00-QUICK-START.md)** - Fastest way to get running (5 minutes)
3. **[01-PREREQUISITES.md](01-PREREQUISITES.md)** - Required software and installation

### Setup Process
4. **[02-DATABASE-SETUP.md](02-DATABASE-SETUP.md)** - Complete database setup guide
5. **[seeding-order.md](seeding-order.md)** - Correct order for running seed scripts

### Reference
6. **[03-TROUBLESHOOTING.md](03-TROUBLESHOOTING.md)** - Common issues and solutions
7. **[04-SEEDING-REFERENCE.md](04-SEEDING-REFERENCE.md)** - What gets seeded and why
8. **[05-LESSONS-LEARNED.md](05-LESSONS-LEARNED.md)** - Issues from past sessions

### Scripts
9. **[check-prerequisites.ps1](check-prerequisites.ps1)** - Verify prerequisites
10. **[setup-database.ps1](setup-database.ps1)** - Automated database setup

---

## 🎯 Quick Navigation

### I'm brand new, where do I start?
→ Start with **[00-QUICK-START.md](00-QUICK-START.md)**

### I need to install prerequisites
→ Read **[01-PREREQUISITES.md](01-PREREQUISITES.md)**

### I want detailed setup instructions
→ Follow **[02-DATABASE-SETUP.md](02-DATABASE-SETUP.md)**

### Something isn't working
→ Check **[03-TROUBLESHOOTING.md](03-TROUBLESHOOTING.md)**

### I need to understand the seeding process
→ Review **[seeding-order.md](seeding-order.md)** and **[04-SEEDING-REFERENCE.md](04-SEEDING-REFERENCE.md)**

### I want to learn from past issues
→ Read **[05-LESSONS-LEARNED.md](05-LESSONS-LEARNED.md)**

---

## 📋 Setup Checklist

Use this checklist to track your progress:

### Prerequisites
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Docker Desktop installed and running
- [ ] Supabase CLI installed
- [ ] Git installed (optional)
- [ ] Run `check-prerequisites.ps1` - all checks pass

### Database Setup
- [ ] Supabase started (`supabase start`)
- [ ] Database dependencies installed (`cd database && npm install`)
- [ ] Basic infrastructure seeded (`seed-database.ts`)
- [ ] Subscription tiers seeded (`seed-subscription-tiers.ts`)
- [ ] Marketplace categories seeded (`seed-marketplace-categories-direct.ts`)
- [ ] Business categories seeded (`seed-business-categories-direct.ts`)
- [ ] Palika tiers assigned (`enroll-palikas-tiers.ts`)
- [ ] Test data created (`seed-marketplace-proper.ts`)
- [ ] Verification passed (`quick-table-check.ts`)

### Admin Panel
- [ ] Admin panel dependencies installed (`cd admin-panel && npm install`)
- [ ] Environment configured (`.env.local`)
- [ ] Admin panel started (`npm run dev`)
- [ ] Can access at http://localhost:3000
- [ ] Can login with test credentials

### Verification
- [ ] Supabase Studio accessible (http://127.0.0.1:54323)
- [ ] Can browse database tables
- [ ] Tables have expected data counts
- [ ] Test users exist in auth.users
- [ ] Businesses and products visible

---

## 🚀 Recommended Path

### For First-Time Setup
1. Read **README.md** (this file)
2. Check **01-PREREQUISITES.md**
3. Run `check-prerequisites.ps1`
4. Follow **00-QUICK-START.md**
5. If issues arise, consult **03-TROUBLESHOOTING.md**

### For Experienced Users
1. Run `check-prerequisites.ps1`
2. Run `setup-database.ps1`
3. Start admin panel
4. Done!

### For Understanding the System
1. Read **04-SEEDING-REFERENCE.md**
2. Review **seeding-order.md**
3. Study **05-LESSONS-LEARNED.md**
4. Explore database in Supabase Studio

---

## 📊 What You'll Have After Setup

### Infrastructure
- 7 provinces
- 77 districts
- 372 palikas
- 3 subscription tiers
- 27 platform features
- 6 user roles
- 12 permissions
- 27 content categories
- 26 marketplace categories
- 8 business categories

### Test Data
- 8 test users
- 8 businesses
- 16 products
- 15 comments

### Access Points
- Supabase Studio: http://127.0.0.1:54323
- Database: http://127.0.0.1:54321
- Admin Panel: http://localhost:3000

---

## 🆘 Getting Help

### If You're Stuck
1. Check **03-TROUBLESHOOTING.md** for your specific error
2. Review **05-LESSONS-LEARNED.md** for similar issues
3. Verify prerequisites with `check-prerequisites.ps1`
4. Check Supabase status: `supabase status`
5. Restart Supabase: `supabase stop && supabase start`

### Common Issues
- **Supabase won't start** → Check Docker is running
- **Scripts fail** → Check seeding order in **seeding-order.md**
- **Connection errors** → Verify Supabase is running
- **Missing data** → Re-run seeding scripts in correct order

---

## 📝 Document Summaries

### 00-QUICK-START.md
5-minute setup guide. Run scripts, start admin panel, done.

### 01-PREREQUISITES.md
Lists all required software with installation instructions.

### 02-DATABASE-SETUP.md
Detailed step-by-step database setup process.

### 03-TROUBLESHOOTING.md
Solutions for common errors and issues.

### 04-SEEDING-REFERENCE.md
Explains what data gets seeded and why.

### 05-LESSONS-LEARNED.md
Documents issues from past sessions and their solutions.

### seeding-order.md
Critical! Shows exact order to run seeding scripts.

---

## 🔄 Update History

- **March 23, 2026** - Initial setup guide created
- Documented successful setup process
- Captured lessons learned from session
- Created automated setup scripts

---

## 📞 Support

For issues not covered in this documentation:
1. Review all troubleshooting docs
2. Check Supabase documentation: https://supabase.com/docs
3. Verify you followed the correct seeding order

---

**Ready to start?** Go to **[00-QUICK-START.md](00-QUICK-START.md)**!
