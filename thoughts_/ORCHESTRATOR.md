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