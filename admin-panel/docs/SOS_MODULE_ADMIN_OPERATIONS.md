# SOS Module - Admin Panel Operations

## Overview

The SOS (Emergency Services) Module in the admin panel enables **Palika Admins** to manage emergency SOS requests filed by citizens through the m-place marketplace. When citizens file SOS requests (medical emergencies, accidents, fires, etc.), palika admins coordinate the response by assigning service providers and tracking resolution.

---

## Key Entities

### 1. **SOS Request** (sos_requests table)
A citizen-filed emergency report with the following fields:

```
- id: UUID
- palika_id: INTEGER (which palika this request belongs to)
- request_code: VARCHAR(40) UNIQUE (e.g., "SOS-20250420-123456")
- emergency_type: ENUM ['medical', 'accident', 'fire', 'security', 'natural_disaster', 'other']
- service_type: ENUM ['ambulance', 'fire_brigade', 'police', 'rescue', 'other'] (nullable)
- priority: ENUM ['low', 'medium', 'high', 'critical'] (nullable)
- urgency_score: INTEGER (0-100, nullable)
- location: GEOGRAPHY(POINT) (latitude/longitude)
- location_accuracy: FLOAT
- location_description: TEXT
- ward_number: INTEGER (1-35)
- user_name: VARCHAR(200) (caller name, nullable)
- user_phone: VARCHAR(40) (caller phone, required)
- details: TEXT (description of emergency)
- images: JSONB (array of image URLs)
- status: ENUM ['pending', 'reviewing', 'assigned', 'in_progress', 'resolved', 'cancelled']
- status_updated_at: TIMESTAMPTZ
- is_anonymous: BOOLEAN (whether caller is anonymous)
- assigned_to: UUID (admin who manages this case, nullable)
- reviewed_at: TIMESTAMPTZ
- reviewed_by: UUID
- resolved_at: TIMESTAMPTZ
- resolution_notes: TEXT
- user_rating: INTEGER (1-5, post-resolution feedback)
- user_feedback: TEXT (post-resolution feedback)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. **Service Provider** (service_providers table)
Emergency response organizations managed by palika admins:

```
- id: UUID
- palika_id: INTEGER
- name_en: VARCHAR(300) (organization name)
- name_ne: VARCHAR(300)
- service_type: ENUM ['ambulance', 'fire_brigade', 'police', 'rescue', 'other']
- phone: VARCHAR(40)
- email: VARCHAR(255)
- secondary_phones: TEXT[]
- location: GEOGRAPHY(POINT)
- address: TEXT
- ward_number: INTEGER
- coverage_area: TEXT
- vehicle_count: INTEGER
- services: TEXT[] (e.g., ["trauma_care", "ICU"])
- operating_hours: JSONB (e.g., {"monday": "8am-5pm", "is_24_7": true})
- is_24_7: BOOLEAN
- status: ENUM ['available', 'busy', 'offline', 'suspended']
- response_time_avg_minutes: INTEGER
- rating_average: NUMERIC(3,2)
- rating_count: INTEGER
- total_assignments: INTEGER
- total_resolved: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. **SOS Request Assignment** (sos_request_assignments table)
Tracks which service providers are assigned to a request:

