# SQL Files Organization

## Directory Structure

```
supabase/
├── migrations/           # Versioned migrations (source of truth)
│   ├── 001-004/        # Core schema layer
│   ├── 006-034/        # Business logic layer
│   └── 036/            # RLS policies (single consolidated file)
│
├── seeds/              # Reference data and seeding
│   ├── subscription-tiers.sql
│   └── [other seeds]
│
├── seed.sql            # Main seed file
│
├── test-queries/       # SQL test utilities (not for prod)
│   └── test_permissions.sql
│
├── snippets/           # Archived/reference queries (not active)
│
├── config.toml         # Supabase config
├── MIGRATION_STRUCTURE.md   # How migrations are organized
└── SQL_ORGANIZATION.md      # This file
```

---

## Files Overview

### Active Files

| File | Purpose | Size | Status |
|------|---------|------|--------|
| `migrations/*` | Versioned schema changes | ~200KB | ✅ In use |
| `seed.sql` | Initial data seeding | ~3KB | ✅ Active |
| `seeds/subscription-tiers.sql` | Tier-specific seeding | ~1KB | ✅ Active |
| `config.toml` | Supabase local config | ~14KB | ✅ Config |

### Development Files

| File | Purpose | Location |
|------|---------|----------|
| `test-queries/test_permissions.sql` | Permission debugging | `test-queries/` |

### Archived/Reference

| File | Purpose | Status |
|------|---------|--------|
| `snippets/` | Old queries | Not used |

---

## Migration Organization

### Layer 1: Core Schema (Migrations 001-004)
```sql
-- Pure schema definitions
CREATE TABLE ...
CREATE INDEX ...
-- No RLS, no security policies
-- Just structure
```

### Layer 2: Business Logic (Migrations 006-034)
```sql
-- Schema + Functions + Triggers
CREATE TABLE ...
CREATE FUNCTION ...
CREATE TRIGGER ...
-- No RLS policies
-- Keep concerns together
```

### Layer 3: Security (Migration 036)
```sql
-- ONLY RLS policies
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...
-- All access control in one place
-- Easy to audit, test, maintain
```

---

## Seed File Hierarchy

### Primary Seed: `seed.sql`
- Default permissions
- Default roles
- Core reference data
- **Runs automatically** with `supabase db reset`

### Secondary Seeds: `seeds/subscription-tiers.sql`
- Tier definitions (Basic, Tourism, Premium)
- Feature mappings
- **Can be run manually** for tier updates

### Loading Seeds
```bash
# Seeds run automatically during:
supabase db reset

# To run specific seed:
psql postgresql://postgres@localhost:54322/postgres \
  -f supabase/seeds/subscription-tiers.sql
```

---

## Adding New SQL Files

### New Migration
1. **Create:** `supabase/migrations/20250301000NNN_description.sql`
2. **Follow pattern:** Layer 1/2/3 organization
3. **Rule:** No RLS in migration, add to 036 if needed

### New Seed
1. **Create:** `supabase/seeds/name.sql`
2. **Convention:** `INSERT INTO ... values;` format
3. **Documentation:** Add comment explaining purpose

### Test Query
1. **Create:** `supabase/test-queries/name.sql`
2. **Prefix:** `test_` or `debug_`
3. **Note:** Not auto-loaded, for manual testing

---

## Cleanup Done

| Item | Action | Result |
|------|--------|--------|
| `/admin-panel/supabase/` | Removed | ❌ Deleted (duplicate) |
| `/admin-panel/supabase/migrations/*` | Removed | ❌ Deleted (outdated) |
| `/admin-panel/supabase/seeds/*` | Removed | ❌ Deleted (duplicate) |
| `/supabase/snippets/Untitled query*` | Removed | ❌ Deleted (garbage) |
| `/admin-panel/test_permissions.sql` | Moved | → `test-queries/` |
| `/database/` | Noted | Old standalone project (not updated) |

---

## Consistency Rules

1. **One source of truth per concern**
   - Schema → migrations/
   - Data → seed.sql or seeds/
   - Tests → test-queries/
   - Policies → migration 036

2. **No duplication**
   - Remove /admin-panel/supabase/ ✅ Done
   - Remove old /database/ (if not needed)
   - Single /supabase/ for all SQL

3. **File naming**
   - Migrations: `YYYYMMDDNNNNN_description.sql`
   - Seeds: `descriptive-name.sql`
   - Tests: `test_descriptive.sql`

4. **Comments in files**
   - Include section headers
   - Document migration purpose
   - Link to related migrations

---

## Best Practices

✅ **DO**
- Put RLS in migration 036
- Put schema in appropriate layer (1/2/3)
- Document seed file contents
- Version migrations sequentially

❌ **DON'T**
- Mix RLS with schema migrations
- Create duplicate SQL files
- Leave garbage files in snippets
- Skip migration numbering

---

## File Locations

| What | Where |
|------|-------|
| Main migrations | `/supabase/migrations/` |
| RLS policies | `/supabase/migrations/20250301000036_*.sql` |
| Seed data | `/supabase/seed.sql`, `/supabase/seeds/` |
| Config | `/supabase/config.toml` |
| Test queries | `/supabase/test-queries/` |

