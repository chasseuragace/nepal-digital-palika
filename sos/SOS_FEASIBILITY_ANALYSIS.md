# SOS Integration: Feasibility Analysis & Decision Log

**Date:** 2026-03-31
**Branch:** `feature/sos-data-layer` (digital-palika repo)
**Scope:** Database schema changes, data layer alignment, integration plan

---

## 1. OVERVIEW

### What We're Doing
1. Create `service_providers` table (separate from businesses)
2. Alter `sos_requests` table (add missing fields)
3. Create `sos_request_assignments` junction table (multi-assignment)
4. Remove "Emergency Services" as a business category
5. Write RLS policies for new tables
6. Align enums between frontend and database

### What We're NOT Doing (Yet)
- Building API routes (later, when wiring frontend)
- Building real-time subscriptions (later)
- SMS/push notifications (later)
- Migrating SOS frontend code into m-place (later)

---

## 2. DECISIONS MADE (Based on Code Analysis)

### D1: Status Enum → MERGED

```
Frontend:  pending → reviewing → assigned → in-progress → resolved → cancelled
Database:  received → assigned → in_progress → resolved → cancelled

DECISION: Use frontend's workflow (more granular, proven in UI)
FINAL:    pending → reviewing → assigned → in_progress → resolved → cancelled

Mapping:  DB 'received' → renamed to 'pending' (frontend's term)
          Added 'reviewing' (admin acknowledges, begins triage)
          'in-progress' → 'in_progress' (DB uses underscores)
```

### D2: Emergency Type vs Service Type → ORTHOGONAL FIELDS

```
emergency_type = WHAT HAPPENED (incident classification)
  → medical, accident, fire, security, natural_disaster, other

service_type = WHO TO SEND (dispatch classification)
  → ambulance, fire_brigade, police

DECISION: Keep BOTH fields. They serve different purposes.
  - User reports "accident" (emergency_type)
  - Admin dispatches "ambulance" + "police" (service_type on assignment)
  - service_type moves to sos_request_assignments table (per-assignment)
```

### D3: Multi-Assignment → JUNCTION TABLE

```
Frontend:  assignedProviders: string[] (array of IDs)
Database:  assigned_to: UUID (single reference)

DECISION: Create sos_request_assignments junction table
REASON:
  - Each assignment has its own status, ETA, notes
  - Assignment history is preserved
  - Can query "all assignments for provider X"
  - Cleaner than JSONB array
  - Supports concurrent multi-provider response
```

### D4: Service Provider → SEPARATE TABLE (Not Business)

```
DECISION: Create dedicated service_providers table
REASON:
  - No owner_user_id dependency (admin-created, not user-owned)
  - Different fields (vehicle_count, response_time_avg, coverage)
  - Different RLS model (palika admin manages directly)
  - No business verification workflow needed
  - Avoids 1-business-per-user constraint entirely
```

### D5: Priority & Urgency → ADD TO SOS_REQUESTS

```
DECISION: Add priority VARCHAR(20) and urgency_score INTEGER
REASON: Frontend has working urgency algorithm (0-100 scale)
  - priority: admin-set classification
  - urgency_score: algorithm-computed triage score
```

### D6: Images/Photos → ADD TO SOS_REQUESTS

```
DECISION: Add images JSONB DEFAULT '[]'
REASON: Frontend supports photo upload, DB lacks field
```

### D7: Provider Types → ENUM CHECK, NOT REFERENCE TABLE

```
DECISION: service_type VARCHAR(30) CHECK ('ambulance', 'fire_brigade', 'police', 'rescue', 'other')
REASON:
  - Frontend uses 3 types (ambulance, fire, police)
  - Added 'rescue' and 'other' for future flexibility
  - Renamed 'fire' → 'fire_brigade' to be explicit
  - Simple CHECK constraint, no need for separate table yet
```

### D8: Provider Ownership → CREATED BY ADMIN, NO USER OWNER

```
DECISION: service_providers.created_by references admin_users(id)
  - No owner_user_id (unlike businesses)
  - Palika admin creates and manages directly
  - Bypasses 1-business-per-user constraint entirely
  - No end-user signup needed for providers
```

### D9: Remove Emergency Services Category

```
DECISION: Remove from seed data, leave category row in DB
  - Don't delete existing category (may have FK references)
  - Mark is_active = false
  - New code uses service_providers table instead
  - Clean separation: businesses = marketplace, service_providers = SOS
```

---

## 3. PROPOSED SCHEMA CHANGES

### Migration 1: Create service_providers Table

