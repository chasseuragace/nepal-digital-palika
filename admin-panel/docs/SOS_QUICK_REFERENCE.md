# SOS Module - Admin Panel Quick Reference

## At a Glance

| Aspect | Details |
|--------|---------|
| **What** | Emergency request coordination system |
| **Who Uses** | Palika admins managing emergency responses |
| **Data Model** | SOS Requests ← → Service Providers via Assignments |
| **Key Flow** | Citizen reports emergency → Admin reviews → Assigns providers → Tracks resolution |
| **Scope** | ✅ Palika-scoped (both sos_requests & service_providers have palika_id NOT NULL) |
| **Permissions** | Requires manage_sos permission + admin_regions access to palika |

---

## ⚠️ Critical Notes Before Implementation

### RLS Gap (Must Fix First)
Missing `sos_requests_admin_update_delete` RLS policy — admins need UPDATE access. Add to Supabase migrations before building admin panel operations.

### Legacy Fields (Do NOT Use)
Original sos_requests fields are **deprecated**:
- `responder_name`, `responder_phone`, `responder_eta_minutes` — Old single-responder design
- **Use instead:** sos_request_assignments table (multi-provider support)

---

## Core Tables & Fields

### sos_requests
```
request_code      — Unique ID (e.g., "SOS-20250420-123456")
emergency_type    — medical | accident | fire | security | natural_disaster | other
status            — pending → reviewing → assigned → in_progress → resolved/cancelled
priority          — low | medium | high | critical
location          — GEOGRAPHY(POINT) + location_description + ward_number
caller info       — user_name, user_phone, is_anonymous
details & images  — Emergency description + photos
assignments       — Array of SOSRequestAssignment records
```

### service_providers
```
name_en, name_ne       — Provider name
service_type           — ambulance | fire_brigade | police | rescue | other
phone, email           — Contact info
location               — GEOGRAPHY(POINT) + address + ward_number
vehicle_count          — Number of vehicles/resources
status                 — available | busy | offline | suspended
is_24_7                — Always available?
rating_average         — User ratings (0.00 - 5.00)
total_assignments      — Lifetime count
is_active              — Enabled? (soft delete)
```

### sos_request_assignments
```
sos_request_id    — Which request
provider_id       — Which provider assigned
status            — assigned → acknowledged → en_route → on_scene → completed/declined
estimated_arrival_minutes
actual_arrival_at
distance_km       — Distance calculated at assignment
assignment_notes  — Notes from admin
assigned_by       — Which admin assigned (admin_users.id)
assigned_at       — When assigned
```

---

## Admin Operations (10 Use Cases)

| UC | Operation | Page | Key Actions |
|----|-----------:|-----:|:------------|
| **UC1** | Dashboard Overview | `/admin/sos` | View stats, active alerts, provider availability |
| **UC2** | View Request Details | `/admin/sos/requests/:id` | See full request, assignments, resolution info |
| **UC3** | List & Filter Requests | `/admin/sos/requests` | Search, filter by status/type/date/ward, sort |
| **UC4** | Update Status | Detail page | pending→reviewing→assigned→in_progress→resolved |
| **UC5** | Assign Providers | Modal | Select provider(s) for request, add notes |
| **UC6** | Update Assignment Status | Detail page | assigned→acknowledged→en_route→on_scene→completed |
| **UC7a** | List Providers | `/admin/sos/providers` | View all providers, filter by type/status |
| **UC7b** | Create Provider | `/admin/sos/providers/new` | Add ambulance, fire, police, rescue service |
| **UC7c** | Edit Provider | `/admin/sos/providers/:id/edit` | Update provider details, location, capacity |
| **UC7d-e** | Manage Provider Status | Provider list/detail | Change status (available/busy/offline), deactivate |
| **UC9** | View Analytics | `/admin/sos/analytics` | Charts, metrics, trends, exports |

---

## API Endpoints (Reference)

### Requests
```
GET    /api/admin/sos/requests              [filters, pagination]
GET    /api/admin/sos/requests/:id
PUT    /api/admin/sos/requests/:id          [status, notes]
PATCH  /api/admin/sos/requests/:id/resolve  [resolution_notes]
```

### Assignments
```
POST   /api/admin/sos/requests/:id/assignments
GET    /api/admin/sos/requests/:id/assignments
GET    /api/admin/sos/requests/:id/available-providers  [service_type, max_distance]
PUT    /api/admin/sos/requests/:id/assignments/:assignmentId  [status]
DELETE /api/admin/sos/requests/:id/assignments/:assignmentId
```

### Providers
```
GET    /api/admin/sos/providers              [filters]
POST   /api/admin/sos/providers
GET    /api/admin/sos/providers/:id
PUT    /api/admin/sos/providers/:id
PATCH  /api/admin/sos/providers/:id/status   [status]
DELETE /api/admin/sos/providers/:id
```

### Dashboard & Analytics
```
GET    /api/admin/sos/stats                  [dashboard numbers]
GET    /api/admin/sos/analytics              [charts, metrics, trends]
```

---

## Key Decisions

✅ **Multi-Provider Assignment:** One request can have multiple providers assigned (ambulance + police + hospital)

✅ **Location-Based:** Providers have coordinates; distance calculated at assignment

✅ **Real-Time Status:** Provider status (available/busy) and assignment status (en_route/on_scene) update in real time

✅ **Anonymous Requests:** Citizens can file anonymously; admin sees redacted caller info

✅ **Soft Delete:** Providers deactivated (is_active=false) not hard-deleted

✅ **Timeline Tracking:** Requests auto-track created_at, reviewed_at, status_updated_at, resolved_at for SLA monitoring

---

## RLS Policies Status

| Table | Policy | Status | Notes |
|-------|--------|--------|-------|
| service_providers | public_read | ✅ Ready | Transparency portal access |
| service_providers | admin_all (CRUD) | ✅ Ready | Requires manage_sos permission |
| sos_requests | public_read | ✅ Ready | Citizens see active requests |
| sos_requests | public_insert | ✅ Ready | Anyone can file request |
| sos_requests | admin_update_delete | ❌ **MISSING** | **Must add before admin ops** |
| sos_assignments | public_read | ✅ Ready | Citizens see assignment status |
| sos_assignments | admin_all (CRUD) | ✅ Ready | Requires manage_sos permission |

---

## Typical Admin Workflow

1. **Notification:** "New high-priority medical emergency filed"
2. **Review:** Admin opens dashboard → clicks request → reviews details
3. **Assign:** Admin clicks "Assign Providers" → selects available ambulance → creates assignment
4. **Track:** Admin monitors assignment status as ambulance acknowledges, heads en route, arrives on scene
5. **Resolve:** When complete, admin clicks "Resolve" → adds notes → marks resolved
6. **Feedback:** System sends SMS/notification to citizen for rating

---

## Files to Review

For full implementation details, see:
- **`SOS_MODULE_ADMIN_OPERATIONS.md`** — Complete use case spec with data models, workflows, all endpoints
- **`SOS_IMPLEMENTATION_GUIDE.md`** — Developer quick start, code patterns, testing, file structure

