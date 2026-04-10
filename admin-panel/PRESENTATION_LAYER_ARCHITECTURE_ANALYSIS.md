# Presentation Layer Architecture Analysis

**Date:** 2026-04-10  
**Status:** Gap Analysis - Current vs Target Architecture  
**Modules Analyzed:** Blog Posts, Events, Heritage Sites

---

## Executive Summary

**Current State:** ❌ Bypasses service layer
- Pages → API Routes → Supabase (direct queries)
- No use of BlogPostsService, EventsService, HeritageSitesService
- No use of newly created datasources (IBlogPostsDatasource, etc.)
- Cannot switch between real/fake data sources
- Tightly coupled to Supabase query structure

**Target State:** ✅ Clean 3-layer architecture
- Pages → API Routes → Services → Datasources → Supabase/Fake
- Full use of service layer for business logic
- Swappable data sources (Supabase or Fake)
- UI state properly isolated from data layer
- Testable components and routes

---

## Current Architecture (BEFORE)

### Presentation Layer Flow

```
┌─────────────────────────────────┐
│  APP/[MODULE]/PAGE.TSX (Client) │
│  ├─ useState(data, filter)      │
│  └─ useEffect(() => fetch())    │
└────────────┬────────────────────┘
             │ fetch('/api/[module]')
             ▼
┌─────────────────────────────────┐
│  APP/API/[MODULE]/ROUTE.TS      │
│  ├─ GET()                        │
│  ├─ supabaseAdmin.from('[t]')  │
│  │  .select().order().etc.      │
│  └─ format & return JSON        │
└────────────┬────────────────────┘
             │
             ▼
       SUPABASE DB
```

### Problem: Direct Query Construction in API Routes

**Blog Posts API (`/api/blog-posts/route.ts`):**
```typescript
export async function GET() {
  const { data: posts, error } = await supabaseAdmin
    .from('blog_posts')
    .select(`id, title_en, slug, status, ...`)
    .order('created_at', { ascending: false })
  
  // Manual formatting in route handler
  const formattedPosts = posts.map(post => ({
    id: post.id,
    title: post.title_en,  // Map title_en → title
    ...
  }))
  
  return NextResponse.json(formattedPosts)
}
```

**Issues:**
1. ❌ Supabase query logic in HTTP handler (route.ts)
2. ❌ Manual data transformation/formatting
3. ❌ No service layer business logic
4. ❌ No use of BlogPostsService (already created!)
5. ❌ No use of IBlogPostsDatasource interface
6. ❌ Cannot test without hitting Supabase
7. ❌ Cannot switch datasources (fake for dev, real for prod)
8. ❌ Duplicated query logic (if same query used elsewhere)

---

## Target Architecture (AFTER)

### 3-Layer Clean Architecture

```
┌─────────────────────────────────────┐
│      PRESENTATION LAYER             │
│  ┌────────────────────────────────┐ │
│  │ Page (blog-posts/page.tsx)      │ │
│  │ ├─ useState: filter, page, etc  │ │
│  │ └─ fetchPosts() → fetch('/api') │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ API Route (/api/blog-posts)     │ │
│  │ ├─ GET() → listPosts()          │ │
│  │ └─ POST() → createPost()        │ │
│  └────────────────────────────────┘ │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     SERVICE LAYER                   │
│  ┌────────────────────────────────┐ │
│  │ BlogPostsService               │ │
│  │ ├─ getAll(filters)             │ │
│  │ ├─ getById(id)                 │ │
│  │ ├─ create(input)               │ │
│  │ ├─ publish(id)                 │ │
│  │ └─ Business logic here         │ │
│  └────────────────────────────────┘ │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     DATA ACCESS LAYER               │
│  ┌────────────────────────────────┐ │
│  │ IBlogPostsDatasource (Interface)│ │
│  └────────────────────────────────┘ │
│  ┌──────────────────┬─────────────┐ │
│  │ Supabase        │ Fake        │ │
│  │ Datasource      │ Datasource  │ │
│  └──────────────────┴─────────────┘ │
└──────────────────┬──────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
   SUPABASE DB         MOCK DATA (Dev/Test)
```

---

## Implementation Mapping

### 1. Blog Posts Module

#### Current (Broken)
```typescript
// app/blog-posts/page.tsx
const [posts, setPosts] = useState<BlogPost[]>([])
useEffect(() => {
  fetch('/api/blog-posts')
    .then(r => r.json())
    .then(setPosts)
}, [])

// app/api/blog-posts/route.ts
export async function GET() {
  const { data: posts } = await supabaseAdmin
    .from('blog_posts')
    .select(`id, title_en, slug, status, ...`)
  
  return NextResponse.json(posts.map(p => ({
    id: p.id,
    title: p.title_en,  // ← Manual mapping
  })))
}
```