```sql
CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,

    -- Identity
    name_en VARCHAR(300) NOT NULL,
    name_ne VARCHAR(300),
    slug VARCHAR(300),

    -- Classification
    service_type VARCHAR(30) NOT NULL CHECK (
        service_type IN ('ambulance', 'fire_brigade', 'police', 'rescue', 'other')
    ),

    -- Contact
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(255),
    secondary_phones TEXT[] DEFAULT '{}',

    -- Location (for distance-based dispatch)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    ward_number INTEGER CHECK (ward_number >= 1 AND ward_number <= 35),
    coverage_area TEXT,  -- Human-readable description

    -- Capacity
    vehicle_count INTEGER DEFAULT 1 CHECK (vehicle_count >= 0),
    services TEXT[] DEFAULT '{}',  -- e.g. ['first_aid', 'critical_care', 'transport']

    -- Operations
    operating_hours JSONB DEFAULT '{"is_24_7": true}',
    is_24_7 BOOLEAN DEFAULT true,

    -- Availability
    status VARCHAR(30) DEFAULT 'available' CHECK (
        status IN ('available', 'busy', 'offline', 'suspended')
    ),

    -- Performance
    response_time_avg_minutes INTEGER,
    rating_average NUMERIC(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_assignments INTEGER DEFAULT 0,
    total_resolved INTEGER DEFAULT 0,

    -- Admin
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sp_palika ON service_providers(palika_id);
CREATE INDEX idx_sp_type ON service_providers(service_type);
CREATE INDEX idx_sp_status ON service_providers(status);
CREATE INDEX idx_sp_location ON service_providers USING GIST(location);
CREATE INDEX idx_sp_active ON service_providers(is_active, status);
```

### Migration 2: Alter sos_requests Table

```sql
-- Add missing fields from frontend
ALTER TABLE sos_requests
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20)
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    ADD COLUMN IF NOT EXISTS urgency_score INTEGER
        CHECK (urgency_score >= 0 AND urgency_score <= 100),
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id),
    ADD COLUMN IF NOT EXISTS app_submitted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS device_location BOOLEAN DEFAULT false;

-- Update status CHECK constraint to include 'pending' and 'reviewing'
-- Drop old constraint, add new one
ALTER TABLE sos_requests DROP CONSTRAINT IF EXISTS sos_requests_status_check;
ALTER TABLE sos_requests ADD CONSTRAINT sos_requests_status_check
    CHECK (status IN ('pending', 'reviewing', 'assigned', 'in_progress', 'resolved', 'cancelled'));

-- Update default status from 'received' to 'pending'
ALTER TABLE sos_requests ALTER COLUMN status SET DEFAULT 'pending';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_sos_priority ON sos_requests(priority);
CREATE INDEX IF NOT EXISTS idx_sos_status_updated ON sos_requests(status, status_updated_at);
```

### Migration 3: Create sos_request_assignments Junction Table

```sql
CREATE TABLE IF NOT EXISTS sos_request_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_request_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,

    -- Assignment details
    assigned_by UUID NOT NULL REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    -- Response tracking
    status VARCHAR(30) DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'acknowledged', 'en_route', 'on_scene', 'completed', 'declined')
    ),
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- ETA
    estimated_arrival_minutes INTEGER CHECK (estimated_arrival_minutes > 0),
    actual_arrival_at TIMESTAMPTZ,

    -- Distance (calculated at assignment time)
    distance_km NUMERIC(8,2),

    -- Notes
    assignment_notes TEXT,
    completion_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate assignments
    UNIQUE(sos_request_id, provider_id)
);

-- Indexes
CREATE INDEX idx_sra_request ON sos_request_assignments(sos_request_id);
CREATE INDEX idx_sra_provider ON sos_request_assignments(provider_id);
CREATE INDEX idx_sra_status ON sos_request_assignments(status);
```

### Migration 4: RLS Policies

