# Phase 7: Data Layer Patterns from Admin-Panel

**Date:** 2026-03-29
**Purpose:** Document reusable patterns for implementing tourism content in m-place
**Scope:** Data layer only (datasources, repositories, DTOs, services, API endpoints)

---

## 🎯 WHAT THIS DOCUMENT IS

This is a **pattern guide** extracted from admin-panel's working data layer. It shows:
- How admin-panel fetches data from Supabase
- What SQL queries are used
- How pagination, filtering, and sorting work
- How to structure services with clean architecture
- How to abstract Supabase so it's testable

**Goal:** Replicate these patterns in m-place for:
- Heritage sites
- Events & festivals
- Blog posts & stories
- Local services directory
- SOS emergency information

---

## 📚 ADMIN-PANEL'S DATA LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│           API Routes (Next.js)                      │
│  /api/heritage-sites, /api/events, /api/blog-posts │
└───────────────────────┬─────────────────────────────┘
                        │ uses
                        ↓
┌─────────────────────────────────────────────────────┐
│           Services (Framework-agnostic)             │
│  HeritageSitesService, EventsService, BlogPostsService │
└───────────────────────┬─────────────────────────────┘
                        │ accepts
                        ↓
┌─────────────────────────────────────────────────────┐
│         DatabaseClient Interface                    │
│  (Abstract layer - can be Supabase or Mock)        │
└───────────────────────┬─────────────────────────────┘
                        │ implements
                        ↓
┌─────────────────────────────────────────────────────┐
│    createSupabaseClient (Real) or                   │
│    createMockClient (Testing)                       │
└─────────────────────────────────────────────────────┘
```

---

## 1️⃣ DATABASECLIENT INTERFACE (Framework-Agnostic)

**File:** `admin-panel/services/database-client.ts`

### Purpose
Abstraction layer that decouples services from Supabase. Enables:
- Testing with mock data
- Swapping databases without changing service code
- Reusing services in different apps

### Key Methods

```typescript
// Query builder pattern - chainable API
QueryBuilder {
  // Selection & Operations
  select(columns?: string): QueryBuilder
  insert(data: Record<string, any>[]): QueryBuilder
  update(data: Record<string, any>): QueryBuilder
  delete(): QueryBuilder

  // Filters
  eq(column: string, value: any): QueryBuilder
  neq, gt, gte, lt, lte, like, ilike, is, in, contains

  // Ordering & Pagination
  order(column: string, options?: { ascending?: boolean }): QueryBuilder
  limit(count: number): QueryBuilder
  range(from: number, to: number): QueryBuilder  // For offset-based pagination

  // Execution
  single(): QueryBuilder         // Returns one row or null
  maybeSingle(): QueryBuilder    // Same as single()
  then(...): Promise<DatabaseResult>
}

// Factory functions
createSupabaseClient(supabaseClient: any): DatabaseClient
createMockClient(mockData: Record<string, any[]>): DatabaseClient
```

### Usage Pattern

```typescript
// In a service
const db: DatabaseClient = supabaseClient

const { data, error, count } = await db
  .from('heritage_sites')
  .select('id, name_en, description, palika_id, palikas!inner(name_en)')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(0, 24)  // First 25 items
  .then(result => result)  // Implicit in Supabase
```

---

## 2️⃣ SERVICE RESPONSE WRAPPER

All service methods return a **ServiceResponse** object:

```typescript
interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

### Example Usage

```typescript
const result = await heritageSitesService.getAll(filters, pagination)

if (result.success) {
  const { data, total, page, hasMore } = result.data
  // Use data...
} else {
  console.error(result.error)
}
```

---

## 3️⃣ HERITAGE SITES SERVICE PATTERN

**File:** `admin-panel/services/heritage-sites.service.ts`

### Data Model

```typescript
HeritageSite {
  id: string
  name_en: string
  name_ne: string
  slug: string
  category_id: number
  category_name: string
  heritage_status: string // 'national', 'regional', 'local'
  location: {
    latitude: number
    longitude: number
    altitude: number
    address: string
    ward_number: number
  }
  description: {
    short_description: string
    full_description: string
  }
  visitor_info: {
    opening_hours: string
    entry_fee: string
    best_time_to_visit: string
    time_needed: string
  }
  facilities: string[] // tags
  accessibility: string
  restrictions: string
  contact: {
    phone: string
    email: string
    website: string
  }
  status: 'draft' | 'published' | 'archived'
  created_at: ISO8601
  updated_at: ISO8601
  palika_id: number
  palika_name: string
  created_by: string
}
```

