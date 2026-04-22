# SOS Module - Datasource Implementation

## Overview

The SOS module implements **clean architecture with dependency injection**, allowing seamless switching between Fake (mock) and Supabase (real) datasources.

## Architecture

```
┌─────────────────────────────────────────┐
│          API Routes / Services          │
│   /api/admin/sos/...                    │
│   SOSService                            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Datasource Interface               │
│   ISOSDatasource                        │
│   (Contract for all data operations)    │
└──────────┬───────────────────┬──────────┘
           │                   │
    ┌──────▼──────────┐  ┌─────▼─────────────────┐
    │ FakeSOS         │  │ SupabaseSOS           │
    │ Datasource      │  │ Datasource            │
    │ (Mock data)     │  │ (Real Supabase)       │
    │ Development     │  │ Production            │
    └─────────────────┘  └───────────────────────┘
```

---

## Files Created

### 1. `lib/sos.dto.ts` - Data Transfer Objects

**Purpose:** Define all data structures (interfaces) for SOS module

**DTOs:**
- `ServiceProviderDTO` — Emergency responder organization
- `SOSRequestDTO` — Emergency report filed by citizen
- `SOSRequestAssignmentDTO` — Link between request and provider
- `SOSStatsDTO` — Dashboard statistics
- Create/Update DTOs for operations

**Key Changes from Legacy:**
- ✅ Proper status enums: `pending | reviewing | assigned | in_progress | resolved | cancelled`
- ✅ Location as `{ latitude, longitude }` instead of string
- ✅ Multi-provider support via assignments table (no legacy responder fields)
- ✅ All required fields match migrations 125, 331:058-061

### 2. `lib/sos-datasource.ts` - Interface/Contract

**Purpose:** Define contract that both datasources must implement

**Key Methods:**
```typescript
// SOS Requests
getSOSRequests(filters)           // Paginated list with filters
getSOSRequestById(id)             // Single request detail
getSOSRequestByCode(code)         // Track by request code
updateSOSRequestStatus(id, data)  // Update status + notes

// Service Providers
getServiceProviders(filters)      // List with filters
getServiceProviderById(id)        // Single provider detail
getAvailableProviders(...)        // Filter available only
createServiceProvider(data)       // Create new provider
updateServiceProvider(id, data)   // Update provider details
updateServiceProviderStatus(...)  // Change availability
deactivateServiceProvider(id)     // Soft delete

// Assignments
getAssignmentsForRequest(id)      // Get all assignments for request
createAssignment(requestId, ...)  // Assign provider to request
updateAssignmentStatus(id, ...)   // Update assignment status
cancelAssignment(id)              // Decline assignment

// Analytics
getSOSStats(palikaId)             // Dashboard statistics
getAnalytics(palikaId, ...)       // Detailed analytics
```

### 3. `lib/fake-sos-datasource.ts` - Mock Implementation

**Purpose:** Return realistic fixture data for development/testing without database

**Features:**
- ✅ 4 mock service providers (ambulance, fire, police, rescue)
- ✅ 4 SOS requests with various statuses (pending, assigned, in_progress, resolved)
- ✅ 3 assignments showing different status progressions
- ✅ Simulated network delays (100-200ms)
- ✅ Proper error handling (404 when not found)
- ✅ All operations (create, update, delete) work in-memory

**Mock Data Palika:** 5 (Kathmandu)

**Use Cases:**
- Development without Supabase connection
- UI testing & design work
- Fast feedback loops
- Offline development

**Enable:** Set `NEXT_PUBLIC_USE_FAKE_DATASOURCES=true` in `.env.local`

### 4. `lib/supabase-sos-datasource.ts` - Real Implementation

**Purpose:** Query actual Supabase database (migrations 058-061)

**Features:**
- ✅ Full RLS support (filters by palika_id automatically)
- ✅ PostGIS location queries (GEOGRAPHY POINT)
- ✅ Proper joins (service_providers in assignments)
- ✅ Pagination with `count()`
- ✅ Search with `ilike`
- ✅ Error handling and logging
- ✅ Respects admin_regions for access control (via RLS at DB level)

**Database Tables:**
- `sos_requests` — Emergency reports
- `service_providers` — Responder organizations
- `sos_request_assignments` — Provider assignments
- `palikas` — Joined for display name

**Use Cases:**
- Production environment
- Real data testing
- Integration testing with Supabase

**Enable:** Set `NEXT_PUBLIC_USE_FAKE_DATASOURCES=false` in `.env.local`

### 5. `lib/sos-config.ts` - Dependency Injection

**Purpose:** Factory and singleton management