```
- id: UUID
- sos_request_id: UUID (FK → sos_requests)
- provider_id: UUID (FK → service_providers)
- assigned_by: UUID (admin who assigned)
- assigned_at: TIMESTAMPTZ
- status: ENUM ['assigned', 'acknowledged', 'en_route', 'on_scene', 'completed', 'declined']
- status_updated_at: TIMESTAMPTZ
- estimated_arrival_minutes: INTEGER
- actual_arrival_at: TIMESTAMPTZ
- distance_km: NUMERIC(8,2)
- assignment_notes: TEXT
- completion_notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## Legacy Fields & Migration Note

**Do Not Use These Fields** (deprecated in favor of sos_request_assignments):
- ❌ `responder_name` — Use `sos_request_assignments.provider_name` instead
- ❌ `responder_phone` — Use `sos_request_assignments.provider_phone` instead  
- ❌ `responder_eta_minutes` — Use `sos_request_assignments.estimated_arrival_minutes` instead

**Why:**
- Original single-responder design assumed one assigned_to provider
- Multi-provider coordination now supported via sos_request_assignments table
- Legacy fields only store one provider; assignments table supports N providers
- To avoid confusion, only use assignments table for all responder tracking

**Recommendation:**
- All new admin operations should use sos_request_assignments table
- Legacy fields can be soft-deprecated (marked as deprecated in code comments)
- No need to backfill or migrate existing data (would be unused)

---

## Admin Use Cases

### **UC1: Dashboard & Overview**
**Goal:** Palika admin sees real-time SOS activity at a glance

**Pages/Views:**
- **SOS Dashboard** (`/admin/sos/dashboard` or `/admin/sos`)
  - Total requests today/this week
  - Active alerts (pending, reviewing, assigned, in_progress)
  - Recently resolved requests
  - Service provider availability summary (by type)
  - Average response time
  - Completion rate percentage

**Actions:**
- Quick stats: total pending, total assigned, total resolved
- Filter by status, emergency type, date range
- See map of active requests and provider locations
- One-click drill-down to request details

**Data Needed:**
```
GET /api/admin/sos/stats
{
  total_today: 12,
  pending: 3,
  assigned: 4,
  in_progress: 2,
  resolved: 3,
  avg_response_time_minutes: 8,
  completion_rate: 92,
  provider_availability: {
    ambulance: { available: 3, busy: 1, offline: 0 },
    fire_brigade: { available: 2, busy: 0, offline: 0 },
    police: { available: 4, busy: 1, offline: 0 }
  }
}

GET /api/admin/sos/requests?status=pending,assigned,in_progress&limit=10
[{ SOS Request objects }]
```

---

### **UC2: View SOS Request Details**
**Goal:** Admin views complete details of a single request

**Pages/Views:**
- **SOS Request Detail** (`/admin/sos/requests/:id`)
  - Request code, emergency type, priority, urgency score
  - Caller information (name, phone, anonymous flag)
  - Location (map + ward number + description)
  - Detailed emergency description + images
  - Current status with timeline
  - All assignments (service providers assigned to this request)
  - Resolution info if resolved (notes, rating, feedback)

**Data Needed:**
```
GET /api/admin/sos/requests/:id
{
  id, palika_id, request_code, emergency_type, service_type, priority,
  urgency_score, location, location_description, ward_number,
  user_name, user_phone, is_anonymous,
  details, images, status, status_updated_at,
  assigned_to (admin UUID), reviewed_at, reviewed_by,
  resolved_at, resolution_notes,
  user_rating, user_feedback,
  created_at, updated_at,
  assignments: [
    {
      id, provider_id, status, estimated_arrival_minutes,
      actual_arrival_at, distance_km, assignment_notes,
      assigned_at, assigned_by,
      provider: { id, name_en, service_type, phone }
    }
  ]
}
```

---

### **UC3: List & Filter SOS Requests**
**Goal:** Admin searches and filters all requests for their palika

**Pages/Views:**
- **SOS Requests List** (`/admin/sos/requests`)
  - Table with sortable columns: request_code, emergency_type, status, caller, location, created_at
  - Filters:
    - Status (pending, reviewing, assigned, in_progress, resolved, cancelled)
    - Emergency type
    - Service type
    - Priority
    - Date range (created_at)
    - Ward number
    - Search: by request_code or caller_name
  - Pagination
  - Quick actions: view details, assign provider, update status

**Data Needed:**
```
GET /api/admin/sos/requests?
  status=pending,assigned
  &emergency_type=medical
  &priority=high
  &date_from=2025-04-01
  &date_to=2025-04-30
  &page=1
  &limit=25
  &sort=created_at:desc

{
  data: [
    {
      id, request_code, emergency_type, priority, status,
      user_name, location_description, ward_number,
      created_at, assignment_count, current_status_age_seconds
    }
  ],
  meta: { page, total, totalPages, limit }
}
```

---

### **UC4: Update SOS Request Status**
**Goal:** Admin changes the status of a request as it progresses

**Pages/Views:**
- Status update modal/form in the detail view

**Status Flow:**
```
pending → reviewing → assigned → in_progress → resolved
                   ↘ cancelled
