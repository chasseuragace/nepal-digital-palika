# CLAUDE.md - Agent Profile & Workspace Guidance

This file provides guidance to Claude (Haiku 4.5) when working in this workspace. It documents the agent profile, roadmap, current status, and expected tools.

---

## Agent Profile

**Primary Agent:** Claude Haiku 4.5  
**Collaborator:** You (Developer)  
**Workspace:** Nepal Digital Tourism Infrastructure Documentation  
**Mode:** Collaborative - Agent executes tasks, you provide direction and validation

### Agent Responsibilities
- Execute setup and seeding scripts
- Verify database state and RLS policies
- Run test suites and validate results
- Create and maintain infrastructure scripts
- Document status and roadmap progress

### Expected Tools & MCP Access
- **Supabase MCP** - Database operations, migrations, RLS verification
- **Playwright MCP** - End-to-end testing and UI validation
- **File System** - Script creation and management
- **Shell Commands** - Setup automation

---

## Roadmap & Current Status

### Phase Overview

| Phase | Name | Status | Completion |
|-------|------|--------|-----------|
| 1 | Database Foundation & Seeding | ✅ Complete | 2026-02-28 |
| 2 | RLS Policies & Security | ✅ Complete | 2026-03-01 |
| 3 | Integration Testing | ✅ Complete | 2026-03-05 |
| 4 | Platform Admin Panel | 🟢 In Progress | Phase 4.2 Complete |
| 5 | Setup Automation & Verification | 🔵 Next | TBD |

### Current State (as of 2026-03-21)

**Database:** ✅ 34 migrations applied, RLS fully operational  
**Admin Panel:** ✅ Complete CRUD for users, 99.6% tests passing (466/468)  
**Seeding:** ✅ Infrastructure, admins, content seeded  
**Status:** 🟢 Production-ready for admin operations

### Phase 5: Setup Automation & Verification (CURRENT FOCUS)

**Objective:** Create automated setup scripts that verify and establish clean database state

**Tasks:**
1. ✅ Create `setup.sh` - Orchestrates full setup process
2. ✅ Create `verify-setup.sh` - Confirms current state matches roadmap
3. 🔵 Document seeding strategy (infrastructure → admins → content → users → products)
4. 🔵 Create seed scripts for each layer
5. 🔵 Integrate MCP tools for verification

---

## Project Overview

Nepal Digital Tourism Platform is a multi-tenant system for managing tourism infrastructure across Nepal's geographic hierarchy (National → Province → District → Palika). The codebase contains four main applications:

- **admin-panel** - Next.js app for regional admins (Palika/District/Province) to manage content
- **platform-admin-panel** - Dev/internal admin panel for managing platform-level configuration
- **m-place** - Vite+React marketplace frontend
- **database** - Supabase PostgreSQL infrastructure and seeding scripts

## Architecture Overview

### Multi-Tenant Hierarchical System

```
National (Super Admin)
  ├── Provinces (1-7)
  │   └── Districts (75)
  │       └── Palikas (753)
  │           ├── Heritage Sites
  │           ├── Events
  │           ├── Businesses
  │           └── Blog Posts
```

Access control uses:
- **Role-Based Access Control (RBAC):** super_admin, palika_admin, district_admin, province_admin, content_moderator
- **Row-Level Security (RLS):** PostgreSQL policies enforced on all tables
- **Admin Regions Table:** Maps users to their assigned geographic regions with cascading access

### Key Architectural Pattern: RLS + Service Role

- **admin-panel & m-place:** Use anon key on client, server-side API endpoints use service role
- **platform-admin-panel:** Intentionally uses service role directly (internal-only dev tool)
- RLS policies prevent infinite recursion by using `user_has_access_to_palika()` function and admin_regions table
- All admin operations logged to audit_log table via triggers

### Database Layer

**Supabase PostgreSQL** with:
- 40+ migrations implementing tables, RLS policies, functions, and triggers
- Subscription tier system (Basic, Tourism, Premium) enabling/disabling features
- Audit trail for all data modifications
- Feature gating based on palika tier assignment

## Build, Lint, and Test Commands

### admin-panel (Content Management - Next.js)

