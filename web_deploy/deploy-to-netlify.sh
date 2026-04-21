#!/usr/bin/env bash
#
# Deploy one of this repo's Next.js apps to Netlify.
#
# Usage:
#   NETLIFY_AUTH_TOKEN=<pat> ./web_deploy/deploy-to-netlify.sh <site-config>
#
# Where <site-config> is a path under web_deploy/sites/, e.g.
#   ./web_deploy/deploy-to-netlify.sh web_deploy/sites/digital-nep-platform-admin.env
#
# Site config files declare:
#   NETLIFY_SITE_SLUG    — DNS-safe site name (becomes <slug>.netlify.app)
#   PROJECT_DIR          — repo-relative directory holding the Next.js app
#   SUPABASE_ENV_FILE    — repo-relative path to the .env file with
#                          ANON_KEY / SERVICE_ROLE_KEY / API_EXTERNAL_URL
#                          (defaults to supabase/prod/.env)
#   EXTRA_ENV_*          — optional `EXTRA_ENV_<KEY>=<value>` lines; the script
#                          will publish each as a Netlify env var.
#
# What the script does, in order:
#   1. Verifies NETLIFY_AUTH_TOKEN is set and valid.
#   2. Creates the Netlify site if a site with that slug does not already exist
#      (idempotent — reuses the existing site otherwise).
#   3. Reads Supabase ANON_KEY / SERVICE_ROLE_KEY / API_EXTERNAL_URL from
#      SUPABASE_ENV_FILE and publishes them as Netlify env vars, along with
#      any EXTRA_ENV_* overrides from the site config.
#   4. Runs `netlify deploy --build --prod` in PROJECT_DIR so Netlify's Next.js
#      plugin runs the build and uploads.
#
# Idempotency: safe to re-run. Re-running on an existing site re-publishes env
# vars (overwriting existing values) and deploys a fresh build.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── helpers ────────────────────────────────────────────────────────────────

die()   { echo "error: $*" >&2; exit 1; }
info()  { echo "─── $* ───"; }

nf_api() {
  # nf_api <method> <path> [<json-body>]
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sSf -X "$method" \
      -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "https://api.netlify.com/api/v1$path"
  else
    curl -sSf -X "$method" \
      -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
      "https://api.netlify.com/api/v1$path"
  fi
}

json_get() {
  # json_get <key> — reads stdin as JSON, prints the top-level value at <key>
  python3 -c "import json,sys; print(json.load(sys.stdin).get('$1',''))"
}

# ── arg parsing ────────────────────────────────────────────────────────────

