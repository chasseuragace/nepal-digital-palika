# SOS Module Research & Implementation Reference

**Date:** 2026-03-29
**Status:** 🔵 DEFERRED (Phase 7, included in m-place)
**Context:** Reference existing infrastructure for future SOS implementation

---

## 🟢 WHAT EXISTS (Database Layer - COMPLETE)

### 1. SOS_REQUESTS TABLE (Full Schema)

```sql
sos_requests {
  -- Primary Key & Audit
  id: UUID PRIMARY KEY
  created_at, updated_at: TIMESTAMPTZ

  -- Multi-tenant
  palika_id: INTEGER NOT NULL REFERENCES palikas(id)
  user_id: UUID NULLABLE REFERENCES profiles(id)

  -- Request Identity
  request_code: VARCHAR(40) UNIQUE -- e.g., "SOS-20260329-001"
  emergency_type: VARCHAR(50) CHECK ('medical', 'accident', 'fire', 'security', 'natural_disaster', 'other')

  -- Location Tracking
  location: GEOGRAPHY(POINT, 4326) NOT NULL  -- GIS point for geo-queries
  location_accuracy: FLOAT CHECK (> 0)       -- GPS accuracy radius
  location_description: TEXT                  -- "Near Thamel Main Road"
  ward_number: INTEGER CHECK (1-35)

  -- Caller Information
  user_name: VARCHAR(200)
  user_phone: VARCHAR(40) NOT NULL

  -- Emergency Details
  details: TEXT -- Full description of emergency

  -- Status Workflow
  status: VARCHAR(50) DEFAULT 'received'
    CHECK ('received', 'assigned', 'in_progress', 'resolved', 'cancelled')
  status_updated_at: TIMESTAMPTZ

  -- Responder Assignment
  assigned_to: UUID REFERENCES admin_users(id)  -- Responder/dispatcher
  responder_name: VARCHAR(200)
  responder_phone: VARCHAR(40)
  responder_eta_minutes: INTEGER CHECK (> 0)

  -- Resolution
  resolved_at: TIMESTAMPTZ
  resolution_notes: TEXT

  -- User Feedback
  user_rating: INTEGER CHECK (1-5)
  user_feedback: TEXT

  -- Offline Support
  sent_offline: BOOLEAN DEFAULT false
  queued_at: TIMESTAMPTZ
  timeline: JSONB DEFAULT '[]'  -- Status change audit trail
}
```

### 2. RLS Policies (Security - COMPLETE)

All SOS access **enforced at database level**:

```sql
-- Support staff: Read their palika's SOS requests
sos_requests_support_read
  → get_user_role() = 'support' AND get_user_palika_id() = palika_id

-- Palika admin: Full access to their palika's SOS
sos_requests_admin_all
  → get_user_palika_id() = palika_id AND
    get_user_role() IN ('palika_admin', 'moderator')

-- Super admin: Unrestricted access
  → get_user_role() = 'super_admin'
```

**Access via `admin_regions` table (NOT direct palika_id column):**
- Ensures revocation works immediately
- Supports hierarchical access (district/province admins see all their palikas)
- 6.5 compliance ready

### 3. Admin Hierarchy for SOS (Complete)

```
National Level
  └─ super_admin (unrestricted)

Province Level
  └─ province_admin (all SOS in province via admin_regions)

District Level
  └─ district_admin (all SOS in district via admin_regions)

Palika Level
  ├─ palika_admin (SOS in assigned palika)
  ├─ support_agent (manage_sos permission)
  ├─ moderator (manage_sos if granted)
  └─ content_editor/reviewer (no SOS access)
```

### 4. Permission Framework (Complete)

```
Permission: 'manage_sos'
  resource: 'sos_requests'
  action: 'manage'
  granted_to: palika_admin, district_admin, province_admin, support_agent

Function: user_has_permission('manage_sos')
  → Checks auth.uid() → admin_users → roles → role_permissions → permissions
  → Returns BOOLEAN
```

### 5. Service Provider Business Categorization (Complete)

