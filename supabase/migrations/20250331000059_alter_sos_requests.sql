-- ==========================================
-- MIGRATION 059: Alter sos_requests table
-- ==========================================
-- Adds fields needed by SOS frontend (priority, images, etc.)
-- Updates status enum to match frontend workflow.
-- Dev environment — safe to drop and recreate constraints.

-- 1. Rename 'received' status to 'pending' (if any rows exist)
UPDATE sos_requests SET status = 'pending' WHERE status = 'received';

-- 2. Drop old status constraint and default
ALTER TABLE sos_requests DROP CONSTRAINT IF EXISTS sos_requests_status_check;
ALTER TABLE sos_requests ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Add new status constraint (frontend workflow)
ALTER TABLE sos_requests ADD CONSTRAINT sos_requests_status_check
    CHECK (status IN ('pending', 'reviewing', 'assigned', 'in_progress', 'resolved', 'cancelled'));

-- 4. Add new columns
ALTER TABLE sos_requests
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20)
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    ADD COLUMN IF NOT EXISTS urgency_score INTEGER
        CHECK (urgency_score >= 0 AND urgency_score <= 100),
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(30)
        CHECK (service_type IN ('ambulance', 'fire_brigade', 'police', 'rescue', 'other')),
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id),
    ADD COLUMN IF NOT EXISTS app_submitted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS device_location BOOLEAN DEFAULT false;

-- 5. Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_sos_priority ON sos_requests(priority);
CREATE INDEX IF NOT EXISTS idx_sos_service_type ON sos_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_sos_status_updated ON sos_requests(status, status_updated_at);
