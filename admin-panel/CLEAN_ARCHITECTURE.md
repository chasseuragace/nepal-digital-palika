# Clean Architecture: Notification & Business Targeting Modules

## Overview

The notification and business targeting modules implement **clean architecture with dependency injection**, allowing seamless switching between real (Supabase) and fake (mock) datasources.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│          API Routes                     │
│   /api/notifications-v2                 │
│   /api/business-targeting               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Service Layer                   │
│   NotificationService                   │
│   BusinessTargetingService              │
│   (Business logic, validation)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Abstract Datasource Interface       │
│   INotificationDatasource               │
│   (Contract for data operations)        │
└──────┬───────────────────────┬──────────┘
       │                       │
   ┌───▼────────────────┐  ┌──▼──────────────────┐
   │ Fake Datasource    │  │ Supabase Datasource │
   │ (Mock data)        │  │ (Real queries)      │
   │ Fast, no network   │  │ Production ready    │
   └────────────────────┘  └─────────────────────┘
```

## Data Flow

### Sending a Notification

```
API Route (POST /api/notifications-v2)
    ↓ extracts { compose, attachments }
    ↓
NotificationService.sendNotification(compose)
    ↓ delegates to datasource
    ↓
INotificationDatasource.sendNotification()
    ↓ (can be Fake OR Supabase implementation)
    ↓ inserts notifications, returns count
    ↓
API Response { success, recipientCount, notificationId }
```

## Key Files

### Abstractions (Contracts)

**`lib/notification-datasource.ts`**
- `INotificationDatasource` interface
- DTOs: `NotificationRow`, `SentNotificationSummary`, `NotificationStats`
- Defines all data operations that any datasource must implement

### Implementations

**`lib/fake-notification-datasource.ts`**
- `FakeNotificationDatasource` — Mock implementation
- Returns hardcoded data (5 mock users, 4 sample notifications)
- Simulates network delays (100-200ms)
- **USE CASE**: Development, testing, frontend work without Supabase

**`lib/supabase-notification-datasource.ts`**
- `SupabaseNotificationDatasource` — Real implementation
- Queries actual Supabase database
- Batch inserts (1000-row chunks) for large broadcasts
- **USE CASE**: Production, testing with real data

### Configuration & DI

**`lib/notification-config.ts`**
- `createNotificationDatasource()` — Factory function
- Reads `NEXT_PUBLIC_USE_FAKE_DATASOURCES` environment variable
- Returns either Fake or Supabase datasource
- `getNotificationDatasource()` — Lazy-initialized singleton
- `setNotificationDatasource()` — Override for testing

### Service Layer

**`services/notification.service.ts`**
- `NotificationService` — High-level business logic
- Constructor accepts optional datasource (uses DI config if not provided)
- Public methods:
  - `sendNotification(compose)` — Send broadcast or personal
  - `listSentNotifications(palikaId, filters)` — Paginated listing
  - `getNotificationDetail(id)` — Single notification
  - `deleteBroadcast(id)` — Delete all recipient rows
  - `getNotificationStats(palikaId)` — Dashboard stats
- **No direct Supabase calls** — all via injected datasource

### API Routes

**`app/api/notifications-v2/route.ts`**
- Clean GET/POST handlers
- Uses `notificationService` singleton
- Datasource switching is **transparent** — routes don't know if it's fake or real

## DTOs (Supabase-Grounded)

All DTOs match actual database schema:

```typescript
// NotificationRow matches notifications table
interface NotificationRow {
  id: string
  user_id: string                    // FK → auth.users
  palika_id: number                  // FK → palikas
  notification_type: 'general' | 'personal'
  category: string                   // VARCHAR(100) from notification-use-cases.ts
  title: string
  body: string                       // Short preview
  body_full?: string                 // Full content (optional)
  image_url?: string
  is_seen: boolean                   // Constraint: general must be false
  created_at: string
  updated_at: string
}