### Constructor

```typescript
constructor(db: DatabaseClient) {
  this.db = db
}
```

### Key Methods

#### getAll(filters, pagination)

```typescript
async getAll(
  filters: HeritageSiteFilters = {},
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>>
```

**Filters Available:**
- `palika_id`: number
- `category_id`: number
- `heritage_status`: 'national' | 'regional' | 'local'
- `status`: 'draft' | 'published' | 'archived'
- `is_featured`: boolean
- `search`: string (searches in name_en, name_ne, description)

**Pagination:**
- `page`: 1-based (default: 1)
- `limit`: items per page (default: 20)

**SQL Query Pattern:**

```sql
SELECT *,
  palikas!inner(name_en),
  category_mappings!inner(category_en_name)
FROM heritage_sites
WHERE palika_id = $1
  AND status = 'published'
  AND (name_en ILIKE '%search%' OR description ILIKE '%search%')
ORDER BY created_at DESC
LIMIT 25 OFFSET 0
```

**Important:** Joins use `!inner` to enforce that related records exist.

#### getById(id)

```typescript
async getById(id: string): Promise<ServiceResponse<HeritageSite>>
```

Returns single heritage site with full details including related palikas and categories.

#### getBySlug(slug)

```typescript
async getBySlug(slug: string): Promise<ServiceResponse<HeritageSite>>
```

URL-friendly lookup for public browsing.

#### getByCategory(categoryId, pagination)

```typescript
async getByCategory(
  categoryId: number,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>>
```

Pre-filtered by category, useful for category pages.

#### getByPalika(palikaId, pagination)

```typescript
async getByPalika(
  palikaId: number,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>>
```

For palika-specific browsing.

#### getPopular(limit)

```typescript
async getPopular(limit: number = 10): Promise<ServiceResponse<HeritageSite[]>>
```

Orders by view_count descending, returns top N.

#### incrementViewCount(id)

```typescript
async incrementViewCount(id: string): Promise<ServiceResponse<void>>
```

Tracks visit engagement.

### Helper Methods

```typescript
private mapHeritageSite(data: any): HeritageSite
  // Transforms raw DB row to domain object
  // Flattens location, description, visitor_info objects
  // Extracts palika_name from joins
  // Extracts category_name from joins

private generateSlug(name: string): string
  // Converts "Kathmandu Durbar Square" → "kathmandu-durbar-square"
  // Used for URL-friendly identifiers

private validateInput(input: CreateHeritageSiteInput): { valid: boolean; error?: string }
  // Ensures required fields: name_en, name_ne, palika_id, description, location
  // Validates numeric fields (latitude, longitude, etc.)
```

---

## 4️⃣ EVENTS SERVICE PATTERN

**File:** `admin-panel/services/events.service.ts`

### Data Model

```typescript
Event {
  id: string
  name_en: string
  name_ne: string
  slug: string
  event_type: string // 'festival', 'conference', 'cultural', 'sports', etc.
  category_id: number
  category_name: string
  palika_id: number
  palika_name: string

  timing: {
    start_date: ISO8601 Date
    end_date: ISO8601 Date
    start_time: string // "09:00"
    end_time: string   // "17:00"
  }

  location: {
    latitude: number
    longitude: number
    address: string
    venue_name: string
  }

  details: {
    description: string
    long_description: string
    expected_attendance: number
  }

  contact: {
    organizer_name: string
    organizer_email: string
    organizer_phone: string
  }

  images: string[] // URLs
  videos: string[] // URLs

  is_festival: boolean
  is_featured: boolean
  status: 'draft' | 'published' | 'cancelled'

  created_at: ISO8601
  updated_at: ISO8601
}
```

### Key Methods

#### getAll(filters, pagination)

**Filters Available:**
- `palika_id`: number
- `category_id`: number
- `event_type`: string
- `is_festival`: boolean
- `status`: 'draft' | 'published' | 'cancelled'
- `start_date_from`: ISO8601
- `start_date_to`: ISO8601
- `search`: string

