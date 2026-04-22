# SOS Module Implementation Guide

**Quick Reference for Developers**

---

## What is the SOS Module?

Emergency response coordination system where palika admins manage SOS requests filed by citizens. Citizens report emergencies (medical, fire, accidents), admins assign service providers (ambulances, fire brigades, police), and track resolution.

---

## Data Models at a Glance

### SOS Request (sos_requests)
- **What:** Emergency report filed by a citizen
- **Key Fields:** request_code, emergency_type, status, location, priority
- **Statuses:** pending → reviewing → assigned → in_progress → resolved/cancelled
- **Admin Role:** Review, assign providers, update status, resolve

### Service Provider (service_providers)
- **What:** Emergency responder organization (ambulance service, fire brigade, etc.)
- **Key Fields:** name, service_type, phone, location, status, vehicle_count
- **Status Values:** available, busy, offline, suspended
- **Admin Role:** Create, edit, manage availability

### SOS Assignment (sos_request_assignments)
- **What:** Link between a request and assigned provider
- **Key Fields:** sos_request_id, provider_id, status, estimated_arrival_minutes
- **Assignment Statuses:** assigned → acknowledged → en_route → on_scene → completed/declined
- **Admin Role:** Create assignment, update status, add notes

---

## Architecture Pattern (from m-place)

```
Components (UI)
    ↓
Client Service Layer (API calls)
    ↓
API Routes (authorization, validation)
    ↓
Server Service Layer (business logic)
    ↓
Repository (data access)
    ↓
Supabase (database)
```

**Example:** For "Create Service Provider"
1. Form component gathers input
2. Uses sosService.createProvider()
3. Calls POST /api/admin/sos/providers
4. API route validates, calls sosService.createProvider()
5. Service prepares data, calls repository.createServiceProvider()
6. Repository inserts into Supabase

---

## Implementation Checklist

### Prerequisites (Do First!)

- [ ] **Add RLS Policy Migration**
  - [ ] Create migration adding `sos_requests_admin_update_delete` policy
  - [ ] Test policy in Supabase: admin should be able to UPDATE sos_requests
  - [ ] Verify permission check: `user_has_permission('manage_sos')` works

### Phase 1: Core CRUD (MVP)

**Dashboard**
- [ ] Create `/admin/sos/dashboard` page
- [ ] Display stats: pending, assigned, in_progress, resolved counts
- [ ] List active requests
- [ ] Show provider availability by type

**SOS Requests**
- [ ] `GET /api/admin/sos/requests` - List with pagination, filters
- [ ] `GET /api/admin/sos/requests/:id` - View detail
- [ ] `PUT /api/admin/sos/requests/:id` - Update status (reviewing, assigned, in_progress, resolved)
- [ ] `GET /api/admin/sos/requests?filters` - Query builder (status, type, date range, ward)

**Service Providers**
- [ ] `GET /api/admin/sos/providers` - List
- [ ] `POST /api/admin/sos/providers` - Create new provider
- [ ] `GET /api/admin/sos/providers/:id` - View detail
- [ ] `PUT /api/admin/sos/providers/:id` - Update
- [ ] `DELETE /api/admin/sos/providers/:id` - Soft delete (is_active=false)

**Assignments**
- [ ] `POST /api/admin/sos/requests/:id/assignments` - Assign provider
- [ ] `GET /api/admin/sos/requests/:id/available-providers` - Filter available providers
- [ ] `GET /api/admin/sos/requests/:id/assignments` - List assignments

### Phase 2: Enhanced Status & Analytics

**Assignment Updates**
- [ ] `PUT /api/admin/sos/requests/:id/assignments/:assignmentId` - Update assignment status
- [ ] Support status flow: assigned → acknowledged → en_route → on_scene → completed

**Resolve Flow**
- [ ] Modal for resolving requests
- [ ] Capture resolution_notes
- [ ] Set assigned_to (current admin)

**Analytics**
- [ ] `GET /api/admin/sos/analytics` - Summary metrics
- [ ] Charts: by type, by status, over time
- [ ] Provider performance metrics

---

## Critical Prerequisites

⚠️ **Before implementing, add missing RLS policy:**

The sos_requests table is missing an admin UPDATE policy. Add this to Supabase migrations:

