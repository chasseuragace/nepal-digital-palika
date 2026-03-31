-- ==========================================
-- MIGRATION 058: Create service_providers table
-- ==========================================
-- Service providers are emergency responders (ambulance, fire, police, rescue)
-- managed by palika admins. Separate from businesses table.
-- No owner_user_id — admin-created entities.

CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,

    -- Identity
    name_en VARCHAR(300) NOT NULL,
    name_ne VARCHAR(300),

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
    coverage_area TEXT,

    -- Capacity
    vehicle_count INTEGER DEFAULT 1 CHECK (vehicle_count >= 0),
    services TEXT[] DEFAULT '{}',

    -- Operations
    operating_hours JSONB DEFAULT '{"is_24_7": true}',
    is_24_7 BOOLEAN DEFAULT true,

    -- Availability (real-time status)
    status VARCHAR(30) DEFAULT 'available' CHECK (
        status IN ('available', 'busy', 'offline', 'suspended')
    ),

    -- Performance metrics
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