**Category for Emergency Services:**
```sql
categories {
  entity_type: 'business'
  name_en: 'Emergency Services'
  name_ne: 'आपतकालीन सेवा'
  slug: 'emergency'
  display_order: 7
  is_active: true
}
```

**How It Works:**
- Service providers are `businesses` with `business_type_id` pointing to this category
- Palika admins create these businesses in the marketplace
- Each business has ONE owner (constraint)
- Businesses can be assigned to SOS requests via `assigned_to` FK relationship

### 6. Testing & Compliance (Complete)

**File:** `/admin-panel/services/__tests__/properties/sos-requests-rls-enforcement.property.test.ts`

**Property-based tests** verify:
- ✅ Palika admin sees only their palika's SOS
- ✅ Palika admin cannot see other palikas' SOS
- ✅ District admin sees all SOS in their district
- ✅ Super admin sees all SOS globally
- ✅ RLS enforced at database level (not bypassed)

---

## 🔴 WHAT'S MISSING (Application Layer - NOT BUILT)

### 1. Admin Panel API Routes
```
❌ GET /api/sos-requests              (list with filters)
❌ GET /api/sos-requests/:id          (detail view)
❌ POST /api/sos-requests/:id/assign  (assign responder)
❌ PATCH /api/sos-requests/:id        (update status)
❌ POST /api/sos-requests/:id/resolve (mark resolved)
```

### 2. Admin Panel Service Layer
```
❌ SOSRequestService {
  createEmergencyRequest()
  getEmergencyRequest()
  getAllEmergencyRequests(filters)
  assignServiceProvider()
  updateEmergencyRequestStatus()
  listNearbyResponders()  // TODO in provided code
  resolveEmergencyRequest()
  getResponseTimestats()
}
```

### 3. Admin Panel UI Pages
```
❌ /admin-panel/app/sos-requests/page.tsx          (dashboard)
❌ /admin-panel/app/sos-requests/[id]/page.tsx    (detail + assign)
❌ /admin-panel/app/sos-requests/analytics        (statistics)
```

### 4. Real-time Updates (Critical)
```
❌ WebSocket subscriptions for live status updates
❌ Push notifications to responders when assigned
❌ Real-time ETA updates from field
❌ Status change broadcasts to dispatch center
```

### 5. Notification System (Critical)
```
❌ SMS alert when responder assigned
❌ Push notification to responder app
❌ Email summary to palika admin
❌ Missed response escalation alerts
```

### 6. Geographic Dispatch (Important)
```
❌ Nearby responder search:
   SELECT * FROM sos_requests
   WHERE st_distance(location, request_location) < 5000m
   AND responder_palika = request_palika

❌ Location-based assignment suggestions
❌ Route optimization for responders
```

### 7. M-Place Public Views
```
❌ Emergency alerts displayed on m-place
❌ Public can view active emergency status
❌ Real-time emergency heatmap
❌ Emergency contact information
```

### 8. External Integrations (Future)
```
❌ Police department API integration
❌ Ambulance service API integration
❌ Fire department API integration
❌ SMS gateway for user notifications
❌ Government reporting/compliance APIs
```

---

## 🎯 HOW SOS FITS INTO PHASE 7

In Phase 7, SOS is the **5th content type** for m-place public browsing:

```
Phase 7 Content Types for M-Place:

1. Heritage Sites       (3-4 hours) ← Start here
2. Events & Festivals   (4 hours)
3. Blog Posts & Stories (3 hours)
4. Local Services      (2 hours)
5. SOS Information     (2 hours)    ← Deferred (simplest public view)
```

### What M-Place SOS Will Do (Public Only)

**Read-only for public users - NO login required:**

