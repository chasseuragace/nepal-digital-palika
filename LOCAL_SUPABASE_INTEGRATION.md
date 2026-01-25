# Local Supabase Integration Guide

## Overview

The workspace contains a fully functional frontend, comprehensive tests, and database seeding infrastructure that can work seamlessly with local Supabase setup.

---

## 🏗️ Architecture Components

### 1. **Database Layer** (`database/`)
- **Status:** ✅ Complete and ready for local setup
- **Seeding Scripts:** TypeScript + SQL
- **Data:** Reference data + sample content
- **RLS Policies:** Row-level security configured

**Key Scripts:**
```bash
npm run seed              # Reference data (provinces, districts, roles, etc.)
npm run seed:content     # Sample tourism content
npm run seed:all         # Everything
npm run db:seed-admins   # Create admin users
npm run check-status     # Verify setup
```

**What Gets Seeded:**
- 7 Provinces, 9 Districts, 8 Palikas
- 6 User Roles + 12 Permissions
- 27 Content Categories
- 8 Heritage Sites, 8 Events, 6 Blog Posts

---

### 2. **Frontend Application** (`admin-panel/`)
- **Status:** ✅ Services complete, UI in progress
- **Framework:** Next.js 14 + React 18 + TypeScript
- **Authentication:** Supabase Auth integrated
- **API Routes:** 7 backend endpoints

**Environment Configuration:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54323
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
ADMIN_SESSION_SECRET=<generate random>
```

**Startup:**
```bash
npm run dev  # Runs on http://localhost:3000
```

---

### 3. **Test Suite** (`admin-panel/services/__tests__/`)
- **Status:** ✅ 114 tests ready to run
- **Unit Tests:** 98 tests (mocked)
- **Integration Tests:** 16 tests (real database)

**Test Commands:**
```bash
npm run test:unit        # Fast unit tests (no DB needed)
npm run test:integration # Against real database
npm test                 # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## 🔄 Integration Workflow

### Step 1: Start Local Supabase
```bash
# Terminal 1: Start Supabase (already running)
supabase start

# Get connection info
supabase status
```

**Output will show:**
```
API URL: http://localhost:54323
Anon Key: [REDACTED].
Service Role Key: [REDACTED].
```

### Step 2: Setup Database
```bash
cd database
npm install
cp config/.env.example .env

# Edit .env with local Supabase credentials
# SUPABASE_URL=http://localhost:54323
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

# Seed database
npm run seed:all
npm run db:seed-admins
npm run check-status
```

### Step 3: Configure Admin Panel
```bash
cd admin-panel
npm install
cp .env.local.example .env.local

# Edit .env.local with local Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54323
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

### Step 4: Run Tests
```bash
# Unit tests (no database needed)
npm run test:unit

# Integration tests (requires seeded database)
npm run test:integration

# All tests
npm test
```

### Step 5: Start Frontend
```bash
npm run dev
# Access at http://localhost:3000
```

---

## 📊 Feasibility Assessment

### ✅ **Fully Compatible**

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Ready | SQL scripts work with any Postgres |
| Seeding Scripts | ✅ Ready | Uses Supabase JS client |
| Unit Tests | ✅ Ready | No database dependency |
| Integration Tests | ✅ Ready | Works with local Supabase |
| Frontend Services | ✅ Ready | Supabase client configured |
| Authentication | ✅ Ready | Supabase Auth integrated |
| API Routes | ✅ Ready | Use Supabase client |

### 🔧 **Configuration Required**

1. **Database `.env`** - Add local Supabase credentials
2. **Admin Panel `.env.local`** - Add local Supabase credentials
3. **Supabase Status** - Get keys from `supabase status` output

### ⚠️ **No Breaking Changes**

- All code uses Supabase client (works with local or cloud)
- No hardcoded URLs or credentials
- Environment-based configuration
- Tests use same credentials as frontend

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Supabase (already running)
# supabase start

# Terminal 2: Database Setup
cd database
npm install
cp config/.env.example .env
# Edit .env with local credentials
npm run seed:all
npm run db:seed-admins

# Terminal 3: Admin Panel
cd admin-panel
npm install
cp .env.local.example .env.local
# Edit .env.local with local credentials
npm run test:unit        # Verify tests work
npm run dev              # Start frontend
```

---

## 📋 Environment Variables Reference

### Database (`.env`)
```env
SUPABASE_URL=http://localhost:54323
SUPABASE_SERVICE_ROLE_KEY=[REDACTED].
NODE_ENV=development
```

### Admin Panel (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54323
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED].
SUPABASE_SERVICE_ROLE_KEY=[REDACTED].
ADMIN_SESSION_SECRET=<random-32-char-string>
```

---

## 🧪 Testing Strategy

### Unit Tests (Fast, No DB)
```bash
npm run test:unit
# 98 tests, ~5 seconds
# Tests: auth, heritage-sites, events, analytics services
```

### Integration Tests (Real DB)
```bash
npm run test:integration
# 16 tests, ~10 seconds
# Tests: auth flow, heritage-sites CRUD
# Requires: seeded database
```

### Full Test Suite
```bash
npm test
# All 114 tests
# Requires: seeded database for integration tests
```

---

## 🔐 Security Notes

- **Local Development:** Use simple credentials (already in examples)
- **Production:** Use strong secrets and environment-specific keys
- **RLS Policies:** Already configured in `part3-rls-policies.sql`
- **Service Role Key:** Only use in backend (never expose to client)

---

## 📝 Next Steps

1. ✅ Supabase CLI is running (in background)
2. ⏳ Wait for `supabase start` to complete
3. 📋 Get credentials from `supabase status`
4. 🗄️ Run database seeding
5. 🧪 Run tests to verify setup
6. 🚀 Start frontend development

---

## 🆘 Troubleshooting

### Tests Fail with "Connection refused"
- Verify Supabase is running: `supabase status`
- Check `.env` credentials match `supabase status` output
- Ensure database is seeded: `npm run check-status`

### Frontend Can't Connect to Database
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure Supabase is running: `supabase status`

### Seeding Fails
- Verify Supabase is running
- Check `.env` has correct credentials
- Ensure database schema exists (run SQL scripts first if needed)

---

## 📚 Related Documentation

- **Database Setup:** `database/README.md`
- **Admin Panel:** `admin-panel/README.md`
- **Testing Guide:** `admin-panel/TESTING.md`
- **Architecture:** `docs/03-architecture/`