```bash
cd admin-panel

# Development
npm run dev                    # Start dev server (http://localhost:3000)

# Building
npm run build                  # Build for production
npm run start                  # Start production server

# Linting
npm lint                       # Run ESLint

# Testing
npm run test                   # Run all tests (vitest run)
npm run test:unit             # Run unit tests only
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report
npm run test:integration      # Run integration tests (requires DB)
```

**Test Configuration:** vitest.config.ts runs tests sequentially with 5-minute timeout for integration tests.

### platform-admin-panel (Dev Admin - Next.js)

```bash
cd platform-admin-panel

# Development
npm run dev                    # Start dev server (http://localhost:3000)

# Building
npm run build                  # Build for production
npm run start                  # Start production server

# Linting
npm lint                       # Run ESLint
```

### m-place (Marketplace - Vite+React)

```bash
cd m-place

# Development
npm run dev                    # Start Vite dev server (http://localhost:5173)

# Building
npm run build                  # Build for production
npm run build:dev            # Build with development mode settings

# Linting
npm run lint                   # Run ESLint

# Preview
npm run preview               # Preview production build locally
```

### database (Seeding & Migrations)

```bash
cd database

# Seeding
npm run seed                   # Run base infrastructure seeding
npm run seed:content           # Seed sample content
npm run seed:all              # Run seed + seed:content
npm run setup:auth-admin      # Create Supabase Auth admin users
npm run setup:complete        # Full setup (seed + auth)

# Management
npm run check-status          # Check database setup status
npm run test-all              # Run all verification tests
```

## Environment Setup

### Required Environment Variables

**All projects** need `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**admin-panel** additionally needs:
```bash
ADMIN_SESSION_SECRET=[random-32-char-string]
```

**platform-admin-panel** additionally needs:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Steps

1. **Database:** Run migrations and seeding
   ```bash
   cd database
   npm run setup:complete
   ```

2. **admin-panel:** Install and start
   ```bash
   cd admin-panel
   npm install
   npm run dev
   ```

3. **platform-admin-panel:** Install and start (separate terminal)
   ```bash
   cd platform-admin-panel
   npm install
   npm run dev
   ```

## Testing Patterns

### admin-panel Test Structure

Located in `services/__tests__/`:

- **properties/** - Property-based tests using fast-check (for RLS enforcement)
- **unit/** - Unit tests for individual services
- **integration/** - Integration tests hitting real Supabase database
- **business-concerns/** - Domain-specific test scenarios
- **setup/** - Test helpers and fixtures

### Running Specific Tests

```bash
# Run single test file
npm test -- heritage-sites.service.test.ts

# Run tests matching pattern
npm test -- --grep "RLS"

# Run with coverage
npm run test:coverage
```

### Key Test Patterns

1. **RLS Enforcement Tests** - Use property-based testing to verify policies work correctly
2. **Integration Tests** - Use real database, run sequentially, clean up after each test
3. **Test Helpers** - Located in `services/__tests__/setup/` for fixtures and utilities

## Database Migrations

Migrations live in `supabase/migrations/`:

- **001-010:** Core infrastructure (tables, auth, roles)
- **011-020:** Business registration and approval workflows
- **021-040:** RLS policies and function fixes
- Migration format: `[timestamp]_[description].sql`

### Running Migrations

Migrations auto-apply via Supabase CLI, but can also be applied manually:

```bash
cd database
# Apply specific migration via custom script
npm run apply-migration -- [timestamp]_[description]
```

## Key Concepts & Gotchas

### 1. Admin Regions Table (Critical for RLS)

All admin access control routes through `admin_regions`:
```sql
- admin_id: references admin_users
- palika_id: NULL for super_admin/national
- district_id: assigned for district+ admins
- province_id: assigned for province+ admins
```

**Why:** RLS policies check this table to determine admin access. Direct column checks (e.g., `admin_users.palika_id`) were shortcuts that bypassed proper hierarchy.

### 2. RLS Policy Recursion

⚠️ **Common Issue:** Complex RLS policies that query normalized tables can cause infinite recursion.

**Solution:** Use security-definer functions that explicitly state access logic:
- `user_has_access_to_palika(user_id, palika_id)` - Returns boolean for read access
- `user_manages_admin(user_id, admin_id)` - Returns boolean for admin region access
- Avoid `LEFT JOIN` in policies; use `EXISTS` subqueries instead

### 3. Audit Logging

All data modifications are logged via PostgreSQL triggers:
- Table: `audit_log` (id, admin_id, action, entity_type, entity_id, changes, created_at)
- Triggers auto-fire on INSERT/UPDATE/DELETE
- `changes` column stores JSON diff of old vs new values

### 4. Subscription Tiers

Feature enablement is tied to palika tier (`palikas.subscription_tier`):
- **Basic:** Core heritage site/event listing
- **Tourism:** +Business registration, approval workflows, messaging
- **Premium:** +Advanced analytics, bulk operations, API access

Query example: Only Tourism+ palikas can create businesses
```sql
SELECT * FROM palikas WHERE subscription_tier >= 'Tourism'
```

### 5. Service Role vs Anon Key

- **Anon Key:** Client-side, respects RLS policies
- **Service Role:** Server-side only, bypasses RLS (used for admin panels to avoid policy recursion)
- **Never commit service role key** - store in .env.local only

## Code Organization

### admin-panel Structure

```
app/
  api/              # API routes (server-side with service role)
  dashboard/        # Admin dashboard
  heritage-sites/   # Content management UI
  login/            # Auth pages