#### Target (Clean)
```typescript
// app/blog-posts/page.tsx (NO CHANGE TO COMPONENT)
const [posts, setPosts] = useState<BlogPost[]>([])
useEffect(() => {
  fetch('/api/blog-posts')
    .then(r => r.json())
    .then(setPosts)
}, [])

// app/api/blog-posts/route.ts (USE SERVICE LAYER)
import { BlogPostsService } from '@/services/blog-posts.service'
import { getBlogPostsDatasource } from '@/lib/blog-posts-config'

const service = new BlogPostsService(getBlogPostsDatasource())

export async function GET() {
  const result = await service.getAll({})
  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest) {
  const input = await req.json()
  const result = await service.create(input)
  return NextResponse.json(result)
}
```

**Benefits:**
- ✅ Service layer handles business logic
- ✅ Datasource can be Supabase OR Fake
- ✅ Switching datasources requires only `.env.local` change
- ✅ API response contracts stay same (UI unchanged)
- ✅ Testable: can test with FakeBlogPostsDatasource

### 2. Events Module

#### Current (Broken)
```typescript
// app/events/page.tsx
const [events, setEvents] = useState<Event[]>([])
useEffect(() => {
  fetch('/api/events').then(r => r.json()).then(setEvents)
}, [])

// app/api/events/route.ts
export async function GET() {
  const { data: events } = await supabaseAdmin
    .from('events')
    .select(`id, name_en, name_ne, ...`)
    .order('created_at', { ascending: false })
  
  return NextResponse.json(events.map(e => ({
    id: e.id,
    name_english: e.name_en,    // ← Manual mapping
    name_nepali: e.name_ne,
  })))
}
```

#### Target (Clean)
```typescript
// app/api/events/route.ts
import { EventsService } from '@/services/events.service'
import { getEventsDatasource } from '@/lib/events-config'

const service = new EventsService(getEventsDatasource())

export async function GET(req: NextRequest) {
  const filters = {
    palika_id: req.nextUrl.searchParams.get('palika_id'),
    status: req.nextUrl.searchParams.get('status'),
    is_festival: req.nextUrl.searchParams.get('is_festival'),
  }
  
  const result = await service.getAll(filters, { page: 1, limit: 20 })
  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest) {
  const input = await req.json()
  const result = await service.create(input)
  return NextResponse.json(result)
}
```

### 3. Heritage Sites Module

#### Current (Broken)
```typescript
// app/heritage-sites/page.tsx
const [sites, setSites] = useState<HeritageSite[]>([])
useEffect(() => {
  fetch('/api/heritage-sites').then(r => r.json()).then(setSites)
}, [])

// app/api/heritage-sites/route.ts
export async function GET() {
  const { data: sites } = await supabaseAdmin
    .from('heritage_sites')
    .select(`id, name_en, ...`)
  
  return NextResponse.json(sites.map(s => ({
    id: s.id,
    name_english: s.name_en,  // ← Manual mapping
  })))
}

export async function POST(request: NextRequest) {
  const formData = await request.json()
  const heritageData = { /* construct manually */ }
  const { data } = await supabaseAdmin.from('heritage_sites').insert(...)
  return NextResponse.json(data)
}
```

#### Target (Clean)
```typescript
// app/api/heritage-sites/route.ts
import { HeritageSitesService } from '@/services/heritage-sites.service'
import { getHeritageSitesDatasource } from '@/lib/heritage-sites-config'

const service = new HeritageSitesService(getHeritageSitesDatasource())

export async function GET(req: NextRequest) {
  const filters = {
    palika_id: req.nextUrl.searchParams.get('palika_id'),
    category_id: req.nextUrl.searchParams.get('category_id'),
    heritage_status: req.nextUrl.searchParams.get('heritage_status'),
  }
  
  const result = await service.getAll(filters, { page: 1, limit: 20 })
  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest) {
  const input = await req.json()
  const result = await service.create(input)
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const { id, ...input } = await req.json()
  const result = await service.update(id, input)
  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const result = await service.delete(id)
  return NextResponse.json(result)
}
```

---

## UI State Layer (No Changes Needed)

Pages remain unchanged because API contract stays the same:

```typescript
// app/blog-posts/page.tsx
export default function BlogPostsPage() {
  // UI State (Component Level)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Data Fetching (through API route, no change)
  useEffect(() => {
    setIsLoading(true)
    fetch('/api/blog-posts')
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }, [])
  
  // Local Filtering (UI concerns, not data layer)
  const filtered = posts.filter(p => 
    p.title.toLowerCase().includes(filter.toLowerCase())
  )
  
  return (
    <AdminLayout>
      <h1>Blog Posts</h1>
      <input onChange={e => setFilter(e.target.value)} />
      {isLoading ? <Spinner /> : <BlogPostsTable posts={filtered} />}
    </AdminLayout>
  )
}
```

**Key Points:**
- ✅ UI state (filter, page, loading) is LOCAL to component
- ✅ Data state (posts) comes through API
- ✅ API now uses service layer (transparent to UI)
- ✅ No changes to component code needed
- ✅ Pages work with both real Supabase AND fake datasources

---

## Key Benefits of Refactoring

### For Development
- **Faster:** Toggle fake datasource = instant data, no network latency
- **Offline:** Work without internet
- **Parallel:** Frontend team can work without backend

### For Testing
- **Unit Tests:** Use FakeBlogPostsDatasource for deterministic tests
- **Integration Tests:** Use SupabaseBlogPostsDatasource
- **No Mock Hell:** Realistic fake data matches real schema

### For Production
- **Flexible:** Can swap datasources by environment variable
- **Testable:** Services are business logic, fully testable
- **Maintainable:** Clear separation of concerns

### For Team
- **Clear Contracts:** Services define what data operations exist
- **Reusable:** Services used by API routes, webhooks, scheduled tasks
- **Documented:** Datasource interfaces are self-documenting

---

## Migration Path (Per Module)

### Step 1: Update API Route (Blog Posts example)

```typescript
// BEFORE
export async function GET() {
  const { data } = await supabaseAdmin.from('blog_posts').select(...)
  return NextResponse.json(data.map(mapBlogPost))
}

// AFTER
import { BlogPostsService } from '@/services/blog-posts.service'
import { getBlogPostsDatasource } from '@/lib/blog-posts-config'

const service = new BlogPostsService(getBlogPostsDatasource())

export async function GET(req: NextRequest) {
  const result = await service.getAll({})
  return NextResponse.json(result.data)
}
```

**Effort:** 10 minutes per route

### Step 2: Add Missing Methods to Service

Some routes might need methods the service doesn't have yet (e.g., getRecent, getFeatured).
Add them to the service and datasources.

**Effort:** 15 minutes per missing method

### Step 3: Test Locally

```bash
# .env.local
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true

# API now returns mock data instantly
# Toggle to false to test with real Supabase
```

**Effort:** 5 minutes

---

## File Checklist (What's Done vs TODO)

### Blog Posts
- ✅ lib/blog-posts-datasource.ts (interface)
- ✅ lib/supabase-blog-posts-datasource.ts (real)
- ✅ lib/fake-blog-posts-datasource.ts (fake)
- ✅ lib/blog-posts-config.ts (DI)
- ✅ services/blog-posts.service.ts (has methods)
- ❌ app/api/blog-posts/route.ts (still using supabaseAdmin directly)
- ✅ app/blog-posts/page.tsx (UI, no changes needed)

### Events
- ✅ lib/events-datasource.ts (interface)
- ✅ lib/supabase-events-datasource.ts (real)
- ✅ lib/fake-events-datasource.ts (fake)
- ✅ lib/events-config.ts (DI)
- ✅ services/events.service.ts (has methods)
- ❌ app/api/events/route.ts (still using supabaseAdmin directly)
- ✅ app/events/page.tsx (UI, no changes needed)

### Heritage Sites
- ✅ lib/heritage-sites-datasource.ts (interface)
- ✅ lib/supabase-heritage-sites-datasource.ts (real)
- ✅ lib/fake-heritage-sites-datasource.ts (fake)
- ✅ lib/heritage-sites-config.ts (DI)
- ✅ services/heritage-sites.service.ts (has methods)
- ❌ app/api/heritage-sites/route.ts (still using supabaseAdmin directly)
- ✅ app/heritage-sites/page.tsx (UI, no changes needed)

---

## Recommendation

**Next Step:** Update the 3 API routes to use the service layer.

**This is critical** because currently:
1. The datasources we created are not being used
2. API routes query Supabase directly (can't toggle fake data)
3. Service layer is not being used (defeats the purpose of creating it)

Once API routes are updated:
- ✅ Datasource switching works
- ✅ Services are actually used
- ✅ Clean architecture is complete
- ✅ Everything is testable

**Estimated Effort:** 30 minutes (3 routes × 10 minutes each)
