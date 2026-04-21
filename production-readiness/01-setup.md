# Setup — Zero to Running

This doc walks through bringing up the full stack on a fresh machine.

## Prerequisites

- Node 18+ (`node --version`)
- Docker Desktop running
- Supabase CLI: `brew install supabase/tap/supabase` (or [installers](https://supabase.com/docs/guides/cli/getting-started))

## 1. Start Supabase

```bash
cd Nepal_Digital_Tourism_Infrastructure_Documentation/
supabase start
```

First run pulls ~2 GB of Docker images. Subsequent starts take <30s.

Config: [`supabase/config.toml`](../supabase/config.toml) — API on `54321`, Studio on `54323`, DB on `54322`.

## 2. Reset the DB (also seeds all infrastructure data)

```bash
supabase db reset --yes
```

This drops everything, reapplies all 64 migrations from [`supabase/migrations/`](../supabase/migrations/), then automatically applies every seed file listed in `supabase/config.toml` `[db.seed] sql_paths` — in order:

1. `supabase/seeds/01-geography.sql` → provinces (7), districts (77), palikas (372)
2. `supabase/seeds/02-rbac.sql` → roles (permissions + role_permissions come from a migration)
3. `supabase/seeds/03-categories.sql` → global content categories + per-palika business types
4. `supabase/seeds/04-business-categories.sql` → business_categories registry (8)
5. `supabase/seeds/05-marketplace-categories.sql` → marketplace_categories (T1/T2/T3, 26)
6. `supabase/seeds/subscription-tiers.sql` → subscription_tiers, features, tier_features

Every file is idempotent (`ON CONFLICT ... DO UPDATE` / `DO NOTHING`), so rerunning is safe.

See [02-seeding.md](./02-seeding.md) for full inventory.

## 3. Run the remaining TS seed pipeline

Only two things can't be pure SQL: creating `auth.users` (needs admin SDK) and enrolling palikas in subscription tiers (operational policy).

```bash
cd database
npm install

# Admins — creates auth.users + admin_users. See 05-known-issues.md #7 about admin_regions.
npx tsx scripts/seed-admin-users.ts
docker exec -i supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc \
  psql -U postgres -d postgres -c \
  "INSERT INTO admin_regions(admin_id, region_type, region_id)
   SELECT id, 'palika', palika_id FROM admin_users WHERE palika_id IS NOT NULL
   ON CONFLICT DO NOTHING;"

# Palika subscription-tier enrolment
npx tsx scripts/enroll-palikas-tiers.ts

cd ..
```

**Dev-only test data** (skip in prod):
```bash
cd database
npx tsx scripts/seed-marketplace-proper.ts    # citizen users + businesses
npx tsx scripts/seed-marketplace-test-data.ts # products
cd ..
```

Orchestrators [`session-2026-03-21/run-seeds.sh`](../session-2026-03-21/run-seeds.sh) and [`setup-clean-db.sh`](../setup-clean-db.sh) have been updated to reflect this new split.

## 4. Start an app

### Platform admin panel

```bash
cd platform-admin-panel
npm install
npm run dev -- -p 3002
```

Open http://localhost:3002. No login — service-role key bypasses auth. See [04-platform-admin.md](./04-platform-admin.md).

### Admin panel

```bash
cd admin-panel
npm install
npm run dev
```

Open http://localhost:3000. See [`admin-panel/README.md`](../admin-panel/README.md) if present, or `CLIENT_SERVICES_ARCHITECTURE.md` for architecture notes.

### Marketplace (m-place)

```bash
cd m-place
npm install
npm run dev
```

Open http://localhost:5173.

## 5. Running offline (no Supabase needed)

Platform admin panel supports fake datasources via env flag:

```bash
# in platform-admin-panel/.env.local
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true
```

All API routes serve from in-memory fixtures. See [03-datasources.md](./03-datasources.md) for the pattern. admin-panel and m-place have similar flags (`NEXT_PUBLIC_USE_FAKE_DATASOURCES` and `VITE_USE_MOCK_DATA` respectively).

## Verifying the setup

```bash
# DB sanity
docker exec supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc psql -U postgres -c \
  "SELECT (SELECT COUNT(*) FROM provinces) AS p, (SELECT COUNT(*) FROM palikas) AS palikas,
          (SELECT COUNT(*) FROM subscription_tiers) AS tiers, (SELECT COUNT(*) FROM admin_users) AS admins;"

# Platform admin API
curl -s http://localhost:3002/api/stats | head -c 200
```

Expected after `supabase db reset --yes` (infrastructure only, before admin-user step): `p=7`, `palikas=372`, `tiers=3`, `admins=0`. After running `seed-admin-users.ts`: `admins=5`.
