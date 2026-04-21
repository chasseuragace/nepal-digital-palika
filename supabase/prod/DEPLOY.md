# Supabase — production deploy on kaha dev VPS

Minimum-change deploy of Nepal Digital Tourism's Supabase data plane onto the
shared kaha dev box, with frontends on Netlify hitting it over HTTPS.

- Topology: path-prefix on existing subdomain. No new DNS, no new TLS cert.
- Public URL: `https://dev.kaha.com.np/tourism-supabase`
- Services: 7 containers (no realtime / studio / analytics / pooler).
- Host port footprint: only `127.0.0.1:8010` (Kong, loopback-only).

## 0. Preconditions

- SSH access to the kaha dev box.
- Docker + docker-compose v2 on the box (already installed).
- `openssl` on your laptop (for key generation).
- Team owns the `dev.kaha.com.np` nginx vhost (they do).

## 1. Clone / rsync this project to the server

```bash
# On the server — pick a home off the shared project tree so it doesn't
# conflict with kaha-bus-booking etc.
mkdir -p /home/ubuntu/nepal-tourism
cd       /home/ubuntu/nepal-tourism

# Ship just the supabase/ subtree (not the whole repo).
# From your laptop:
rsync -avz --delete \
  ./supabase/ \
  ubuntu@$remote_dev_server:/home/ubuntu/nepal-tourism/supabase/
```

## 2. Fetch the upstream initdb fragments

Supabase's postgres image needs four SQL fragments on first boot to create
the `authenticator`, `anon`, `authenticated`, `service_role`,
`supabase_admin`, `supabase_auth_admin`, `supabase_storage_admin` roles and
the `realtime` / `supabase_functions` schemas.

They live in the upstream `supabase/supabase` repo; we don't vendor them.
Pin the commit so a deploy today and a redeploy in six months are identical.

```bash
cd /home/ubuntu/nepal-tourism/supabase/prod/volumes/db

# Pin to a known-good release tag (Supabase self-host 2026-Q1 snapshot).
TAG=v1.24.09   # bump only after re-testing

BASE=https://raw.githubusercontent.com/supabase/supabase/${TAG}/docker/volumes/db
for f in realtime.sql webhooks.sql roles.sql jwt.sql _supabase.sql; do
  curl -fsSL -o "$f" "$BASE/$f"
done
ls -la   # expect 5 files, none empty
```

## 3. Generate secrets and API keys

On your laptop:

```bash
cd supabase/prod
cp .env.example .env

# Random secrets
python3 -c 'import secrets; print("POSTGRES_PASSWORD="+secrets.token_urlsafe(32))' >> .env.new
python3 -c 'import secrets; print("JWT_SECRET="+secrets.token_urlsafe(48))'        >> .env.new
# (hand-edit .env to use those values, or merge)
```

Then mint the `anon` and `service_role` JWTs signed with `JWT_SECRET`.
The easiest path: open https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
paste your `JWT_SECRET`, copy the two JWTs back into `.env`.

