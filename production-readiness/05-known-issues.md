# Known Issues & Production Blockers

Bugs, mismatches, and gaps that must be resolved before production deploy. Ordered most-critical-first.

Cross-reference: [SEED_AUDIT.md](../SEED_AUDIT.md) has the raw audit (with a correction note at the top — two of its original recommendations were wrong).

## P0 — Blocks production deploy

### 1. Hard-coded service-role key in `.env.local`
- **Where:** every app's `.env.local` (platform-admin-panel, admin-panel, `database/.env`)
- **Risk:** full DB access leaks if repo is cloned / pushed. Committed right now.
- **Fix:** move to a real secrets manager (Vercel env, Doppler, AWS Secrets Manager); remove from repo; rotate the key.

### 2. No access control at deploy boundary for platform-admin-panel
- **Where:** the panel intentionally has no login — see [04-platform-admin.md](./04-platform-admin.md)
- **Risk:** publicly routable panel = full platform admin via service-role key
- **Fix:** put behind VPN / IP allowlist / SSO proxy (Cloudflare Access, Pomerium, etc.) before any non-local deploy.

### 3. Canonical palika dataset lives in TS, not SQL ~~(previously: `seed.sql` vs `seed-database.ts` conflict)~~
- **Status of the conflict:** resolved by deleting `supabase/seed.sql` (the 12-palika stub). `database/scripts/seed-database.ts` is now the sole source for geography (372 palikas, 33 districts, 6 provinces) + roles + permissions + categories + app_versions. Orchestrators prepend it as step 0.
- **Residual risk:** `supabase db reset` no longer auto-applies any geography — someone running `db reset` alone gets an empty DB. Running any other seed (admins, tiers, businesses) without `seed-database.ts` first will fail on missing FK targets.
- **Fix (best):** port the palika + district data from `seed-database.ts` into a new migration (e.g. `supabase/migrations/YYYYMMDD_seed_geography.sql`) so `db reset` gets the full set. Then delete the TS implementation. This gives you automatic geography without the manual step.
- **Fix (minimum):** enforce the two-step order (`supabase db reset` → `npx tsx seed-database.ts`) in the orchestrators. Already done in [`session-2026-03-21/run-seeds.sh`](../session-2026-03-21/run-seeds.sh) and [`setup-clean-db.sh`](../setup-clean-db.sh).

### 4. Broken SQL in `subscription-tiers.sql` (premium tier block)
- **Where:** [`supabase/seeds/subscription-tiers.sql`](../supabase/seeds/subscription-tiers.sql) — last `INSERT INTO tier_features` uses `JOIN features f` with no `ON` clause
- **Risk:** seed fails silently partway; premium tier has zero features
- **Fix:** change `JOIN public.features f` → `CROSS JOIN public.features f`

