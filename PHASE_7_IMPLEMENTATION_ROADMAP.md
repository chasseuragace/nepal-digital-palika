# Phase 7: Implementation Roadmap for M-Place

**Date:** 2026-03-29
**Scope:** Step-by-step guide for adding tourism content types to m-place
**Architecture:** Building on m-place's existing clean architecture (DI, repositories, datasources)

---

## 🎯 WHAT M-PLACE IS READY FOR

M-place already has the foundation for Phase 7:

```
✅ DI Container (getContainer.ts)
   └─ Decides: Mock data or real Supabase
   └─ Pattern established: getXyzDatasource → new XyzRepository → getXyzRepository

✅ Clean Architecture Pattern
   ├─ core/dtos/        (Data transfer objects)
   ├─ domain/           (Datasource interfaces)
   ├─ data/datasources/ (Mock + Real implementations)
   ├─ data/repositories/(Repository layer)
   ├─ services/         (Business logic)
   └─ pages/            (React components)

✅ Existing Examples
   ├─ Products (marketplace_products table)
   ├─ Businesses (businesses table)
   └─ Auth (Supabase auth)

🟡 NOT YET IMPLEMENTED
   ├─ Heritage Sites
   ├─ Events & Festivals
   ├─ Blog Posts & Stories
   ├─ Local Services Directory
   └─ SOS Emergency Information
```

---

## 📊 IMPLEMENTATION TEMPLATE (Use for Each Content Type)

For each content type, follow this exact pattern:

### Level 1: DTOs (Data Transfer Objects)

**File:** `src/core/dtos/heritage-site.dto.ts`

```typescript
// Define what data looks like
export interface HeritageSiteDTO {
  id: string
  name_en: string
  name_ne: string
  slug: string
  description: string
  location: { latitude: number; longitude: number }
  imageUrl: string
  status: 'draft' | 'published'
  palikaId: number
  palikaName: string
  createdAt: string
}

// Define what filters are available
export interface HeritageSiteFiltersDTO {
  palikaId: number
  search?: string
  status?: string
  categoryId?: number
  page?: number
  limit?: number
}

// Define paginated response
export interface GetHeritageSitesResponseDTO {
  data: HeritageSiteDTO[]
  meta: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}
```

### Level 2: Datasource Interface (Contract)

**File:** `src/domain/repositories/heritage-site.datasource.ts`

```typescript
// Interface - what datasources MUST implement
export interface IHeritageSiteDatasource {
  getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO>

  getHeritageSiteById(id: string): Promise<HeritageSiteDTO>

  getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO>

  getPopular(palikaId: number, limit?: number): Promise<HeritageSiteDTO[]>
}
```

### Level 3: Mock Datasource (For Testing)

**File:** `src/data/datasources/mock/mock-heritage-site.datasource.ts`

```typescript
import type { IHeritageSiteDatasource } from '@/domain/repositories/heritage-site.datasource'
import type { HeritageSiteDTO, GetHeritageSitesResponseDTO } from '@/core/dtos/heritage-site.dto'

export class MockHeritageSiteDatasource implements IHeritageSiteDatasource {
  private mockData: HeritageSiteDTO[] = [
    {
      id: '1',
      name_en: 'Kathmandu Durbar Square',
      name_ne: 'काठमाडौँ दरबार चौराहे',
      slug: 'kathmandu-durbar-square',
      description: 'Historic palace square in Kathmandu',
      location: { latitude: 27.7349, longitude: 85.3291 },
      imageUrl: 'https://...',
      status: 'published',
      palikaId: 1,
      palikaName: 'Kathmandu Metropolitan',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // ... more mock data
  ]

  async getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO> {
    let filtered = this.mockData.filter(site => site.palikaId === palikaId)

    if (filters?.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(
        site =>
          site.name_en.toLowerCase().includes(query) ||
          site.description.toLowerCase().includes(query)
      )
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 25
    const start = (page - 1) * limit
    const end = start + limit

    const paginated = filtered.slice(start, end)

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total: filtered.length,
        hasMore: end < filtered.length
      }
    }
  }

  async getHeritageSiteById(id: string): Promise<HeritageSiteDTO> {
    const site = this.mockData.find(s => s.id === id)
    if (!site) throw new Error('Heritage site not found')
    return site
  }

  async getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO> {
    const site = this.mockData.find(s => s.slug === slug)
    if (!site) throw new Error('Heritage site not found')
    return site
  }

  async getPopular(palikaId: number, limit?: number): Promise<HeritageSiteDTO[]> {
    return this.mockData
      .filter(site => site.palikaId === palikaId)
      .slice(0, limit || 10)
  }
}
```