```

**Actions:**
- **pending → reviewing:** Admin acknowledges and starts reviewing
- **reviewing → assigned:** Admin assigns service providers
- **assigned → in_progress:** Providers acknowledge and are en route
- **in_progress → resolved:** Emergency resolved
- **any → cancelled:** Emergency cancelled

**Data Needed:**
```
PUT /api/admin/sos/requests/:id
{
  status: "reviewing" | "assigned" | "in_progress" | "resolved" | "cancelled",
  [optional] resolution_notes: string (if status=resolved or cancelled)
}

Returns: Updated SOS Request object
```

---

### **UC5: Assign Service Providers to Request**
**Goal:** Admin assigns one or more service providers to respond to a request

**Pages/Views:**
- **Assign Provider Modal/Form** (in request detail view or list quick action)
  - Step 1: Select service type (ambulance, fire_brigade, police, rescue)
  - Step 2: Filter available providers by:
    - Availability (status = 'available')
    - Distance from incident location
    - Average response time
    - Rating
  - Step 3: Confirm assignment with optional notes

**Workflow:**
1. Admin clicks "Assign Provider" button
2. Modal shows available providers filtered by service_type
3. Admin selects provider(s)
4. Admin adds optional assignment_notes (e.g., "Patient critical, notify hospital in advance")
5. Submit → creates sos_request_assignment record

**Data Needed:**
```
GET /api/admin/sos/requests/:id/available-providers?service_type=ambulance
[
  {
    id, name_en, service_type, phone, email,
    location, ward_number, address,
    status, vehicle_count, is_24_7,
    response_time_avg_minutes, rating_average, rating_count,
    distance_km_from_incident (calculated on backend)
  }
]

POST /api/admin/sos/requests/:id/assignments
{
  provider_id: UUID,
  assignment_notes?: string,
  estimated_arrival_minutes?: number
}

Returns: Created SOSRequestAssignment object
```

---

### **UC6: Update Assignment Status**
**Goal:** Admin (or provider) updates the status of an assignment as response progresses

**Workflow:**
- Assignment statuses: assigned → acknowledged → en_route → on_scene → completed or declined
- Admin can update from the request detail view or assignment detail card

**Data Needed:**
```
PUT /api/admin/sos/requests/:requestId/assignments/:assignmentId
{
  status: "acknowledged" | "en_route" | "on_scene" | "completed" | "declined",
  [optional] actual_arrival_at: ISO8601 (if status=on_scene or completed),
  [optional] completion_notes: string (if status=completed)
}

Returns: Updated SOSRequestAssignment object
```

---

### **UC7: Manage Service Providers**
**Goal:** Palika admin maintains the registry of service providers

#### **UC7a: List Service Providers**
**Pages/Views:**
- **Service Providers List** (`/admin/sos/providers`)
  - Table: name, service_type, phone, status, vehicle_count, rating, total_assignments
  - Filters: service_type, status (available, busy, offline, suspended), ward, active/inactive
  - Actions: view, edit, disable/activate

**Data Needed:**
```
GET /api/admin/sos/providers?service_type=ambulance&status=available&page=1
{
  data: [
    {
      id, name_en, name_ne, service_type, phone, email,
      location, address, ward_number, coverage_area,
      vehicle_count, is_24_7, status, is_active,
      response_time_avg_minutes, rating_average, rating_count,
      total_assignments, total_resolved,
      created_at, updated_at
    }
  ],
  meta: { page, total, totalPages }
}
```

#### **UC7b: Create Service Provider**
**Pages/Views:**
- **Create Provider Form** (`/admin/sos/providers/new`)
  - Fields:
    - name_en (required)
    - name_ne (optional)
    - service_type (dropdown: ambulance, fire_brigade, police, rescue, other)
    - phone (required)
    - email (optional)
    - secondary_phones (comma-separated list)
    - location (map picker or address)
    - address (text)
    - ward_number (dropdown 1-35)
    - coverage_area (text)
    - vehicle_count (number, default 1)
    - services (multi-select, e.g., trauma_care, ICU, disaster_response)
    - is_24_7 (checkbox)
    - operating_hours (JSON or time pickers)

**Data Needed:**
```
POST /api/admin/sos/providers
{
  name_en, name_ne?, service_type, phone, email?,
  secondary_phones?, location, address?, ward_number?,
  coverage_area?, vehicle_count?, services?,
  is_24_7?, operating_hours?
}

