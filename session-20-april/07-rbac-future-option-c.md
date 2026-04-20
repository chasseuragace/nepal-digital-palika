# RBAC — Runway to Option C

Today we rejected half-measure UI that pretended to control authorization. The database already contains the tables a proper RBAC needs; the wiring between `admin_users` and those tables was never finished. This note records what was intended, what's currently functional, and the critical implementation that must land when Option C is picked up.

## Current state (post-session-20-april)

- `admin_users.role` is a `VARCHAR CHECK IN ('super_admin','palika_admin','moderator','support')` — **this is the load-bearing source of truth today**.
- `admin_users.permissions` is a JSONB array edited directly per-user on `/admins/[id]`.
- `/admins/new` uses a hardcoded `ADMIN_ROLES` constant mirroring the CHECK enum, with a comment pointing back to the migration.
- Tables `roles`, `permissions`, `role_permissions` are present and seeded, but **no application code outside the deleted UI reads from them**. They are runway for Option C.
- RLS helpers (`get_user_role()`, `user_has_permission()`) hardcode role strings — they do NOT join `role_permissions`.

## The design that was never finished

Three documents in this repo describe the target architecture. Read them before resuming Option C:

1. **`docs/04-database-design/HONEST_SCHEMA_GAPS.md`** — declares the current `admin_users.role` / `permissions` model "❌ MISSING" proper RBAC and prescribes the migration:
   ```sql
   ALTER TABLE admin_users ADD COLUMN role_id INTEGER REFERENCES roles(id);
   ```
2. **`docs/MULTI_TENANT_HIERARCHY_ANALYSIS.md`** — explicitly flags: *"Permissions table is unused in actual access control"*, *"RLS policies hardcode role names"*, and motivates the hierarchy levels (`national`, `province`, `district`, `palika`) added by migration `20250126000004`.
3. **`docs/ADMIN_PANEL_SPECIFICATION.md`** §3 (Role Management) and §4 (Permission Management) — the UI spec that the deleted `/roles` and `/permissions` pages were built to. They were correct against the spec; only the database wiring never caught up.

## The zombie-table inventory

| Table | Purpose | Status |
|---|---|---|
| `roles` | id, name, hierarchy_level, description, description_ne | Seeded with 8 roles; CHECK on `admin_users.role` only accepts 4 of them. |
| `permissions` | id, name, resource, action, description, description_ne | Seeded with ~12 permissions; never consulted by RLS. |
| `role_permissions` | M:N join | Seeded; never joined in RLS. |

The seed drift (8 vs 4) is the key evidence that the RBAC tables and the `admin_users.role` CHECK are different sources of truth. Option C aligns them.

## Option C — the migration + code work

### Schema
1. `ALTER TABLE admin_users ADD COLUMN role_id INTEGER REFERENCES roles(id)`.
2. Backfill `role_id` from existing `admin_users.role` string matches.
3. Decide: drop `admin_users.role` VARCHAR (and its CHECK) OR keep it as a denormalized cache. Dropping is cleaner.
4. Decide: drop `admin_users.permissions` JSONB (permissions derive from `role_id → role_permissions → permissions`) OR keep it for per-user overrides. Dropping is cleaner.
5. Rewrite `public.get_user_role()` to `SELECT r.name FROM admin_users a JOIN roles r ON a.role_id = r.id WHERE a.id = auth.uid()`.
6. Rewrite `public.user_has_permission(name)` to join through `role_permissions`.
7. Audit every RLS policy that references role strings and regenerate against the new helper.

### Admin-panel code
1. `/admins/new` — replace the hardcoded `ADMIN_ROLES` constant with a fetch from `/api/roles` (restore `lib/client/roles-client.service.ts`).
2. Restore `/roles` and `/permissions` pages + their API routes (git revert from the commit that deleted them, then rewire to the new authoritative schema).
3. Add scope-enforced admin creation (see next section — this is the critical piece).
4. Add property-based tests covering every role × hierarchy × region combination (mirroring the pattern already in `admin-panel/services/__tests__/properties/permission-based-access-control.property.test.ts`).

## The critical implementation — scope-enforced admin creation

**Today's admin-create endpoint does NOT verify the caller's authority to create the target.** Any user who reaches `/api/admins/create` (authenticated through the admin panel) can currently pass any payload they like, and the service-role key executes it. This is a privilege-escalation hole. It must be closed when Option C ships.

### Hierarchy model
Per migration `20250126000004`:
- `national` — can manage admins of any hierarchy level
- `province` — manages `district` and `palika` within their assigned province
- `district` — manages `palika` within their assigned district
- `palika` — manages `moderator` / `support` within their assigned palika only

### The five rules the API route must enforce

Every rule is evaluated server-side, **before** `supabase.auth.admin.createUser()` runs.

1. **Caller is authenticated and active.** `auth.uid()` resolves to an `admin_users` row with `is_active=true`.
2. **Target role ≤ caller's role.** A `palika_admin` cannot create a `palika_admin` or higher. Only `super_admin` may create admins of any role. A content_editor can never create a palika_admin.
3. **Target hierarchy_level ≤ caller's hierarchy_level.** A `province` caller cannot create a `national` target. A `district` caller cannot create a `province` target.
4. **Target region is inside caller's scope.**
   - Palika caller: `target.palika_id === caller.palika_id`.
   - District caller: `target.palika_id` must belong to `caller.district_id`.
   - Province caller: `target.district_id` must belong to `caller.province_id`.
   - National caller: unrestricted.
5. **Target permissions ⊆ caller's own permissions.** A caller cannot grant a permission they don't themselves hold (prevents "create an admin with more power than me, then have them promote me").

### Why this cannot be done client-side
The service role key bypasses RLS. The Next.js API route runs server-side and has it. Therefore **the route is the trust boundary** — every rule above must be verified there, using the caller's session (not just `auth.uid()`), before the mutation is executed. A client-side dropdown that hides options from the UI is cosmetic and cannot be relied upon.

### Same rules apply to
- `PUT /api/admins/[id]` (role upgrade = privilege escalation)
- `POST /api/admins/[id]/delete` (cannot delete peers or superiors)
- `PUT /api/admins/[id]/permissions` (cannot grant what caller doesn't hold)
- `POST /api/admins/[id]/regions` (cannot assign regions outside caller's scope)

## Checklist when Option C is resumed

- [ ] Migration: add `admin_users.role_id` FK + backfill + rewrite RLS helpers.
- [ ] Drop or cache `admin_users.role` and `admin_users.permissions` (decide per above).
- [ ] Restore `/roles` and `/permissions` pages via `git revert` of the deletion commit; rewire fetch to new schema.
- [ ] Replace the hardcoded `ADMIN_ROLES` constant in `/admins/new` with `rolesService.getAll()`.
- [ ] Implement the 5 scope-enforcement rules in `/api/admins/create`, `/admins/[id]` PUT/DELETE, and any permission/region mutation endpoint.
- [ ] Property tests: for every (caller_role, caller_hierarchy, caller_region) × (target_role, target_hierarchy, target_region), assert allow/deny.
- [ ] Update `HONEST_SCHEMA_GAPS.md` status: ❌ MISSING → ✅ COMPLETE.

## Git breadcrumbs

The deletion commit (filled in at commit time) contains the removed `/permissions`, `/roles`, `lib/client/permissions-client.service.ts`, `lib/client/roles-client.service.ts`, and their API routes. Restoring them is a `git revert <that-sha>` starting point — then rewiring to the post-Option-C schema.
