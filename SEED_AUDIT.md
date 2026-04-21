# Seeding Infrastructure Audit — Production Readiness & Duplication Analysis

**Audit Date:** 2026-04-20
**Scope:** Next.js + Supabase seed orchestration
**Thoroughness:** Very thorough (multi-pass code analysis)

---

## ⚠️ Corrections (2026-04-20, post-review)

Two of the audit's headline recommendations are **WRONG** and must not be acted on:

1. **§3.1 + Fix #1 "Delete seed-database.ts" — REVERSED.**
   `database/scripts/seed-database.ts` contains **372 palikas across 33 districts** — the canonical infrastructure dataset for Nepal's local governments. `supabase/seed.sql` (12 palikas) was the stub, not the source of truth.

2. **Fix #6 "Delete seed-business-categories-direct.ts" — REVERSED.**
   `seed-business-categories-direct.ts` seeds the `business_categories` table (global); `seed-business-types.ts` seeds the `categories` table with `entity_type='business'` (per-palika). **Different tables, different data, both needed.**

## ✅ Deletions applied (2026-04-20)

Actually-duplicate / conflicting files were removed:

- **`supabase/seed.sql`** — deleted (12-palika stub, conflicted with `seed-database.ts`'s 372-palika canonical set)
- **`database/scripts/seed-subscription-tiers.ts`** — deleted (pure duplicate of `subscription-tiers.sql`)
- **`database/scripts/seed-marketplace-categories.ts`** — deleted (older do-everything superset; its coverage is split across `-direct.ts` + `seed-business-categories-direct.ts` + `subscription-tiers.sql`)

Orchestrators patched accordingly:
- `session-2026-03-21/run-seeds.sh` — prepends `seed-database.ts`; applies `subscription-tiers.sql` via `psql` with inline CROSS JOIN patch for the premium-tier block
- `setup-clean-db.sh` — same
- `database/scripts/enroll-palikas-tiers.ts` — error message updated to point at `subscription-tiers.sql`

Still-duplicated writers (not yet resolved): `roles`/`permissions` (migration 20250127000008 vs `seed-database.ts`), `categories` with `entity_type='business'` (`seed-database.ts` vs `seed-business-types.ts`). See [`production-readiness/05-known-issues.md`](./production-readiness/05-known-issues.md) #13.

All other findings in §§ 4, 5, 6 (SQL syntax bug, admin_regions not populated, hard-coded passwords, non-idempotency, missing env guards, FK validation, UUID generation, tier assignments) **remain valid**.

---

## 1. Inventory

| File | Purpose | Lines |
|------|---------|-------|
| `supabase/seed.sql` | Geographic base: 6 provinces, 6 districts, 12 palikas with codes `KTM001`, `BHK001`, `RAJ001` | 55 |
| `supabase/seeds/subscription-tiers.sql` | Tiers (basic/tourism/premium), features (28), tier-feature mappings | 99 |
| `supabase/seeds/seed_service_providers.sql` | Dev data: 8 ambulance/fire/police/rescue providers for first active palika | 92 |
| `supabase/seeds/seed_sos_requests.sql` | Dev data: 6 SOS request scenarios (pending/reviewing/resolved/cancelled) | 96 |
| `supabase/migrations/20250127000008_seed_permissions_and_role_permissions.sql` | Seed: 12 permissions, role-permission mappings (6 roles) | 74 |
| `database/scripts/seed-database.ts` | 77 districts + 753 palikas with codes `D28-MT01`, `D26-M01` etc.; complete reference dataset | 1000+ |
| `database/scripts/seed-subscription-tiers.ts` | Duplicate: seed 3 tiers + 24 features + tier-feature maps (mirrors `.sql`) | 245 |
| `database/scripts/seed-admin-users.ts` | Seed: 5 admin users (super_admin, 2x kathmandu, 2x bhaktapur) with hardcoded passwords | 162 |
| `database/scripts/seed-business-types.ts` | Seed: 8 business types per palika (accommodation, food, etc.) | 129 |
| `database/scripts/seed-business-categories-direct.ts` | Duplicate: 8 business categories to global table (not per-palika) | 99 |
| `database/scripts/seed-marketplace-categories-direct.ts` | Seed: 26 marketplace categories (tier 1-3) to global table | 247 |
| `database/scripts/seed-marketplace-proper.ts` | Seed: 8 test users + 8 test businesses + comments | 400+ |
| `database/scripts/seed-marketplace-test-data.ts` | Seed: Test users/businesses/products with non-UUID IDs (date-based) | 150+ |
| `database/scripts/enroll-palikas-tiers.ts` | Seed: Assign tiers to palika 1-4 only | 100+ |
| `database/scripts/seed-content.ts` | Seed: Heritage sites, events, blog posts (sample content) | 200+ |
| `database/scripts/seed-bhaktapur-users.ts` | Seed: Bhaktapur-specific test users | 150+ |
| `database/scripts/setup-supabase-auth.ts` | Setup: Supabase auth initialization | 80+ |
| `database/scripts/setup-complete.ts` | Orchestrator: Run multiple seed scripts in sequence | 100+ |
| `database/scripts/seed-complete-flow.ts` | Orchestrator: Standalone complete flow script | 100+ |
| `setup-clean-db.sh` | Top-level orchestrator: reset DB → install deps → run seeds → verify | 200 |
| `session-2026-03-21/run-seeds.sh` | Orchestrator: runs 8 TS seed scripts in strict order | 146 |
| `session-2026-03-21/setup.sh` | Orchestrator: checks Supabase, resets DB, seeds, verifies | 180 |

---

## 2. Duplicates — Same Data Written Multiple Places

### 2.1 Subscription Tiers & Features

**Concept:** Subscription tier definitions (basic/tourism/premium) + 24 feature codes  
**Files Involved:**
- `supabase/seeds/subscription-tiers.sql` (lines 2–98)
- `database/scripts/seed-subscription-tiers.ts` (lines 23–212)

**Content Match:** Identical tiers and feature lists (name, display_name, cost_per_year, description all match)

**Execution Order (from `run-seeds.sh`):**
1. Line 96: `seed-subscription-tiers.ts` runs first
2. Line 2: `subscription-tiers.sql` runs automatically on `supabase db reset`

**Which Wins:** The SQL seed runs first during `db reset`, then the TS script runs afterward using `upsert` on conflict `name`. Both use `ON CONFLICT`, so they safely idempotent-overwrite.

**Status:** Safe but redundant. The TS script is unnecessary since `supabase db reset` applies all seeds.

**Recommendation:** Delete `database/scripts/seed-subscription-tiers.ts`. Let `supabase/seeds/subscription-tiers.sql` be the single source of truth. If TS-side feature mapping is needed post-reset, handle it in a separate script that only does mappings.

---

### 2.2 Business Categories

**Concept:** Business category definitions (accommodation, food, producer, etc.)  
**Files Involved:**
- `database/scripts/seed-business-types.ts` (lines 36–93)
- `database/scripts/seed-business-categories-direct.ts` (lines 21–78)

**Content Match:** Identical 8 categories (name_en, name_ne, slug, description, display_order all match)

**Execution Order (from `run-seeds.sh`):**
1. Line 97: `seed-business-types.ts` runs 2nd
2. Line 98: `seed-business-categories-direct.ts` runs 3rd

**Key Difference:**
- `seed-business-types.ts`: Inserts per-palika (lines 95–116: loops over all palikas, inserts to `categories` table)
- `seed-business-categories-direct.ts`: Inserts once globally to `business_categories` table (different table!)

**Schema Issue:** The code references two different tables: `categories` (per-palika) vs `business_categories` (global). This is a schema mismatch—**the real schema has only `categories` with `palika_id` FK**, per the known facts.

**Which Wins:** `seed-business-types.ts` because it inserts per-palika (correct). `seed-business-categories-direct.ts` writes to a non-existent table and likely fails silently on constraint error.

**Recommendation:** Delete `database/scripts/seed-business-categories-direct.ts`. Keep only `seed-business-types.ts`, which aligns with the real schema (categories per palika).

---

### 2.3 Marketplace Categories (Tier-Gated)

**Concept:** 26 product marketplace categories split across 3 feature tiers  
**Files Involved:**
- `database/scripts/seed-marketplace-categories-direct.ts` (lines 22–213)

**Status:** Single source. No duplication detected.

**Recommendation:** Confirm this data structure is correct and that `marketplace_categories` table schema matches expected columns (name_en, name_ne, slug, min_tier_level, display_order).

---

## 3. Conflicts — Different Data for Same Concept

### 3.1 Geographic Hierarchy: Palika Code Systems

**Concept:** Palika (local government unit) codes and datasets  
**Conflict Files:**
- `supabase/seed.sql` (lines 29–54): 12 palikas with codes `KTM001`, `BHK001`, `RAJ001` (simple 3-char suffix)
- `database/scripts/seed-database.ts` (lines 232–1000+): 753 palikas with codes `D28-MT01`, `D26-M01`, `D27-M01` (district-meter format)

**Data Divergence:**

| Dimension | seed.sql | seed-database.ts |
|-----------|----------|------------------|
| Palikas | 12 (6 districts × 2) | 753 (all Nepal) |
| Code Format | 3-digit (RAJ001) | District-Type (D28-MT01) |
| Districts | 6 (SAPTARI, SUNSARI, KATHMND, BHKTPUR, LALITPU) | 77 (all Nepal) |
| Provinces | 6 (not Nepal's 7) | N/A in seed-database |
| Use Case | Local dev/testing | Complete reference data |

**Critical Issue:** These **cannot coexist** on the same database reset without one overwriting the other:
- `supabase db reset` inserts `seed.sql` palikas with codes `KTM001`, `BHK001`
- If `seed-database.ts` ran afterward, it would insert `D28-MT01` (Kathmandu) with different ID, creating duplicate geographic units

**Which Wins:** `supabase/seed.sql` wins on fresh `db reset`. The TS script in `seed-database.ts` is never called by `run-seeds.sh`, so it doesn't run. The TS script is **dormant/unused**.

**Known Workaround:** Per the known facts, `seed-admin-users.ts` (lines 27, 42) queries for `'KTM001'` and `'BHK001'`, confirming it expects `seed.sql`'s dataset. The file contains a patched comment acknowledging the earlier hard-coded `D28-MT01` and `D26-M01` references were changed to `KTM001` and `BHK001`.

**Recommendation:**
- **Delete `database/scripts/seed-database.ts`** entirely (unused, conflicting)
- **Keep `supabase/seed.sql`** as the canonical geographic seed
- If full-Nepal 753-palika seeding is needed for production, move that data into a proper migration (e.g., `supabase/migrations/20250420_seed_all_palikas.sql`) and track it in version control

---

## 4. Correctness Bugs

### 4.1 SQL Syntax Error in `subscription-tiers.sql`

**File:** `supabase/seeds/subscription-tiers.sql`, line 96  
**Issue:** Malformed JOIN clause without ON condition

```sql
-- BROKEN (line 93-98):
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT t.id, f.id, true
FROM public.subscription_tiers t
JOIN public.features f                    -- <-- JOIN without ON clause
WHERE t.name = 'premium'
```

**Error:** PostgreSQL will reject this: `CROSS JOIN` or `INNER JOIN` requires `ON` or implicit cross-product. This is invalid syntax.

**Fix:**
```sql
JOIN public.features f ON TRUE  -- Allow all feature-tier combinations
-- or
CROSS JOIN public.features f
```

**Impact:** Premium tier feature mapping will fail silently or error on `supabase db reset`.

**Recommendation:** Correct line 96 to `CROSS JOIN` (line 96). Both basic and tourism tiers use `JOIN` correctly because they have explicit feature code lists in the ON clause.

---

### 4.2 Hard-Coded Passwords in Seed Scripts

**Files:**
- `database/scripts/seed-admin-users.ts` (lines 53, 60, 67, 74, 81)
- `database/scripts/seed-bhaktapur-users.ts` (line 55)
- `database/scripts/seed-marketplace-proper.ts` (line 58)

**Issue:** Plain-text test passwords embedded in source code:
```typescript
password: 'SuperSecurePass123!',
password: 'KathmanduAdmin456!',
password: 'ModeratorSecure789!',
password: 'TestPass@123',
```

**Risk:** If this codebase is committed to a shared repo, these credentials leak. Even if intent is dev-only, storing passwords in seed scripts violates principle of least privilege.

**Status:** Marked as dev-only test data (intentional), but still a security smell. Better approach:
- Generate random passwords server-side, return in logs only
- Use environment variables for prod passwords
- Warn users to change passwords after seeding

**Recommendation:** Wrap password generation in a function that either reads from env or generates a random string. Log credentials to secure location only, not stdout.

---

### 4.3 Missing ON CONFLICT Clauses (Non-Idempotent Seeds)

**Files:** Multiple TS scripts lack idempotency guards:
- `database/scripts/seed-business-types.ts` (line 104): Uses `.insert()`, not `.upsert()`. Fails on re-run if data exists.
  - Line 110: Catches error code 23505 (duplicate key) and ignores—this is a workaround, not proper idempotency.
- `database/scripts/seed-marketplace-proper.ts`: Uses `.insert()` without conflict handling.
- `database/scripts/seed-marketplace-test-data.ts`: Uses `.insert()`.

**Issue:** These scripts cannot be re-run cleanly without manually deleting data first. Production seeding requires idempotency.

**Recommendation:** Replace `.insert()` with `.upsert(data, { onConflict: 'id' })` or equivalent. Alternatively, wrap in transactions with `BEGIN; DELETE...; INSERT...; COMMIT;`.

---

### 4.4 Transaction Safety

**SQL Seeds (Good):**
- `seed_service_providers.sql` (line 13): Wraps in `BEGIN ... END $$` (PL/pgSQL block)
- `seed_sos_requests.sql` (line 12): Same pattern

**TS Seeds (Weak):**
- No explicit transaction handling in any TS script
- Supabase.js client sends individual queries; if one fails mid-seed, partial state remains

**Recommendation:** For critical seeds (tiers, palikas), wrap in Supabase RPC calls that execute SQL transactions server-side. Or use TypeScript `Promise.all()` with rollback on failure (complex; SQL is better).

---

### 4.5 Hard-Coded Palika IDs in Enrollment Script

**File:** `database/scripts/enroll-palikas-tiers.ts`, lines 50–80

**Issue:** Script hard-codes palika IDs 1–4:
```typescript
.eq('id', 1)  // Assumes palika 1 exists
.eq('id', 2)  // Assumes palika 2 exists
// etc.
```

**Risk:** If `supabase db reset` changes palika ID assignment (unlikely but possible), or if palikas are deleted/recreated, these IDs become stale.

**Recommendation:** Query palikas by code instead:
```typescript
.eq('code', 'KTM001')  // Reference by code, not ID
```

---

### 4.6 Non-UUID User IDs in Test Data Scripts

**File:** `database/scripts/seed-marketplace-test-data.ts`, line 52

**Issue:** Test user IDs are constructed as:
```typescript
id: 'user-1a-' + Date.now(),  // String like "user-1a-1713607200000"
```

**Risk:** These are not valid UUIDs. If the users table schema requires UUID primary key, these inserts will fail. Also, storing timestamps in IDs is a data smell.

**Recommendation:** Use `crypto.randomUUID()` (already imported, line 4):
```typescript
id: randomUUID(),
```

---

### 4.7 Missing Foreign Key Validation

**Pattern:** None of the TS seed scripts validate that referenced IDs exist before inserting:
- `seed-business-types.ts` (line 99): Inserts `palika_id` without checking if palika exists
- `seed-marketplace-proper.ts`: References `palika_id`, `tier_level` without validation

**Risk:** Silent failures or orphaned records if referenced data hasn't been seeded yet.

**Recommendation:** Add pre-flight checks:
```typescript
const { data: palikas } = await supabaseAdmin.from('palikas').select('id');
if (!palikas || palikas.length === 0) {
  throw new Error('No palikas found. Run geographic seeding first.');
}
```

---

## 5. Gaps — Features Not Seeded

### 5.1 Admin Regions Table

**Table:** `admin_regions` (maps admins to geographic regions)  
**Status:** Per known facts, this table exists and is critical for RLS. **Not seeded by any script**.

**Risk:** `seed-admin-users.ts` creates admin_users but doesn't populate `admin_regions`. Without admin_regions entries, RLS policies that check `user_has_access_to_palika()` will reject admin access.

**Recommendation:** Add post-user-creation step in `seed-admin-users.ts` to insert admin_regions records:
```typescript
// After creating admin user:
await supabaseAdmin
  .from('admin_regions')
  .insert({
    admin_id: userId,
    palika_id: user.palika_id,  // or district_id/province_id for hierarchy
    region_type: 'palika',
  })
```

---

### 5.2 Approval Workflows

**Feature:** Content approval workflows (mentioned in permissions seed, line 52)  
**Status:** No seed data for `approval_workflows` table. Only permissions reference exists.

**Risk:** Palikas cannot define approval workflows (feature mentioned as "approval_workflows" but no table seeding).

**Recommendation:** Either seed sample workflows, or document that palikas must create these post-deployment.

---

### 5.3 Subscription Tier Assignment Across All Palikas

**File:** `database/scripts/enroll-palikas-tiers.ts`  
**Status:** Only assigns tiers to palikas 1–4. With `seed.sql`'s 12 palikas, 8 are left unassigned.

**Risk:** Palikas 5–12 have no subscription tier, breaking feature gating logic.

**Recommendation:** Extend script to enumerate all palikas and assign tiers (e.g., all → basic tier by default, then selectively promote some).

---

### 5.4 Permissions & Role Permissions Completeness

**File:** `supabase/migrations/20250127000008_seed_permissions_and_role_permissions.sql`  
**Status:** Seeds 12 permissions across 6 roles. All major roles covered (super_admin → all; palika_admin → content; etc.).

**Gap:** No check that all roles exist before inserting role_permissions. If a role is missing, the insert silently succeeds (due to `ON CONFLICT DO NOTHING`).

**Recommendation:** Add validation in migration:
```sql
-- Validate roles exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin') THEN
    RAISE EXCEPTION 'Role super_admin not found';
  END IF;
END $$;
```

---

## 6. Production-Readiness Concerns

### 6.1 Environment Awareness

**Risk:** None of the seed scripts check `NODE_ENV` or similar to prevent accidental production seeding.

**Current Guard:** None. A developer with production credentials could accidentally seed test data to prod.

**Recommendation:** Add checks:
```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot seed in production. Use backup restore instead.');
  process.exit(1);
}
```

---

### 6.2 Secret Handling

**Status:** Passwords hard-coded, but credentials are marked "test-only." Not ideal for CI/CD.

**Risk:** If seeds are run in CI without `.env` file, they fail or use fallback insecure values.

**Recommendation:** Load from environment:
```typescript
const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'GeneratedRandomPass123!';
```

---

### 6.3 Idempotency

**Current State:** Mixed. SQL seeds use `ON CONFLICT`, TS scripts don't (mostly).

**Production Impact:** Scaling, disaster recovery, and re-deployment require idempotent seeds. Current setup is fragile.

**Recommendation:** Audit all TS scripts and add conflict handling.

---

### 6.4 Logging & Observability

**Status:** Good—all scripts use console.log with emoji indicators (✓, ✗, ℹ). Output is human-readable.

**Gap:** No structured logging (JSON), no log levels, no aggregation for monitoring.

**Recommendation:** For production, integrate with logging service (e.g., Winston, Pino).

---

### 6.5 Test Data Leaking into Prod Seeds

**Files:**
- `seed-marketplace-proper.ts`: Creates 8 test users with hardcoded emails (ramesh.sharma@test.com, etc.)
- `seed-marketplace-test-data.ts`: Same test users
- `seed-bhaktapur-users.ts`: Bhaktapur-specific test users

**Risk:** If prod accidentally runs these, test accounts pollute the database.

**Recommendation:** Move all test data to a separate `seed-dev-test-data.sh` that is NOT called in production setup. Or gate behind `NODE_ENV === 'development'`.

---

### 6.6 Dangerous Patterns

**Checked:**
- ❌ No `--drop-all` flags in scripts
- ❌ No destructive `TRUNCATE` without explicit confirmation
- ✓ Shell scripts use `set -e` (exit on error) where appropriate

**Status:** Safe. No dangerous patterns detected.

---

## 7. Prioritized Fix List (Most to Least Critical)

### 1. **Delete conflicting/unused seed-database.ts** [CRITICAL]
   - **What:** Remove `database/scripts/seed-database.ts` (753-palika dataset conflicts with seed.sql's 12-palika dataset)
   - **Why:** Prevents production accidents; unused by run-seeds.sh
   - **Min Fix:** Delete file; update .gitignore if needed
   - **Effort:** S (1 file delete)
   - **Blocks Prod:** Yes—ambiguity on which palika dataset is canonical

### 2. **Fix SQL syntax error in subscription-tiers.sql** [CRITICAL]
   - **What:** Change line 96 from `JOIN` to `CROSS JOIN` (missing ON clause for premium tier features)
   - **Why:** Premium tier feature mapping fails silently on db reset
   - **Min Fix:** One line change: `JOIN` → `CROSS JOIN`
   - **Effort:** S (1 line)
   - **Blocks Prod:** Yes—premium tier incomplete

### 3. **Seed admin_regions for admin users** [HIGH]
   - **What:** Update `seed-admin-users.ts` to insert `admin_regions` entries after creating admin_users
   - **Why:** Admin RLS policies require admin_regions entries; without them, admins have no access
   - **Min Fix:** Add upsert to admin_regions table with admin_id, palika_id, region_type
   - **Effort:** M (10 lines)
   - **Blocks Prod:** Yes—admins cannot access their assigned palikas without admin_regions

### 4. **Add environment guard to prevent prod seeding** [HIGH]
   - **What:** Add `if (NODE_ENV === 'production') throw` check to all TS seed scripts
   - **Why:** Prevents test data from accidentally being seeded to production
   - **Min Fix:** Add guard at start of each script's main function
   - **Effort:** M (5 lines × 10 scripts)
   - **Blocks Prod:** No, but essential for safety

### 5. **Make business category seeds idempotent** [HIGH]
   - **What:** Replace `.insert()` with `.upsert(data, { onConflict: 'id' })` in `seed-business-types.ts`, `seed-marketplace-proper.ts`, etc.
   - **Why:** Enables re-running seeds without data deletion
   - **Min Fix:** Change insert → upsert in 5+ scripts
   - **Effort:** M (1 line × 5 scripts)
   - **Blocks Prod:** No, but needed for operational repeatability

### 6. **Delete duplicate seed-business-categories-direct.ts** [MEDIUM]
   - **What:** Remove unused script that references non-existent `business_categories` table
   - **Why:** Reduces confusion, cleans up codebase
   - **Min Fix:** Delete file
   - **Effort:** S (1 file delete)
   - **Blocks Prod:** No—script is unused

### 7. **Delete duplicate seed-subscription-tiers.ts** [MEDIUM]
   - **What:** Remove TS script that mirrors `supabase/seeds/subscription-tiers.sql`
   - **Why:** Reduces duplication; SQL is single source of truth
   - **Min Fix:** Delete file
   - **Effort:** S (1 file delete)
   - **Blocks Prod:** No—both scripts are idempotent and complementary

### 8. **Add FK validation to TS seed scripts** [MEDIUM]
   - **What:** Add pre-flight checks for referenced IDs (palika_id, category_id, etc.) before inserting
   - **Why:** Prevents orphaned records; fails fast if dependencies missing
   - **Min Fix:** Add `.select()` checks with error handling
   - **Effort:** M (10 lines × 3 scripts)
   - **Blocks Prod:** No, but improves reliability

### 9. **Fix hard-coded palika IDs in enroll-palikas-tiers.ts** [MEDIUM]
   - **What:** Replace `eq('id', 1)` with `eq('code', 'KTM001')` queries
   - **Why:** Resilient to ID changes; aligns with seed.sql's code-based references
   - **Min Fix:** Replace 4 hardcoded queries with code-based lookups
   - **Effort:** M (15 lines)
   - **Blocks Prod:** No, but improves maintainability

### 10. **Separate test data from infrastructure seeds** [MEDIUM]
   - **What:** Move `seed-marketplace-proper.ts`, `seed-marketplace-test-data.ts`, `seed-bhaktapur-users.ts` to separate `dev-only/` folder; gate behind `NODE_ENV`
   - **Why:** Prevents test data from shipping to production
   - **Min Fix:** Create dev-only folder, move files, add env checks
   - **Effort:** M (move files, add guards)
   - **Blocks Prod:** No, but essential for safety

### 11. **Fix UUID generation in test data** [LOW]
   - **What:** Replace `'user-' + Date.now()` with `randomUUID()` in seed-marketplace-test-data.ts
   - **Why:** Correct data type; prevents schema validation errors
   - **Min Fix:** Change ID generation in 2 places
   - **Effort:** S (2 lines)
   - **Blocks Prod:** Maybe—depends on schema; low priority

### 12. **Complete palika tier assignments** [LOW]
   - **What:** Extend `enroll-palikas-tiers.ts` to assign tiers to all 12 palikas (currently only 1–4)
   - **Why:** All palikas should have a tier assignment
   - **Min Fix:** Add loop over all palikas, default to 'basic' tier
   - **Effort:** M (20 lines)
   - **Blocks Prod:** No, but needed for feature gating to work across all palikas

---

## 8. Recommended Single Source of Truth Architecture

### Current State
- SQL seeds in `supabase/seeds/` (auto-run on reset)
- TS scripts in `database/scripts/` (manual, ordered execution via shell scripts)
- Multiple orchestrators (`setup-clean-db.sh`, `run-seeds.sh`, `setup.sh`)
- Duplicates and conflicts

### Proposed State

```
supabase/
├── migrations/
│   ├── [existing migrations]
│   ├── 20250420_001_seed_geographic_base.sql         (MOVE FROM seed.sql)
│   ├── 20250420_002_seed_subscription_tiers.sql      (MOVE FROM seeds/subscription-tiers.sql)
│   ├── 20250420_003_seed_permissions_and_roles.sql   (MOVE migration 20250127000008)
│   └── 20250420_004_seed_categories.sql              (NEW: merge business + marketplace)
│
├── seeds/                                            (DEPRECATED)
│   └── [empty or removed]
│
database/scripts/
├── seed-database.ts                                  (DELETE - conflicts with geographic seed)
├── seed-subscription-tiers.ts                        (DELETE - duplicate of SQL migration)
├── seed-business-categories-direct.ts                (DELETE - references non-existent table)
│
├── [core infrastructure - idempotent]
├── seed-admin-users.ts                               (ENHANCE: add admin_regions seeding)
├── seed-business-types.ts                            (FIX: make idempotent, add FK checks)
├── seed-marketplace-categories-direct.ts             (KEEP)
│
├── [test data - gated by NODE_ENV]
└── dev-only/
    ├── seed-marketplace-proper.ts
    ├── seed-marketplace-test-data.ts
    ├── seed-bhaktapur-users.ts
    └── seed-content.ts
│
└── orchestrators/
    ├── prod-setup.sh                                 (runs migrations only; no TS scripts)
    └── dev-setup.sh                                  (runs migrations + dev TS scripts)
```

### Key Changes

1. **SQL Migration as Source of Truth:**
   - Move all infrastructure seeding to migrations (`supabase/migrations/`)
   - Migrations are versioned, immutable, tracked in git
   - Running `supabase db reset` is sufficient for base setup
   - TS scripts become optional, post-migration enhancements only

2. **Delete Duplicates:**
   - Remove `seed-database.ts`, `seed-subscription-tiers.ts`, `seed-business-categories-direct.ts`
   - One dataset = one canonical location

3. **Reorganize TS Scripts by Purpose:**
   - **Core Infrastructure:** seed-admin-users, seed-business-types (must run)
   - **Test Data:** marketplace-proper, marketplace-test-data, bhaktapur-users (dev-only)
   - Gate test scripts with `NODE_ENV === 'development'` check

4. **Two Orchestrators:**
   - **`prod-setup.sh`:** `supabase db reset` only (migrations handle all seeding)
   - **`dev-setup.sh`:** `db reset` + TS scripts + test data

5. **Documentation:**
   - Create `DATABASE_SEEDING.md` with layer definitions
   - Explain why each script exists, when it runs, what it guarantees
   - Examples of adding new seed data

---

## Summary & Recommendations

| Issue | Severity | Action | Effort |
|-------|----------|--------|--------|
| Conflicting palika datasets | 🔴 Critical | Delete seed-database.ts | S |
| SQL syntax error (premium tier) | 🔴 Critical | Fix JOIN → CROSS JOIN | S |
| Missing admin_regions seeding | 🔴 Critical | Add admin_regions insert | M |
| Test data in prod seeds | 🟠 High | Move to dev-only/ with env guard | M |
| Non-idempotent TS seeds | 🟠 High | Add upsert logic | M |
| Unused/duplicate scripts | 🟡 Medium | Delete 3 files | S |
| Hard-coded IDs/passwords | 🟡 Medium | Use code-based lookups, env vars | M |
| No FK validation | 🟡 Medium | Add pre-flight checks | M |
| Incomplete palika tiers | 🟡 Medium | Enumerate all palikas | M |
| No prod environment guard | 🟡 Medium | Add NODE_ENV check | M |

**Blocking Production Deploy:** Items 1–3 (conflicts, syntax error, admin_regions)

**Total Estimated Effort:** 1–2 days for full remediation (4–5 hours critical path)