```typescript
// Show active emergency alerts
interface SOSPublicView {
  id: string
  request_code: string              // "SOS-20260329-001"
  emergency_type: string            // "medical", "accident", etc.
  location: { latitude, longitude }
  status: string                    // "received", "assigned", "in_progress"
  responder_eta_minutes: number     // How many minutes until help arrives
  palikaName: string
  updatedAt: string
}

// M-Place Query Pattern:
const { data } = await supabase
  .from('sos_requests')
  .select(`
    id, request_code, emergency_type, location, status,
    responder_eta_minutes, palikas!inner(name_en as palika_name)
  `)
  .eq('palika_id', palikaId)
  .in('status', ['received', 'assigned', 'in_progress'])  // Only active
  .order('status_updated_at', { ascending: false })

// Components:
- SOSAlertCard.tsx (display single alert)
- SOSAlertList.tsx (paginated list)
- EmergencyHeatmap.tsx (optional: location visualization)
```

### What Admin Panel SOS Will Do (Later - Not Phase 7)

**Full emergency management - Admin only:**

```typescript
// Features (implemented later):
1. View all SOS requests in palika (with filters)
2. Assign responder business to SOS
3. Update response status in real-time
4. Mark as resolved with notes
5. View response time statistics
6. Export incident reports
7. Receive notifications on new SOS
```

---

## 📋 IMPLEMENTATION REFERENCE: THE NESTJS SERVICE

The following service was provided as reference for what already works:

```typescript
@Injectable()
export class EmergencyRequestService {
  // 1. User creates emergency request (public mobile app)
  async createEmergencyRequest(userId: string, body: CreateEmergencyRequestDto)
    → Inserts sos_requests row with status='received'
    → Returns success message

  // 2. Admin/Dispatcher gets request details
  async getEmergencyRequest(id: string)
    → Returns full SOS request with all fields
    → RLS ensures only authorized admin can see it

  // 3. Central Control: Get all SOS with filters
  async getAllEmergencyRequests(query: FilterEmergencyRequestDto)
    → Filters by status, assigned provider, palika
    → RLS filters by user's palika access
    → Returns array of SOS requests

  // 4. Central Control: Assign responder to SOS
  async assignServiceProvider(id: string, body: AssignServiceProviderDto)
    → Updates: assigned_to, status='in_progress', acknowledged flag
    → Triggers: notification to responder, ETA calculation

  // 5. User updates their request (cancel or mark help received)
  async updateEmergencyRequestStatus(id: string, body: UpdateEmergencyRequestDto)
    → Updates: status, remarks
    → Triggers: notification to responder team

  // 6. List nearby responders (NOT YET IMPLEMENTED - TODO)
  async listNearbyResponders(query: ListNearbyRespondersDto)
    → Should query nearby businesses (service providers)
    → Filter by emergency_type + distance + availability
    → Currently returns empty array (TODO)
}
```

**Key Insight:** This NestJS service shows the **pattern to follow** but was built for a different backend architecture. M-place will implement a similar layer using **Next.js API routes + Supabase**.

---

## ⚠️ KEY CONSTRAINTS & ISSUES

### 1. One Business Profile Per User

**Current:** Database enforces one business per user profile
**Problem:** If a palika admin needs to create multiple service provider businesses, they'd need multiple user accounts

**Solution Options:**
- Create platform-managed service provider accounts (not owned by users)
- Or allow multiple business profiles per user (requires schema change)
- **Recommendation:** Platform-managed for SOS (not user-created)

### 2. Service Provider Creation Permission

**Current Status:** Palika admin can't create service providers (hanging)

**What's Needed:**
- Admin endpoint to create service provider businesses
- Validation that provider is in their palika
- Auto-assign ownership to palika admin account or platform account

**Priority:** HIGH (blocking full SOS workflow)

### 3. Geographic Dispatch Not Implemented

**Gap:** `listNearbyResponders()` is TODO - currently returns empty

**What's Needed:**
```sql
-- PostGIS query for nearby responders
SELECT b.* FROM businesses b
WHERE b.business_type_id = (SELECT id FROM categories WHERE slug='emergency')
  AND ST_Distance(b.location, ST_SetSRID(ST_Point(lon, lat), 4326)) < 5000
  AND b.palika_id = $1
  AND b.is_active = true
  AND b.verification_status = 'verified'
ORDER BY ST_Distance(b.location, ST_SetSRID(ST_Point(lon, lat), 4326))
LIMIT 10
```

