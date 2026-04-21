# Platform Admin Panel

**What:** Internal developer panel. Manages admins, palikas, subscription tiers, business approvals, audit log.

**Who:** Platform engineers. Not exposed to citizens or palika staff.

## Posture

- **No login screen.** All routes use the Supabase service-role key, bypassing RLS. Access is controlled at the deploy boundary (VPN, IP allowlist, SSO proxy — not in-app).
- Reference: [`platform-admin-panel/README.md`](../platform-admin-panel/README.md) section "Why service role?"
- Removed auth surface: login page, `/api/auth/*`, auth stores, auth initializer, AuthLoadingScreen. See git history for the commit that ripped it out.

## Running

### Offline (fake datasources, no Supabase)

```bash
cd platform-admin-panel
# .env.local already has NEXT_PUBLIC_USE_FAKE_DATASOURCES=true
npm run dev -- -p 3002
```

All 18 API routes return in-memory fixtures. Useful for UI dev and demos.

### Against real Supabase

```bash
# make sure Supabase is running + seeded — see 01-setup.md
# flip the flag
sed -i '' 's/NEXT_PUBLIC_USE_FAKE_DATASOURCES=true/NEXT_PUBLIC_USE_FAKE_DATASOURCES=false/' platform-admin-panel/.env.local
npm run dev -- -p 3002
```

## Env vars

Location: [`platform-admin-panel/.env.local`](../platform-admin-panel/.env.local)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | API URL (`http://127.0.0.1:54321` locally) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key — present for client-side supabase imports that linger elsewhere |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** service-role key used by every datasource |
| `NEXT_PUBLIC_USE_FAKE_DATASOURCES` | `true` = fixtures, `false` = Supabase |

## API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/stats` | GET | Dashboard counts + recent audit activity |
| `/api/admins` | GET, POST | List / create admins (auth.users + admin_users + admin_regions) |
| `/api/admins/[id]` | GET, DELETE | Read / delete one admin |
| `/api/tiers` | GET | Tiers with feature counts |
| `/api/palikas/tiers` | GET | Palikas with tier join (filters, pagination) |
| `/api/subscriptions/tiers` | GET | Tiers with full feature lists |
| `/api/subscriptions/palikas` | GET, PATCH | Palika tier view / update |
| `/api/tier-assignment-log` | GET | Tier change audit log |
| `/api/palikas-features` | GET | Features available to a palika's tier |
| `/api/businesses/approvals` | GET | Pending / draft businesses |
| `/api/businesses/register` | POST | New business registration (tier-gated) |
| `/api/businesses/[id]/approval-details` | GET | Full business + notes + workflow rules |
| `/api/businesses/[id]/approval-notes` | GET, POST | Internal review notes |
| `/api/businesses/[id]/approval-status` | PUT | Approve / reject / request-changes |

## Production readiness (this panel specifically)

| Item | Status |
|---|---|
| Offline mode works | ✅ |
| Real Supabase mode works | ✅ (all 18 routes green) |
| Auth removed | ✅ |
| Clean-arch DI pattern | ✅ |
| Fake datasources tree-shake out of prod bundle | ❓ (verify with bundle analyser) |
| Service-role key in secrets manager | ❌ (currently in `.env.local`) |
| Access control at deploy layer (VPN / SSO) | ❌ (not yet wired) |
| Audit trail populated for platform actions | ⚠️ (triggers exist; some routes don't set `admin_id`) |
| Schema-route field name alignment | ⚠️ (businesses/register still has API↔DB field mapping quirks; see [05-known-issues.md](./05-known-issues.md)) |
| Test coverage | ❌ |

See [05-known-issues.md](./05-known-issues.md) for the full blocker list.
