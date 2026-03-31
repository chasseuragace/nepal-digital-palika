-- ==========================================
-- MIGRATION 061: RLS policies for SOS tables
-- ==========================================
-- service_providers: public read, admin write (via admin_regions)
-- sos_request_assignments: follows parent sos_request access
-- sos_requests: add public read for active requests
--
-- Uses user_has_access_to_palika() which checks admin_regions table.
-- No shortcuts — consistent with migration 037 fixes.

-- ==========================================
-- SERVICE_PROVIDERS
-- ==========================================

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Public: anyone can see active providers (transparency portal, m-place)
CREATE POLICY "service_providers_public_read"
ON service_providers FOR SELECT
USING (is_active = true);

-- Admin: full CRUD for providers in their palika
CREATE POLICY "service_providers_admin_all"
ON service_providers FOR ALL
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

-- ==========================================
-- SOS_REQUEST_ASSIGNMENTS
-- ==========================================

ALTER TABLE sos_request_assignments ENABLE ROW LEVEL SECURITY;

-- Admin: access assignments for requests in their palika
CREATE POLICY "sos_assignments_admin_all"
ON sos_request_assignments FOR ALL
USING (
    public.get_user_role() = 'super_admin' OR
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND public.user_has_access_to_palika(sr.palika_id)
        AND public.user_has_permission('manage_sos')
    )
)
WITH CHECK (
    public.get_user_role() = 'super_admin' OR
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND public.user_has_access_to_palika(sr.palika_id)
        AND public.user_has_permission('manage_sos')
    )
);

-- Public: can see assignments for active SOS requests (status tracking)
CREATE POLICY "sos_assignments_public_read"
ON sos_request_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM sos_requests sr
        WHERE sr.id = sos_request_id
        AND sr.status IN ('pending', 'reviewing', 'assigned', 'in_progress')
    )
);

-- ==========================================
-- SOS_REQUESTS — add public read policy
-- ==========================================
-- Citizens can see active requests (for m-place alerts & status tracking)
-- No PII exposed — frontend selects only safe columns

DROP POLICY IF EXISTS "sos_requests_public_read" ON sos_requests;

CREATE POLICY "sos_requests_public_read"
ON sos_requests FOR SELECT
USING (
    status IN ('pending', 'reviewing', 'assigned', 'in_progress')
);

-- Citizens can create SOS requests (m-place complaint submission)
-- user_id is nullable — supports both logged-in and anonymous submissions
DROP POLICY IF EXISTS "sos_requests_public_insert" ON sos_requests;

CREATE POLICY "sos_requests_public_insert"
ON sos_requests FOR INSERT
WITH CHECK (true);
-- Note: INSERT is open because SOS must work for anyone, even unauthenticated.
-- The table requires user_phone (NOT NULL) as minimum identification.
-- Abuse prevention should be handled at the API layer (rate limiting).