```sql
-- Admin UPDATE/DELETE policy for sos_requests
CREATE POLICY "sos_requests_admin_update_delete"
ON sos_requests FOR UPDATE
USING (
    public.get_user_role() = 'super_admin' OR
    (
        public.user_has_access_to_palika(palika_id) AND
        public.user_has_permission('manage_sos')
    )
)
WITH CHECK (
    public.get_user_role() = 'super_admin' OR
    (
        public.user_has_access_to_palika(palika_id) AND
        public.user_has_permission('manage_sos')
    )
);
```

Without this, admins will get RLS errors when trying to update request status.

---

## Key Decisions & Constraints

### Palika Scoping ✅
Both **sos_requests** and **service_providers** have `palika_id NOT NULL`:
- All queries must include palika_id filter
- RLS enforced at database level via admin_regions table
- District/province admins see all palikas in their region

### Legacy Fields (DEPRECATED)
Do **NOT** use these fields:
- ❌ `responder_name` → Use `sos_request_assignments.provider_name`
- ❌ `responder_phone` → Use `sos_request_assignments.provider_phone`
- ❌ `responder_eta_minutes` → Use `sos_request_assignments.estimated_arrival_minutes`

These were from the original single-responder design. The sos_request_assignments table replaces them for multi-provider coordination. To avoid confusion, only use assignments table.

### Multi-Provider Assignment
Unlike simple systems, **one SOS request can have multiple providers assigned**. For example:
- Ambulance responds to medical emergency
- Police also assigned for traffic control
- Hospital notified in advance

**Implication:** Use junction table (sos_request_assignments), not single assigned_to.

### Location-Based Dispatch
Service providers have `location` (GEOGRAPHY POINT) and distance is calculated on assignment:
```sql
distance_km NUMERIC(8,2) -- calculated at assignment time via Haversine
```

**Implication:** When showing available providers, calculate distance on backend.

### Real-Time Availability
Provider status changes in real-time (available → busy → offline). Assignment status also updates in real-time.

**Implication:** Consider WebSocket subscriptions or polling for live updates.

### Anonymous Callers
Citizens can file SOS requests anonymously (`is_anonymous = true`). Admin should not expose anonymous caller details in certain reports.

**Implication:** Filter or redact caller name in analytics/reports when is_anonymous=true.

### Request Timeline
Request has built-in timeline tracking (JSONB field):
- created_at
- reviewed_at
- status_updated_at
- resolved_at

**Implication:** Use these for calculating SLA metrics and response time trends.

---

## API Request/Response Examples

### Assign Provider to Request
```bash
POST /api/admin/sos/requests/{requestId}/assignments
Content-Type: application/json

{
  "provider_id": "uuid-of-ambulance",
  "assignment_notes": "Patient critical, notify hospital",
  "estimated_arrival_minutes": 12
}

Response 201:
{
  "id": "uuid",
  "sos_request_id": "uuid",
  "provider_id": "uuid",
  "assigned_by": "uuid-of-current-admin",
  "assigned_at": "2025-04-20T10:30:00Z",
  "status": "assigned",
  "estimated_arrival_minutes": 12,
  "provider": {
    "id": "uuid",
    "name_en": "Metro Ambulance Service",
    "service_type": "ambulance",
    "phone": "9841234567"
  }
}
```

### Update Request Status to Resolving
```bash
PUT /api/admin/sos/requests/{requestId}
Content-Type: application/json

{
  "status": "in_progress",
  "status_updated_at": "2025-04-20T10:45:00Z"
}

Response 200:
{ full SOS request object }
```

### Filter Available Providers
```bash
GET /api/admin/sos/requests/{requestId}/available-providers?service_type=ambulance&max_distance_km=5&sort=response_time

Response 200:
[
  {
    "id": "uuid",
    "name_en": "Metro Ambulance",
    "service_type": "ambulance",
    "phone": "9841234567",
    "status": "available",
    "vehicle_count": 3,
    "response_time_avg_minutes": 8,
    "distance_km": 2.5,
    "rating_average": 4.8
  },
  ...
]
```

---

## Common Workflows