components/         # React components
lib/
  supabase.ts      # Client initialization
  auth.ts          # Auth helpers
services/          # Business logic, DB queries
  __tests__/       # Test suites
```

### platform-admin-panel Structure

```
src/
  app/              # Pages (admins, roles, permissions, etc.)
  components/       # Reusable UI components
  lib/
    supabase.ts    # Service role client (server-side only)
    auth.ts        # Auth helpers
  hooks/           # React hooks
  types/           # TypeScript types
```

### m-place Structure

```
src/
  pages/           # Main routes
  components/      # Reusable UI (shadcn-based)
  lib/             # Utilities and helpers
  hooks/           # React hooks
  services/        # API calls
```

## Important Files to Know

- **BUSINESS_MODEL.md** - Business model and tier definitions
- **docs/03-architecture/** - Technical specifications
- **database/docs/** - Schema documentation
- **admin-panel/services/__tests__/README.md** - Test documentation
- **MEMORY.md** in `.claude/` - Session notes (RLS fixes, test progress)

## Common Development Tasks

### Adding a New Content Type

1. Create migration: `supabase/migrations/[ts]_add_[type].sql`
   - Create table with required fields
   - Add RLS policies (use existing patterns)
   - Add audit trigger

2. Create service in `admin-panel/services/[type].service.ts`
   - CRUD operations using supabase-js
   - Handle RLS-safe queries

3. Add API route in `admin-panel/app/api/[type]/route.ts`
   - POST for create, GET for list, PUT for update, DELETE

4. Add tests in `admin-panel/services/__tests__/`
   - Unit tests for service logic
   - RLS property tests for policy enforcement

### Debugging RLS Issues

1. Check if admin_regions table has correct mappings
   ```bash
   cd database && npm run check-status
   ```

2. Verify RLS policies exist (see migration files)

3. Use RLS debug functions (if available):
   ```sql
   SELECT user_has_access_to_palika(current_user_id(), palika_id)
   ```

4. Review audit_log for what was attempted:
   ```sql
   SELECT * FROM audit_log WHERE created_at > now() - interval '1 hour'
   ```

5. Check test output in `admin-panel/services/__tests__/properties/` for policy traces

### Running Integration Tests Against Real DB

```bash
cd admin-panel
npm run test:integration        # Runs all tests/**/*.test.ts files
```

Tests clean up after themselves but **do not reset the database**. For full reset:
```bash
cd database
npm run setup:complete
```

## Current Known Issues & Workarounds

Check `MEMORY.md` in `.claude/` for recent session notes, including:
- RLS shortcut policies that were deprecated
- Test pass rates and remaining failures
- Recent fixes applied to migrations

## Notes for Future Sessions

- Always run `npm run test` in admin-panel after RLS changes
- Database seeding is idempotent - safe to run multiple times
- Service role operations bypass RLS but are still logged in audit_log
- For production: migrate to token-based API keys instead of service role

## Quick Links

- Supabase Dashboard: https://app.supabase.com/
- TypeScript Errors: Check `tsconfig.json` in each project
- Feature Documentation: See `docs/` folder

---

## Setup Verification & Automation

### Setup Strategy

The setup process follows this sequence:

```
1. Supabase Installation Check
   ├─ Check if supabase CLI is installed
   ├─ Check if supabase is running
   └─ If not running: install and start