### Level 4: Repository (Abstraction Layer)

**File:** `src/data/repositories/heritage-site.repository.ts`

```typescript
import type { IHeritageSiteDatasource } from '@/domain/repositories/heritage-site.datasource'
import type { HeritageSiteDTO, GetHeritageSitesResponseDTO, HeritageSiteFiltersDTO } from '@/core/dtos/heritage-site.dto'

export interface IHeritageSiteRepository {
  getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO>
  getHeritageSiteById(id: string): Promise<HeritageSiteDTO>
  getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO>
  getPopular(palikaId: number, limit?: number): Promise<HeritageSiteDTO[]>
}

export class HeritageSiteRepository implements IHeritageSiteRepository {
  constructor(private datasource: IHeritageSiteDatasource) {}

  async getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO> {
    return this.datasource.getHeritageSites(palikaId, filters)
  }

  async getHeritageSiteById(id: string): Promise<HeritageSiteDTO> {
    return this.datasource.getHeritageSiteById(id)
  }

  async getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO> {
    return this.datasource.getHeritageSiteBySlug(slug)
  }

  async getPopular(palikaId: number, limit?: number): Promise<HeritageSiteDTO[]> {
    return this.datasource.getPopular(palikaId, limit)
  }
}
```

### Level 5: DI Container Integration

**File:** `src/di/container.ts` (Add these methods)

```typescript
// Add to imports
import type { IHeritageSiteDatasource } from '@/domain/repositories/heritage-site.datasource'
import type { IHeritageSiteRepository } from '@/data/repositories/heritage-site.repository'
import { MockHeritageSiteDatasource } from '@/data/datasources/mock/mock-heritage-site.datasource'
import { HeritageSiteRepository } from '@/data/repositories/heritage-site.repository'

// Add to DIContainer class
class DIContainer {
  private heritageSiteDatasource: IHeritageSiteDatasource | null = null
  private heritageSiteRepository: IHeritageSiteRepository | null = null

  getHeritageSiteDatasource(): IHeritageSiteDatasource {
    if (this.heritageSiteDatasource) {
      return this.heritageSiteDatasource
    }

    if (this.useMockMode) {
      this.heritageSiteDatasource = new MockHeritageSiteDatasource()
    } else {
      // TODO: Implement SupabaseHeritageSiteDatasource
      throw new Error('Supabase datasource not yet implemented. Use VITE_USE_MOCK_DATA=true')
    }

    return this.heritageSiteDatasource
  }

  getHeritageSiteRepository(): IHeritageSiteRepository {
    if (this.heritageSiteRepository) {
      return this.heritageSiteRepository
    }

    const datasource = this.getHeritageSiteDatasource()
    this.heritageSiteRepository = new HeritageSiteRepository(datasource)

    return this.heritageSiteRepository
  }

  reset(): void {
    // ... existing reset code ...
    this.heritageSiteDatasource = null
    this.heritageSiteRepository = null
  }
}
```

### Level 6: Service Layer (Business Logic)

**File:** `src/services/heritage-site.service.ts`