```sql
-- ==========================================
-- SERVICE_PROVIDERS RLS
-- ==========================================
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see active providers (for transparency portal)
CREATE POLICY "service_providers_public_read"
ON service_providers FOR SELECT
USING (is_active = true);

-- Admin write: palika admin manages their palika's providers
CREATE POLICY "service_providers_admin_write"
ON service_providers FOR ALL
USING (
    public.get_user_role() = 'super_admin' OR
    public.user_has_access_to_palika(palika_id)
)
WITH CHECK (
    public.get_user_role() = 'super_admin' OR
    public.user_has_access_to_palika(palika_id)
);

-- ==========================================
-- SOS_REQUEST_ASSIGNMENTS RLS
-- ==========================================
ALTER TABLE sos_request_assignments ENABLE ROW LEVEL SECURITY;

-- Admin access: same as sos_requests (via the request's palika_id)
CREATE POLICY "sos_assignments_admin_all"
ON sos_request_assignments FOR ALL
USING (
    public.get_user_role() = 'super_admin' OR
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND public.user_has_access_to_palika(sr.palika_id)
    )
)
WITH CHECK (
    public.get_user_role() = 'super_admin' OR
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND public.user_has_access_to_palika(sr.palika_id)
    )
);

-- Public read: can see assignments for active SOS requests
CREATE POLICY "sos_assignments_public_read"
ON sos_request_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND sr.status IN ('assigned', 'in_progress')
    )
);

-- ==========================================
-- UPDATE SOS_REQUESTS RLS (add public read for active)
-- ==========================================
-- Drop old shortcut policy if exists
DROP POLICY IF EXISTS "sos_requests_public_read" ON sos_requests;

-- Public can see active SOS requests (sanitized via select columns)
CREATE POLICY "sos_requests_public_read"
ON sos_requests FOR SELECT
USING (
    status IN ('pending', 'reviewing', 'assigned', 'in_progress')
);
```

### Migration 5: Deactivate Emergency Services Category

```sql
-- Don't delete (may have FK references), just deactivate
UPDATE categories
SET is_active = false
WHERE entity_type = 'business'
  AND slug = 'emergency';
```

---

## 4. FIELD MAPPING: Frontend ↔ Database

### EmergencyRequest (Frontend) → sos_requests (DB)

| Frontend Field | DB Column | Notes |
|---------------|-----------|-------|
| id | id | UUID |
| userId | user_id | UUID, nullable |
| userName | user_name | VARCHAR(200) |
| userPhone | user_phone | VARCHAR(40) |
| location.latitude | location (GEOGRAPHY) | Extract from POINT |
| location.longitude | location (GEOGRAPHY) | Extract from POINT |
| location.address | location_description | TEXT |
| emergencyType | emergency_type | CHECK constraint |
| serviceType | *moved to assignments* | Per-assignment, not per-request |
| status | status | Updated CHECK constraint |
| priority | priority | **NEW** VARCHAR(20) |
| description | details | TEXT |
| photos | images | **NEW** JSONB |
| timestamp | created_at | TIMESTAMPTZ |
| reviewedAt | reviewed_at | **NEW** TIMESTAMPTZ |
| assignedAt | *on assignment row* | Per-assignment timestamp |
| responseTime | *calculated* | resolved_at - created_at |
| resolvedAt | resolved_at | TIMESTAMPTZ |
| assignedProviders | *junction table* | sos_request_assignments |
| assignedBy | *on assignment row* | Per-assignment admin |
| estimatedArrival | *on assignment row* | Per-assignment ETA |
| appSubmitted | app_submitted | **NEW** BOOLEAN |
| deviceLocation | device_location | **NEW** BOOLEAN |
| adminNotes | details + timeline | JSONB timeline for history |
| urgencyScore | urgency_score | **NEW** INTEGER |
| lastUpdated | updated_at | TIMESTAMPTZ |
| — | request_code | Auto-generated unique code |
| — | palika_id | **CRITICAL** multi-tenant key |
| — | ward_number | Location detail |
| — | location_accuracy | GPS accuracy |
| — | user_rating | Post-resolution feedback |
| — | user_feedback | Post-resolution text |
| — | sent_offline | Offline queue support |

### ServiceProvider (Frontend) → service_providers (DB)

| Frontend Field | DB Column | Notes |
|---------------|-----------|-------|
| id | id | UUID |
| name | name_en | VARCHAR(300) |
| — | name_ne | **NEW** Nepali name |
| type | service_type | CHECK constraint |
| location | address | TEXT |
| coordinates | location (GEOGRAPHY) | POINT type |
| phone | phone | VARCHAR(40) |
| email | email | VARCHAR(255) |
| status | status | CHECK constraint |
| vehicleCount | vehicle_count | INTEGER |
| responseTimeAvg | response_time_avg_minutes | INTEGER (minutes) |
| services | services | TEXT[] array |
| coverage | coverage_area | TEXT |
| operatingHours | operating_hours | JSONB |
| rating | rating_average | NUMERIC(3,2) |
| — | palika_id | **CRITICAL** multi-tenant key |
| — | ward_number | Location detail |
| — | is_active | Soft delete |
| — | created_by | Admin who created |
| — | total_assignments | Performance counter |
| — | total_resolved | Performance counter |