**SQL Query Pattern:**

```sql
SELECT *,
  palikas!inner(name_en),
  category_mappings!inner(category_en_name)
FROM events
WHERE palika_id = $1
  AND start_date >= $2
  AND start_date <= $3
  AND status = 'published'
  AND (name_en ILIKE '%search%' OR description ILIKE '%search%')
ORDER BY start_date ASC  -- IMPORTANT: Chronological for events
LIMIT 25 OFFSET 0
```

#### getUpcoming(palikaId, days, pagination)

```typescript
async getUpcoming(
  palikaId: number,
  days: number = 30,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<Event>>>
```

Shows only events starting within next N days. Useful for "upcoming" section.

#### getFestivals(palikaId, pagination)

```typescript
async getFestivals(
  palikaId: number,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<Event>>>
```

Filters where `is_festival = true`.

#### getByDateRange(palikaId, startDate, endDate, pagination)

```typescript
async getByDateRange(
  palikaId: number,
  startDate: string,
  endDate: string,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<Event>>>
```

Calendar view: events between two dates.

---

## 5️⃣ BLOG POSTS SERVICE PATTERN

**File:** `admin-panel/services/blog-posts.service.ts`

### Data Model

```typescript
BlogPost {
  id: string
  palika_id: number
  palika_name: string

  author_id: string
  author_name: string

  title_en: string
  title_ne: string
  slug: string

  excerpt: string
  excerpt_ne: string

  content: string      // HTML or Markdown
  content_ne: string

  featured_image: string  // URL

  category: string // 'news', 'culture', 'tourism', etc.
  tags: string[]

  status: 'draft' | 'published' | 'archived'

  view_count: number

  published_at: ISO8601 | null
  created_at: ISO8601
  updated_at: ISO8601
}
```

### Key Methods

#### getAll(filters, pagination)

**Filters Available:**
- `palika_id`: number
- `author_id`: string
- `category`: string
- `status`: 'draft' | 'published' | 'archived'
- `search`: string (searches title_en, title_ne, excerpt, content)
- `tags`: string[]

**SQL Query Pattern:**

```sql
SELECT *,
  palikas!inner(name_en),
  admin_users!inner(full_name)
FROM blog_posts
WHERE palika_id = $1
  AND status = 'published'
  AND (title_en ILIKE '%search%' OR content ILIKE '%search%')
ORDER BY created_at DESC
LIMIT 25 OFFSET 0
```

#### getRecent(limit)

```typescript
async getRecent(limit: number = 5): Promise<ServiceResponse<BlogPost[]>>
```

Latest published posts, no pagination. Good for homepage "latest news".

#### getPopular(limit)

```typescript
async getPopular(limit: number = 5): Promise<ServiceResponse<BlogPost[]>>
```

Ordered by `view_count DESC`. Good for "trending" section.

#### getByCategory(category, pagination)

```typescript
async getByCategory(
  category: string,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<BlogPost>>>
```

Category landing pages.

#### getByAuthor(authorId, pagination)

```typescript
async getByAuthor(
  authorId: string,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<BlogPost>>>
```

Author's profile page - show all their posts.

#### getByTag(tag, pagination)

```typescript
async getByTag(
  tag: string,
  pagination: PaginationParams = {}
): Promise<ServiceResponse<PaginatedResponse<BlogPost>>>
```

Tag landing pages.

#### getCategories(), getTags()

```typescript
async getCategories(): Promise<ServiceResponse<string[]>>
async getTags(): Promise<ServiceResponse<string[]>>
```

Used for filters/navigation. Returns unique values from published posts.

#### getBySlug(slug)

```typescript
async getBySlug(slug: string): Promise<ServiceResponse<BlogPost>>
```

URL-friendly detail lookup.

#### incrementViewCount(id)

```typescript
async incrementViewCount(id: string): Promise<ServiceResponse<void>>
```

Track engagement.

---

## 6️⃣ API ROUTE PATTERN

**File Examples:**
- `admin-panel/app/api/heritage-sites/route.ts`
- `admin-panel/app/api/events/route.ts`
- `admin-panel/app/api/blog-posts/route.ts`

