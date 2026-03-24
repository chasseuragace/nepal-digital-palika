# Setup Checklist

Use this checklist to track your setup progress.

## Prerequisites

- [ ] **Supabase CLI** installed
  ```powershell
  scoop install supabase
  ```

- [ ] **Node.js** installed (v18+)
  - Check: `node --version`

- [ ] **npm** installed
  - Check: `npm --version`

- [ ] **Docker** installed and running
  - Check: `docker ps`

- [ ] **Git** installed (optional)
  - Check: `git --version`

## Verification

- [ ] Run prerequisites check
  ```powershell
  .\check-prerequisites.ps1
  ```

- [ ] All checks show "OK"

## Database Setup

- [ ] Run setup script
  ```powershell
  .\setup-clean-db.ps1
  ```

- [ ] Supabase started successfully

- [ ] Database reset completed

- [ ] All migrations applied

- [ ] Infrastructure data seeded
  - Subscription tiers
  - Features
  - Categories

- [ ] Admin users created
  - Super admin
  - Palika admins
  - Moderators

- [ ] Test data seeded
  - Users
  - Businesses
  - Products

## Verification

- [ ] Check database tables
  ```powershell
  cd database
  npx ts-node scripts/quick-table-check.ts
  ```

- [ ] Open Supabase Studio
  - URL: http://127.0.0.1:54323
  - Check tables have data
  - Check auth users exist

## Admin Panel

- [ ] Install dependencies
  ```powershell
  cd admin-panel
  npm install
  ```

- [ ] Start development server
  ```powershell
  npm run dev
  ```

- [ ] Access admin panel
  - URL: http://localhost:3000

- [ ] Test login with super admin
  - Email: `superadmin@nepaltourism.dev`
  - Password: `SuperSecurePass123!`

- [ ] Dashboard loads successfully

- [ ] Can view businesses

- [ ] Can view products

- [ ] Can view users

## Final Checks

- [ ] Supabase is running
  ```powershell
  supabase status
  ```

- [ ] Admin panel is accessible

- [ ] Can login with admin credentials

- [ ] Data is visible in admin panel

- [ ] Supabase Studio shows all tables

## Troubleshooting (If Needed)

If something doesn't work:

- [ ] Check Supabase status: `supabase status`

- [ ] Check Docker is running: `docker ps`

- [ ] Review error messages in PowerShell

- [ ] Check [DATABASE-SETUP-GUIDE.md](DATABASE-SETUP-GUIDE.md)

- [ ] Try resetting:
  ```powershell
  supabase stop
  supabase start
  .\setup-clean-db.ps1
  ```

## Success Criteria

✅ All prerequisites installed
✅ Database setup completed without errors
✅ Admin panel accessible
✅ Can login with admin credentials
✅ Data visible in admin panel and Supabase Studio

---

## Quick Reference

**Check Prerequisites:**
```powershell
.\check-prerequisites.ps1
```

**Setup Database:**
```powershell
.\setup-clean-db.ps1
```

**Start Admin Panel:**
```powershell
cd admin-panel
npm run dev
```

**Access Points:**
- Admin Panel: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323

**Admin Login:**
- Email: `superadmin@nepaltourism.dev`
- Password: `SuperSecurePass123!`

---

**Done?** You're ready to start developing! 🚀