---

## 5. WHAT REMAINS UNANSWERED (Needs Discussion)

### Q1: Should `service_type` live on sos_requests OR only on assignments?

**Context:** A single accident may need BOTH ambulance AND police.

**Option A:** `service_type` on sos_requests = "primary need"
  - Quick triage: "this is a fire call"
  - Doesn't prevent assigning other types
  - Frontend currently has it on the request

**Option B:** Only on assignments, not on request
  - Cleaner: request describes incident, assignments describe response
  - More flexible but harder to filter "show me all fire calls"

**Recommendation:** Keep on BOTH. Request has `service_type` for triage filtering. Assignment can override with different provider type.

### Q2: Coverage Area — Text or PostGIS Polygon?

**Context:** Frontend uses `coverage: string` ("Kathmandu Valley, Ring Road area")

**Option A:** Text field (current frontend approach)
  - Simple, human-readable
  - Can't do spatial queries ("is this location in coverage?")

**Option B:** PostGIS polygon + text label
  - Enables "find providers whose coverage includes this emergency location"
  - More complex migration
  - Frontend would need map drawing UI

**Recommendation:** Start with text. Add polygon later when geographic dispatch is built. The distance-based Haversine approach works for now.

### Q3: Provider Rating — From SOS Feedback or Admin-Set?

**Context:** Frontend has `rating: number`. DB `sos_requests` has `user_rating`.

**Option A:** Computed from SOS request user_ratings (average)
  - Authentic feedback
  - Need enough data to be meaningful
  - Requires trigger or materialized view

**Option B:** Admin-set rating
  - Quick to implement
  - Less authentic
  - Can be overridden

**Recommendation:** Support BOTH. `rating_average` computed from SOS feedback (via trigger). Admin can override with manual rating if needed. Start with admin-set, add trigger later.

### Q4: How Does Palika Admin Create Providers Without Conflicting with RLS?

**Context:** Current RLS uses `user_has_access_to_palika()` which checks `admin_regions` table.

**Answer:** This is actually NOT a problem:
```sql
-- The RLS policy we'll create:
CREATE POLICY "service_providers_admin_write"
ON service_providers FOR ALL
USING (user_has_access_to_palika(palika_id))
WITH CHECK (user_has_access_to_palika(palika_id));

-- Palika admin has admin_regions row for their palika
-- So user_has_access_to_palika() returns TRUE
-- They can INSERT, UPDATE, DELETE within their palika
-- No conflict with existing RLS architecture
```

**The only prerequisite:** Admin must have an `admin_regions` row for the palika. This is already the standard admin onboarding flow.

### Q5: What About the `assigned_to` Column on sos_requests?

**Context:** Current DB has `assigned_to UUID REFERENCES admin_users(id)`. New junction table replaces this.

**Options:**
- **A:** Drop column (breaking change, need to migrate data)
- **B:** Keep column, mark deprecated, use junction table going forward
- **C:** Repurpose as "primary coordinator" for the request

**Recommendation:** Option C. Keep `assigned_to` as the admin who owns/coordinates the request (the dispatcher). Actual provider assignments go in junction table. Different concept: `assigned_to` = "who's managing this case", assignments = "who's responding in the field".

### Q6: SOS Request Creation — Who Can Create?

**Context:** Current DB has `user_id UUID REFERENCES profiles(id) ON DELETE SET NULL` (nullable).

**Current Frontend:** Has `appSubmitted` and `deviceLocation` booleans suggesting mobile app creation.

**Answer:** Three paths already supported:
1. **Mobile app user** (has profile): `user_id` = their profile ID
2. **Anonymous caller** (no profile): `user_id` = NULL, phone required
3. **Admin on behalf of caller**: Admin creates, sets user_phone manually

No schema change needed. RLS already allows INSERT for authenticated users. May need a public INSERT policy for anonymous mobile submissions.

### Q7: Real-Time Strategy

**Context:** Frontend polls every 30 seconds. Supabase supports real-time subscriptions.

**Not blocking now.** When wiring frontend to Supabase:
- Replace polling with `supabase.channel('sos-updates').on('postgres_changes', ...)`
- Free with Supabase, no extra infrastructure
- Can do incrementally (keep polling as fallback)

---

## 6. TOTAL FEASIBILITY ASSESSMENT

### ✅ FEASIBLE — Database Changes

