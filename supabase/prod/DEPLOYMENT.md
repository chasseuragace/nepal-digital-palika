# Nepal Digital Tourism — Supabase deployment record

Operational reference for the live Supabase data plane.
For first-time-deploy instructions, see `DEPLOY.md`.

## 1. Live endpoint

| Item | Value |
|---|---|
| Public URL | `https://dev.kaha.com.np/tourism-supabase` |
| Topology | Path-prefix proxy. Nginx strips `/tourism-supabase/` and forwards to Kong on loopback. |
| TLS | Reuses the existing `dev.kaha.com.np` Let's Encrypt cert. No new cert issued. |
| Kong host binding | `127.0.0.1:8010` (loopback only — not reachable from the internet directly) |
| Postgres exposure | None. Docker network internal. Access via `docker exec` or SSH tunnel. |
| First deployed | 2026-04-21 |
| Deployed by | chasseuragace (+ Claude Code) |

## 2. What's running

Seven containers under compose project `nepal-tourism-supabase`:

| Service | Image | Purpose | Healthcheck |
|---|---|---|---|
| `nepal-tourism-db` | `supabase/postgres:15.6.1.115` | Data | `pg_isready` |
| `nepal-tourism-kong` | `kong:2.8.1` | API gateway, key-auth, CORS | 8001 admin API |
| `nepal-tourism-auth` | `supabase/gotrue:v2.158.1` | Sign-up / sign-in / JWT | — |
| `nepal-tourism-rest` | `postgrest/postgrest:v12.2.0` | REST over SQL | — |
| `nepal-tourism-storage` | `supabase/storage-api:v1.11.13` | File up/download | `/status` |
| `nepal-tourism-imgproxy` | `darthsim/imgproxy:v3.8.0` | On-the-fly image transforms | built-in |
| `nepal-tourism-meta` | `supabase/postgres-meta:v0.83.2` | Schema introspection | — |

Dropped from the upstream Supabase self-host stack (by design):
`realtime`, `studio`, `vector`, `analytics` (Logflare), `supavisor`/pooler,
`edge-functions`. See `docker-compose.yml` header for rationale.

## 3. Data state at first deploy

Applied on 2026-04-21 against an empty DB:

- **54 migrations** from `supabase/migrations/*.sql` (project schema + RLS)
- **6 infrastructure seeds** from `supabase/seeds/`:
  `01-geography.sql`, `02-rbac.sql`, `03-categories.sql`,
  `04-business-categories.sql`, `05-marketplace-categories.sql`,
  `subscription-tiers.sql`

Verified counts (match the spec in `CLAUDE.md`):

```
provinces            = 7
districts            = 77
palikas              = 372
subscription_tiers   = 3
roles                = 8
```

NOT yet applied (run from your laptop when ready):

- `database/scripts/seed-admin-users.ts` — creates `auth.users` + `admin_users`
  rows for the five bootstrap admins (`super@admin.com` etc.).
- `database/scripts/enroll-palikas-tiers.ts` — enrols palikas in subscription tiers.
- `seeds/seed_service_providers.sql`, `seeds/seed_sos_requests.sql` — dev fixtures.

## 4. File layout on the remote

```
/home/ubuntu/nepal-tourism/supabase/
├── migrations/                     # 54 SQL files (applied)
├── seeds/                          # 8 SQL files (6 applied)
├── config.toml                     # dev-only, not consumed in prod
└── prod/
    ├── docker-compose.yml
    ├── .env                        # 0600, not committed, holds all secrets
    ├── .env.example
    ├── DEPLOY.md                   # first-deploy runbook
    ├── DEPLOYMENT.md               # this file
    ├── nginx-location.conf         # reference copy of the nginx block
    └── volumes/
        ├── kong.yml                # rendered with real JWTs (env-substituted)
        ├── kong.yml.template       # original with $SUPABASE_ANON_KEY placeholders
        └── db/                     # upstream initdb fragments (first-boot only)
            ├── roles.sql
            ├── jwt.sql
            ├── realtime.sql
            ├── webhooks.sql
            └── _supabase.sql
```

Docker volumes (persistent):

- `nepal-tourism-supabase_nepal-tourism-db-data` — Postgres data directory
- `nepal-tourism-supabase_nepal-tourism-storage-data` — uploaded files

