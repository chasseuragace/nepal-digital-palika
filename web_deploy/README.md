# web_deploy — Netlify deployment scripts

Reusable pipeline for shipping each of this repo's Next.js apps to Netlify.

## Requirements

- `NETLIFY_AUTH_TOKEN` in your environment (a personal access token).
  Add it to `~/.zshrc` once:

  ```zsh
  export NETLIFY_AUTH_TOKEN='<paste your PAT>'
  ```

- `node`, `npm`, `python3`, `curl`, `bash` on PATH.
- Supabase `.env` populated at `supabase/prod/.env` (the script reads
  `ANON_KEY`, `SERVICE_ROLE_KEY`, and `API_EXTERNAL_URL` from it).

## How to deploy

```bash
./web_deploy/deploy-to-netlify.sh web_deploy/sites/<site>.env
```

Example (platform-admin-panel):

```bash
./web_deploy/deploy-to-netlify.sh web_deploy/sites/digital-nep-platform-admin.env
```

What the script does, in order:

1. Verifies the PAT with Netlify (`GET /user`).
2. Looks up a site whose `name` matches the slug; creates it if missing.
3. Pulls `API_EXTERNAL_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` from the
   Supabase env file, plus any `EXTRA_ENV_*` from the site config, and
   publishes them as Netlify build/runtime env vars.
4. Runs `netlify deploy --build --prod --site=<id>` inside the app
   directory, letting `@netlify/plugin-nextjs` do its thing.

Idempotent — safe to re-run. Existing env vars are replaced; a new deploy
is pushed each time.

## Adding a new app

1. Make sure the app's directory has a `netlify.toml` with
   `[[plugins]] package = "@netlify/plugin-nextjs"`.
2. Drop a new `web_deploy/sites/<slug>.env`, e.g. for admin-panel:

   ```env
   NETLIFY_SITE_SLUG=digital-nep-admin
   PROJECT_DIR=admin-panel

   EXTRA_ENV_NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
   EXTRA_ENV_NEXT_PUBLIC_USE_MOCK_AUTH=false
   ```

3. Run `./web_deploy/deploy-to-netlify.sh web_deploy/sites/<slug>.env`.

## Site config schema

| Var | Required | Meaning |
|---|---|---|
| `NETLIFY_SITE_SLUG` | yes | Becomes `<slug>.netlify.app`. DNS-safe: letters, digits, hyphens. |
| `PROJECT_DIR` | yes | Repo-relative path containing `package.json` + `netlify.toml`. |
| `SUPABASE_ENV_FILE` | no | Defaults to `supabase/prod/.env`. |
| `EXTRA_ENV_<KEY>` | no | Any of these become `<KEY>=<value>` on Netlify. |

## What gets published automatically

These five env vars are always set on the Netlify site, derived from
`SUPABASE_ENV_FILE`:

- `NEXT_PUBLIC_SUPABASE_URL` ← `API_EXTERNAL_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← `ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← `SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL` ← `API_EXTERNAL_URL`    (harmless for Next; picked up by m-place)
- `VITE_SUPABASE_ANON_KEY` ← `ANON_KEY`         (same)

## Remember to update `SITE_URL` on the Supabase side

After the first production deploy of a frontend, add its Netlify URL to
the self-hosted Supabase `.env` so GoTrue's password-reset / email-confirm
links point to the right place:

```bash
ssh ubuntu@$remote_dev_server
cd /home/ubuntu/nepal-tourism/supabase/prod
$EDITOR .env
# Set SITE_URL=https://<slug>.netlify.app (the main login frontend)
# Append <slug>.netlify.app to ADDITIONAL_REDIRECT_URLS for any secondary frontend
docker compose restart auth
```

See `supabase/prod/DEPLOYMENT.md` §10a for context.
