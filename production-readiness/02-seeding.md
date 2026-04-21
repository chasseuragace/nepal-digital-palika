# Seeding — Inventory & Run Order

As of 2026-04-20, **`supabase db reset` now seeds all infrastructure data automatically** from pure-SQL files under `supabase/seeds/`. Only auth-bound / policy-bound steps remain as TypeScript scripts.

For the raw audit of the previous hybrid state see [SEED_AUDIT.md](../SEED_AUDIT.md) (historical).

## What runs on `supabase db reset`

`supabase/config.toml` `[db.seed] sql_paths` lists these files in order; the CLI applies them after all migrations:

| Order | File | Tables written | Source |
|---|---|---|---|
| 1 | `supabase/seeds/01-geography.sql` | `provinces` (7), `districts` (77), `palikas` (372) | Ported from `seed-database.ts` |
| 2 | `supabase/seeds/02-rbac.sql` | `roles` (6 base, idempotent) | Ported from `seed-database.ts`. Note: permissions (12) + role_permissions are already seeded by migration `20250127000008`, and hierarchical roles (province_admin, district_admin) by migration `20250126000004`. |
| 3 | `supabase/seeds/03-categories.sql` | `categories` — 26 global rows (palika_id NULL) + 2 976 per-palika business-type rows | Ported from `seed-database.ts` `CATEGORIES` + `seed-business-types.ts`. Per-palika is load-bearing because `admin-panel/lib/supabase-business-targeting-datasource.ts` filters by `palika_id`. |
| 4 | `supabase/seeds/04-business-categories.sql` | `business_categories` (8) | Ported from `seed-business-categories-direct.ts` |
| 5 | `supabase/seeds/05-marketplace-categories.sql` | `marketplace_categories` (26 across T1/T2/T3) | Ported from `seed-marketplace-categories-direct.ts` |
| 6 | `supabase/seeds/subscription-tiers.sql` | `subscription_tiers` (3), `features` (27), `tier_features` (57) | Pre-existing, with the premium-tier `JOIN → CROSS JOIN` fix applied. |

Every INSERT uses `ON CONFLICT … DO UPDATE` or `DO NOTHING`, so rerunning `supabase db reset` (or applying the seed files manually) is idempotent.

Re-generation: the generator `database/scripts/dump-seeds-to-sql.ts` was a one-shot port. It has been removed; regenerate by rewriting the seed files directly.

## What still runs as TypeScript

These need runtime behaviour that SQL can't express:

| Script | Why it stays TS |
|---|---|
| [`database/scripts/seed-admin-users.ts`](../database/scripts/seed-admin-users.ts) | Uses Supabase admin auth SDK (`auth.admin.createUser`) to create rows in `auth.users`. Not pure SQL. |
| [`database/scripts/enroll-palikas-tiers.ts`](../database/scripts/enroll-palikas-tiers.ts) | Operational decision (which palikas get which tier), not infrastructure data. Runs fallible business logic. |
| [`supabase/seeds/seed_service_providers.sql`](../supabase/seeds/seed_service_providers.sql) | Dev-only SOS seeds; not listed in `sql_paths` because it targets a specific palika. |
| [`supabase/seeds/seed_sos_requests.sql`](../supabase/seeds/seed_sos_requests.sql) | Dev-only SOS data. |

## Removed in this cleanup pass

- `database/scripts/seed-database.ts` — superseded by `01-geography.sql` + `02-rbac.sql` + `03-categories.sql`. The `app_versions` seeding it used to do was not consumed by any app (grep confirmed) and was dropped; re-add as a migration if needed.
- `database/scripts/seed-business-categories-direct.ts` — superseded by `04-business-categories.sql`.
- `database/scripts/seed-business-types.ts` — superseded by the per-palika loop in `03-categories.sql`.
- `database/scripts/seed-marketplace-categories-direct.ts` — superseded by `05-marketplace-categories.sql`.
- `database/scripts/dump-seeds-to-sql.ts` — the one-shot generator, removed after it produced the SQL.
- `supabase/seed.sql` is retained as a no-op stub (the supabase CLI seed loader does not support `\i` / `\ir` psql meta-commands, so orchestration is done via `sql_paths` in `config.toml` instead).

## Test / dev-only seeds (must be gated in prod)

| File | Tables written | Notes |
|---|---|---|
| [`database/scripts/seed-marketplace-proper.ts`](../database/scripts/seed-marketplace-proper.ts) | `profiles`, `businesses`, `marketplace_products`, `marketplace_product_comments` | Uses fixed UUIDs. |
| [`database/scripts/seed-marketplace-test-data.ts`](../database/scripts/seed-marketplace-test-data.ts) | test users, products, comments | See [05-known-issues.md](./05-known-issues.md) #18. |
| [`database/scripts/seed-bhaktapur-users.ts`](../database/scripts/seed-bhaktapur-users.ts) | Bhaktapur-specific test users |  |
| [`database/scripts/seed-complete-flow.ts`](../database/scripts/seed-complete-flow.ts) | marketplace users + businesses + products | Demo flow. |
| [`database/scripts/seed-content.ts`](../database/scripts/seed-content.ts) | heritage sites, events, blog posts |  |

## Current recommended run order

```bash
# 1. Start + migrate + auto-seed infrastructure
supabase start
supabase db reset --yes           # applies migrations + all supabase/seeds/*.sql files

# 2. Admin users (auth.users + admin_users)
cd database
npm install
npx tsx scripts/seed-admin-users.ts

# Manual step (until seed-admin-users.ts is patched): populate admin_regions
docker exec -i supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc \
  psql -U postgres -d postgres -c \
  "INSERT INTO admin_regions(admin_id, region_type, region_id)
   SELECT id, 'palika', palika_id FROM admin_users WHERE palika_id IS NOT NULL
   ON CONFLICT DO NOTHING;"

# 3. Palika subscription-tier enrolment
npx tsx scripts/enroll-palikas-tiers.ts

# 4. (dev only) Test data
if [ "$NODE_ENV" != "production" ]; then
  npx tsx scripts/seed-marketplace-proper.ts
  npx tsx scripts/seed-marketplace-test-data.ts
fi
cd ..
```

## Verification

```bash
docker exec supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc psql -U postgres -c "
  SELECT (SELECT COUNT(*) FROM provinces) AS p,
         (SELECT COUNT(*) FROM districts) AS d,
         (SELECT COUNT(*) FROM palikas) AS palikas,
         (SELECT COUNT(*) FROM roles) AS roles,
         (SELECT COUNT(*) FROM permissions) AS perms,
         (SELECT COUNT(*) FROM categories) AS cats,
         (SELECT COUNT(*) FROM business_categories) AS bc,
         (SELECT COUNT(*) FROM marketplace_categories) AS mc,
         (SELECT COUNT(*) FROM subscription_tiers) AS tiers,
         (SELECT COUNT(*) FROM features) AS features,
         (SELECT COUNT(*) FROM tier_features) AS tf;
"
```

Expected after a clean `supabase db reset`:
`p=7, d=77, palikas=372, roles=8, perms=12, cats=3002, bc=8, mc=26, tiers=3, features=27, tf=57`.

(`roles=8` because migration `20250126000004` adds `province_admin` and `district_admin` on top of the six listed in `02-rbac.sql`.)
