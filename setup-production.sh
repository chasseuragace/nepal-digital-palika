#!/bin/bash
################################################################################
# setup-production.sh — Non-destructive production setup
#
# Learns from: session-2026-03-21/setup.sh, database/scripts/deploy-infrastructure.sh
# Differs in that it NEVER runs `supabase db reset`. Safe against a live DB.
#
# What it does (idempotent):
#   1. Verifies prerequisites (supabase CLI, node, env)
#   2. Pushes pending migrations       → supabase db push --linked
#   3. Applies infrastructure SQL seeds → psql, each uses ON CONFLICT
#   4. Creates admin users             → seed-admin-users.ts (upserts)
#   5. Populates admin_regions         → single SQL upsert
#   6. Verifies row counts
#
# Deliberately NOT included (operational / policy decisions, run separately):
#   - Palika→tier enrolment  (database/scripts/enroll-palikas-tiers.ts)
#   - Test/demo data         (seed-marketplace-*.ts, seed-content.ts)
#
# Usage:
#   ./setup-production.sh              # full infra seed + admins
#   ./setup-production.sh --check      # verify only, no writes
#   ./setup-production.sh --skip-admins # infra only
################################################################################

set -e

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; NC='\033[0m'

step()    { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
section() { echo -e "\n${CYAN}────────────────────────────────────────${NC}\n${CYAN}$1${NC}\n${CYAN}────────────────────────────────────────${NC}"; }

# ── args ──────────────────────────────────────────────────────────────────────
MODE="apply"
SKIP_ADMINS=false
for arg in "$@"; do
  case "$arg" in
    --check)        MODE="check" ;;
    --skip-admins)  SKIP_ADMINS=true ;;
    -h|--help)
      sed -n '1,30p' "$0"; exit 0 ;;
    *) warn "unknown arg: $arg" ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# ── 1. prereqs ────────────────────────────────────────────────────────────────
section "1. Prerequisites"
command -v supabase >/dev/null 2>&1 || error "supabase CLI missing"
success "supabase CLI $(supabase --version 2>/dev/null | head -1)"
command -v node >/dev/null 2>&1 || error "node missing"
success "node $(node --version)"

if [ -z "$SUPABASE_DB_URL" ] && [ -z "$SUPABASE_URL" ]; then
  warn "SUPABASE_DB_URL / SUPABASE_URL not set in env — trying supabase/config.toml"
fi

# ── 2. migrations ─────────────────────────────────────────────────────────────
section "2. Migrations"
if [ "$MODE" = "check" ]; then
  step "would run: supabase db push --linked --dry-run"
  supabase db push --linked --dry-run 2>&1 | tail -5 || warn "dry-run failed"
else
  step "supabase db push --linked"
  supabase db push --linked || error "migration push failed"
  success "migrations applied"
fi

# ── 3. infrastructure SQL seeds (idempotent) ──────────────────────────────────
section "3. Infrastructure seeds"
SEEDS=(
  "supabase/seeds/01-geography.sql"
  "supabase/seeds/02-rbac.sql"
  "supabase/seeds/03-categories.sql"
  "supabase/seeds/04-business-categories.sql"
  "supabase/seeds/05-marketplace-categories.sql"
  "supabase/seeds/subscription-tiers.sql"
)

apply_sql() {
  local file="$1"
  if [ ! -f "$file" ]; then warn "$file missing, skipping"; return; fi
  if [ "$MODE" = "check" ]; then
    step "would apply: $file ($(wc -l <"$file" | tr -d ' ') lines)"
    return
  fi
  step "apply $(basename "$file")"
  if [ -n "$SUPABASE_DB_URL" ]; then
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file" >/dev/null
  else
    # Fall back to the local docker container (dev convenience).
    docker exec -i supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc \
      psql -U postgres -d postgres -v ON_ERROR_STOP=1 <"$file" >/dev/null \
      || error "$(basename "$file") failed — see psql output above"
  fi
  success "$(basename "$file")"
}

for s in "${SEEDS[@]}"; do apply_sql "$s"; done

# ── 4. admin users + regions ─────────────────────────────────────────────────
section "4. Admins"
if $SKIP_ADMINS; then
  warn "--skip-admins → not creating auth users"
elif [ "$MODE" = "check" ]; then
  step "would run: database/scripts/seed-admin-users.ts"
else
  step "npx tsx database/scripts/seed-admin-users.ts"
  (cd database && [ -d node_modules ] || npm install --silent)
  (cd database && npx tsx scripts/seed-admin-users.ts) || error "admin seed failed"
  step "populate admin_regions"
  if [ -n "$SUPABASE_DB_URL" ]; then
    psql "$SUPABASE_DB_URL" -c "
      INSERT INTO admin_regions(admin_id, region_type, region_id)
      SELECT id, 'palika', palika_id FROM admin_users WHERE palika_id IS NOT NULL
      ON CONFLICT DO NOTHING;" >/dev/null
  else
    docker exec -i supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc psql -U postgres -d postgres -c "
      INSERT INTO admin_regions(admin_id, region_type, region_id)
      SELECT id, 'palika', palika_id FROM admin_users WHERE palika_id IS NOT NULL
      ON CONFLICT DO NOTHING;" >/dev/null
  fi
  success "admin_regions populated"
fi

# ── 5. verify ─────────────────────────────────────────────────────────────────
section "5. Verify"
VERIFY_SQL="SELECT
  (SELECT COUNT(*) FROM provinces)            AS provinces,
  (SELECT COUNT(*) FROM districts)            AS districts,
  (SELECT COUNT(*) FROM palikas)              AS palikas,
  (SELECT COUNT(*) FROM roles)                AS roles,
  (SELECT COUNT(*) FROM permissions)          AS perms,
  (SELECT COUNT(*) FROM categories)           AS cats,
  (SELECT COUNT(*) FROM business_categories)  AS bcats,
  (SELECT COUNT(*) FROM marketplace_categories) AS mcats,
  (SELECT COUNT(*) FROM subscription_tiers)   AS tiers,
  (SELECT COUNT(*) FROM features)             AS features,
  (SELECT COUNT(*) FROM tier_features)        AS tf,
  (SELECT COUNT(*) FROM admin_users)          AS admins,
  (SELECT COUNT(*) FROM admin_regions)        AS regions;"
if [ -n "$SUPABASE_DB_URL" ]; then
  psql "$SUPABASE_DB_URL" -c "$VERIFY_SQL"
else
  docker exec -i supabase_db_Nepal_Digital_Tourism_Infrastructure_Doc psql -U postgres -d postgres -c "$VERIFY_SQL"
fi

# ── done ──────────────────────────────────────────────────────────────────────
section "Done"
if [ "$MODE" = "check" ]; then
  echo "Dry-run — no writes performed."
else
  echo "Expected after full run: provinces=7, districts=77, palikas=372,"
  echo "  roles=8, perms=12, cats=3002, bcats=8, mcats=26,"
  echo "  tiers=3, features=27, tf=57, admins>=5, regions>=4"
  echo
  echo "Next (optional, operational):"
  echo "  npx tsx database/scripts/enroll-palikas-tiers.ts    # palika tier enrolment"
  echo "  (dev only)"
  echo "  npx tsx database/scripts/seed-marketplace-proper.ts # test users + businesses"
  echo "  npx tsx database/scripts/seed-marketplace-test-data.ts # test products"
fi
