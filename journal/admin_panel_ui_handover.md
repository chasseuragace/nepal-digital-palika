# Platform Admin Panel - Handover & Workflow Documentation

## Purpose & Scope

The **Platform Admin Panel** is an internal developer-facing tool for managing the multi-tenant Nepal Digital Tourism platform at the national level.

### What This Panel Does (Not Just Tier Management)

This is the **operational hub** for platform management when Narayan sells subscriptions to palikas/provinces:

#### 1. **Subscription Tier Assignment** ✅
   - When a Palika subscribes (via Narayan's sales pitch)
   - Admin assigns appropriate tier (Basic/Tourism/Premium)
   - This enables features based on tier

#### 2. **Admin User Creation** ⚠️ (NOT YET IMPLEMENTED)
   - **Current state:** Admins are seeded in Supabase Auth during development
   - **Needed:** In production, when a Palika signs up:
     - Admin creates auth user in Supabase (similar to seed logic)
     - Sets username/initial password
     - Palika's super-admin receives credentials
   - **Workflow:** Palika subscribes → Tier assigned → Auth user created → Credentials sent → Super-admin logs in

#### 3. **Role & Permission Management** ✅ (Partially)
   - View roles and permissions
   - **Missing:** Show which admin has which permissions (need to add)
   - When creating new admin: assign role → permissions auto-apply

#### 4. **Regional Hierarchy Management** ✅
   - View Province → District → Palika structure
   - Assign admins to regions
   - Track geographic coverage

#### 5. **Audit Trail** ✅
   - Every operation logged
   - Track who changed what, when
   - For security & debugging

#### 6. **Admin User Management** ⚠️
   - **Current:** View admins with their palika assignment
   - **Needed:**
     - Show permissions each admin has
     - Create new admins (auth user creation)
     - Update admin roles
     - Disable/enable admins
     - Delete admins (with caution)

---

## Business Flow: From Sale to Operational Admin

```
NARAYAN SALES CYCLE
↓
Customer (Palika/Province) decides to subscribe
↓
AJAY'S ADMIN PANEL
├─ Assign subscription tier (Basic/Tourism/Premium)
├─ Create super-admin user in Supabase Auth
│  (Email: received from customer)
│  (Password: generated or customer-provided)
├─ Assign permissions to super-admin role
└─ Send credentials to customer
↓
CUSTOMER'S PALIKA ADMIN PANEL
├─ Super-admin logs in
├─ Creates staff accounts
├─ Assigns roles to staff
└─ Manages content, heritage sites, events, businesses
```

---

## Key Workflow Components

### ✅ DONE
1. **Login system** - Dev credentials provided
2. **Subscription tier assignment** - UI functional
3. **Admin listing with location** - Shows Palika/District/Province
4. **Regional hierarchy** - Province → District → Palika
5. **Audit logging** - All operations tracked

### ⚠️ TODO - Critical for Production
1. **User creation in admin panel**
   - Create Supabase Auth user from admin panel
   - Similar to how we seeded test users
   - Generate temporary password or send invite link

2. **Show admin permissions**
   - Current view: Admin Name, Role, Location
   - Need to add: Permission list (what can they do?)
   - Visual indicator of permission scope

3. **Admin lifecycle management**
   - Edit admin details
   - Change role/permissions
   - Deactivate (instead of delete)
   - Delete (with confirmation)

4. **Bulk operations** (nice-to-have)
   - Bulk tier assignment
   - Bulk admin creation
   - Import/export admin data

---

## Concerns & Solutions

### **Concern 1: User Registration is Gated**
> "Registration is something we are not giving off just like that. First palika must come into subscription, only then they will get the credentials."

**Solution:**
- Registration API should check: `SELECT palika_has_feature(palika_id, 'self_service_registration')`
- Only create account if palika is subscribed AND has this feature
- In admin panel: create accounts directly (bypass registration)

### **Concern 2: How Do We Create Users?**
> "In test we created admin with supabase auth right? Can't we do something similar?"

**Yes! This is the pattern:**

```typescript
// In admin panel API endpoint (similar to seed)
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email: newAdmin.email,
  password: generateTemporaryPassword(), // or use customer's password
  email_confirm: true,
  user_metadata: { full_name: newAdmin.full_name }
})

// Then create admin_users record
await serviceClient.from('admin_users').insert({
  id: authData.user.id,  // Link to auth user
  full_name: newAdmin.full_name,
  role: newAdmin.role,
  palika_id: newAdmin.palika_id,
  is_active: true
})
```

### **Concern 3: Showing Admin Permissions**
> "In the admin listing, we should show what roles/permissions the admin has."

**Current table columns:**
- Name ✅
- Role ✅
- Location (Palika/District/Province) ✅
- Created ✅
- Actions ✅

**Need to add:**
- **Permissions** column or modal
  - Show as tags/pills
  - Expandable list
  - Visual indicator of scope (super_admin → all, palika_admin → regional, etc.)

Example display:
```
Admin Name          Role              Location                 Permissions
Super Admin         super_admin       Kathmandu, Bagmati      [all permissions] (national scope)
Palika Admin        palika_admin      Kathmandu Met., ...     [manage_heritage, manage_events, ...]
Content Moderator   moderator         Kathmandu Met., ...     [moderate_content, view_analytics]
```

---

## Test Credentials (Development Only)

All seeded via `database/scripts/seed-admin-users.ts`

| Role | Email | Password | Scope |
|---|---|---|---|
| Super Admin | superadmin@nepaltourism.dev | SuperSecurePass123! | National |
| Palika Admin | palika.admin@kathmandu.gov.np | KathmanduAdmin456! | Kathmandu Met. |
| Moderator | content.moderator@kathmandu.gov.np | ModeratorSecure789! | Kathmandu Met. |

**Seed data location:** `database/scripts/seed-admin-users.ts`

---

## Architecture: Why Service Role Key?

The platform admin panel uses **service role key** (server-side only) for database access because:

1. **Simplicity** - No RLS recursion issues
2. **Safety** - Internal tool only; anon key insufficient
3. **Control** - All user creation goes through API endpoints
4. **Audit** - Every action logged via admin user

**Login exists for:**
- Access control (keep non-developers out)
- Audit trail (track who did what)
- Consistency (same auth pattern as palika admin)

**Does NOT enforce RLS** - This is intentional for dev/internal tool

---

## Implementation Roadmap

### Phase 1: Now ✅
- [x] Login & auth system
- [x] Subscription tier assignment
- [x] Admin listing with location
- [x] Role management
- [x] Permission viewing
- [x] Audit log
- [x] Regional hierarchy

### Phase 2: Before Production 🔴
- [ ] **User creation in admin panel** (critical)
- [ ] Show admin permissions in listing
- [ ] Admin lifecycle (edit, deactivate, delete)
- [ ] Bulk operations
- [ ] API key system for service-to-service

### Phase 3: Production Ready 🟡
- [ ] Proper RLS policies
- [ ] Rate limiting
- [ ] Request signing
- [ ] Advanced audit with diffs
- [ ] Role-based access control per admin

---

## Next Steps for Aayush

1. **Test current features:**
   - Login with test credentials
   - Assign tier to a palika
   - View admin details with permissions

2. **Polish UI:**
   - Make tier assignment more visual
   - Improve admin listing (add permissions column)
   - Better error messages

3. **Build missing features:**
   - User creation endpoint
   - Admin creation form in UI
   - Permission display improvements

4. **Document for operations:**
   - Create quick-start guide for admin panel
   - Write runbook for onboarding new palika
   - Create troubleshooting guide

---

## Handoff Checklist

- [x] Auth system working
- [x] Test credentials documented
- [x] Tier management functional
- [x] Admin listing with location
- [x] Permissions visible in role management
- [ ] User creation implemented
- [ ] Permission column in admin listing
- [ ] Admin lifecycle management
- [ ] Production readiness review

---

## Questions & Decisions Needed

1. **User creation UX:** Should we:
   - Generate temporary password?
   - Send invite link?
   - Use customer's own password?

2. **Bulk operations:** Do we need bulk tier assignment or is individual assignment fine?

3. **Admin deletion:** Soft delete (deactivate) or hard delete? Audit trail considerations?

4. **Regional assignment:** Can an admin manage multiple regions or only one?

---

## References

- **Seed script:** `database/scripts/seed-admin-users.ts`
- **API endpoints:** `platform-admin-panel/src/app/api/`
- **Admin UI:** `platform-admin-panel/src/app/admins/page.tsx`
- **Auth system:** `platform-admin-panel/src/lib/auth-store.ts`
- **README:** `platform-admin-panel/README.md`
