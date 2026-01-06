# Orchestrator Notes

> **Role:** Human orchestrator coordinating AI-assisted development
> **Date:** January 5, 2026
> **Session:** Fresh context initialization

---

## Source of Truth Hierarchy

**Code > Seed > Schema Docs > Architecture Docs > Overview Docs**

```
┌─────────────────────────────────────────────────────────────┐
│  MOST CURRENT (Execute to see reality)                      │
├─────────────────────────────────────────────────────────────┤
│  08-admin-panel/services/    ← Current work                 │
│  07-database-seeding/        ← Generates SQL, seeds data    │
│                                 SOURCE OF TRUTH for schema  │
├─────────────────────────────────────────────────────────────┤
│  POSSIBLY STALE (May not reflect recent decisions)          │
├─────────────────────────────────────────────────────────────┤
│  03-technical-architecture/  ← May be lying                 │
│  04-schema-analysis/         ← Snapshot in time             │
├─────────────────────────────────────────────────────────────┤
│  INTENT & DIRECTION (Still relevant for "why")              │
├─────────────────────────────────────────────────────────────┤
│  01-project-overview/        ← Vision, stakeholders         │
│  02-business-commercial/     ← Business model, roadmap      │
│  05-operations/              ← User stories, workflows      │
└─────────────────────────────────────────────────────────────┘
```

### Why 07-database-seeding > sipabase_sql.md

The seed scripts **generate** the SQL that gets pasted into Supabase. The seed is the source, the SQL file is a derivative. When in doubt, read the seed.

### Why Architecture Docs Might Be Lying

Decisions made during development often don't get backported to architecture docs. The code is what actually runs. The docs are what we *intended* to build.

### Relevancy as Memory

Past stages don't disappear - they inform context. But their authority diminishes as newer stages override decisions:

```
Stage 01-02: "We planned to do X"
Stage 03-04: "We designed X this way"
Stage 07:    "We actually built X like this"  ← Current truth
Stage 08:    "We're building on top of X"     ← Where we are
```

---

## Documents Requiring Re-grounding

### 1. DASHBOARD-REQUIREMENTS.md ✅ Grounded (2026-01-05)

**Verified against:**
- `07-database-seeding/scripts/part1-basic-tables.sql`
- `07-database-seeding/scripts/part2-content-tables.sql`
- `08-admin-panel/services/analytics.service.ts`

**Key findings:**
- analytics.service.ts ~70% aligned with requirements
- Gaps: pending reviews moderation, SOS metrics, time-series, QR tracking

### 2. TRANSLATION-STRATEGY.md ✅ Decided

- EN first
- LLM-generated NE for frontend
- Review later

### 3. RBAC-CONCERNS.md ✅ Grounded (2026-01-05)

**Verified against:**
- `07-database-seeding/scripts/part1-basic-tables.sql`
- `08-admin-panel/services/auth.service.ts`

**Key findings:**
- Role fallback bug FIXED (empty array was truthy)
- 98 tests passing
- roles/permissions tables exist but unused (admin_users uses string enum)
- Palika scope enforcement NOT implemented
- RLS policies NOT implemented

---

## Immediate Actions Queue

### Priority 1: Fix Failing Tests ✅ DONE (2026-01-05)
```
Fixed: auth.service.ts (empty permissions array fallback)
Fixed: database-client.ts (select after insert/update)
Result: 98 tests passing
```

### Priority 2: Ground Dashboard Requirements ✅ DONE (2026-01-05)
```
Updated: thoughts_/dashboard-scope/DASHBOARD-REQUIREMENTS.md
Key gap: pending reviews, SOS, time-series, QR tracking
```

### Priority 3: Ground RBAC Concerns ✅ DONE (2026-01-05)
```
Updated: thoughts_/rbac/RBAC-CONCERNS.md
Key gaps: palika scope check, RLS policies, audit logging
```

### Priority 4: Next Steps (Suggested)
```
Option A: Implement palika_id scope check in hasPermission()
Option B: Add missing analytics (pending reviews, SOS metrics)
Option C: Build dashboard UI using analytics.service.ts [differed with DASHBOARD-UI-SPEC.md]()
t
```

---

## Working Mode

- **Read seed first** - It's the schema source of truth
- **Distrust old docs** - Verify against actual code
- **Past stages = memories** - They inform, but don't dictate

---

## Notes to Future Claude