Sanity check: `ANON_KEY` must decode (on https://jwt.io) with `{"role":"anon"}`
and `SERVICE_ROLE_KEY` with `{"role":"service_role"}`.

Set `SITE_URL` to the Netlify frontend URL of whichever app will do auth
redirects (usually admin-panel). Add all frontends to
`ADDITIONAL_REDIRECT_URLS`.

Ship the `.env` to the server (never committed):

```bash
scp .env ubuntu@$remote_dev_server:/home/ubuntu/nepal-tourism/supabase/prod/.env
chmod 600 /home/ubuntu/nepal-tourism/supabase/prod/.env  # on the server
```

## 4. Pre-flight: port + path collisions

Port 8010 must be free (used only by our Kong). Check:

```bash
ssh ubuntu@$remote_dev_server "ss -tlnp | grep ':8010 ' || echo FREE"
```

Path `/tourism-supabase/` must not already be claimed by another nginx
location. Check `sudo grep tourism-supabase /etc/nginx/sites-enabled/*`.

## 5. Bring the stack up

### 5a. Render `kong.yml` with real keys

Kong 2.8 does not interpolate `$VAR` inside the declarative config file.
`kong.yml` ships with `$SUPABASE_ANON_KEY` / `$SUPABASE_SERVICE_KEY`
placeholders; substitute them with the real JWTs from `.env` before
starting Kong, or Kong will register the literal strings as API keys
and every request will 401.

```bash
ssh ubuntu@$remote_dev_server
cd /home/ubuntu/nepal-tourism/supabase/prod

set -a; . ./.env; set +a
export SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_KEY=$SERVICE_ROLE_KEY

# Keep the template around for re-rendering after key rotation.
cp -n volumes/kong.yml volumes/kong.yml.template
envsubst < volumes/kong.yml.template > volumes/kong.yml

# Sanity: the `- key:` lines must now be eyJ...-shaped JWTs, not $VARs.
grep 'key: ey' volumes/kong.yml | head -2
```

### 5b. Start the containers

```bash
docker compose up -d
docker compose ps   # all 7 healthy within ~30s
```

Verify Kong is listening on loopback only:

```bash
ss -tlnp | grep 8010       # expect 127.0.0.1:8010, NOT 0.0.0.0:8010
```

Smoke-test Kong directly (skip nginx):

```bash
curl -sf -H "apikey: $ANON_KEY" http://127.0.0.1:8010/auth/v1/health | jq .
```

## 6. Apply migrations

This project's 54 migrations live in `supabase/migrations/`. We apply
them via `psql` directly against the containerised db — simpler than
linking the Supabase CLI for a one-shot deploy.

```bash
cd /home/ubuntu/nepal-tourism/supabase
# shellcheck disable=SC2046
docker exec -i nepal-tourism-db psql -U postgres -d postgres < <(cat migrations/*.sql seeds/*.sql)
```

If you prefer migration-by-migration to see which one failed:

```bash
for f in migrations/*.sql; do
  echo "-- $f --"
  docker exec -i nepal-tourism-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < "$f" || break
done
```

For the admin-user + tier-enrolment TypeScript seeds (`database/scripts/*.ts`),
run them from your laptop against the public endpoint once step 8 is done;
they only need `SUPABASE_URL` + `SERVICE_ROLE_KEY`.

## 7. Wire up nginx

Splice the location block from `supabase/prod/nginx-location.conf` into
the `dev.kaha.com.np` server block in `/etc/nginx/sites-enabled/dev.conf`.

```bash
sudo $EDITOR /etc/nginx/sites-enabled/dev.conf
# Paste the contents of nginx-location.conf inside the `server { ... }`
# block that has `server_name dev.kaha.com.np www.dev.kaha.com.np;`
# Keep it above any catch-all `location /` block.

sudo nginx -t && sudo systemctl reload nginx
```

## 8. Smoke-test the public URL

```bash
# (1) GoTrue health — no auth required
curl -sf https://dev.kaha.com.np/tourism-supabase/auth/v1/health | jq .
# expect: {"date":"2026-...","description":"GoTrue is a user registration and authentication API","name":"GoTrue","version":"v2.158.1"}

# (2) PostgREST root — needs the anon key as API gateway auth
ANON_KEY='...paste the anon JWT from .env...'
curl -sf -H "apikey: $ANON_KEY" https://dev.kaha.com.np/tourism-supabase/rest/v1/ | jq . | head -20

# (3) A seeded-data query
curl -sf -H "apikey: $ANON_KEY" \
  "https://dev.kaha.com.np/tourism-supabase/rest/v1/palikas?select=id,name_en&limit=3" | jq .
# expect: a 3-row array
```

All three green = deploy is validated.

## 9. Point the frontends at it

On Netlify (per site: admin-panel, platform-admin-panel, m-place), set
the build env vars. Nothing in the source code needs to change — every
client already reads these.

```
# admin-panel + platform-admin-panel
NEXT_PUBLIC_SUPABASE_URL=https://dev.kaha.com.np/tourism-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<the service_role JWT>   # server-only, NOT NEXT_PUBLIC

# m-place (Vite)
VITE_SUPABASE_URL=https://dev.kaha.com.np/tourism-supabase
VITE_SUPABASE_ANON_KEY=<the anon JWT>
```

Trigger a rebuild on each site. Once deployed, log in through the UI —
that exercises GoTrue + PostgREST + (optionally) Storage in one flow.

## 10. Backups

Append to `/home/ubuntu/backup-postgres.sh` (the existing rotation that
dumps to `/home/ubuntu/backups/`):

```bash
docker exec nepal-tourism-db pg_dumpall -U postgres \
  | gzip > /home/ubuntu/backups/nepal_tourism_$(date +%Y%m%d_%H%M%S).sql.gz
```

## Known caveats

- **Storage data is on the container host's disk**, not S3. Capacity is
  shared with every other project on the box. Watch
  `/var/lib/docker/volumes/nepal-tourism_nepal-tourism-storage-data`.
- **No email unless SMTP is configured.** With `ENABLE_EMAIL_AUTOCONFIRM=true`
  users are auto-verified, fine for dev but not production. For real
  email, fill SMTP_* in `.env` and flip autoconfirm off.
- **`dev.kaha.com.np` is shared dev infrastructure**, not a dedicated
  prod hostname. Moving to a dedicated subdomain later is a one-hour job:
  new DNS + certbot run, copy the location block into a new vhost,
  update Netlify env vars. Code changes: zero.