[ $# -eq 1 ] || die "usage: NETLIFY_AUTH_TOKEN=<pat> $0 <site-config-file>"
SITE_CONFIG="$1"
[ -f "$SITE_CONFIG" ] || die "site config not found: $SITE_CONFIG"

# shellcheck disable=SC1090
source "$SITE_CONFIG"

: "${NETLIFY_AUTH_TOKEN:?set NETLIFY_AUTH_TOKEN env var with your PAT}"
: "${NETLIFY_SITE_SLUG:?NETLIFY_SITE_SLUG must be set in the site config}"
: "${PROJECT_DIR:?PROJECT_DIR must be set in the site config}"
SUPABASE_ENV_FILE="${SUPABASE_ENV_FILE:-supabase/prod/.env}"

[ -d "$PROJECT_DIR" ] || die "PROJECT_DIR does not exist: $PROJECT_DIR"
[ -f "$SUPABASE_ENV_FILE" ] || die "SUPABASE_ENV_FILE not found: $SUPABASE_ENV_FILE"

info "deploying $PROJECT_DIR → https://${NETLIFY_SITE_SLUG}.netlify.app"

# ── 1. verify token ────────────────────────────────────────────────────────

info "verify Netlify PAT"
USER_INFO=$(nf_api GET /user) \
  || die "PAT rejected by Netlify (/user returned non-2xx)"
echo "  user: $(echo "$USER_INFO" | json_get email)"

# ── 2. create-or-reuse site ────────────────────────────────────────────────

info "resolve site (create if missing)"
SITE_ID=""
# List all sites, look for exact-name match. Netlify doesn't offer a
# filter-by-name endpoint that's documented as stable.
SITES_JSON=$(nf_api GET "/sites?per_page=100")
SITE_ID=$(python3 -c "
import json,sys
slug='$NETLIFY_SITE_SLUG'
for s in json.loads(sys.argv[1]):
    if s['name']==slug:
        print(s['id']); break
" "$SITES_JSON" || true)

if [ -z "$SITE_ID" ]; then
  CREATE_RESP=$(nf_api POST /sites "{\"name\":\"${NETLIFY_SITE_SLUG}\"}") \
    || die "failed to create site"
  SITE_ID=$(echo "$CREATE_RESP" | json_get id)
  echo "  created site id=$SITE_ID"
else
  echo "  reusing existing site id=$SITE_ID"
fi

ACCOUNT_ID=$(nf_api GET "/sites/$SITE_ID" | json_get account_id)
[ -n "$ACCOUNT_ID" ] || die "could not resolve account_id for site $SITE_ID"

# ── 3. publish env vars ────────────────────────────────────────────────────

info "publish env vars (from $SUPABASE_ENV_FILE + EXTRA_ENV_*)"

# Pull the canonical three from Supabase .env.
SUP_URL=$(grep -E '^API_EXTERNAL_URL=' "$SUPABASE_ENV_FILE" | cut -d= -f2-)
SUP_ANON=$(grep -E '^ANON_KEY=' "$SUPABASE_ENV_FILE" | cut -d= -f2-)
SUP_SVC=$(grep -E '^SERVICE_ROLE_KEY=' "$SUPABASE_ENV_FILE" | cut -d= -f2-)
[ -n "$SUP_URL" ]  || die "API_EXTERNAL_URL missing in $SUPABASE_ENV_FILE"
[ -n "$SUP_ANON" ] || die "ANON_KEY missing in $SUPABASE_ENV_FILE"
[ -n "$SUP_SVC" ]  || die "SERVICE_ROLE_KEY missing in $SUPABASE_ENV_FILE"

# Build the env array.
declare -a ENV_KV=(
  "NEXT_PUBLIC_SUPABASE_URL=$SUP_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUP_ANON"
  "SUPABASE_SERVICE_ROLE_KEY=$SUP_SVC"
  "VITE_SUPABASE_URL=$SUP_URL"
  "VITE_SUPABASE_ANON_KEY=$SUP_ANON"
)
# Any EXTRA_ENV_* from the site config.
for var in $(compgen -v EXTRA_ENV_ || true); do
  key="${var#EXTRA_ENV_}"
  ENV_KV+=("$key=${!var}")
done

# Netlify env API expects an array; build the JSON.
ENV_PAYLOAD=$(python3 -c "
import json,sys
pairs=sys.argv[1:]
out=[]
for p in pairs:
    k,_,v=p.partition('=')
    out.append({'key':k,'values':[{'value':v,'context':'all'}],
                'scopes':['builds','functions','runtime','post_processing']})
print(json.dumps(out))
" "${ENV_KV[@]}")

# Upsert: DELETE then POST. (Netlify's POST rejects duplicates; there is a PUT
# on the account/env/:key endpoint but it only updates one key at a time.)
for kv in "${ENV_KV[@]}"; do
  key="${kv%%=*}"
  curl -sS -X DELETE \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/accounts/$ACCOUNT_ID/env/$key?site_id=$SITE_ID" \
    > /dev/null || true
done

curl -sSf -X POST \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ENV_PAYLOAD" \
  "https://api.netlify.com/api/v1/accounts/$ACCOUNT_ID/env?site_id=$SITE_ID" \
  | python3 -c "import json,sys; [print(f\"  set {e['key']}\") for e in json.load(sys.stdin)]"

# ── 4. build + deploy ──────────────────────────────────────────────────────

info "build + deploy"
(
  cd "$PROJECT_DIR"
  # Netlify CLI picks up NETLIFY_AUTH_TOKEN and --site flag; no `netlify link`
  # needed, so the script works on a fresh checkout or a CI runner.
  npx --yes netlify-cli@latest deploy \
    --build --prod --site="$SITE_ID" \
    --message "deploy from web_deploy/deploy-to-netlify.sh ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
)

info "done → https://${NETLIFY_SITE_SLUG}.netlify.app"