2. Database Reset
   ├─ Run: supabase db reset
   └─ Result: Clean database with all 34 migrations applied

3. Infrastructure Seeding (Layer 1)
   ├─ Palikas (753 geographic units)
   ├─ Categories (heritage, events, businesses, etc.)
   ├─ Subscription Tiers (Basic, Tourism, Premium)
   ├─ RLS Policies & Functions
   └─ Platform Admins (super_admin users)

4. Palika Tier Assignment (Layer 2)
   ├─ Assign subscription tiers to palikas
   └─ Enable/disable features based on tier

5. Palika Admin Creation (Layer 3)
   ├─ Create admin users for each palika
   ├─ Assign roles (palika_admin, district_admin, province_admin)
   └─ Map to geographic regions

6. User Seeding (Layer 4)
   ├─ Create regular users
   ├─ Assign to palikas
   └─ Create business profiles

7. Marketplace Products (Layer 5)
   ├─ Seed products to businesses
   ├─ Assign categories and pricing
   └─ Set availability by tier
```

### Verification Script

See: `verify-setup.sh` - Confirms current state matches roadmap

**What it checks:**
- ✅ Supabase CLI installed and running
- ✅ Database migrations applied (34 total)
- ✅ RLS policies active
- ✅ Infrastructure seeded (palikas, categories, tiers)
- ✅ Platform admins created
- ✅ Test data present
- ✅ All services operational

**Usage:**
```bash
./verify-setup.sh
```

**Output:** Clear status report showing what's complete and what needs attention

### Setup Script

See: `setup.sh` - Orchestrates full setup process

**What it does:**
1. Checks Supabase installation
2. Starts Supabase if not running
3. Resets database (clean state)
4. Applies all migrations
5. Seeds infrastructure
6. Seeds admins
7. Runs verification

**Usage:**
```bash
./setup.sh
```

### Seeding Layers

Each seeding layer is independent and can be run separately:

```bash
# Layer 1: Infrastructure (palikas, categories, tiers, RLS)
npm run seed:infrastructure

# Layer 2: Palika tier assignments
npm run seed:palika-tiers

# Layer 3: Palika admins
npm run seed:palika-admins

# Layer 4: Users and business profiles
npm run seed:users

# Layer 5: Marketplace products
npm run seed:products

# All layers
npm run seed:all
```

### Current Seeding Status

**Implemented:**
- ✅ Infrastructure seeding (palikas, categories, tiers, RLS, platform admins)
- ✅ Palika tier assignment
- ✅ Palika admin creation
- ✅ User seeding with business profiles
- ✅ Marketplace product seeding

**Excluded from Infrastructure Seed:**
- ❌ Palika tier assignment (separate layer)
- ❌ Palika admin creation (separate layer)
- ❌ User data (separate layer)
- ❌ Marketplace products (separate layer)

This separation allows:
- Clean database resets without losing all data
- Incremental seeding for development
- Testing individual layers
- Reproducible test scenarios

---

## Mindstate & Session Context

See: `mindstate.json` - Complete project state, phases, and session notes

**Key Metrics:**
- Database: 34 migrations, fully operational
- Tests: 466/468 passing (99.6%)
- Admin Panel: Complete CRUD, all endpoints working
- Git Analysis: Integrated with schedules repo pipeline

**Last Updated:** 2026-03-06 (Phase 4.2 Complete)  
**Next Phase:** Phase 5 - Setup Automation & Verification

---

## Session Notes & Memory

See: `.claude/MEMORY.md` - Recent session notes, RLS fixes, test progress

**Recent Work:**
- Fixed infinite recursion in admin detail page
- Added email addresses to admin listing
- Implemented support for all 3 admin hierarchy levels
- Fixed dashboard stats (0 admins issue)
- 99.6% test pass rate achieved

---

## Related Documentation

- **BUSINESS_MODEL.md** - Business model and tier definitions
- **docs/03-architecture/** - Technical specifications
- **database/docs/** - Schema documentation
- **admin-panel/services/__tests__/README.md** - Test documentation
- **DATA_PREPARATION_SUMMARY.md** - Data seeding details
- **SEEDING_STATUS.md** - Current seeding status
- **SESSION_7_COMPLETION_REPORT.md** - Latest session report