```typescript
import { getContainer } from '@/di/container'
import type { HeritageSiteDTO, GetHeritageSitesResponseDTO, HeritageSiteFiltersDTO } from '@/core/dtos/heritage-site.dto'

export class HeritageSiteService {
  private static instance: HeritageSiteService | null = null

  private constructor() {}

  static getInstance(): HeritageSiteService {
    if (!HeritageSiteService.instance) {
      HeritageSiteService.instance = new HeritageSiteService()
    }
    return HeritageSiteService.instance
  }

  async getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO> {
    const repository = getContainer().getHeritageSiteRepository()
    return repository.getHeritageSites(palikaId, filters)
  }

  async getHeritageSiteById(id: string): Promise<HeritageSiteDTO> {
    const repository = getContainer().getHeritageSiteRepository()
    return repository.getHeritageSiteById(id)
  }

  async getHeritageSiteBySlug(slug: string): Promise<HeritageSiteDTO> {
    const repository = getContainer().getHeritageSiteRepository()
    return repository.getHeritageSiteBySlug(slug)
  }

  async getPopularSites(palikaId: number, limit?: number): Promise<HeritageSiteDTO[]> {
    const repository = getContainer().getHeritageSiteRepository()
    return repository.getPopular(palikaId, limit)
  }
}

export const heritageSiteService = HeritageSiteService.getInstance()
```

### Level 7: React Components

**File:** `src/components/HeritageSiteCard.tsx`

```typescript
import type { HeritageSiteDTO } from '@/core/dtos/heritage-site.dto'

interface Props {
  site: HeritageSiteDTO
}

export function HeritageSiteCard({ site }: Props) {
  return (
    <div className="card">
      <img src={site.imageUrl} alt={site.name_en} />
      <h3>{site.name_en}</h3>
      <p>{site.description}</p>
      <a href={`/heritage-sites/${site.slug}`}>View Details</a>
    </div>
  )
}
```

**File:** `src/components/HeritageSiteList.tsx`

```typescript
import { useEffect, useState } from 'react'
import { heritageSiteService } from '@/services/heritage-site.service'
import { HeritageSiteCard } from './HeritageSiteCard'
import type { HeritageSiteDTO } from '@/core/dtos/heritage-site.dto'

interface Props {
  palikaId: number
}

export function HeritageSiteList({ palikaId }: Props) {
  const [sites, setSites] = useState<HeritageSiteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSites = async () => {
      try {
        const result = await heritageSiteService.getHeritageSites(palikaId)
        setSites(result.data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadSites()
  }, [palikaId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid">
      {sites.map(site => (
        <HeritageSiteCard key={site.id} site={site} />
      ))}
    </div>
  )
}
```

### Level 8: Page/Route

**File:** `src/pages/HeritageSites.tsx`

```typescript
import { useCurrentPalika } from '@/hooks/useCurrentPalika'
import { HeritageSiteList } from '@/components/HeritageSiteList'

export function HeritageSites() {
  const palika = useCurrentPalika()

  if (!palika) return <div>Please select a palika</div>

  return (
    <div className="page">
      <h1>Heritage Sites in {palika.name}</h1>
      <HeritageSiteList palikaId={palika.id} />
    </div>
  )
}
```

---

## 📋 PHASE 7 CONTENT TYPES CHECKLIST

For each content type, follow the template above. Here's the order:

### 1️⃣ Heritage Sites (FIRST - Simplest)

```
Files to create (8 files):

✅ src/core/dtos/heritage-site.dto.ts               (4 interfaces)
✅ src/domain/repositories/heritage-site.datasource.ts  (1 interface)
✅ src/data/datasources/mock/mock-heritage-site.datasource.ts (1 class)
✅ src/data/repositories/heritage-site.repository.ts    (2 classes)
✅ src/services/heritage-site.service.ts           (1 class)
✅ src/components/HeritageSiteCard.tsx             (1 component)
✅ src/components/HeritageSiteList.tsx             (1 component)
✅ src/pages/HeritageSites.tsx                     (1 page)

Changes to existing files:

✅ src/di/container.ts                             (Add 2 methods)
✅ src/App.tsx                                     (Add route)

Estimated LOC: 400-500 lines
Estimated time: 2-3 hours
```

