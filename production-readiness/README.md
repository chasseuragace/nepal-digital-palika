# Production Readiness

> **Orientation note.** The authoritative seeding/setup docs predate this folder:
> - [`docs/INFRASTRUCTURE_SEEDING_OVERVIEW.md`](../docs/INFRASTRUCTURE_SEEDING_OVERVIEW.md) — canonical "what is infrastructure" definition
> - [`session-2026-03-21/SEEDING_PIPELINE.md`](../session-2026-03-21/SEEDING_PIPELINE.md) — five-stage pipeline
> - [`setup-guide/seeding-order.md`](../setup-guide/seeding-order.md) — dependency order
> - [`database/scripts/docs/`](../database/scripts/docs/) — script index and quick start
> - [`database/scripts/deploy-infrastructure.sh`](../database/scripts/deploy-infrastructure.sh) — the original orchestrator (`--minimal` / default / `--dev`)
>
> This `production-readiness/` folder is **delta-only** — it captures what this cleanup pass changed on top of the above. For historical context and the original architecture, read the originals first.

Single entry point for everything needed to stand up, seed, and operate the Nepal Digital Tourism platform.

This folder is an **index**. It points to the authoritative files — it does **not** duplicate their contents.

## Contents

| Doc | Purpose |
|---|---|
| [01-setup.md](./01-setup.md) | Zero-to-running: prerequisites, DB reset, seed pipeline, starting each app |
| [02-seeding.md](./02-seeding.md) | Inventory of every seed file, what it populates, recommended run order |
| [03-datasources.md](./03-datasources.md) | Clean-arch + DI pattern used across apps, real/fake datasource switching |
| [04-platform-admin.md](./04-platform-admin.md) | Platform admin panel: purpose, no-auth posture, env vars, API surface |
| [05-known-issues.md](./05-known-issues.md) | Bugs, schema mismatches, duplicates, production blockers |
| [SEED_AUDIT.md](../SEED_AUDIT.md) | Full audit of seed scripts (duplicates, conflicts, correctness bugs, gaps) |

## Apps in the repo

| App | Path | Port (dev) | Run command |
|---|---|---|---|
| Platform admin panel | [`platform-admin-panel/`](../platform-admin-panel/) | 3002 | `npm run dev` |
| Admin panel (palika-level) | [`admin-panel/`](../admin-panel/) | 3000/3001 | `npm run dev` |
| Marketplace (Vite CSR) | [`m-place/`](../m-place/) | 5173 | `npm run dev` |
| Supabase stack | [`supabase/`](../supabase/) | 54321 API / 54323 Studio | `supabase start` |

## Supabase environment

Local development uses the Supabase CLI (`supabase start` / `supabase db reset`). Config lives at [`supabase/config.toml`](../supabase/config.toml). All three apps point to `http://127.0.0.1:54321` by default.

Service-role key is committed in each app's `.env.local` for dev. Rotate before production deploy.

## Quick links

- **Production setup (non-destructive):** [`setup-production.sh`](../setup-production.sh) — migrations via `db push`, idempotent SQL seeds, admin creation, verify
- Dev setup (destructive `db reset`): [`session-2026-03-21/setup.sh`](../session-2026-03-21/setup.sh) and [`setup-clean-db.sh`](../setup-clean-db.sh)
- Seeding orchestrator (TS-only tail): [`session-2026-03-21/run-seeds.sh`](../session-2026-03-21/run-seeds.sh)
- Infrastructure seeds (auto-applied by `supabase db reset` via `config.toml`):
  - [`supabase/seeds/01-geography.sql`](../supabase/seeds/01-geography.sql) — 7 provinces / 77 districts / 372 palikas
  - [`supabase/seeds/02-rbac.sql`](../supabase/seeds/02-rbac.sql) — roles
  - [`supabase/seeds/03-categories.sql`](../supabase/seeds/03-categories.sql) — categories
  - [`supabase/seeds/04-business-categories.sql`](../supabase/seeds/04-business-categories.sql) — business_categories
  - [`supabase/seeds/05-marketplace-categories.sql`](../supabase/seeds/05-marketplace-categories.sql) — marketplace_categories (de-gated)
  - [`supabase/seeds/subscription-tiers.sql`](../supabase/seeds/subscription-tiers.sql) — tiers/features
- Admin user seed (TS — needs auth SDK): [`database/scripts/seed-admin-users.ts`](../database/scripts/seed-admin-users.ts)

## Status

- **Platform admin panel** — runs end-to-end against both fake datasources and real Supabase. See [04-platform-admin.md](./04-platform-admin.md).
- **Infrastructure seed** — now pure SQL under `supabase/seeds/`, auto-applied by `supabase db reset` via `config.toml` `[db.seed]`. `seed-database.ts` and co. were ported + deleted. See [02-seeding.md](./02-seeding.md).
- **Tier gating** — removed from functional code paths (2026-04-21). `marketplace_categories.min_tier_level` is nullable/deprecated; businesses registration no longer tier-checks; `palikaHasFeature` util deleted. Tier data tables remain as metadata for a future dynamic-policy layer.
- **Not production-ready** — see blocker list in [05-known-issues.md](./05-known-issues.md). Top three: secrets-in-repo, panel access control, admin_regions seeding gap.
