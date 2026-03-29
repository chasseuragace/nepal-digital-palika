# Phase 7: Quick Start Guide

**Date:** 2026-03-29
**Status:** 🟢 READY TO IMPLEMENT
**Roadmap:** Phase 7 Prioritized (Phase 6 Deferred)

---

## 🎯 YOU ARE HERE

```
Phase 5 ✅ COMPLETE (Setup Automation)
   ↓
Phase 6 ⏸️  DEFERRED (Analytics, Approval Workflows)
   ↓
Phase 7 🔵 NEXT (Tourism Content in M-Place)
   ├─ Heritage Sites ← START HERE (simplest)
   ├─ Events & Festivals
   ├─ Blog Posts & Stories
   ├─ Local Services Directory
   └─ SOS Emergency Information
   ↓
Tier-Gating Session 📅 FUTURE (Standardization)
```

---

## 📚 DOCUMENTATION CREATED THIS SESSION

You now have 4 comprehensive documents grounding Phase 7 implementation:

### 1. **PHASE_7_ROADMAP.md** (Overview)
   - Why Phase 7 is prioritized over Phase 6
   - Technical approach: reference admin-panel patterns
   - Clean architecture for m-place
   - Phase 7 content types definition
   - Future tier-gating session topics

### 2. **PHASE_7_DATA_LAYER_PATTERNS.md** (Reference)
   - DatabaseClient interface (framework-agnostic)
   - Admin-panel service layer patterns
   - Heritage Sites service (complete example)
   - Events service (with date-range filtering)
   - Blog Posts service (with search and tags)
   - API route pattern
   - Pagination (offset-based)
   - Testing with mock datasource

### 3. **PHASE_7_IMPLEMENTATION_ROADMAP.md** (Step-by-Step)
   - Implementation template (8-file pattern)
   - DTOs, datasources, repositories, services, components
   - DI container integration
   - Complete heritage sites example
   - Why this order (heritage sites first)
   - Quick start for heritage sites (10 concrete steps)
   - Supabase integration pattern
   - Phase 7 completion criteria

### 4. **PHASE_7_SUPABASE_SCHEMAS.md** (Reference)
   - Exact heritage_sites table structure (all 30 columns)
   - Exact events table structure (date filtering ready)
   - Exact blog_posts table structure (categories and tags)
   - Businesses table (for local services)
   - SOS_requests table (for emergency info)
   - Query patterns from admin-panel
   - RLS policies for public access
   - Key relationships between tables
   - Typical m-place queries (calendar, search, filtering)

---

## 🚀 NEXT STEPS (In Order)

### Step 1: Read Documentation (15 mins)

Read in this order:
1. PHASE_7_QUICK_START.md (this file)
2. PHASE_7_ROADMAP.md
3. PHASE_7_SUPABASE_SCHEMAS.md (reference)
4. PHASE_7_IMPLEMENTATION_ROADMAP.md (step-by-step)

### Step 2: Prepare M-Place (15 mins)

```bash
# Navigate to m-place
cd m-place

# Verify structure
ls -la src/
# Should see: core/, data/, di/, domain/, pages/, services/, etc.

# Verify DI container
cat src/di/container.ts | head -50
# Should see pattern: getXyzDatasource() → getXyzRepository()

# Verify package.json has Supabase dependency
grep supabase package.json
```

### Step 3: Start Heritage Sites (3-4 hours)

Follow **PHASE_7_IMPLEMENTATION_ROADMAP.md** step-by-step, starting with:

**Create 8 files in order:**

1. `src/core/dtos/heritage-site.dto.ts` (4 interfaces)
   - Use template from roadmap
   - Reference PHASE_7_SUPABASE_SCHEMAS.md for field names

2. `src/domain/repositories/heritage-site.datasource.ts` (1 interface)
   - IHeritageSiteDatasource
   - Define methods: getHeritageSites, getById, getBySlug, getPopular

3. `src/data/datasources/mock/mock-heritage-site.datasource.ts` (1 class)
   - MockHeritageSiteDatasource
   - Use hardcoded mock data for 2-3 sites
   - Implement all interface methods

4. `src/data/repositories/heritage-site.repository.ts` (2 classes)
   - IHeritageSiteRepository interface
   - HeritageSiteRepository implementation
   - Simply delegates to datasource

5. `src/di/container.ts` (Add 2 methods)
   - getHeritageSiteDatasource()
   - getHeritageSiteRepository()
   - Update reset() method

6. `src/services/heritage-site.service.ts` (1 class)
   - HeritageSiteService singleton
   - Methods delegate to repository via DI container
   - Export default instance

7. `src/components/HeritageSiteCard.tsx` (1 component)
   - Display single heritage site
   - Show image, name, description, link

