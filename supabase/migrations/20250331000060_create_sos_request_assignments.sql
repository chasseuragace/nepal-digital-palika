-- ==========================================
-- MIGRATION 060: Create sos_request_assignments table
-- ==========================================
-- Junction table for multi-provider assignment.
-- Each assignment tracks its own status, ETA, and timeline.
-- Replaces the single assigned_to column approach.

CREATE TABLE IF NOT EXISTS sos_request_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_request_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,

    -- Who assigned
    assigned_by UUID NOT NULL REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    -- Per-assignment status
    status VARCHAR(30) DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'acknowledged', 'en_route', 'on_scene', 'completed', 'declined')
    ),
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Response tracking
    estimated_arrival_minutes INTEGER CHECK (estimated_arrival_minutes > 0),
    actual_arrival_at TIMESTAMPTZ,

    -- Distance snapshot (calculated at assignment time via Haversine)
    distance_km NUMERIC(8,2),

    -- Notes
    assignment_notes TEXT,
    completion_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- No duplicate provider per request
    UNIQUE(sos_request_id, provider_id)
);

-- Indexes
CREATE INDEX idx_sra_request ON sos_request_assignments(sos_request_id);
CREATE INDEX idx_sra_provider ON sos_request_assignments(provider_id);
CREATE INDEX idx_sra_status ON sos_request_assignments(status);
CREATE INDEX idx_sra_assigned_at ON sos_request_assignments(assigned_at);
