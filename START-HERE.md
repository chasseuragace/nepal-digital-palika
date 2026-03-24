# 🚀 START HERE - Database Setup

## What You Need to Do

You need to install **Supabase CLI** first, then run the setup script.

## Step 1: Install Supabase CLI

**Using Scoop (Easiest):**
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Other Options:** See [INSTALL-SUPABASE-CLI.md](INSTALL-SUPABASE-CLI.md)

## Step 2: Verify Prerequisites

```powershell
.\check-prerequisites.ps1
```

Make sure everything shows "OK" (especially Supabase CLI and Docker).

## Step 3: Run Database Setup

```powershell
.\setup-clean-db.ps1
```

This will:
- ✅ Start Supabase
- ✅ Reset database (clean slate)
- ✅ Apply all migrations
- ✅ Seed infrastructure data
- ✅ Create admin users
- ✅ Add test data

## Step 4: Start Admin Panel

```powershell
cd admin-panel
npm install  # First time only
npm run dev
```

Access at: **http://localhost:3000**

## Login Credentials

**Super Admin:**
- Email: `superadmin@nepaltourism.dev`
- Password: `SuperSecurePass123!`

**Kathmandu Admin:**
- Email: `palika.admin@kathmandu.gov.np`
- Password: `KathmanduAdmin456!`

---

## That's It!

Your database is now clean and seeded with all required data.

**Need more details?** See [SETUP-INSTRUCTIONS.md](SETUP-INSTRUCTIONS.md)

**Having issues?** Check [DATABASE-SETUP-GUIDE.md](DATABASE-SETUP-GUIDE.md)