### 5. Migration 64 was broken in the repo (patched in this working tree)
- **Where:** [`supabase/migrations/20250401000064_notifications_rls_policies.sql`](../supabase/migrations/20250401000064_notifications_rls_policies.sql)
- **Was:** referenced `admin_regions.palika_id` (column doesn't exist — schema is `region_type` + `region_id`) and used invalid `OLD.is_seen` in a WITH CHECK clause
- **Status:** patched in the working tree. Ensure the fix is merged to main before any deploy.

## P1 — Should fix before rollout

### 6. Schema ↔ API contract mismatches in businesses routes
- **Where:** [`platform-admin-panel/src/lib/datasources/supabase-businesses-datasource.ts`](../platform-admin-panel/src/lib/datasources/supabase-businesses-datasource.ts) has a field-mapping comment block
- **Issue:** API accepts `contact_phone`, `contact_email`, `category`, `owner_info`, `featured_image_url`, `coordinates`; real DB columns are `phone`, `email`, `sub_category`, `details`, `featured_image`, `location` (geography Point). Current code maps both ways but needs default values for required-NOT-NULL columns (`slug`, `business_type_id`, `ward_number`, `owner_user_id`) that the API doesn't collect.
- **Fix:** decide whether the API contract or the schema is canonical; align both ends; document in OpenAPI / Zod.

### 7. `admin_regions` not populated by `seed-admin-users.ts`
- **Where:** [`database/scripts/seed-admin-users.ts`](../database/scripts/seed-admin-users.ts) creates admin_users but not admin_regions
- **Risk:** RLS policies on businesses / events / blog posts gate on admin_regions — seeded admins can't read their own palika's content.
- **Workaround:** manual SQL (see step in [02-seeding.md](./02-seeding.md))
- **Fix:** extend `seed-admin-users.ts` to upsert into admin_regions for roles ∈ {province_admin, district_admin, palika_admin}.

### 8. Dev admin credentials committed in seed scripts
- **Where:** [`database/scripts/seed-admin-users.ts`](../database/scripts/seed-admin-users.ts) and [`platform-admin-panel/README.md`](../platform-admin-panel/README.md) list plaintext passwords: `SuperSecurePass123!`, `KathmanduAdmin456!`, etc.
- **Risk:** anyone who reads the repo has cred for every environment that was seeded from this script
- **Fix:** generate random passwords at seed time; write to a gitignored file or secrets manager; rotate any that have leaked.

### 9. No env guard around test-data seeds
- **Where:** [`database/scripts/seed-marketplace-proper.ts`](../database/scripts/seed-marketplace-proper.ts), [`database/scripts/seed-marketplace-test-data.ts`](../database/scripts/seed-marketplace-test-data.ts), [`database/scripts/seed-bhaktapur-users.ts`](../database/scripts/seed-bhaktapur-users.ts)
- **Risk:** running the full pipeline in production inserts fake citizen users, test businesses, test products.
- **Fix:** top-of-file `if (process.env.NODE_ENV === 'production') { console.error('refuse'); process.exit(1); }` and a top-level orchestration flag `--with-test-data`.

### 10. Non-idempotent TS seeds
- **Where:** many scripts (including `seed-marketplace-proper.ts`, `seed-business-types.ts`) don't use `ON CONFLICT`; re-running throws unique-constraint errors
- **Fix:** add `.upsert({ ... }, { onConflict: '<col>' })` on Supabase client calls, or pre-check and skip.

### 11. Hard-coded palika IDs in `enroll-palikas-tiers.ts`
- **Where:** [`database/scripts/enroll-palikas-tiers.ts`](../database/scripts/enroll-palikas-tiers.ts) — `.eq('id', 1)` … `.eq('id', 4)`. Tiers are resolved by name ✅ but palikas by numeric id ❌.
- **Issue:** palika IDs are serial and change depending on insert order (e.g. `seed.sql` vs `seed-database.ts` produce different orderings). Only enrolls 4 of 372 palikas regardless of dataset.
- **Fix:** resolve palikas by `code` or `name_en`; optionally iterate over all and apply a defaulting rule (e.g. "tier from subscription_expires_at or default to basic").

### 12. Fake datasources may ship in production bundle
- **Where:** every `*-config.ts` in `platform-admin-panel/src/lib/datasources/` imports its fake impl at module top-level
- **Risk:** fixtures + helper code in prod JS bundle
- **Fix:** verify with `next build` + bundle analyser. If the fake code is in, move the `FakeXxx` import to the `if (useFake) { require(...) }` branch (same as we already do for supabase impls).

### 13. Duplicate seed scripts / overlapping table writes
Confirmed by grep on `.from('...').insert|.upsert`:

| Table | Writers | Status |
|---|---|---|
| `subscription_tiers` + `features` + `tier_features` | `supabase/seeds/subscription-tiers.sql` (canonical). ~~`seed-subscription-tiers.ts`~~ deleted. ~~`seed-marketplace-categories.ts`~~ deleted. | ✅ Resolved. |
| `marketplace_categories` | `seed-marketplace-categories-direct.ts` (canonical). ~~`seed-marketplace-categories.ts`~~ deleted. | ✅ Resolved. |
| `roles` + `permissions` | migration `20250127000008`, `seed-database.ts` (`seedRoles`/`seedPermissions`) | Still duplicated. Pick one: either strip those sections from `seed-database.ts`, or replace the migration with a reference to the TS data. |
| `categories` (`entity_type='business'`) | `seed-database.ts` (`seedCategories`), `seed-business-types.ts` | Still duplicated. Pick one. |

**NOT duplicates (common misread):**
- `seed-database.ts` is the **broadest infrastructure seed** (provinces + districts + 372 palikas + roles + permissions + categories + app_versions). The former 12-palika `supabase/seed.sql` has been deleted. See #3.
- `seed-business-types.ts` is NOT a duplicate of `seed-business-categories-direct.ts` — they write to different tables (`categories` vs `business_categories`). Both needed.

## P2 — Quality / hygiene

### 14. Mutable state on `globalThis` in fake datasources
- **Where:** `fake-businesses-datasource.ts`, `fake-admins-datasource.ts`, `fake-palikas-datasource.ts`, `fake-auth-datasource.ts`
- **Why:** needed to survive Next.js HMR resetting module-level `const`s
- **Status:** works in dev; guarded by #12 never reaching prod. Document rather than remove.

### 15. `/api/admins/[id]` returns 500 on missing id instead of 404
- **Where:** platform-admin-panel — supabase `.single()` errors map to 500
- **Fix:** `.maybeSingle()` and return 404 on null.

### 16. No test suite for platform-admin-panel
- **Fix:** add a Vitest / Playwright harness. Start with API-level integration tests that run against real Supabase + fake datasources in parallel.

### 17. Orchestrator scripts drift
- **Where:** `setup-clean-db.sh`, `session-2026-03-21/run-seeds.sh`, `session-2026-03-21/setup.sh`, `database/scripts/setup-complete.ts`
- **Fix:** pick one (recommend a single shell script at repo root); delete the rest.

### 18. Invalid UUIDs in test script
- **Where:** [`database/scripts/seed-marketplace-test-data.ts`](../database/scripts/seed-marketplace-test-data.ts) lines 52, 61, 71, 80, 90, 99, 109, 118 — `id: 'user-1a-' + Date.now()` for user rows, and `id: 'comment-' + Date.now() + '-' + i` for comments (lines 336, 357).
- **Risk:** fails against UUID columns; the audit's claim was aimed at this file, not `seed-marketplace-proper.ts` which uses proper UUIDs (`'11111111-…'` + `randomUUID()`).
- **Fix:** `import { randomUUID } from 'crypto'` and replace string-concatenated ids.

### 19. Seed scripts don't log structured output
- **Fix:** standardise on a single logger; emit JSON for CI parsing.

---

**Top-3 to fix this week** (if forced to pick):
1. #1 (rotate + secrets manager)
2. #2 (gateway / SSO for platform-admin-panel)
3. #3 (canonicalise palika seed so `supabase db reset` produces a usable DB)

Those three remove the "can't deploy" class of issues. Everything else is cleanup that can happen in parallel.