### Workflow 1: New Emergency Request Arrives
1. Request status = `pending` (from citizen)
2. Admin opens dashboard → sees new request
3. Admin clicks request → views detail page
4. Admin clicks "Review" → status becomes `reviewing`, reviewed_at set
5. Admin clicks "Assign Providers" → modal with available providers
6. Admin selects ambulance and police → creates assignments
7. Status becomes `assigned`
8. As providers respond, assignment statuses update: acknowledged → en_route → on_scene
9. When resolved, admin clicks "Resolve" → status = `resolved`, resolution_notes added
10. Citizen can rate and provide feedback

### Workflow 2: Manage Service Providers
1. Palika admin navigates to `/admin/sos/providers`
2. Clicks "New Provider" → form to create ambulance/fire/police service
3. Fills in details: name, phone, location, ward, vehicle count, 24/7 status
4. Saves → provider added to registry
5. Provider card shows in list with current status (available/busy/offline)
6. Admin can click provider to edit details or change status

---

## Authorization & RLS Considerations

**Assumption:** RLS is already set up on sos_requests and service_providers tables.

- Palika admins can only manage requests/providers for their palika
- District admins can see all palikas in their district
- Super admins can see all

**Implementation:** Use admin's palika_id when querying:
```javascript
const palikaId = currentAdmin.palika_id;
const requests = await sosService.getSOSRequests({ palika_id: palikaId, ... });
```

---

## Testing Considerations

1. **Mock Data Setup:**
   - Create fixture service providers with different service types
   - Create fixture SOS requests with various statuses
   - Create assignments linking them

2. **Test Cases:**
   - Create provider with validation (required fields, phone format)
   - Assign provider to request (check validation: must be available)
   - Update assignment status transitions
   - Filter requests by status/type/date
   - Check SLA: response time not exceeded
   - Verify anonymous caller name is hidden in reports

3. **Playwright E2E:**
   - Login as palika admin
   - Create new service provider
   - File SOS request (as citizen, or mock it)
   - View request in admin dashboard
   - Assign provider
   - Update statuses
   - Resolve request

---

## File Structure Suggestion

```
admin-panel/src/
├── app/
│   └── admin/
│       └── sos/
│           ├── page.tsx              # Dashboard
│           ├── requests/
│           │   ├── page.tsx          # List requests
│           │   └── [id]/
│           │       ├── page.tsx      # Request detail
│           │       └── components/
│           │           ├── StatusModal.tsx
│           │           ├── AssignmentList.tsx
│           │           └── AssignProviderModal.tsx
│           └── providers/
│               ├── page.tsx          # List providers
│               ├── new/
│               │   └── page.tsx      # Create form
│               └── [id]/
│                   ├── page.tsx      # Edit form
│                   └── components/
│                       └── StatusDropdown.tsx
├── services/
│   └── sos.service.ts               # Client service layer
├── api/
│   └── admin/
│       └── sos/
│           ├── route.ts             # GET requests dashboard stats
│           ├── requests/
│           │   ├── route.ts         # GET/list, POST create (if needed)
│           │   └── [id]/
│           │       ├── route.ts     # GET/PUT
│           │       └── assignments/
│           │           ├── route.ts # GET list, POST create
│           │           └── [assignmentId]/
│           │               └── route.ts  # PUT, DELETE
│           └── providers/
│               ├── route.ts         # GET list, POST create
│               └── [id]/
│                   ├── route.ts     # GET, PUT, DELETE
│                   └── status/
│                       └── route.ts # PATCH status
└── docs/
    ├── SOS_MODULE_ADMIN_OPERATIONS.md  # This spec
    └── SOS_IMPLEMENTATION_GUIDE.md      # This file
```

---

## Quick Start for Implementation

1. **Review:** Read `SOS_MODULE_ADMIN_OPERATIONS.md` for full use cases
2. **Backend First:** Create API routes and services
3. **Fixtures:** Add mock/test data for SOS requests and providers
4. **UI Build:** Create pages and components
5. **Integration:** Wire up client services to API routes
6. **Testing:** Add Playwright E2E tests
7. **Refinement:** Add analytics, notifications, polish

---

## Notes for Agent

- Follow the **m-place SOS module patterns** for consistency
- Use the **clean architecture** (Components → Services → API → Database)
- Implement **RLS validation** at each layer
- Create **test fixtures** with realistic data (multiple palikas, service types)
- Add **error boundaries** for critical operations
- Consider **loading states** for long operations
- Use **optimistic updates** for assignment status changes
- **Verify permissions** at API route level (not just client)