| Change | Complexity | Risk | Blocking? |
|--------|-----------|------|-----------|
| Create service_providers table | Low | Low | No |
| Alter sos_requests (add columns) | Low | Low | No |
| Create sos_request_assignments | Low | Low | No |
| RLS for service_providers | Medium | Medium | No |
| RLS for assignments | Medium | Medium | No |
| Deactivate emergency category | Low | Low | No |
| Update status CHECK constraint | Low | Medium | No |

**Total migration effort:** 5 SQL files, ~200 lines
**Risk:** Low-medium. New tables don't affect existing data. ALTER on sos_requests is additive (no drops).

### ✅ FEASIBLE — Frontend Alignment

| Gap | Solution | Effort |
|-----|----------|--------|
| Status enum mismatch | Update DB CHECK + default | 1 line SQL |
| Missing priority/urgency | ALTER ADD COLUMN | 2 lines SQL |
| Missing images | ALTER ADD COLUMN | 1 line SQL |
| Multi-assignment | Junction table | ~30 lines SQL |
| Provider as separate entity | New table | ~50 lines SQL |
| Service type mapping | Orthogonal fields | Design decision |

### ⚠️ DEFERRED — Not Blocking

| Item | Why Deferred | When |
|------|-------------|------|
| API routes | Need frontend wiring first | When merging to m-place |
| Real-time subscriptions | Polling works for now | After API routes |
| SMS/push notifications | External service needed | After real-time |
| Geographic polygon coverage | Text coverage works | After basic dispatch |
| Rating computation trigger | Admin-set works first | After enough SOS data |
| SOS frontend → m-place merge | Separate task | After data layer done |

### 🔴 RISK: Status Data Migration

If any existing sos_requests rows have `status = 'received'`:
```sql
-- Must run BEFORE changing CHECK constraint
UPDATE sos_requests SET status = 'pending' WHERE status = 'received';
```

---

## 7. IMPLEMENTATION ORDER

```
Step 1: Create branch feature/sos-data-layer ✅ (done)

Step 2: Write migrations
  2a. Create service_providers table + indexes
  2b. Alter sos_requests (add columns, update CHECK)
  2c. Create sos_request_assignments + indexes
  2d. RLS policies for all new/changed tables
  2e. Deactivate emergency business category

Step 3: Update seed data
  3a. Remove emergency category from active seeds
  3b. Add sample service providers for dev/test

Step 4: Verify
  4a. Run migrations locally
  4b. Test RLS with different admin roles
  4c. Verify existing sos_requests data not broken

Step 5: Commit to feature/sos-data-layer branch

Step 6: (Future) Wire SOS frontend to Supabase
Step 7: (Future) Merge SOS frontend into m-place
Step 8: (Future) Build API routes
```

---

## 8. RELATIONSHIP DIAGRAM (After Changes)

```
palikas (1) ──→ (∞) service_providers
palikas (1) ──→ (∞) sos_requests

sos_requests (1) ──→ (∞) sos_request_assignments ←── (∞) service_providers
                              │
                              └── assigned_by → admin_users

admin_users ──→ service_providers.created_by
admin_users ──→ sos_requests.assigned_to (coordinator)
admin_users ──→ sos_requests.reviewed_by
profiles ──→ sos_requests.user_id (caller, nullable)
```

---

## 9. DECISION LOG SUMMARY

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Status: pending→reviewing→assigned→in_progress→resolved→cancelled | Frontend's workflow is more granular, already built |
| D2 | emergency_type + service_type are separate concepts | "What happened" vs "who to send" |
| D3 | Junction table for multi-assignment | Per-assignment status, history, ETA |
| D4 | Separate service_providers table | No user-owner dependency, different fields |
| D5 | Add priority + urgency_score to sos_requests | Frontend has working algorithm |
| D6 | Add images JSONB to sos_requests | Frontend supports photo upload |
| D7 | Provider types as CHECK constraint | 5 types sufficient for now |
| D8 | Providers created by admin, no user owner | Bypasses 1-business-per-user entirely |
| D9 | Deactivate (not delete) emergency category | Preserve FK integrity |
| D10 | Keep assigned_to as "coordinator" | Different from provider assignments |
| D11 | Text coverage area (not polygon) | Simple first, PostGIS later |
| D12 | Public read for active providers | Transparency portal needs it |

---

## ✅ READY TO PROCEED

All blocking questions answered. Open questions (Q1-Q7) have recommendations that can proceed with. No external dependencies needed for database changes.

**Next:** Write the actual SQL migrations and commit to `feature/sos-data-layer`.