## 5. Nginx integration

Location block added to `/etc/nginx/sites-enabled/dev.conf` at line 389
(just before `listen 443 ssl;` inside the `dev.kaha.com.np` server block).

Backups of the pre-patch config:

| Location | Path |
|---|---|
| Remote | `/etc/nginx/sites-enabled/dev.conf.bak.20260421_080354` |
| Local (repo) | `supabase/prod/nginx-backup/dev.conf.20260421_134822.bak` |

### Known pre-existing warning

`nginx -t` emits `conflicting server name "dev.kaha.com.np"` warnings —
these are **not** caused by our patch. They come from backup files
(`dev.conf.bak.*`) sitting in `/etc/nginx/sites-enabled/` being parsed
as active configs. Fix when convenient:

```bash
sudo mkdir -p /etc/nginx/backups
sudo mv /etc/nginx/sites-enabled/*.bak.* /etc/nginx/backups/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Operational commands

All `docker compose` commands must be run from `/home/ubuntu/nepal-tourism/supabase/prod/`.

### Status + logs

```bash
docker compose ps
docker compose logs -f --tail 100 kong auth rest storage
docker compose logs --since 10m auth     # recent gotrue events
docker stats --no-stream $(docker compose ps -q)
```

### Restart / recreate

```bash
# Config change in .env
docker compose up -d auth    # restart just auth
docker compose up -d         # pick up any changed env across services

# kong.yml changed — re-render first
set -a; . ./.env; set +a
export SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_KEY=$SERVICE_ROLE_KEY
envsubst < volumes/kong.yml.template > volumes/kong.yml
docker compose restart kong
```

### Apply a new migration

```bash
# Ship the new migration with rsync from your laptop, then:
docker exec -i nepal-tourism-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < /home/ubuntu/nepal-tourism/supabase/migrations/20260421NNNNNN_new.sql

# PostgREST caches the schema — reload after any DDL:
docker exec nepal-tourism-db psql -U postgres -c "NOTIFY pgrst, 'reload schema';"
# Or, if that doesn't work:
docker compose restart rest meta
```

### Direct psql

```bash
# From on the server
docker exec -it nepal-tourism-db psql -U postgres -d postgres

# From your laptop via SSH tunnel
ssh -L 54322:127.0.0.1:<random-port> ubuntu@$remote_dev_server \
  'docker run --rm --network=container:nepal-tourism-db -p 127.0.0.1:<random-port>:5432 ...'
# (or just exec psql remotely; tunneling postgres is rarely worth it for one-off queries)
```

### Backups

Postgres dump should be appended to the existing rotation
(`/home/ubuntu/backup-postgres.sh`):

```bash
docker exec nepal-tourism-db pg_dumpall -U postgres \
  | gzip > /home/ubuntu/backups/nepal_tourism_$(date +%Y%m%d_%H%M%S).sql.gz
```

Storage files live on the container host at
`/var/lib/docker/volumes/nepal-tourism-supabase_nepal-tourism-storage-data/_data/`.
Snapshot with `tar czf` or rsync as needed.

## 7. Secrets

Stored only in two places:

- `/home/ubuntu/nepal-tourism/supabase/prod/.env` on the remote (mode 0600)
- `supabase/prod/.env` on the deploying laptop (gitignored via `supabase/prod/.gitignore`)

Keys generated 2026-04-21. **`SITE_URL` is a placeholder** —
update to the real Netlify frontend URL before production traffic,
otherwise email-auth redirects go nowhere. Rotation is manual and is the
operator's responsibility.

`ENABLE_EMAIL_AUTOCONFIRM=true` is a bootstrap setting; users are
auto-verified without any email being sent. Before treating this as
"production", configure SMTP_* and flip autoconfirm off.

## 8. Netlify env vars (when frontends ship)

Per-site build settings. No code changes are required in any app —
every Supabase client already reads these from env.

```
# admin-panel + platform-admin-panel (Next)
NEXT_PUBLIC_SUPABASE_URL=https://dev.kaha.com.np/tourism-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from .env>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from .env>    # server-only routes