### GET Handler Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Parse filters from query params
    const filters = {
      search: request.nextUrl.searchParams.get('search') || undefined,
      category: request.nextUrl.searchParams.get('category') || undefined,
      status: request.nextUrl.searchParams.get('status') || 'published',
      dateFrom: request.nextUrl.searchParams.get('dateFrom') || undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') || undefined,
    }

    // Parse pagination from query params
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '25')

    // Use service layer
    const db = createSupabaseClient(supabaseAdmin)
    const service = new HeritageSitesService(db)

    const result = await service.getAll(filters, { page, limit })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/heritage-sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Common Query Parameters

All content APIs accept:
- `palika_id` (required): Which palika's content
- `page` (default: 1): Pagination page number
- `limit` (default: 25): Items per page
- `search`: Full-text search in name/title/description
- `status` (default: 'published'): 'draft', 'published', 'archived'
- `category`: Filter by category
- `sort` (default: 'newest'): 'newest', 'oldest', 'popular', 'trending'

---

## 7️⃣ M-PLACE IMPLEMENTATION TEMPLATE

For each content type in Phase 7, you'll need:

### Step 1: Create DTO (Data Transfer Object)

```typescript
// src/core/dtos/heritage-site.dto.ts
export interface HeritageSiteDTO {
  id: string
  name_en: string
  name_ne: string
  slug: string
  description: string
  location: { latitude: number; longitude: number }
  palikaId: number
  palikaName: string
  status: 'draft' | 'published' | 'archived'
  createdAt: string
}

export interface GetHeritageSitesFiltersDTO {
  palikaId: number
  search?: string
  status?: string
  page?: number
  limit?: number
}
```

### Step 2: Create Datasources (Mock + Real)

```typescript
// src/data/datasources/heritage-site.datasource.ts
export interface HeritageSiteDatasource {
  getHeritageSites(palikaId: number, filters?: Filters): Promise<HeritageSiteDTO[]>
  getHeritageSiteById(id: string): Promise<HeritageSiteDTO>
  getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO>
}

// Mock implementation for testing
export class MockHeritageSiteDatasource implements HeritageSiteDatasource {
  private mockData = [ /* ... */ ]

  async getHeritageSites(palikaId: number, filters?: Filters) {
    return this.mockData.filter(s => s.palikaId === palikaId)
  }
  // ...
}

// Real implementation using Supabase
export class SupabaseHeritageSiteDatasource implements HeritageSiteDatasource {
  constructor(private db: DatabaseClient) {}

  async getHeritageSites(palikaId: number, filters?: Filters) {
    const { data, error } = await this.db
      .from('heritage_sites')
      .select('*, palikas!inner(name_en)')
      .eq('palika_id', palikaId)
      .eq('status', filters?.status || 'published')
      // ... more filters
      .order('created_at', { ascending: false })
      .range(0, (filters?.limit || 25) - 1)

    if (error) throw error
    return data.map(this.mapToDTO)
  }
}
```

### Step 3: Create Repository

```typescript
// src/data/repositories/heritage-site.repository.ts
export class HeritageSiteRepository {
  constructor(private datasource: HeritageSiteDatasource) {}

  async getHeritageSites(palikaId: number, filters?: Filters) {
    return this.datasource.getHeritageSites(palikaId, filters)
  }

  async getHeritageSiteById(id: string) {
    return this.datasource.getHeritageSiteById(id)
  }

  async getHeritageSiteBySlug(slug: string) {
    return this.datasource.getHeritageSiteBySlug(slug)
  }
}
```

### Step 4: Create API Endpoint

```typescript
// src/api/heritage-sites/index.ts or pages/api/heritage-sites.ts
export async function getHeritageSites(palikaId: number, filters?: Filters) {
  const datasource = new SupabaseHeritageSiteDatasource(supabaseClient)
  const repository = new HeritageSiteRepository(datasource)
  return repository.getHeritageSites(palikaId, filters)
}
```

### Step 5: Create React Component

```typescript
// src/components/HeritageSiteList.tsx
export function HeritageSiteList() {
  const [sites, setSites] = useState<HeritageSiteDTO[]>([])

  useEffect(() => {
    const loadSites = async () => {
      const data = await getHeritageSites(palikaId)
      setSites(data)
    }
    loadSites()
  }, [palikaId])

  return (
    <div>
      {sites.map(site => (
        <HeritageSiteCard key={site.id} site={site} />
      ))}
    </div>
  )
}
```

