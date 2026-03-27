# 🪟 Windows Quick Start Guide
## Nepal Digital Palika + Marketplace

Quick reference for Windows developers to get the system running.

---

## ⚡ Super Quick Start (5 Minutes)

```powershell
# 1. Start Supabase
cd D:\nepal-digital-palika
supabase start

# 2. Seed all data
cd database
.\scripts\seed-all-windows.ps1

# 3. Start marketplace
cd D:\mktplace
npm run dev

# 4. Open in browser
Start-Process "http://localhost:8080"
```

Done! The marketplace is now running with sample data.

---

## 📦 One-Time Setup

### Install Prerequisites
```powershell
# Install Node.js from https://nodejs.org/
# Install Docker Desktop from https://docker.com/
# Install Supabase CLI
npm install -g supabase
```

### Clone and Setup
```powershell
# Navigate to your projects folder
cd D:\

# Install dependencies for both projects
cd nepal-digital-palika\database
npm install

cd D:\mktplace
npm install
```

---

## 🔄 Daily Development Workflow

### Morning Startup
```powershell
# Terminal 1: Start Supabase
cd D:\nepal-digital-palika
supabase start

# Terminal 2: Start Marketplace
cd D:\mktplace
npm run dev
```

### Evening Shutdown
```powershell
# Stop marketplace (Ctrl+C in Terminal 2)

# Stop Supabase
cd D:\nepal-digital-palika
supabase stop
```

---

## 🗄️ Database Commands

### Reset Database (Fresh Start)
```powershell
cd D:\nepal-digital-palika
supabase db reset
cd database
.\scripts\seed-all-windows.ps1
```

### Check Database Status
```powershell
cd D:\nepal-digital-palika
supabase status
```

### Open Supabase Studio
```powershell
Start-Process "http://127.0.0.1:54323"
```

### Run Specific Seeding Scripts
```powershell
cd D:\nepal-digital-palika\database

# Infrastructure only
npx tsx scripts/seed-subscription-tiers.ts
npx tsx scripts/seed-marketplace-categories-direct.ts

# Marketplace only
npx tsx scripts/seed-marketplace-proper.ts

# Bhaktapur only
npx tsx scripts/seed-bhaktapur-users.ts
```

---

## 🛠️ Common Tasks

### Add New Product
1. Open http://localhost:8080
2. Login with test@example.com / password123
3. Click "Sell" in navigation
4. Fill out product form
5. Submit

### Test Seller Visibility
1. Create a product while logged in
2. Note the product URL
3. Open incognito window
4. Navigate to product URL
5. Verify seller info is visible

### Check RLS Policies
```powershell
cd D:\nepal-digital-palika
docker exec supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc psql -U postgres -d postgres -c "SELECT policyname, roles FROM pg_policies WHERE tablename = 'businesses';"
```

---

## 🐛 Quick Fixes

### Supabase Won't Start
```powershell
# Remove old containers
docker ps -a | Select-String "supabase" | ForEach-Object { docker rm -f $_.ToString().Split()[0] }

# Start fresh
cd D:\nepal-digital-palika
supabase start
```

### Marketplace Shows No Data
```powershell
# Reseed the database
cd D:\nepal-digital-palika\database
.\scripts\seed-all-windows.ps1
```

### Port Already in Use
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Seller Info Not Showing
```powershell
# Apply RLS fix
cd D:\mktplace
node fix-rls-now.mjs

# Or restart Supabase
cd D:\nepal-digital-palika
supabase stop
supabase start
```

---

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Marketplace | http://localhost:8080 | Main application |
| Supabase Studio | http://127.0.0.1:54323 | Database admin |
| Supabase API | http://127.0.0.1:54321 | REST API |
| Mailpit | http://127.0.0.1:54324 | Email testing |

---

## 🔑 Test Credentials

### Marketplace User
- Email: `test@example.com`
- Password: `password123`

### Admin User
- Email: `admin@bhaktapur.gov.np`
- Password: `admin123`

---

## 📂 Project Structure

```
D:\
├── nepal-digital-palika\          # Backend & Database
│   ├── database\
│   │   ├── scripts\               # Seeding scripts
│   │   │   ├── seed-all-windows.ps1
│   │   │   └── WINDOWS_SEEDING_GUIDE.md
│   │   └── docs\                  # Documentation
│   └── supabase\
│       └── migrations\            # Database migrations
│
└── mktplace\                      # Frontend Marketplace
    ├── src\
    │   ├── pages\                 # React pages
    │   ├── components\            # React components
    │   └── api\                   # API calls
    └── docs\                      # Marketplace docs
```

---

## 🎯 Next Steps

After getting everything running:

1. **Explore the Marketplace**
   - Browse products
   - Create a listing
   - Test search and filters

2. **Check Database**
   - Open Supabase Studio
   - Explore tables
   - View RLS policies

3. **Read Documentation**
   - `database/scripts/WINDOWS_SEEDING_GUIDE.md`
   - `mktplace/RLS_FIX_COMPLETE.md`
   - `database/docs/SEEDING-SUMMARY.md`

4. **Start Development**
   - Modify components
   - Add features
   - Test changes

---

## 💡 Pro Tips

- Keep two PowerShell terminals open (one for Supabase, one for marketplace)
- Use Supabase Studio to inspect data while developing
- Run `supabase status` to check if services are running
- Use `npm run dev` in mktplace for hot reload during development
- Check browser console for errors
- Use incognito mode to test as anonymous user

---

## 📞 Need Help?

Check these files for detailed information:
- `database/scripts/WINDOWS_SEEDING_GUIDE.md` - Complete seeding guide
- `mktplace/RLS_FIX_COMPLETE.md` - RLS policy fixes
- `database/docs/SEEDING-SUMMARY.md` - Data overview
- `mktplace/QUICK_FIX_GUIDE.md` - Common issues

---

**Happy Coding! 🚀**