### 2️⃣ Events & Festivals

```
Same pattern as heritage sites (8 files)
Add date-range filtering for upcoming events
Estimated: 450-550 lines
```

### 3️⃣ Blog Posts & Stories

```
Same pattern
Add category/tag filtering
Add search functionality
Estimated: 450-550 lines
```

### 4️⃣ Local Services Directory

```
Same pattern
Reuse existing businesses table filtering
Filter by service type (hotel, restaurant, guide, etc.)
Estimated: 350-400 lines (less code due to reuse)
```

### 5️⃣ SOS Emergency Information

```
Same pattern
Simpler data model (fewer fields)
Estimated: 300-350 lines
```

---

## 🚀 QUICK START: HERITAGE SITES IMPLEMENTATION

### Step 1: Create DTO File

Create `src/core/dtos/heritage-site.dto.ts` with the 4 interfaces from the template above.

**Why:** Defines the data contract. All other code flows from this.

### Step 2: Create Datasource Interface

Create `src/domain/repositories/heritage-site.datasource.ts` with the `IHeritageSiteDatasource` interface.

**Why:** Defines what implementations must support. Allows swapping mock ↔ real.

### Step 3: Create Mock Datasource

Create `src/data/datasources/mock/mock-heritage-site.datasource.ts` with `MockHeritageSiteDatasource` class.

**Why:** For testing without real database. Use with `VITE_USE_MOCK_DATA=true`.

### Step 4: Create Repository

Create `src/data/repositories/heritage-site.repository.ts` with both interface and implementation.

**Why:** Abstracts away datasource details. Service layer doesn't know if it's mock or real.

### Step 5: Update DI Container

Edit `src/di/container.ts` and add the 2 methods:
- `getHeritageSiteDatasource()`
- `getHeritageSiteRepository()`

Also update the `reset()` method.

**Why:** Wires everything up. This is how services get their dependencies.

### Step 6: Create Service

Create `src/services/heritage-site.service.ts` with `HeritageSiteService` singleton class.

**Why:** Business logic layer. React components use this to load data.

### Step 7: Create Components

Create:
- `src/components/HeritageSiteCard.tsx` - Display single site
- `src/components/HeritageSiteList.tsx` - Display paginated list

**Why:** React UI layer. Calls service to load data.

### Step 8: Create Page

Create `src/pages/HeritageSites.tsx` to tie everything together.

**Why:** User navigates here. Page uses components which use service which uses DI.

### Step 9: Update Routes

Edit `src/App.tsx` and add route:

```typescript
import { HeritageSites } from '@/pages/HeritageSites'

// In routing:
<Route path="/heritage-sites" element={<HeritageSites />} />
```

### Step 10: Test with Mock Data

```bash
VITE_USE_MOCK_DATA=true npm run dev
```

Navigate to `/heritage-sites` and verify it works.

**Why:** You can test everything before writing real Supabase code.

### Step 11: Test with Real Supabase

Once mock data works, create `src/data/datasources/supabase-heritage-site.datasource.ts` with real database queries (using patterns from admin-panel).

Update DI container to use real datasource when `VITE_USE_MOCK_DATA=false`.

---

## 🔗 SUPABASE INTEGRATION (After Mock Works)

When you're ready to connect to real Supabase, follow admin-panel's patterns:

**File:** `src/data/datasources/supabase-heritage-site.datasource.ts`