1. **07-database-seeding > sipabase_sql.md** - Seed generates SQL
2. **Architecture docs may lie** - Check against actual implementation
3. **Current stage = authority** - Earlier stages are context, not commands
4. **Not everything is seeded yet** - Schema is work in progress

# Dashboard UI Spec - RLS Alignment Review

> **Reviewed:** January 5, 2026
> **Against:** `07-database-seeding/scripts/part3-rls-policies.sql`

## Summary

The Dashboard UI Spec is **mostly aligned** with RLS policies. Three issues need resolution:

---

## Issue 1: `support` Role Gap

**Dashboard Spec:**
```json
"accessRoles": ["super_admin", "palika_admin", "moderator", "support"]
```

**RLS Reality:**
```sql
-- Only these roles are handled:
'super_admin', 'palika_admin', 'moderator'
```

### Resolution Options

**Option A:** Add `support` to RLS as read-only
```sql
-- Add to each policy's USING clause:
OR (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
)
-- No WITH CHECK = read-only
```

**Option B:** Remove `support` from dashboard spec
```json
"accessRoles": ["super_admin", "palika_admin", "moderator"]
```

**Recommendation:** Option A - support role is useful for read-only inquiry tracking.

---

## Issue 2: Blog Posts Author Restriction

**RLS Reality:**
```sql
-- Moderators can only manage their OWN blog posts
author_id = auth.uid() AND
public.get_user_palika_id() = palika_id
```

**Dashboard Spec Implication:**
The spec shows "Blog Posts" count for the Palika, implying visibility of all posts.

### Resolution Options

**Option A:** Update RLS to allow moderators to see (but not edit) all Palika posts
```sql
-- SELECT policy: all Palika posts visible
-- UPDATE/DELETE policy: only own posts
```

**Option B:** Update dashboard spec to clarify "Your Blog Posts" vs "All Palika Posts"
```json
{
  "id": "blog_posts_mine",
  "label": "My Blog Posts",
  "source": { "filter": "author_id = current_user" }
},
{
  "id": "blog_posts_palika",
  "label": "Palika Blog Posts",
  "accessRoles": ["super_admin", "palika_admin"],  // Not moderator
  ...
}
```

**Recommendation:** Option A - moderators should see all Palika content for coordination, even if they can only edit their own.

---

## Issue 3: Public View Not Specified

**RLS Reality:**
```sql
-- Anonymous users can read published content
FOR SELECT USING (status = 'published')
```

**Dashboard Spec:**
No public/anonymous view defined.

### Resolution

This is likely intentional - the public view is the **website frontend**, not the admin dashboard. No change needed, but add a note:

```json
"views": {
  "public_website": {
    "note": "Public content display handled by frontend app, not admin dashboard",
    "accessRoles": ["anonymous"],
    "dataAccess": "published content only via RLS"
  },
  "palika_dashboard": { ... },
  "national_dashboard": { ... }
}
```

---

## Updated JSON Patch

Add to the dashboard spec:

```json
{
  "securityNotes": {
    "rlsAlignment": {
      "verified": "2026-01-05",
      "policyFile": "07-database-seeding/scripts/part3-rls-policies.sql",
      "knownGaps": [
        {
          "issue": "support role not in RLS",
          "status": "pending",
          "resolution": "Add read-only policy or remove from spec"
        },
        {
          "issue": "blog_posts author restriction",
          "status": "acknowledged",
          "behavior": "Moderators see own posts only, palika_admin sees all"
        }
      ]
    },
    "scopeEnforcement": {
      "mechanism": "RLS via get_user_palika_id()",
      "bypassRole": "super_admin",
      "scopedRoles": ["palika_admin", "moderator", "support"]
    }
  }
}
```

---

## Action Items

| Item | Priority | Owner | Status |
|------|----------|-------|--------|
| Decide on `support` role handling | High | Orchestrator | Pending |
| Clarify blog post visibility rules | Medium | Orchestrator | Pending |
| Add `securityNotes` to dashboard spec | Low | Developer | Ready |

---

## Verification Checklist

Before demo, verify:

- [ ] Login as `palika_admin` → sees only Kathmandu data
- [ ] Login as `super_admin` → sees all Palikas
- [ ] Login as `moderator` → sees own blog posts only (current RLS)
- [ ] Anonymous request → sees only published content
- [ ] Cross-Palika write attempt → blocked by RLS