Returns: Created ServiceProvider object
```

#### **UC7c: Edit Service Provider**
**Pages/Views:**
- **Edit Provider Form** (`/admin/sos/providers/:id/edit`)
  - Same fields as create
  - Pre-filled with current values

**Data Needed:**
```
GET /api/admin/sos/providers/:id
PUT /api/admin/sos/providers/:id
```

#### **UC7d: Update Provider Status**
**Goal:** Quick status change (available → busy → offline → suspended)

**Pages/Views:**
- Status dropdown in provider card / detail view

**Data Needed:**
```
PATCH /api/admin/sos/providers/:id/status
{
  status: "available" | "busy" | "offline" | "suspended"
}
```

#### **UC7e: Delete/Deactivate Service Provider**
**Pages/Views:**
- Delete button (soft-delete: set is_active = false)

**Data Needed:**
```
DELETE /api/admin/sos/providers/:id
(soft deletes: sets is_active = false and status = "offline")
```

---

### **UC8: Resolve SOS Request**
**Goal:** Admin marks a request as resolved and collects feedback

**Pages/Views:**
- **Resolve Request Modal** (from request detail view)
  - Form fields:
    - resolution_notes (textarea, required)
    - Primary provider selection (if multiple assignments, which one resolved it)

**Workflow:**
1. Admin clicks "Mark as Resolved"
2. Modal shows assignments and primary responder
3. Admin enters resolution notes
4. Submit → updates status to 'resolved', sets resolved_at, sets assigned_to admin
5. System sends notification to citizen with request code to leave feedback

**Data Needed:**
```
PUT /api/admin/sos/requests/:id
{
  status: "resolved",
  resolution_notes: string,
  assigned_to: UUID (current admin)
}

Returns: Updated SOS Request
```

---

### **UC9: Request Analytics & Reports**
**Goal:** Palika admin views SOS metrics and trends

**Pages/Views:**
- **SOS Analytics Dashboard** (`/admin/sos/analytics`)
  - Charts:
    - Requests by emergency type (pie/bar)
    - Requests by status over time (line)
    - Average response time by provider (bar)
    - Provider ratings distribution
    - Resolution time histogram (how long to resolve)
    - Peak hours for requests (heatmap)
  - Tables:
    - Top providers by assignments completed
    - Top providers by average rating
    - Response time by service type
  - Export options: CSV, PDF

**Data Needed:**
```
GET /api/admin/sos/analytics?date_from=...&date_to=...&groupBy=day|week|month
{
  summary: { total_requests, avg_response_time, completion_rate },
  requests_by_type: { medical: 5, fire: 2, ... },
  requests_by_status: { pending: 1, assigned: 2, resolved: 40, ... },
  top_providers: [ { id, name, assignments_completed, avg_rating } ],
  response_time_by_type: { ambulance: 8, fire: 12, ... },
  timeline: [ { date, count } ]
}
```

---

### **UC10: Notification & Alerts**
**Goal:** Real-time notifications for critical SOS events

**Events to Notify:**
- New high-priority SOS request filed
- Assignment status changes (accepted, declined, arrived)
- Request about to exceed response time SLA
- Provider offline unexpectedly

**Data Needed:**
- Real-time subscriptions (WebSocket or polling)
- Email/SMS notifications to admin

---

## Data API Endpoints Summary

### Core Endpoints
```
# SOS Requests
GET    /api/admin/sos/requests                    # List requests
GET    /api/admin/sos/requests/:id                # Get single request
PUT    /api/admin/sos/requests/:id                # Update request (status, notes)
PATCH  /api/admin/sos/requests/:id/resolve        # Resolve request

# Assignments
POST   /api/admin/sos/requests/:id/assignments    # Create assignment
GET    /api/admin/sos/requests/:id/assignments    # List assignments for request
PUT    /api/admin/sos/requests/:id/assignments/:assignmentId  # Update assignment
DELETE /api/admin/sos/requests/:id/assignments/:assignmentId  # Cancel assignment