**Key Functions:**
```typescript
createSOSDatasource()     // Create new instance based on env var
getSOSDatasource()        // Get singleton (lazy init)
setSOSDatasource(ds)      // Override (for testing)
resetSOSDatasource()      // Reset to null
```

**Usage:**
```typescript
// In API route or service
import { getSOSDatasource } from '@/lib/sos-config';

const datasource = getSOSDatasource();  // Returns Fake or Supabase
const requests = await datasource.getSOSRequests({ palika_id: 5 });
```

---

## How to Use

### In an API Route

```typescript
// app/api/admin/sos/requests/route.ts
import { getSOSDatasource } from '@/lib/sos-config';

export async function GET(request: Request) {
  const datasource = getSOSDatasource();
  
  const palikaId = 5;  // From auth context
  const filters = {
    palika_id: palikaId,
    status: 'pending',
    page: 1,
    pageSize: 25,
  };
  
  const response = await datasource.getSOSRequests(filters);
  return Response.json(response);
}
```

### In a Service

```typescript
// services/sos.service.ts
import { getSOSDatasource } from '@/lib/sos-config';

export class SOSService {
  private datasource = getSOSDatasource();
  
  async getActiveRequests(palikaId: number) {
    return this.datasource.getSOSRequests({
      palika_id: palikaId,
      status: 'pending|reviewing|assigned|in_progress',
    });
  }
}
```

### In a Component

```typescript
// Don't call datasource directly in components!
// Use API routes or services instead

import { sosService } from '@/services/sos.service';

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  
  useEffect(() => {
    sosService.getActiveRequests(5).then(setRequests);
  }, []);
  
  return <div>{requests.map(r => <div>{r.request_code}</div>)}</div>;
}
```

---

## Environment Configuration

### `.env.local`

```bash
# Use fake datasource (development)
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true

# Use Supabase (production)
NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
```

**Default:** `false` (uses Supabase)

---

## Testing

### Unit Test Example

```typescript
import { FakeSOSDatasource } from '@/lib/fake-sos-datasource';
import { setSOSDatasource, resetSOSDatasource } from '@/lib/sos-config';

describe('SOS Module', () => {
  beforeEach(() => {
    setSOSDatasource(new FakeSOSDatasource());
  });

  afterEach(() => {
    resetSOSDatasource();
  });

  it('should create SOS request', async () => {
    const ds = getSOSDatasource();
    const request = await ds.getSOSRequests({ palika_id: 5 });
    expect(request.data.length).toBeGreaterThan(0);
  });
});
```

---

## Key Implementation Details

### Palika Scoping ✅
- Both Fake and Supabase filter by `palika_id` parameter
- Supabase also enforces RLS at database level
- No palika-to-palika data leakage

### Multi-Provider Support ✅
- Uses `sos_request_assignments` table for N:N relationship
- Legacy fields (responder_name, etc.) completely ignored
- Each assignment tracks independent status

### Location Data ✅
- **Supabase:** `GEOGRAPHY(POINT, 4326)` with PostGIS
- **Fake:** `{ latitude, longitude }` object (in-memory)
- Mock location is Kathmandu area coordinates

### Status Enums ✅
- **Requests:** pending → reviewing → assigned → in_progress → resolved/cancelled
- **Assignments:** assigned → acknowledged → en_route → on_scene → completed/declined
- Both match spec exactly

### Error Handling ✅
- Fake datasource throws `Error` with message (e.g., "SOS request XYZ not found")
- Supabase datasource logs to console and throws error
- All errors propagate to API route (should be handled there)

---

## Migration Notes

The old minimal SOS implementation (`supabase-sos-requests-datasource.ts`) has been completely replaced:
- ✅ Old interface removed (too simplistic)
- ✅ New comprehensive interface with 20+ methods
- ✅ Both Fake and Supabase fully implemented
- ✅ DTOs match actual database schema

The old files can be deleted:
- `lib/sos-requests-datasource.ts` (old interface)
- `lib/supabase-sos-requests-datasource.ts` (old Supabase impl)
- `lib/fake-sos-requests-datasource.ts` (old fake impl)
- `lib/sos-requests-config.ts` (old config)

---

## What's Ready

✅ **Datasource Layer:** Complete (interface + 2 implementations)
✅ **DTOs:** Complete (all data structures)
✅ **DI Config:** Complete (factory + singleton)
✅ **Mock Data:** Complete (realistic fixtures for Kathmandu/palika-5)

**What's Next:**
- [ ] Service layer (SOSService) — wraps datasource
- [ ] API routes (/api/admin/sos/...) — uses service
- [ ] UI pages and components — calls API routes
- [ ] Tests — using fake datasource

