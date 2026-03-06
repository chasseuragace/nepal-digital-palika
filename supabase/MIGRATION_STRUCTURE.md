# Database Migration Structure

## Organization Philosophy

**Separation of Concerns:** Each migration has a single responsibility.

```
Migrations → Schema → Functions → Triggers → RLS Policies
  (in order of dependency)
```

---

## Migration Layers

### Layer 1: Core Tables (001-004)
Basic table definitions, no RLS, no policies.

| Migration | Purpose |
|-----------|---------|
| 001 | Basic tables (provinces, districts, palikas, roles, permissions) |
| 002 | Content tables (heritage_sites, events, businesses, blog_posts, reviews, SOS requests) |
| 003 | Initial RLS setup (deprecated - replaced by 036) |
| 004 | Hierarchical admin structure + helper functions (get_user_role, user_has_access_to_palika, etc.) |

### Layer 2: Business Logic (006-035)
Tables, functions, indexes, triggers. **NO RLS POLICIES**.

| Migration | Purpose |
|-----------|---------|
| 006 | Audit triggers |
| 007 | Admin user role constraints |
| 008 | Seed permissions and role mappings |
| 009 | Fix user_has_permission function |
| 010 | Fix audit log entity_id type |
| 011 | Fix RLS functions |
| 012-015 | Various RLS function fixes (logic, not policies) |
| 020-033 | Business features (subscriptions, tiers, businesses, approval workflows) |
| 034 | Subscription tier tables + helper functions + triggers |

### Layer 3: Security - RLS Policies (036)
**SINGLE SOURCE OF TRUTH for all access control**

**Migration 036:** `consolidated_row_level_security.sql`

All RLS policies in one migration:
- ✅ Admin access (hierarchical)
- ✅ Public/authenticated access
- ✅ Super admin bypass
- ✅ Audit and system table access
- ✅ Grant statements

**Benefits:**
- Easy to audit all access rules
- No duplication across migrations
- Single place to understand security model
- Easy to test and validate

---

## Current Migration Count

```
001-004:  Core schema + hierarchical admin setup
006-034:  Business logic (schema, functions, triggers, NO RLS)
036:      All RLS policies consolidated
───────────────────────────────────────────────
Total: 31 active migrations (clean, organized)
```

---

## Adding New Features

### New Table:
1. Add table definition to appropriate migration (or create new 037+)
2. Add indexes and constraints
3. Add helper functions if needed
4. **DO NOT** add RLS policies here

### New Access Control Rule:
1. Add to migration 036 in appropriate section
2. Follow existing pattern (public → admin → super_admin)
3. Test with property-based tests

### New Trigger:
1. Add to appropriate business logic migration
2. Keep schema and logic together
3. Reference migration 036 for any RLS dependencies

---

## Removed Migrations

These were consolidated into 036:
- ❌ Migration 035 (old consolidated RLS)
- ❌ Duplicate migrations from /admin-panel/supabase (outdated)
- ❌ /database folder (old standalone project)

---

## How to Modify RLS

**All RLS modifications happen in migration 036.**

1. Make your changes to `020250301000036_consolidated_row_level_security.sql`
2. Re-run `supabase db reset`
3. Test with property-based tests
4. Commit to main

---

## Migration Testing

Run the test suite after any migration changes:

```bash
# Run all tests
npm test

# Check for RLS failures
npm test 2>&1 | grep FAIL
```

Expected: ~95%+ pass rate after recent consolidation.

---

## File Locations

- **Active migrations:** `/supabase/migrations/`
- **RLS policies:** Migration 036 (single file)
- **Business logic:** Migrations 006-034
- **Schema definitions:** Migrations 001-004
- **Test config:** `/admin-panel/vitest.config.ts`

---

## Maintenance Checklist

- [ ] New migrations follow Layer 1/2/3 pattern
- [ ] RLS changes only in migration 036
- [ ] No RLS in migrations 001-035
- [ ] Tests pass after any RLS change
- [ ] Function signatures match RLS usage
- [ ] Audit triggers properly capture changes
- [ ] GRANT statements in migration 036

