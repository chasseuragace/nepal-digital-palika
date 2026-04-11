# Direct API Calls Audit & Refactoring Plan

**Date:** 2026-04-10  
**Status:** Audit Complete - Ready for Refactoring

## Summary

Found **12 pages** with direct `fetch()` calls that bypass the client service layer. These need refactoring to follow clean architecture pattern.

## Pages with Direct API Calls

| Page | Endpoints Called | Type | Priority |
|------|-----------------|------|----------|
| `app/admins/[id]/page.tsx` | `/api/palikas/provinces` | Edit admin | HIGH |
| `app/admins/new/page.tsx` | `/api/roles`, `/api/palikas/provinces`, `/api/admins/create` | Create admin | HIGH |
| `app/events/[id]/page.tsx` | `/api/palikas` | Edit event | MEDIUM |
| `app/heritage-sites/new/page.tsx` | `/api/categories`, `/api/palikas`, `/api/heritage-sites` | Create site | MEDIUM |
| `app/login/page.tsx` | `/api/auth/login` | Auth | LOW (keep as-is) |
| `app/notifications/compose/page.tsx` | `/api/notifications` | Compose | MEDIUM |
| `app/palika-profile/page.tsx` | `/api/palika-profile` | Palika profile | MEDIUM |
| `app/permissions/page.tsx` | `/api/roles?limit=1000` | Permissions | MEDIUM |
| `app/regions/page.tsx` | `/api/regions`, `/api/admins`, `/api/regions/assign-admin`, `/api/regions/remove-admin` | Regions mgmt | HIGH |
| `app/roles/[id]/page.tsx` | `/api/permissions` | Edit role | MEDIUM |
| `app/roles/page.tsx` | `/api/roles` | Roles listing | HIGH |
| `app/tiers/page.tsx` | `/api/tier-change-requests` | Tiers | MEDIUM |

## Endpoints to Wrap with Client Services

### Already Have Client Services ✅
- `/api/blog-posts` → `blogPostsService`
- `/api/events` → `eventsService`
- `/api/heritage-sites` → `heritageSitesService`

### Need Client Services (NEW) ❌

1. **Admin Management**
   - POST `/api/admins/create`
   - GET `/api/admins?limit=X`
   - → Service: `adminsService`

2. **Regions (Provinces, Districts, Palikas)**
   - GET `/api/regions`
   - POST `/api/regions/assign-admin`
   - POST `/api/regions/remove-admin`
   - → Service: `regionsService`

3. **Roles & Permissions**
   - GET `/api/roles`
   - GET `/api/permissions`
   - POST/DELETE `/api/roles`
   - → Service: `rolesService`, `permissionsService`

4. **Palika Profile**
   - GET `/api/palika-profile?palika_id=X`
   - PUT `/api/palika-profile`
   - → Service: `palikaProfileService`

5. **Tier Change Requests**
   - GET `/api/tier-change-requests`
   - POST `/api/tier-change-requests`
   - → Service: `tierChangeRequestsService`

6. **Notifications**
   - POST `/api/notifications`
   - → Service: `notificationsService`

7. **Categories & Utilities**
   - GET `/api/categories?entity_type=X`
   - GET `/api/palikas`
   - GET `/api/palikas/provinces`
   - → Service: `categoriesService`, `palikaService`, `provincesService`

## Pattern for Refactoring

### BEFORE ❌
```typescript
'use client'
const fetchRoles = async () => {
  const response = await fetch('/api/roles', { /* ... */ })
  const data = await response.json()
  setRoles(data)
}
```

### AFTER ✅
```typescript
'use client'
import { rolesService } from '@/lib/client/roles-client.service'

const fetchRoles = async () => {
  const result = await rolesService.getAll()
  setRoles(result.data)
}
```

## Benefits of Refactoring

✅ **Centralized API Logic**
- All API calls in one place
- Easy to change endpoints globally
- Consistent error handling

✅ **Type Safety**
- Services export types
- Components use service types
- Catch errors at compile time

✅ **Testability**
- Mock services in tests
- No need to mock fetch
- Can test components in isolation

✅ **Maintainability**
- Adding features: update service only
- Changing API: update service only
- Components stay clean

## Implementation Order

### Phase 1: Core Services (HIGH PRIORITY)
1. `adminsService` - Affects 2 pages
2. `regionsService` - Affects 1 page
3. `rolesService` - Affects 2 pages

### Phase 2: Profile Services (MEDIUM)
4. `palikaProfileService` - Affects 1 page
5. `notificationsService` - Affects 1 page
6. `tierChangeRequestsService` - Affects 1 page

### Phase 3: Utility Services (MEDIUM)
7. `categoriesService` - Affects 1 page
8. `palikaService` - Affects 3 pages (provinces, palikas)
9. `permissionsService` - Affects 1 page

### Phase 4: Refactor Pages (LOW PRIORITY)
10. Update all 12 pages to use new services
11. Remove direct fetch calls
12. Clean up state management

## Files to Create

```
lib/client/
├── admins-client.service.ts
├── regions-client.service.ts
├── roles-client.service.ts
├── permissions-client.service.ts
├── palika-profile-client.service.ts
├── notifications-client.service.ts
├── tier-change-requests-client.service.ts
├── categories-client.service.ts
├── palikas-client.service.ts
└── provinces-client.service.ts
```

## Estimated Effort

- Service Creation: 2-3 hours (10 services × 15-20 min each)
- Page Refactoring: 1-2 hours (12 pages × 5-10 min each)
- Testing: 1 hour
- **Total: 4-6 hours**

## Status

- [ ] Create adminsService
- [ ] Create regionsService
- [ ] Create rolesService
- [ ] Create permissionsService
- [ ] Create palikaProfileService
- [ ] Create notificationsService
- [ ] Create tierChangeRequestsService
- [ ] Create categoriesService
- [ ] Create palikaService
- [ ] Create provincesService
- [ ] Refactor app/admins/new/page.tsx
- [ ] Refactor app/admins/[id]/page.tsx
- [ ] Refactor app/regions/page.tsx
- [ ] Refactor app/roles/page.tsx
- [ ] Refactor app/roles/[id]/page.tsx
- [ ] Refactor app/palika-profile/page.tsx
- [ ] Refactor app/notifications/compose/page.tsx
- [ ] Refactor app/tiers/page.tsx
- [ ] Refactor app/permissions/page.tsx
- [ ] Refactor app/heritage-sites/new/page.tsx
- [ ] Refactor app/events/[id]/page.tsx
- [ ] Verify all pages work
- [ ] Playwright testing
