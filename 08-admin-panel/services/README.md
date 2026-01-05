# Nepal Tourism Platform - Services Layer

Framework-agnostic services for the Nepal Digital Tourism Infrastructure admin panel.

## Overview

This services layer provides a clean separation between business logic and UI components. The services can be used in any React/TypeScript project, making it easy to:

- Move to a different React framework (Next.js, Vite, Create React App)
- Test business logic independently
- Swap database backends (Supabase, Firebase, REST API)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ AuthService │ │ Heritage    │ │ EventsService       │   │
│  │             │ │ SitesService│ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────────────────────────────┐   │
│  │ BlogPosts   │ │ AnalyticsService                    │   │
│  │ Service     │ │                                     │   │
│  └─────────────┘ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Client                            │
│  (Supabase, Mock, or Custom Implementation)                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize Services

```typescript
import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient, createServices } from './services'

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create database client wrapper
const db = createSupabaseClient(supabase)

// Create all services
const services = createServices(db)

// Use services
const { heritageSites, events, blogPosts, analytics, auth } = services
```

### 2. Use Individual Services

```typescript
import { HeritageSitesService } from './services'

const heritageSitesService = new HeritageSitesService(db)

// Get all heritage sites
const result = await heritageSitesService.getAll()
if (result.success) {
  console.log(result.data)
}

// Get with filters
const filtered = await heritageSitesService.getAll({
  palika_id: 1,
  status: 'published',
  is_featured: true
})

// Create new site
const created = await heritageSitesService.create({
  name_en: 'New Temple',
  name_ne: 'नयाँ मन्दिर',
  palika_id: 1,
  category_id: 1
})
```

## Services

### AuthService

Handles authentication, session management, and permissions.

```typescript
// Login
const result = await auth.login({ email, password })

// Check permissions
if (auth.hasPermission('heritage_sites.create')) {
  // User can create heritage sites
}

// Get current user
const user = auth.getCurrentUser()
```

### HeritageSitesService

CRUD operations for heritage sites.

```typescript
// Get all with pagination
const sites = await heritageSites.getAll(
  { status: 'published' },
  { page: 1, limit: 20 }
)

// Get by ID
const site = await heritageSites.getById('uuid')

// Create
const newSite = await heritageSites.create({
  name_en: 'Temple Name',
  name_ne: 'मन्दिर नाम',
  palika_id: 1,
  category_id: 1,
  heritage_status: 'world_heritage'
})

// Update
await heritageSites.update('uuid', { status: 'published' })

// Delete
await heritageSites.delete('uuid')

// Publish/Archive
await heritageSites.publish('uuid')
await heritageSites.archive('uuid')

// Get featured
const featured = await heritageSites.getFeatured(6)
```

### EventsService

CRUD operations for events and festivals.

```typescript
// Get upcoming events
const upcoming = await events.getUpcoming(10)

// Get festivals only
const festivals = await events.getFestivals()

// Get events for calendar
const calendarEvents = await events.getCalendarEvents(2025, 10)

// Create event
const newEvent = await events.create({
  name_en: 'Festival Name',
  name_ne: 'पर्व नाम',
  palika_id: 1,
  start_date: '2025-10-01',
  end_date: '2025-10-05',
  is_festival: true
})
```

### BlogPostsService

CRUD operations for blog posts.

```typescript
// Get recent posts
const recent = await blogPosts.getRecent(5)

// Get popular posts
const popular = await blogPosts.getPopular(5)

// Get by category
const categoryPosts = await blogPosts.getByCategory('Tourism News')

// Get all tags
const tags = await blogPosts.getTags()
```

### AnalyticsService

Dashboard statistics and reporting.

```typescript
// Get dashboard stats
const stats = await analytics.getDashboardStats(palikaId)

// Get top content
const topSites = await analytics.getTopContent('heritage_site', 10)

// Get content freshness report
const freshness = await analytics.getContentFreshnessReport()

// Get palika activity report
const activity = await analytics.getPalikaActivityReport()

// Generate monthly report
const report = await analytics.generateMonthlyReport(palikaId, 2025, 1)
```

## Testing

The services include a mock database client for testing:

```typescript
import { createMockClient, HeritageSitesService } from './services'

// Create mock client with test data
const mockDb = createMockClient({
  heritage_sites: [
    { id: '1', name_en: 'Test Site', status: 'published' }
  ]
})

// Create service with mock
const service = new HeritageSitesService(mockDb)

// Test
const result = await service.getAll()
expect(result.success).toBe(true)
```

Run tests:

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Type Definitions

All types are exported from `./types.ts`:

```typescript
import {
  HeritageSite,
  Event,
  BlogPost,
  AdminUser,
  DashboardStats,
  ServiceResponse,
  PaginatedResponse
} from './services/types'
```

## Portability

To use these services in a different React project:

1. Copy the `services/` folder to your project
2. Install dependencies: `@supabase/supabase-js` (or your database client)
3. Initialize services with your database client
4. Use services in your components

The services have no dependencies on Next.js or any specific React framework.

## User Stories Covered

Based on the System Operations document, these services support:

### Palika Administrator Workflows
- Initial system setup
- Weekly content review
- Managing user permissions
- Monthly reporting

### Content Creator Workflows
- Adding heritage sites
- Creating events/festivals
- Daily content updates
- Media management

### Analytics Workflows
- Dashboard metrics
- Content performance
- User engagement
- Monthly reports

### Tourist/Citizen Interactions
- Heritage site discovery
- Event calendar
- Business directory
- Search functionality
