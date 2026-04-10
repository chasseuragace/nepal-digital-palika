# Client Services Architecture

**Date:** 2026-04-10  
**Status:** ✅ Complete & Verified with Playwright

## Overview

Implemented client-side service layer abstraction to separate UI components from direct API calls. Pages now use clean service interfaces instead of hardcoded fetch URLs.

## What Was Built

### Client Service Files

**1. `lib/client/blog-posts-client.service.ts`**
- Singleton service class: `blogPostsService`
- Methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Handles paginated responses & filters
- Error handling with descriptive messages

**2. `lib/client/events-client.service.ts`**
- Singleton service class: `eventsService`
- Methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Supports filtering by status, palika_id, is_festival, search
- Pagination support

**3. `lib/client/heritage-sites-client.service.ts`**
- Singleton service class: `heritageSitesService`
- Methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Filters: status, palika_id, category_id, heritage_status, search
- Pagination support

### Updated Pages

**1. `app/blog-posts/page.tsx`**
- ❌ Before: `const response = await fetch('/api/blog-posts')`
- ✅ After: `const result = await blogPostsService.getAll()`
- Imports service: `import { blogPostsService } from '@/lib/client/blog-posts-client.service'`
- Fixed field mappings: `title_en` instead of `title`

**2. `app/events/page.tsx`**
- ❌ Before: `const response = await fetch('/api/events')`
- ✅ After: `const result = await eventsService.getAll()`
- Imports service: `import { eventsService } from '@/lib/client/events-client.service'`
- Fixed field mappings: `name_en`, `name_ne` instead of `name_english`, `name_nepali`

**3. `app/heritage-sites/page.tsx`**
- ❌ Before: `const response = await fetch('/api/heritage-sites')`
- ✅ After: `const result = await heritageSitesService.getAll()`
- Imports service: `import { heritageSitesService } from '@/lib/client/heritage-sites-client.service'`
- Fixed interface to match actual API response
- Fixed field mappings throughout component

## Architecture Flow

```
┌──────────────────────────┐
│   UI Component (Page)     │
│   [blog-posts/page.tsx]   │
└──────────────┬────────────┘
               │ uses
               ▼
┌──────────────────────────────────┐
│   Client Service Layer            │
│   blogPostsService.getAll()       │
│   eventsService.getAll()          │
│   heritageSitesService.getAll()   │
└──────────────┬────────────────────┘
               │ calls
               ▼
┌──────────────────────────────────┐
│   API Routes                      │
│   /api/blog-posts                 │
│   /api/events                     │
│   /api/heritage-sites             │
└──────────────┬────────────────────┘
               │ uses
               ▼
┌──────────────────────────────────┐
│   Service Layer (Server-side)     │
│   BlogPostsService                │
│   EventsService                   │
│   HeritageSitesService            │
└──────────────┬────────────────────┘
               │ uses
               ▼
┌──────────────────────────────────┐
│   Datasources                     │
│   FakeBlogPostsDatasource         │
│   FakeEventsDatasource            │
│   FakeHeritageSitesDatasource     │
└──────────────┬────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    Fake Data      Real Supabase
   (Dev Mode)      (Production)
```

## Benefits

✅ **Clean Separation**
- Pages don't know about API URLs
- Services own the API contract
- Easy to change API structure without touching UI

✅ **Reusability**
- Multiple pages can share same service
- Service methods are centralized
- Filter/pagination logic lives in one place

✅ **Testability**
- Can mock services in tests
- API calls are centralized & easy to stub
- No need to mock fetch in every test

✅ **Type Safety**
- Each service exports its own types
- Pages import types from service
- TypeScript catches mismatches at compile time

✅ **Maintainability**
- Adding API methods: update service only
- Changing API response format: update service only
- Pages stay clean and focused on UI logic

## Usage Example

```typescript
'use client'
import { blogPostsService } from '@/lib/client/blog-posts-client.service'

export function BlogPostList() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    // ✅ Clean, semantic API
    blogPostsService
      .getAll({ status: 'published' }, { page: 1, limit: 20 })
      .then(result => setPosts(result.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title_en}</div>
      ))}
    </div>
  )
}
```

## Verification with Playwright

✅ **Blog Posts Page**
- 5 fake blog posts loading
- Fields: title_en, slug, status, author_name, created_at
- Service: `blogPostsService.getAll()`

✅ **Events Page**
- 5 fake events loading
- Fields: name_en, name_ne, event_type, start_date, end_date, status
- Service: `eventsService.getAll()`

✅ **Heritage Sites Page**
- 5 fake heritage sites loading
- Fields: name_en, name_ne, site_type, heritage_status, status
- Service: `heritageSitesService.getAll()`

✅ **Authentication**
- Mock auth enabled: `NEXT_PUBLIC_USE_MOCK_AUTH=true`
- Logged in as: `super@admin.com`
- Test users: super@, district@, palika@, test@admin.com

✅ **Fake Data**
- Blog posts: 5 realistic Nepal tourism posts
- Events: 5 Nepal cultural events (workshops, festivals, tours)
- Heritage sites: 5 UNESCO heritage sites (Durbar Squares, Stupas, Temples)

## Full Stack Architecture Complete

```
Offline Development ──── ENABLED

NEXT_PUBLIC_USE_MOCK_AUTH=true        ✅ Fake auth system
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true ✅ Fake blog, events, heritage data

Client Layer
├── Pages (no API URLs)                ✅ Clean UI
├── Client Services (abstract fetch)   ✅ Centralized API contract
└── Form validation, UI state          ✅ Isolated from data layer

Server Layer
├── API Routes (handle HTTP)           ✅ Using service layer
├── Services (business logic)          ✅ Using datasources
└── Datasources (data access)          ✅ Can be fake or real

Data Layer
├── Fake Datasources (dev/test)        ✅ In-memory mock data
└── Real Datasources (production)      ✅ Supabase queries
```

## Files Modified

- `app/blog-posts/page.tsx` - Now uses `blogPostsService`
- `app/events/page.tsx` - Now uses `eventsService`
- `app/heritage-sites/page.tsx` - Now uses `heritageSitesService`
- `.env.local` - Added `NEXT_PUBLIC_USE_MOCK_AUTH=true`

## Files Created

- `lib/client/blog-posts-client.service.ts`
- `lib/client/events-client.service.ts`
- `lib/client/heritage-sites-client.service.ts`

## Next Steps (Optional)

1. **Add more client service methods** - search, filter, pagination helpers
2. **Create error/loading hooks** - Extract common fetch patterns
3. **Add request caching** - Cache responses at service layer
4. **Implement retry logic** - Handle transient failures gracefully