---

## 📝 DIFFERENCES: PROVIDED SERVICE vs M-Place Implementation

| Aspect | Provided Service (NestJS) | M-Place (Phase 7) |
|--------|---------------------------|------------------|
| **Framework** | NestJS + TypeORM | Next.js + Supabase + React |
| **Layer** | Backend service | Frontend components + API routes |
| **Scope** | Full CRUD for all users | Read-only public + RLS-protected writes |
| **Auth** | User/Admin role-based | RLS policies + JWT |
| **Database** | TypeORM entities | Supabase RLS policies |
| **Notifications** | TODO (implied) | Required (SMS, push, email) |
| **Scope** | Central control system | Public alert display + Admin mgmt |

**What to Copy:**
- Service method patterns (createEmergencyRequest, updateStatus, etc.)
- DTO/entity structure
- Filter logic pattern

**What to Adapt:**
- Use Supabase query builder instead of TypeORM
- Use Next.js API routes instead of NestJS controllers
- Use RLS policies instead of role decorators
- Use React components for UI instead of templates

---

## 🚀 SOS PHASE 7 QUICK REFERENCE

**8-File Pattern for M-Place SOS (Same as other content types):**

1. `src/core/dtos/sos.dto.ts` - SOSAlertDTO, filters
2. `src/domain/repositories/sos.datasource.ts` - Interface
3. `src/data/datasources/mock/mock-sos.datasource.ts` - Mock data
4. `src/data/datasources/supabase-sos.datasource.ts` - Real Supabase queries
5. `src/data/repositories/sos.repository.ts` - Repository pattern
6. `src/services/sos.service.ts` - Business logic
7. `src/components/SOSAlertCard.tsx` + `SOSAlertList.tsx` - UI
8. `src/pages/EmergencyAlerts.tsx` - Page

**Estimated Lines of Code:** 250-300 LOC (simplest content type)

**Query Pattern:**
```typescript
// Get active SOS alerts for palika (no login required)
const { data, error } = await supabase
  .from('sos_requests')
  .select('id, request_code, emergency_type, location, status, responder_eta_minutes, palika_id')
  .eq('palika_id', palikaId)
  .in('status', ['received', 'assigned', 'in_progress'])  // Only active
  .eq('sent_offline', false)  // Not archived
  .order('status_updated_at', { ascending: false })
  .range(0, 24)  // Pagination
```

---

## 📌 DEFERRED: FULL SOS ADMIN MANAGEMENT (Not Phase 7)

Complete admin management with assignments, notifications, etc. will come later:

```
Phase 7:  ✅ M-Place public read-only SOS alerts
Phase 8?: ⏳ Admin panel SOS dashboard
Phase 9?: ⏳ Real-time updates + notifications
Phase 10?: ⏳ Geographic dispatch + routing
Phase 11?: ⏳ External agency integrations
```

---

## ✅ NEXT STEPS FOR PHASE 7

When implementing SOS in m-place (after heritage sites, events, blogs, services):

1. **Follow the same 8-file template** as other content types
2. **Reference the Supabase schema** (all fields are ready)
3. **Use RLS policies** - access control already enforced
4. **Mock datasource first** - test without real data
5. **Keep it simple** - read-only for public users
6. **No notifications yet** - Phase 7 is display only
7. **No assignments yet** - That's admin panel work (deferred)

---

## 🔗 RELATED DOCUMENTATION

- Database Schema: `PHASE_7_SUPABASE_SCHEMAS.md`
- Implementation Pattern: `PHASE_7_IMPLEMENTATION_ROADMAP.md`
- Data Layer Patterns: `PHASE_7_DATA_LAYER_PATTERNS.md`
- RLS Policies: Admin panel migration files in `/supabase/migrations/`
- Tests: `/admin-panel/services/__tests__/properties/sos-requests-rls-enforcement.property.test.ts`