// SentNotificationSummary for listing (grouped by broadcast)
interface SentNotificationSummary {
  title: string
  body: string
  notification_type: NotificationType
  category: string
  image_url?: string
  created_at: string
  recipient_count: number            // Calculated from grouping
  target_user_id?: string            // For personal: the target user
  sample_notification_id: string     // One representative ID
}
```

## Switching Datasources

### Option 1: Environment Variable (Recommended)

```bash
# .env.local
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true   # Uses FakeNotificationDatasource
NEXT_PUBLIC_USE_FAKE_DATASOURCES=false  # Uses SupabaseNotificationDatasource
```

On startup, `notification-config.ts` logs which datasource is active:
```
[Notification] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)
[Notification] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)
```

### Option 2: Programmatic (Testing)

```typescript
import { setNotificationDatasource } from '@/lib/notification-config'
import { FakeNotificationDatasource } from '@/lib/fake-notification-datasource'

// Override datasource for a test
setNotificationDatasource(new FakeNotificationDatasource())
```

## Adding a New Datasource

To add a new datasource (e.g., REST API, Postgres, Firebase):

1. Create a class implementing `INotificationDatasource`:
```typescript
export class CustomNotificationDatasource implements INotificationDatasource {
  async sendNotification(...) { /* implementation */ }
  async listSentNotifications(...) { /* implementation */ }
  // ... implement all methods
}
```

2. Update `notification-config.ts` to instantiate it:
```typescript
if (useCustom) {
  return new CustomNotificationDatasource()
}
```

3. Service and API routes work unchanged — no modifications needed!

## Testing

### Unit Test (Service + Fake Datasource)

```typescript
import { NotificationService } from '@/services/notification.service'
import { FakeNotificationDatasource } from '@/lib/fake-notification-datasource'

describe('NotificationService', () => {
  it('sends broadcast to all users', async () => {
    const fakeDS = new FakeNotificationDatasource()
    const service = new NotificationService(fakeDS)
    
    const result = await service.sendNotification({
      notification_type: 'general',
      category: 'announcement',
      title: 'Test',
      body: 'Test broadcast',
      palika_id: 1,
    })
    
    expect(result.success).toBe(true)
    expect(result.recipientCount).toBeGreaterThan(0)
  })
})
```

### Integration Test (Service + Supabase)

```typescript
// Uses real Supabase (from environment variables)
const service = new NotificationService()  // Uses default DI config
const result = await service.sendNotification({ ... })
```

## Business Targeting Module

The same architecture is applied to `BusinessTargetingService`:

- **Abstraction**: Not yet extracted (uses `businessTargetingService` directly)
- **Fake Implementation**: `lib/fake-business-targeting.ts` (8 mock businesses)
- **Real Implementation**: `services/business-targeting.service.ts` (queries Supabase)
- **API**: `/api/business-targeting` + `/api/business-targeting/filter-options` + `/api/business-targeting/stats`

Future: Extract abstract datasource interface for consistency with notification module.

## Design Principles

1. **Single Responsibility**: Each layer has one reason to change
   - Routes: HTTP handling
   - Service: Business logic
   - Datasource: Data operations
   
2. **Dependency Inversion**: Service depends on abstract interface, not concrete implementation

3. **Open/Closed**: Open for extension (new datasources), closed for modification (service doesn't change)

4. **Supabase-Grounded**: DTOs match actual schema (no "theoretical" fields)

5. **Mock/Real Parity**: Fake datasource returns same DTO shapes as Supabase

## Future Work

1. Extract `IBusinessTargetingDatasource` interface (similar to notifications)
2. Add REST API datasource implementation
3. Add caching layer (e.g., Redis datasource wrapper)
4. Add audit logging datasource wrapper
5. Add comprehensive query builders for complex filters

## References

- **Query Builder Pattern**: `services/business-targeting.service.ts:85-166`
- **Service Layer Pattern**: `services/notification.service.ts`
- **Dependency Injection**: `lib/notification-config.ts`
- **DTO Pattern**: All `interface` exports in `lib/notification-datasource.ts`