8. `src/components/HeritageSiteList.tsx` (1 component)
   - Use heritageSiteService to load sites
   - Render paginated list using HeritageSiteCard

### Step 4: Create Page & Route (30 mins)

1. Create `src/pages/HeritageSites.tsx`
   - Use HeritageSiteList component
   - Get current palika ID
   - Handle loading/error states

2. Update `src/App.tsx`
   - Add route: `/heritage-sites` → HeritageSites page
   - Add navigation link

### Step 5: Test with Mock Data (30 mins)

```bash
# Start dev server with mock mode
VITE_USE_MOCK_DATA=true npm run dev

# Navigate to localhost:5173/heritage-sites
# Verify sites display correctly
# Check browser console for errors
```

### Step 6: Connect to Real Supabase (1-2 hours)

1. Create `src/data/datasources/supabase-heritage-site.datasource.ts`
   - Implement IHeritageSiteDatasource
   - Use query patterns from PHASE_7_SUPABASE_SCHEMAS.md
   - Copy patterns from admin-panel (same queries)

2. Update DI container to choose real datasource when needed

3. Test with real data:
   ```bash
   VITE_USE_MOCK_DATA=false npm run dev
   # Verify real data loads
   ```

### Step 7: Repeat for Other Content Types (8-10 hours)

After heritage sites works:

1. Events & Festivals (4 hours)
   - Use same 8-file pattern
   - Add date-range filtering
   - Add festival filter
   - Reference admin-panel's EventsService

2. Blog Posts & Stories (3 hours)
   - Use same 8-file pattern
   - Add category/tag filtering
   - Reference admin-panel's BlogPostsService

3. Local Services Directory (2 hours)
   - Use same 8-file pattern
   - Filter existing businesses table
   - Add service type filtering

4. SOS Emergency Information (2 hours)
   - Use same 8-file pattern
   - Simpler data model
   - Show active emergencies

---

## 📋 FILES TO CREATE (Summary)

**Total: ~40 files, ~2500 lines of code**

```
Heritage Sites (8 files, ~400 LOC)
├─ src/core/dtos/heritage-site.dto.ts
├─ src/domain/repositories/heritage-site.datasource.ts
├─ src/data/datasources/mock/mock-heritage-site.datasource.ts
├─ src/data/datasources/supabase-heritage-site.datasource.ts (later)
├─ src/data/repositories/heritage-site.repository.ts
├─ src/services/heritage-site.service.ts
├─ src/components/HeritageSiteCard.tsx
├─ src/components/HeritageSiteList.tsx
├─ src/pages/HeritageSites.tsx
└─ Update src/di/container.ts + src/App.tsx

Events & Festivals (8 files, ~450 LOC)
├─ src/core/dtos/event.dto.ts
├─ src/domain/repositories/event.datasource.ts
├─ src/data/datasources/mock/mock-event.datasource.ts
├─ src/data/datasources/supabase-event.datasource.ts (later)
├─ src/data/repositories/event.repository.ts
├─ src/services/event.service.ts
├─ src/components/EventCard.tsx
├─ src/components/EventList.tsx
└─ src/pages/Events.tsx (+ calendar view)

Blog Posts (8 files, ~400 LOC)
├─ src/core/dtos/blog-post.dto.ts
├─ src/domain/repositories/blog-post.datasource.ts
├─ src/data/datasources/mock/mock-blog-post.datasource.ts
├─ src/data/datasources/supabase-blog-post.datasource.ts (later)
├─ src/data/repositories/blog-post.repository.ts
├─ src/services/blog-post.service.ts
├─ src/components/BlogPostCard.tsx
├─ src/components/BlogPostList.tsx
└─ src/pages/BlogPosts.tsx

Local Services (6 files, ~300 LOC)
├─ src/core/dtos/service.dto.ts
├─ src/data/datasources/mock/mock-service.datasource.ts
├─ src/data/repositories/service.repository.ts
├─ src/services/service.service.ts
├─ src/components/ServiceCard.tsx
└─ src/pages/LocalServices.tsx

SOS Information (6 files, ~250 LOC)
├─ src/core/dtos/sos.dto.ts
├─ src/data/datasources/mock/mock-sos.datasource.ts
├─ src/data/repositories/sos.repository.ts
├─ src/services/sos.service.ts
├─ src/components/SOSAlert.tsx
└─ src/pages/SOSInformation.tsx
```

---

## 🎯 SUCCESS CRITERIA

Phase 7 complete when:

✅ **Heritage Sites**
   - Mock datasource works with test data
   - Component displays list + details
   - Real Supabase queries work
   - RLS allows anonymous reads
   - Deployed to production

✅ **Events & Festivals**
   - Pagination working
   - Date-range filtering (upcoming/past)
   - Calendar view
   - Chronological sort
   - Deployed

