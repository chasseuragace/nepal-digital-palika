# RBAC — Palika-Scope Enforcement Shipped

Follow-up to `07-rbac-future-option-c.md`. Scope was deliberately narrowed after a product call: this admin-panel serves palika-level users only (palika_admin + the content team). Platform-level role management (super/province/district roles, the `/roles` and `/permissions` UI, the `role_id` schema migration) lives on a separate branch and is sold as an advanced tier.

## What shipped on `main`

### Phase 1 — Server-side session
- `admin-panel/lib/server/session.ts` — HMAC-SHA256 signed cookie, 8h TTL, `HttpOnly`, `SameSite=Lax`, `Secure` in production. Pure Node `crypto`, no new deps.
- `admin-panel/app/api/auth/login/route.ts` — sets `admin_session` cookie on successful login. Cookie payload: `{ sub, role_name, hierarchy_level, palika_id, district_id, province_id, iat, exp }`.
- `admin-panel/app/api/auth/logout/route.ts` — clears the cookie. Wired into `AdminLayout.handleLogout`.
- `admin-panel/app/api/auth/me/route.ts` — resolves caller from cookie, returns full `CallerContext`.
- Mock-auth parity: when `NEXT_PUBLIC_USE_MOCK_AUTH=true`, the same cookie is issued for mock users, and `getCallerFromRequest` resolves from `MOCK_ADMIN_USERS`. Added a `province_admin` mock entry and aligned all mock region IDs with `lib/fake-regions-datasource.ts`.
- Secret: `ADMIN_SESSION_SECRET` env var required (≥32 chars) outside mock mode.

### Phase 2 — Scope-enforced admin CRUD
- `admin-panel/lib/server/rbac.ts` — `assertCallerCanCreate`, `assertCallerCanUpdate`, `assertCallerCanDelete`. Rules:
  1. Caller authenticated and `is_active`.
  2. Caller role must be `palika_admin` (super_admin bypasses for emergency access).
  3. Target role must be in `PALIKA_MANAGEABLE_ROLES = {palika_admin, moderator, content_editor, content_reviewer, support_agent}`.
  4. Target `hierarchy_level` must be `'palika'`.
  5. Target `palika_id` must equal caller's `palika_id`.
  - Update path re-runs the rules against the proposed new values; delete path forbids self-delete and deleting platform admins.
- Wired into `POST /api/admins/create`, `PUT /api/admins/[id]`, `POST /api/admins/[id]/delete`, and `GET /api/admins` (list is scoped to caller's palika for palika_admin; super_admin sees all; content team denied 403).
- `/admins/new` page rewritten: hierarchy is locked to `palika`, the regional assignment UI is replaced by a read-only display of the caller's own palika, and the role dropdown only offers palika-manageable roles.

### Phase 5 — Tests
- `services/__tests__/unit/rbac.test.ts` — 22 tests covering every rule plus three fast-check property tests (non-palika_admin caller always denied; platform-role target always denied; cross-palika always denied).
- `services/__tests__/unit/session.test.ts` — 5 tests covering sign/verify round-trip, tampered body/signature rejection, malformed tokens, expired tokens.

All 27 tests pass. Run with `npx vitest run services/__tests__/unit/rbac.test.ts services/__tests__/unit/session.test.ts`.

## Corrections to `07-rbac-future-option-c.md`

Two claims in that doc were off, worth noting so nobody plans against them:

1. `admin_users.role` CHECK constraint. 07 said "accepts 4 values." Migration `20250126000007` widened it to 9 values (`super_admin, province_admin, district_admin, palika_admin, moderator, support_agent, content_editor, content_reviewer, support`). The legacy `support` is still accepted but no longer seeded in `roles`.
2. "Permissions table is unused in actual access control." `user_has_permission()` in migration `20250126000004` already joins through `admin_users.role = roles.name → role_permissions → permissions`. The mechanism works — the gap is that `admin_users.permissions JSONB` is cosmetic and `admin_users.role_id` doesn't exist. That part of 07 stands.

Also **not** flagged in 07: the admin-panel had no server-readable session. Login returned JSON, the client stored it in `localStorage`, no cookie was set, no middleware existed. Server-side authorization of any kind was impossible until Phase 1 above landed.

## What's deferred to the Option C Full branch

Everything below is out of scope on `main` and will be implemented on a follow-up branch (advanced tier):

- **Schema migration**: `ALTER TABLE admin_users ADD COLUMN role_id INTEGER REFERENCES roles(id)`, backfill, rewrite `get_user_role()` and `user_has_permission()` to go through `role_id`, drop `admin_users.role` VARCHAR and `admin_users.permissions` JSONB, audit every RLS policy that references role strings.
- **Restore `/roles` and `/permissions` pages** via `git revert 8ecbb89`, rewired to the new schema.
- **Hierarchical admin creation** from the admin-panel (super/province/district roles, multi-region assignment, cross-palika scope) — currently these targets are rejected by Phase 2 with `rule-3-target-role-platform`.
- **Property tests for the full hierarchy matrix** — the test file on main covers only the palika-scope subset.

## Verification (manual, on `main`)

1. `npm run dev` with `NEXT_PUBLIC_USE_MOCK_AUTH=true`.
2. Log in as `palika@admin.com` / `palika123456`. DevTools → Application → Cookies: confirm `admin_session` is `HttpOnly` + `SameSite=Lax`.
3. `GET /api/auth/me` → returns caller context including `permissions`.
4. Navigate to `/admins/new`: the role dropdown shows only the 5 palika-manageable roles; the palika is locked to "Kathmandu Metropolitan".
5. `curl -X POST -H "Content-Type: application/json" --cookie "admin_session=<token>" -d '{"email":"x@y.com","full_name":"X","role":"super_admin","hierarchy_level":"national"}' http://localhost:3000/api/admins/create` → 403 citing `rule-3-target-role-platform`.
6. Same payload with `role: "moderator"`, `hierarchy_level: "palika"`, `palika_id: 5` → 201.
7. Log out: cookie cleared.
8. `POST /api/admins/create` without cookie → 401 citing `rule-1-authentication`.