# Service Providers
GET    /api/admin/sos/providers                   # List providers
POST   /api/admin/sos/providers                   # Create provider
GET    /api/admin/sos/providers/:id               # Get provider
PUT    /api/admin/sos/providers/:id               # Update provider
PATCH  /api/admin/sos/providers/:id/status        # Update status
DELETE /api/admin/sos/providers/:id               # Deactivate provider
GET    /api/admin/sos/providers/:id/stats         # Get provider stats

# Available providers
GET    /api/admin/sos/requests/:id/available-providers?service_type=...

# Dashboard & Analytics
GET    /api/admin/sos/stats                       # Dashboard stats
GET    /api/admin/sos/analytics                   # Detailed analytics
```

---

## Palika Admin Permissions & RLS

**Scope:**
- ✅ **SOS Requests:** Palika-scoped (`palika_id NOT NULL`)
- ✅ **Service Providers:** Palika-scoped (`palika_id NOT NULL`)
- ✅ **Assignments:** Inherited from parent SOS request (palika-scoped)

**Authorization (via RLS):**
- Palika admins can only view/manage SOS requests for their assigned palika (via admin_regions)
- District admins can view all palikas in their district
- Super admins can view all
- Permission check: `user_has_permission('manage_sos')` required for all updates

**RLS Policies Currently in Place:**
- ✅ `service_providers_public_read` — Public access (transparency portal)
- ✅ `service_providers_admin_all` — Admin CRUD (requires manage_sos)
- ✅ `sos_requests_public_read` — Public access (active requests only)
- ✅ `sos_requests_public_insert` — Anyone can file request
- ✅ `sos_assignments_public_read` — Public access to assignments
- ✅ `sos_assignments_admin_all` — Admin access to assignments
- ❌ **MISSING:** `sos_requests_admin_update_delete` — Admin UPDATE/DELETE policy

**⚠️ CRITICAL GAP:**
Admin UPDATE and DELETE operations on sos_requests are **NOT protected by RLS policy**. 
This must be added before admin operations can work:

```sql
-- Must be added to migration 061 or new migration
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

**Specific Operations (after RLS fix):**
- Create assignment: requires palika_admin role or higher + manage_sos permission
- Update request status: requires palika_admin role or higher + manage_sos permission + RLS policy
- Create/edit service provider: requires palika_admin role or higher + manage_sos permission
- View analytics: requires palika_admin role or higher + manage_sos permission

---

## UI Components Needed

1. **SOS Dashboard Widget** - Overview stats
2. **SOS Requests Table** - Sortable, filterable list
3. **SOS Request Detail Card** - Full details with tabs
4. **Assignments List Component** - Shows all assignments for a request
5. **Assignment Card** - Individual assignment with status badge
6. **Service Provider List** - Sortable table
7. **Service Provider Form** - Create/edit form with map picker
8. **Assign Provider Modal** - Provider selection with filters
9. **Status Update Modal** - Status dropdown with notes
10. **Analytics Dashboard** - Charts and metrics
11. **Location Map** - Display incident location
12. **Provider Distance Filter** - Sort by distance from incident

---

## Database Schema Relationships

```
palikas (1) ─────────────── (N) sos_requests
palikas (1) ─────────────── (N) service_providers
sos_requests (1) ─────────────── (N) sos_request_assignments
service_providers (1) ─────────────── (N) sos_request_assignments
admin_users (1) ─────────────── (N) sos_requests (assigned_to, reviewed_by)
admin_users (1) ─────────────── (N) sos_request_assignments (assigned_by)
```

---

## Implementation Priority

### Phase 1 (MVP)
- [ ] Dashboard with basic stats
- [ ] List SOS requests with filters
- [ ] View request detail
- [ ] List service providers
- [ ] Create/edit service providers
- [ ] Assign provider to request
- [ ] Update request status

### Phase 2
- [ ] Update assignment status
- [ ] Resolve request flow
- [ ] Provider status updates
- [ ] Basic analytics

### Phase 3 (Nice-to-have)
- [ ] Advanced analytics with charts
- [ ] Notification system
- [ ] Bulk actions
- [ ] Export reports
- [ ] Provider performance ratings