✅ **Blog Posts**
   - Category/tag filtering
   - Search functionality
   - Recent/popular sections
   - Deployed

✅ **Local Services**
   - Service type filtering
   - Hotels, restaurants, guides
   - Rating system
   - Deployed

✅ **SOS Information**
   - Emergency alerts
   - Contact information
   - Status updates
   - Deployed

✅ **Navigation**
   - Links in main nav
   - Homepage featured sections
   - Search across all types
   - No login required

---

## 🔍 HOW TO USE THE DOCUMENTATION

| Need | Read This | Why |
|------|-----------|-----|
| Understand overall strategy | PHASE_7_ROADMAP.md | Big picture, why Phase 7, why defer Phase 6 |
| Reference data patterns | PHASE_7_DATA_LAYER_PATTERNS.md | Copy/paste service patterns, understand DatabaseClient |
| Implement step-by-step | PHASE_7_IMPLEMENTATION_ROADMAP.md | Follow 8-file template, has actual code examples |
| Know table structures | PHASE_7_SUPABASE_SCHEMAS.md | Copy field names, see query examples, understand RLS |

---

## 🚨 IMPORTANT REMINDERS

⚠️ **START WITH MOCK DATA**
   - Don't jump to real Supabase
   - Mock datasource lets you test UI without DB
   - Only connect to Supabase after mock works

⚠️ **FOLLOW THE 8-FILE PATTERN**
   - DTOs first (defines contract)
   - Datasources second (mock + real)
   - Repositories third (abstraction)
   - Services fourth (business logic)
   - Components fifth (UI)
   - Use the same pattern for all 5 content types

⚠️ **USE DI CONTAINER CORRECTLY**
   - Wire up in container.ts BEFORE using services
   - Container decides mock vs real
   - Services get dependencies from container

⚠️ **TEST BEFORE MOVING ON**
   - Test each layer in isolation
   - Mock datasource works? ✅ Move to repository
   - Repository works? ✅ Move to service
   - Service works? ✅ Move to component
   - Component works? ✅ Add real datasource

⚠️ **NO TIER-GATING YET**
   - Skip all tier-based feature gating
   - All content is public (no login needed)
   - Tier-gating is a future session
   - Focus on getting content types working

⚠️ **NO APPROVAL WORKFLOWS YET**
   - Phase 7 is public read-only
   - No admin approval UI
   - Palika admins manage in admin-panel, shows in m-place
   - Phase 6 (deferred) will handle approval workflows

---

## ✅ READY TO START?

Everything is documented. You have:

✅ 4 reference documents
✅ m-place structure ready (DI, clean arch)
✅ Supabase tables defined
✅ Query patterns from admin-panel
✅ Template for all 5 content types
✅ Step-by-step guide for heritage sites
✅ Mock datasource examples
✅ RLS policies for public access

**Next:** Start implementing heritage sites!

---

## 🤔 QUESTIONS?

**Q: How long will Phase 7 take?**
A: ~12-16 hours total (2-3 hours per content type after heritage sites)

**Q: Can I skip mock datasource?**
A: No. Mock is essential for testing without touching the database.

**Q: When do I implement tier-gating?**
A: Future session. Phase 7 has NO tier-gating.

**Q: Can I start with events instead of heritage sites?**
A: Not recommended. Heritage sites are simpler (no date ranges).

**Q: How do I know if a query is correct?**
A: Test with real data and check admin-panel for exact same query patterns.

**Q: What about performance?**
A: Indexes are created in migrations. Pagination is built-in from day 1.

---

## 🔮 FUTURE SESSION: TIER-GATING STANDARDIZATION

After Phase 7 complete, schedule dedicated session to decide:

1. **Where does tier logic live?**
   - Database triggers?
   - API routes?
   - RLS policies?
   - Frontend feature flags?

2. **How to handle conditional defaults?**
   - Example: "If approval_workflow = OFF, then status = 'approved'"
   - Where should this be implemented?

3. **What gets tier-gated?**
   - Categories (which palikas offer what?)
   - Content types (who can create events, blogs, etc.?)
   - Features (analytics, advanced search, etc.?)

4. **How to test tier-gated features?**
   - Unit tests for tier logic
   - Integration tests for RLS
   - E2E tests for workflow

5. **Documentation pattern?**
   - Create reusable architecture document
   - Examples for each content type
   - Decision tree for future features

---

## 📌 REMEMBER

This is **data layer first**. You're building:
- DTOs (contracts)
- Datasources (testable, swappable)
- Repositories (abstraction)
- Services (business logic)
- Components (UI that uses services)

All built on m-place's existing clean architecture.
All tested with mock before touching Supabase.
All patterns copied from admin-panel's proven approach.

**You're ready. Let's go!** 🚀