---

## 📋 PAGINATION PATTERNS

### Offset-Based Pagination (Used in Admin-Panel)

```typescript
const page = 2
const limit = 25
const offset = (page - 1) * limit  // = 25

const { data, error, count } = await db
  .from('heritage_sites')
  .select('*')
  .range(offset, offset + limit - 1)  // range(25, 49)
```

**Return in response:**
```json
{
  "data": [ /* 25 items */ ],
  "total": 372,
  "page": 2,
  "limit": 25,
  "hasMore": true
}
```

### Cursor-Based Pagination (Optional for Large Lists)

```typescript
const cursor = request.nextUrl.searchParams.get('cursor')  // Last item's ID

const { data, error } = await db
  .from('heritage_sites')
  .select('*')
  .gt('id', cursor)  // Get items after cursor
  .order('id')
  .limit(25)
```

---

## 🧪 TESTING WITH MOCK DATASOURCE

```typescript
// In tests
const mockData = {
  heritage_sites: [
    {
      id: '1',
      name_en: 'Durbar Square',
      palika_id: 1,
      status: 'published',
      created_at: '2026-01-01'
    }
  ],
  palikas: [
    { id: 1, name_en: 'Kathmandu Metropolitan' }
  ]
}

const mockDb = createMockClient(mockData)
const service = new HeritageSitesService(mockDb)

const result = await service.getAll({ palika_id: 1 })
expect(result.success).toBe(true)
expect(result.data.data).toHaveLength(1)
```

---

## 🎯 SUPABASE RLS PATTERNS

All public content uses `is_published = true` + RLS policy:

```sql
-- Public read access for published content
create policy "published_heritage_sites_read"
on heritage_sites for select
using (
  is_published = true OR  -- Anyone can see published
  auth.uid() = created_by  -- Creator can see their own
)
```

**Important:** In m-place, users don't need to authenticate to browse. The app uses `supabaseAnonKey` which has RLS policies enforcing `is_published = true`.

---

## 📝 CHECKLIST FOR PHASE 7 IMPLEMENTATION

For each content type (Heritage Sites, Events, Blog Posts, Services, SOS):

- [ ] Create DTO file in `src/core/dtos/`
- [ ] Create mock datasource in `src/data/datasources/`
- [ ] Create real Supabase datasource in `src/data/datasources/`
- [ ] Create repository in `src/data/repositories/`
- [ ] Create API endpoint in `src/api/` or `pages/api/`
- [ ] Create React component in `src/components/`
- [ ] Add page/route in `src/pages/`
- [ ] Write tests with mock datasource
- [ ] Test with real Supabase
- [ ] Add to m-place navigation/routing

---

## 🚀 EXAMPLE: HERITAGE SITES PHASE 7 STEP

Start with heritage sites because:
1. Simplest data model (no date ranges like events)
2. Admin-panel already has working queries
3. Builds foundation for other content types

**Estimated scope:** 4-6 files, 400-500 lines of code

---

## 📌 KEY TAKEAWAYS

1. **DatabaseClient abstracts Supabase** - Services don't know about Supabase
2. **Services return ServiceResponse<T>** - Consistent error handling
3. **Pagination uses offset pattern** - (page - 1) * limit
4. **Filters are passed as objects** - Easy to add new filters later
5. **Mappers transform DB rows to DTOs** - Keeps layer boundaries clean
6. **Mock datasource enables testing** - Before touching real data
7. **RLS policies protect public content** - `is_published = true` + authentication check
8. **All queries join with palikas** - Context about which palika owns the content

---

## 🔗 NEXT STEPS

1. Review admin-panel's actual Supabase table schemas
   - Run: `SELECT * FROM heritage_sites LIMIT 1` → See columns
   - Run: `SELECT * FROM events LIMIT 1` → See columns
   - Run: `SELECT * FROM blog_posts LIMIT 1` → See columns

2. Begin Phase 7 with heritage sites:
   - Create datasource layer first (mock + real)
   - Write tests with mock datasource
   - Test queries against real Supabase
   - Build React components last

3. Document tier-gating decisions for future session:
   - Where does tier logic live?
   - How to test tier-gated features?
   - RLS policies vs frontend flags vs API logic

