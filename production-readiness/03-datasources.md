# Datasources & Clean-Architecture Pattern

All three apps use a clean-architecture DI pattern so each can run offline against in-memory fixtures or live against Supabase.

## Pattern

```
Route / Page
   │
   ▼
Service (framework-agnostic use cases, returns ServiceResponse<T>)
   │
   ▼
IXxxDatasource (interface)
   │
   ├──► SupabaseXxxDatasource  (real)
   └──► FakeXxxDatasource       (in-memory fixtures)
            │
       selected by *-config.ts factory, reading an env flag
```

## Env flag per app

| App | Flag | Location |
|---|---|---|
| platform-admin-panel | `NEXT_PUBLIC_USE_FAKE_DATASOURCES` | [`platform-admin-panel/.env.local`](../platform-admin-panel/.env.local) |
| admin-panel | `NEXT_PUBLIC_USE_FAKE_DATASOURCES` | admin-panel env |
| m-place (Vite) | `VITE_USE_MOCK_DATA` (plus `import.meta.env.DEV` fallback) | m-place env; DI in [`m-place/src/di/container.ts`](../m-place/src/di/container.ts) |

## Where the code lives

### platform-admin-panel
- Interfaces + impls: [`platform-admin-panel/src/lib/datasources/`](../platform-admin-panel/src/lib/datasources/)
- Services: [`platform-admin-panel/src/services/`](../platform-admin-panel/src/services/)
- API routes: thin adapters at [`platform-admin-panel/src/app/api/`](../platform-admin-panel/src/app/api/)
- Env flag: `NEXT_PUBLIC_USE_FAKE_DATASOURCES` in [`platform-admin-panel/.env.local`](../platform-admin-panel/.env.local)

Entities covered: stats, admins, palikas, tiers, subscriptions, palikas-features, tier-assignment-log, businesses, feature-check. All connect via `supabaseServer` (service-role) when running against real DB.

### admin-panel
- Interfaces + impls: [`admin-panel/lib/*-datasource.ts`](../admin-panel/lib/) (`fake-*`, `supabase-*`, `*-config.ts`)
- Services: [`admin-panel/services/`](../admin-panel/services/)
- Mock auth is special-cased via a Proxy-wrapped `supabase` client: [`admin-panel/lib/supabase.ts`](../admin-panel/lib/supabase.ts) + [`admin-panel/lib/mock-supabase-auth.ts`](../admin-panel/lib/mock-supabase-auth.ts), controlled by `NEXT_PUBLIC_USE_MOCK_AUTH`.

### m-place
- Full clean-architecture layering (domain / data / services): [`m-place/src/domain/repositories/`](../m-place/src/domain/repositories/), [`m-place/src/data/datasources/`](../m-place/src/data/datasources/), [`m-place/src/services/`](../m-place/src/services/)
- DI container: [`m-place/src/di/container.ts`](../m-place/src/di/container.ts)
- Mock data: [`m-place/src/data/datasources/mock/`](../m-place/src/data/datasources/mock/) (includes `mock-auth-data.ts` with `MOCK_USERS` and localStorage persistence via `mockStorage`)

## Production implications

- **Fake datasources must not ship to prod bundles** — they are imported eagerly in every `*-config.ts`. Prod build should either tree-shake them out (verify with `next build` + bundle analysis) or guard the import behind a build-time constant.
- **`NEXT_PUBLIC_USE_FAKE_DATASOURCES` is a public env var** (prefixed `NEXT_PUBLIC_`). Anyone can toggle it in the browser; treat it as dev-only and hard-code `false` in prod builds.
- **Service-role key is server-side only** but currently lives in `.env.local` committed to the repo. Rotate and move to a secrets manager before any prod deploy.
- **Token maps / mutable state on `globalThis`** — the fake datasources use `globalThis` to survive Next.js HMR. Harmless in dev; should never run in prod, same as above.

## Adding a new entity (shortest path)

1. Define interface: `src/lib/datasources/<entity>-datasource.ts`
2. Real impl: `src/lib/datasources/supabase-<entity>-datasource.ts` (takes `SupabaseClient`)
3. Fake impl: `src/lib/datasources/fake-<entity>-datasource.ts` (in-memory fixtures; use `globalThis` for mutable state)
4. Factory: `src/lib/datasources/<entity>-config.ts` — reads `NEXT_PUBLIC_USE_FAKE_DATASOURCES`, **lazy-requires** the supabase impl so fake mode works with no Supabase env
5. Service: `src/services/<entity>.service.ts` — returns `ServiceResponse<T>`
6. Route: `src/app/api/<entity>/route.ts` — thin adapter

Canonical reference: the `stats` slice in platform-admin-panel.