# m-place (Vite)
VITE_SUPABASE_URL=https://dev.kaha.com.np/tourism-supabase
VITE_SUPABASE_ANON_KEY=<ANON_KEY from .env>
```

Also update the `SITE_URL` in the server `.env` to the first Netlify URL,
and add the rest to `ADDITIONAL_REDIRECT_URLS`, then restart auth:

```bash
$EDITOR /home/ubuntu/nepal-tourism/supabase/prod/.env
docker compose restart auth
```

## 9. Rollback

### Roll back the nginx block only (Supabase keeps running, path becomes 404)

```bash
ssh ubuntu@$remote_dev_server
sudo cp /etc/nginx/sites-enabled/dev.conf.bak.20260421_080354 \
        /etc/nginx/sites-enabled/dev.conf
sudo nginx -t && sudo systemctl reload nginx
```

### Roll back the whole stack (keeps data volumes)

```bash
cd /home/ubuntu/nepal-tourism/supabase/prod
docker compose down
# Data is preserved in docker volumes. Bring back up with:
docker compose up -d
```

### Full wipe (destructive — removes DB, storage, everything)

```bash
cd /home/ubuntu/nepal-tourism/supabase/prod
docker compose down -v        # `-v` deletes the volumes
```

## 10. Known caveats + deferred work

Summary table:

| Item | Risk right now | Blocks what | Effort to fix |
|---|---|---|---|
| `SITE_URL` is a placeholder | Low — only matters once users sign up via a deployed Netlify site | Password-reset / email-confirm links | ~1 min + `restart auth` |
| No SMTP + `ENABLE_EMAIL_AUTOCONFIRM=true` | Low for staging; **High** if you treat this as production | Real email workflows + sign-up friction | ~5 min + SMTP creds |
| Admin seed scripts not run | **Blocking** — no admin can log in | All admin-panel / platform-admin login | ~5 min + choice of passwords |
| Storage on local disk, not S3 | Shared capacity with every other project on this VPS | Disk pressure at scale | Compose-env change to S3 backend |
| Nginx `conflicting server name` warnings | Cosmetic | Clean `nginx -t` output | See §5 |
| JWT + API keys never expire | Trust surface widens over time | Operational hygiene | Manual rotation |

### 10a. `SITE_URL` is `http://localhost:3000`

**What it does.** GoTrue uses `SITE_URL` to build the URLs it puts inside emails it sends to users:

- Password-reset: "Click here to reset" → `${SITE_URL}/auth/callback?token=...`
- Email-confirm: "Click to verify your email" → same
- Magic-link login: same

**What breaks right now.** Nothing, while nobody signs up through a Netlify-hosted app. The day a real user triggers a password reset from a production frontend, the email link will point at `http://localhost:3000` — their own laptop, not running anything. They click, see "site not reachable," abandon.

**Fix.** One-minute job the moment you know the Netlify URL(s):

```bash
ssh ubuntu@$remote_dev_server
cd /home/ubuntu/nepal-tourism/supabase/prod
$EDITOR .env
# Change SITE_URL to the primary Netlify frontend, e.g.
#   SITE_URL=https://nepal-admin.netlify.app
# Add every other frontend to ADDITIONAL_REDIRECT_URLS (comma-separated).
docker compose restart auth
```

GoTrue re-reads env on restart. No other containers need bouncing.

### 10b. SMTP not configured, email auto-confirm on

**What SMTP is.** The protocol GoTrue uses to send the emails from §10a. It needs real outbound credentials — SendGrid, Mailgun, Amazon SES, or a gmail app password. In `.env`:

```
SMTP_HOST=         # e.g. smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=         # e.g. apikey
SMTP_PASS=         # the actual secret
SMTP_ADMIN_EMAIL=  # "from" address
```

All four are currently blank.

**What `ENABLE_EMAIL_AUTOCONFIRM=true` means.** A shortcut that says "pretend the user already clicked the verification link."

- With `autoconfirm=false` (normal prod behaviour): GoTrue creates the user row with `email_confirmed_at = NULL`, sends a verification email. User cannot sign in until they click the link. If SMTP isn't configured, the email never goes out → nobody can ever sign in.
- With `autoconfirm=true` (bootstrap mode, active now): GoTrue creates the user row with `email_confirmed_at = now()` immediately and skips email. User can sign in right after signup.

Bootstrap mode is fine for:
- Local dev against this URL
- Seeding admin users from scripts
- Kicking the tires

**Risk of leaving it on.** Anyone who hits the signup endpoint with a fake email becomes a real user immediately. No ownership proof. That's bad for:

- Password-reset flows — reset emails go to the fake address, attacker gets control
- Abuse / rate limiting — no natural friction on sign-up
- Compliance / audit — you can't claim verified email addresses

**Fix.** When SMTP credentials exist:

```bash
$EDITOR /home/ubuntu/nepal-tourism/supabase/prod/.env
# Fill the five SMTP_* variables.
# Flip:
#   ENABLE_EMAIL_AUTOCONFIRM=false
docker compose restart auth

# Test: sign a real address up, check the inbox for the verification email.
```

### 10c. Admin seed scripts not yet run

**What they are.** Two TypeScript scripts in `database/scripts/`:

- `seed-admin-users.ts` — creates the five bootstrap admin accounts (`super@admin.com`, `district@admin.com`, `palika@admin.com`, `test@admin.com`, plus one more). Each needs a row in `auth.users` (managed by GoTrue) **and** a matching row in `admin_users` with role + region assignment.
- `enroll-palikas-tiers.ts` — picks a subscription tier for each of the 372 palikas and writes rows into `subscriptions` / `palika_tier_features`.

**Why they aren't plain SQL.** Creating an `auth.users` row can't be done via `INSERT` — GoTrue owns the password hash, unique-email invariant, and confirm-timestamp handling. The script uses `supabase.auth.admin.createUser()` via the `service_role` JWT. That in turn needs the stack to be reachable (it is, now).

**Why they weren't run during deploy.**

1. They need `SUPABASE_URL` + `SERVICE_ROLE_KEY` pointed at the live instance. Trivial to set, but worth letting you pick *when* real admin rows exist.
2. They ship with **dev passwords** (`super123456` etc.) meant for an offline local setup, not for an internet-reachable box.
3. Key/secret rotation is your concern, not mine — bootstrap users fall under the same principle.

**Current DB state (from §3).**

- Geography, roles, categories, tiers all seeded ✓
- **Zero rows in `auth.users`. Zero rows in `admin_users`.**
- Logging into admin-panel / platform-admin is not possible yet.

**Fix when ready.**

```bash
# From your laptop, inside the project repo
cd database
cp -n .env.example .env
$EDITOR .env
#   SUPABASE_URL=https://dev.kaha.com.np/tourism-supabase
#   SUPABASE_SERVICE_ROLE_KEY=<from supabase/prod/.env on remote>

npm install
npx tsx scripts/seed-admin-users.ts

# Then wire admin -> region mappings (required by RLS policies):
ssh ubuntu@$remote_dev_server \
  "docker exec -i nepal-tourism-db psql -U postgres -d postgres -c \
    \"INSERT INTO admin_regions(admin_id, region_type, region_id)
      SELECT id, 'palika', palika_id FROM admin_users WHERE palika_id IS NOT NULL
      ON CONFLICT DO NOTHING;\""

# Optional: tier enrolment
npx tsx scripts/enroll-palikas-tiers.ts
```

**Before running, decide.** Do you want the canned dev passwords in a live system, or should you adapt the script to take passwords from env / prompt? The dev defaults are in `seed-admin-users.ts` at the top — easy to find and change.

### 10d. Misc operational notes

- **Storage hostname:** confirm with a test upload + `getPublicUrl()` call once an app is wired up. If the returned URL is missing the `/tourism-supabase` prefix, set `STORAGE_BACKEND_URL` (or similar) in compose and restart.
- **JWT + API keys** are long-lived (10-year expiry). Rotation is manual: regenerate `.env`, re-render `volumes/kong.yml` via `envsubst`, `docker compose restart kong auth rest storage meta`, then update Netlify env vars.

## 11. Smoke-test commands (copy-paste)

```bash
# From anywhere with internet
ANON='<paste ANON_KEY>'

curl -sf -H "apikey: $ANON" \
  https://dev.kaha.com.np/tourism-supabase/auth/v1/health | jq .

curl -sf -H "apikey: $ANON" -H "Prefer: count=exact" \
  -D - -o /dev/null \
  'https://dev.kaha.com.np/tourism-supabase/rest/v1/palikas?select=id&limit=1' \
  | grep -i content-range
# expect:  content-range: 0-0/372

curl -sf https://dev.kaha.com.np/tourism-supabase/storage/v1/status
```