```typescript
import { supabase } from '@/lib/supabase'
import type { IHeritageSiteDatasource } from '@/domain/repositories/heritage-site.datasource'
import type { HeritageSiteDTO, GetHeritageSitesResponseDTO, HeritageSiteFiltersDTO } from '@/core/dtos/heritage-site.dto'

export class SupabaseHeritageSiteDatasource implements IHeritageSiteDatasource {
  async getHeritageSites(
    palikaId: number,
    filters?: HeritageSiteFiltersDTO
  ): Promise<GetHeritageSitesResponseDTO> {
    let query = supabase
      .from('heritage_sites')
      .select(`
        id,
        name_en,
        name_ne,
        slug,
        description,
        location,
        featured_image as imageUrl,
        status,
        palika_id,
        palikas!inner(name_en as palika_name),
        created_at
      `)
      .eq('palika_id', palikaId)
      .eq('status', 'published')

    // Apply filters from admin-panel patterns
    if (filters?.search) {
      query = query.or(
        `name_en.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 25
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const mapped = (data || []).map(row => ({
      id: row.id,
      name_en: row.name_en,
      // ... map other fields
      palikaName: row.palikas?.palika_name
    }))

    return {
      data: mapped,
      meta: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0)
      }
    }
  }

  // ... implement other methods similarly
}
```

---

## 🎯 WHY THIS ORDER?

1. **Heritage Sites First** - Simplest data model, no date ranges, no status workflows
2. **Events Second** - Add date-range filtering, learn from events
3. **Blogs Third** - Add category/tag filtering, learn from blogs
4. **Services Fourth** - Reuse business filtering, reduces new code
5. **SOS Last** - Simplest, can reuse patterns from all others

---

## 📝 KEY PRINCIPLES

✅ **Start with Mock** - Test UI/logic before touching database
✅ **Follow Template** - 8-file pattern used for every content type
✅ **Test Each Level** - Component → Service → Repository → Datasource
✅ **DI First** - Always wire up container BEFORE UI
✅ **Pagination Built-in** - Page/limit filtering from day 1
✅ **No Tier-Gating Yet** - Skip that (future session)
✅ **Public Browsing Only** - No login required for reading
✅ **Real Supabase Last** - Only after mock works

---

## 🏁 PHASE 7 COMPLETION CRITERIA

All content types complete when:

```
✅ Heritage Sites
  ├─ Mock datasource works
  ├─ Components render
  ├─ Real Supabase queries integrated
  └─ Deployed to production

✅ Events & Festivals
  ├─ Pagination working
  ├─ Date filtering (upcoming, past)
  ├─ Sorted chronologically
  └─ RLS policies verified

✅ Blog Posts & Stories
  ├─ Category/tag filtering
  ├─ Search functionality
  ├─ Recent/popular sections
  └─ Published_at timestamp working

✅ Local Services
  ├─ Hotels, restaurants, guides filtering
  ├─ Search by type and location
  ├─ Rating/review system
  └─ Contact information displayed

✅ SOS Information
  ├─ Emergency contacts
  ├─ Alert system
  ├─ Real-time status updates
  └─ RLS for palika-specific access

✅ M-Place Navigation
  ├─ Links to all 5 content types
  ├─ Homepage featured sections
  ├─ Search across all content
  └─ No login required to browse

✅ Testing
  ├─ All components tested with mock data
  ├─ All queries tested with real Supabase
  ├─ No RLS bypasses
  └─ Performance verified
```

---

## 🔮 NEXT SESSION: TIER-GATING STANDARDIZATION

After Phase 7 is complete, schedule a dedicated session to decide:

1. **Where does tier logic live?**
   - DB triggers (best for enforcement)
   - API routes (best for control)
   - RLS policies (best for security)
   - Frontend flags (best for UX)

2. **How to handle conditional defaults?**
   - Example: "If approval_workflow = OFF, product_status = 'approved'"
   - Where should this be implemented?

3. **What gets tier-gated in Phase 7?**
   - Categories (which palikas can offer what)
   - Content types (who can create events, blogs, etc.)
   - Features (who gets analytics, advanced search, etc.)

4. **How to test tier-gated features?**
   - Unit tests for tier logic
   - Integration tests for RLS
   - E2E tests for whole flow

5. **Documentation pattern?**
   - Create reusable architecture document
   - Examples for each content type
   - Decision tree for future features

