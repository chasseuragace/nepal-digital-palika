
-- ==========================================
-- SUPABASE PROJECT SETUP
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- ==========================================
-- CORE TABLES
-- ==========================================

-- PROVINCES
CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ne VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISTRICTS
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    province_id INTEGER REFERENCES provinces(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_ne VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PALIKAS
CREATE TABLE palikas (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    name_en VARCHAR(200) NOT NULL,
    name_ne VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('municipality', 'metropolitan', 'sub_metropolitan')),
    code VARCHAR(40) UNIQUE NOT NULL,
    
    -- Contact
    office_phone VARCHAR(40),
    office_email VARCHAR(100),
    website VARCHAR(200),
    
    -- Geographic
    center_point GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    
    total_wards INTEGER DEFAULT 0 CHECK (total_wards >= 0),
    
    -- Settings: {"logo_url": null, "theme_color": "#1a73e8", "contact_email": null, "languages": ["en", "ne"]}
    settings JSONB DEFAULT '{"logo_url": null, "theme_color": "#1a73e8", "contact_email": null, "languages": ["en", "ne"]}',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_palikas_center ON palikas USING GIST(center_point);
CREATE INDEX idx_palikas_active ON palikas(is_active);

-- ==========================================
-- USERS (Supabase Auth Integration)
-- ==========================================

-- Supabase creates auth.users automatically with: email, phone, email_confirmed_at, phone_confirmed_at
-- This profiles table extends auth.users with app-specific data
-- Note: phone is stored in auth.users; we store it here for quick access without auth schema queries

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact (denormalized from auth.users for performance)
    phone VARCHAR(40),
    name VARCHAR(200),
    profile_photo TEXT,
    
    -- User classification
    user_type VARCHAR(40) DEFAULT 'resident' CHECK (user_type IN ('resident', 'tourist_domestic', 'tourist_international', 'business_owner', 'admin')),
    
    -- Location
    default_palika_id INTEGER REFERENCES palikas(id),
    current_location GEOGRAPHY(POINT, 4326),
    
    -- Preferences: {"language": "en", "notifications_enabled": true, "theme": "light"}
    preferences JSONB DEFAULT '{"language": "en", "notifications_enabled": true, "theme": "light"}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_palika ON profiles(default_palika_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);

-- ==========================================
-- ADMIN USERS
-- ==========================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'palika_admin', 'moderator', 'support')),
    palika_id INTEGER REFERENCES palikas(id),
    
    -- Permissions: ["manage_heritage", "manage_businesses", "manage_sos", "manage_users", "manage_admins"]
    permissions JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_palika ON admin_users(palika_id);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- ==========================================
-- HERITAGE SITES
-- ==========================================

CREATE TABLE heritage_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    
    name_en VARCHAR(300) NOT NULL,
    name_ne VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    category VARCHAR(100) NOT NULL CHECK (category IN ('temple', 'monastery', 'palace', 'fort', 'museum', 'archaeological', 'natural', 'cultural', 'other')),
    site_type VARCHAR(100),
    heritage_status VARCHAR(100) CHECK (heritage_status IN ('world_heritage', 'national', 'provincial', 'local', 'proposed')),
    
    ward_number INTEGER CHECK (ward_number >= 1 AND ward_number <= 35),
    address TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    short_description TEXT,
    full_description TEXT,
    
    -- Opening hours: {"monday": "09:00-17:00", "tuesday": "09:00-17:00", ..., "sunday": "09:00-17:00"}
    opening_hours JSONB DEFAULT '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
    
    -- Entry fee: {"local_adult": 100, "local_child": 50, "foreign_adult": 500, "foreign_child": 250, "currency": "NPR"}
    entry_fee JSONB DEFAULT '{"local_adult": 0, "local_child": 0, "foreign_adult": 0, "foreign_child": 0, "currency": "NPR"}',
    
    featured_image TEXT,
    -- Images: [{"url": "https://...", "caption": "Main entrance", "order": 1}, ...]
    images JSONB DEFAULT '[]',
    
    audio_guide_url TEXT,
    languages_available TEXT[] DEFAULT '{"en", "ne"}',
    
    -- Accessibility: {"wheelchair_accessible": true, "parking": true, "restrooms": true, "guide_available": true}
    accessibility_info JSONB DEFAULT '{"wheelchair_accessible": false, "parking": false, "restrooms": false, "guide_available": false}',
    
    best_time_to_visit VARCHAR(100),
    average_visit_duration_minutes INTEGER CHECK (average_visit_duration_minutes > 0),
    
    qr_code_url TEXT,
    
    view_count INTEGER DEFAULT 0,
    
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_heritage_palika ON heritage_sites(palika_id);
CREATE INDEX idx_heritage_location ON heritage_sites USING GIST(location);
CREATE INDEX idx_heritage_status ON heritage_sites(status);
CREATE INDEX idx_heritage_category ON heritage_sites(category);
CREATE INDEX idx_heritage_name_search ON heritage_sites USING gin(to_tsvector('english', name_en));

-- ==========================================
-- EVENTS
-- ==========================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    
    name_en VARCHAR(300) NOT NULL,
    name_ne VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    category VARCHAR(100),
    event_type VARCHAR(50),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    location GEOGRAPHY(POINT, 4326),
    venue_name VARCHAR(200),
    
    short_description TEXT,
    full_description TEXT,
    
    featured_image TEXT,
    -- Images: [{"url": "https://...", "caption": "Event photo", "order": 1}, ...]
    images JSONB DEFAULT '[]',
    
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_palika ON events(palika_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_location ON events USING GIST(location);

-- ==========================================
-- BUSINESSES
-- ==========================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    business_name VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    business_type VARCHAR(100) NOT NULL CHECK (business_type IN ('accommodation', 'restaurant', 'tour_operator', 'transport', 'shopping', 'entertainment', 'service', 'other')),
    sub_category VARCHAR(100),
    
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(255),
    
    ward_number INTEGER NOT NULL CHECK (ward_number >= 1 AND ward_number <= 35),
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    description TEXT NOT NULL,
    
    -- Details: {"rooms": 3, "room_types": ["single", "double"], "amenities": ["wifi", "hot_water"], "capacity": 10}
    details JSONB DEFAULT '{}',
    
    -- Price range: {"min": 1500, "max": 2500, "currency": "NPR", "unit": "night"}
    price_range JSONB DEFAULT '{"min": 0, "max": 0, "currency": "NPR", "unit": "per_item"}',
    
    -- Operating hours: {"monday": "09:00-17:00", "tuesday": "09:00-17:00", ..., "sunday": "closed"}
    operating_hours JSONB DEFAULT '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
    is_24_7 BOOLEAN DEFAULT false,
    
    languages_spoken TEXT[] DEFAULT '{"en", "ne"}',
    
    -- Facilities: {"parking": true, "wifi": true, "restaurant": false, "guide_service": true}
    facilities JSONB DEFAULT '{"parking": false, "wifi": false, "restaurant": false, "guide_service": false}',
    
    featured_image TEXT,
    -- Images: [{"url": "https://...", "caption": "Main entrance", "order": 1}, ...]
    images JSONB DEFAULT '[]',
    
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES admin_users(id),
    
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_palika ON businesses(palika_id);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX idx_businesses_verification ON businesses(verification_status);
CREATE INDEX idx_businesses_type_status ON businesses(business_type, verification_status, is_active);
CREATE INDEX idx_businesses_name_search ON businesses USING gin(to_tsvector('english', business_name));

-- ==========================================
-- INQUIRIES
-- ==========================================

CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    inquiry_code VARCHAR(40) UNIQUE NOT NULL,
    inquiry_data JSONB NOT NULL,
    
    status VARCHAR(50) DEFAULT 'new',
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiries_business ON inquiries(business_id);
CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_inquiries_code ON inquiries(inquiry_code);

-- ==========================================
-- REVIEWS
-- ==========================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    
    owner_response TEXT,
    owner_responded_at TIMESTAMPTZ,
    
    helpful_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ==========================================
-- SOS REQUESTS
-- ==========================================

CREATE TABLE sos_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    palika_id INTEGER NOT NULL REFERENCES palikas(id),
    
    request_code VARCHAR(40) UNIQUE NOT NULL,
    emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('medical', 'accident', 'fire', 'security', 'natural_disaster', 'other')),
    
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    location_accuracy FLOAT CHECK (location_accuracy > 0),
    location_description TEXT,
    ward_number INTEGER CHECK (ward_number >= 1 AND ward_number <= 35),
    
    user_name VARCHAR(200),
    user_phone VARCHAR(40) NOT NULL,
    details TEXT,
    
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'assigned', 'in_progress', 'resolved', 'cancelled')),
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    assigned_to UUID REFERENCES admin_users(id),
    responder_name VARCHAR(200),
    responder_phone VARCHAR(40),
    responder_eta_minutes INTEGER CHECK (responder_eta_minutes > 0),
    
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    sent_offline BOOLEAN DEFAULT false,
    queued_at TIMESTAMPTZ,
    
    -- Timeline: [{"status": "received", "timestamp": "2025-01-15T10:30:00Z"}, ...]
    timeline JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sos_palika ON sos_requests(palika_id);
CREATE INDEX idx_sos_status ON sos_requests(status);
CREATE INDEX idx_sos_location ON sos_requests USING GIST(location);
CREATE INDEX idx_sos_created_date ON sos_requests(DATE(created_at));

-- ==========================================
-- FAVORITES
-- ==========================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ==========================================
-- ANALYTICS
-- ==========================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    palika_id INTEGER REFERENCES palikas(id),
    
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- ==========================================
-- TRIGGERS (Automatic Updates)
-- ==========================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_palikas_updated_at BEFORE UPDATE ON palikas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update business rating when review is added
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE businesses
    SET 
        rating_average = (
            SELECT AVG(rating)::NUMERIC(3,2)
            FROM reviews
            WHERE business_id = NEW.business_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE business_id = NEW.business_id
        )
    WHERE id = NEW.business_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Generate inquiry code automatically
CREATE OR REPLACE FUNCTION generate_inquiry_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.inquiry_code = 'INQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_inquiry_code_trigger
BEFORE INSERT ON inquiries
FOR EACH ROW EXECUTE FUNCTION generate_inquiry_code();

-- Generate SOS request code automatically
CREATE OR REPLACE FUNCTION generate_sos_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_code = 'SOS-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sos_code_trigger
BEFORE INSERT ON sos_requests
FOR EACH ROW EXECUTE FUNCTION generate_sos_code();

-- Generate slug automatically from name (heritage_sites, events, businesses)
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $
BEGIN
    NEW.slug = LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name_en, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER generate_heritage_slug_trigger
BEFORE INSERT ON heritage_sites
FOR EACH ROW EXECUTE FUNCTION generate_slug();

CREATE TRIGGER generate_events_slug_trigger
BEFORE INSERT ON events
FOR EACH ROW EXECUTE FUNCTION generate_slug();

CREATE TRIGGER generate_businesses_slug_trigger
BEFORE INSERT ON businesses
FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES
-- ==========================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ==========================================
-- HERITAGE SITES
-- ==========================================

-- Anyone can view published heritage sites
CREATE POLICY "Anyone can view published heritage sites"
ON heritage_sites FOR SELECT
USING (status = 'published');

-- Only admins can insert heritage sites
CREATE POLICY "Admins can insert heritage sites"
ON heritage_sites FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- Only admins can update heritage sites
CREATE POLICY "Admins can update heritage sites"
ON heritage_sites FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- BUSINESSES
-- ==========================================

-- Anyone can view verified active businesses
CREATE POLICY "Anyone can view verified businesses"
ON businesses FOR SELECT
USING (
    verification_status = 'verified'
    AND is_active = true
);

-- Business owners can view their own businesses
CREATE POLICY "Owners can view own businesses"
ON businesses FOR SELECT
USING (auth.uid() = owner_user_id);

-- Authenticated users can insert businesses
CREATE POLICY "Users can register businesses"
ON businesses FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

-- Owners can update their own businesses
CREATE POLICY "Owners can update own businesses"
ON businesses FOR UPDATE
USING (auth.uid() = owner_user_id);

-- ==========================================
-- INQUIRIES
-- ==========================================

-- Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
USING (auth.uid() = user_id);

-- Business owners can view inquiries to their businesses
CREATE POLICY "Owners can view business inquiries"
ON inquiries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = inquiries.business_id
        AND businesses.owner_user_id = auth.uid()
    )
);

-- Users can create inquiries
CREATE POLICY "Users can create inquiries"
ON inquiries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Business owners can update inquiry status
CREATE POLICY "Owners can update inquiry status"
ON inquiries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = inquiries.business_id
        AND businesses.owner_user_id = auth.uid()
    )
);

-- ==========================================
-- REVIEWS
-- ==========================================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (is_approved = true);

-- Users can insert reviews
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Business owners can add responses to their reviews
CREATE POLICY "Owners can respond to reviews"
ON reviews FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = reviews.business_id
        AND businesses.owner_user_id = auth.uid()
    )
);

-- ==========================================
-- SOS REQUESTS
-- ==========================================

-- Users can view their own SOS requests
CREATE POLICY "Users can view own SOS"
ON sos_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create SOS requests
CREATE POLICY "Users can create SOS"
ON sos_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all SOS in their palika
CREATE POLICY "Admins can view palika SOS"
ON sos_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND admin_users.palika_id = sos_requests.palika_id
        AND admin_users.is_active = true
    )
);

-- Admins can update SOS status
CREATE POLICY "Admins can update SOS"
ON sos_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND admin_users.palika_id = sos_requests.palika_id
        AND admin_users.is_active = true
    )
);

-- ==========================================
-- FAVORITES
-- ==========================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

-- Users can create favorites
CREATE POLICY "Users can create favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Create storage buckets (done via Supabase dashboard or API)

/*
Buckets to create:
1. heritage-sites
2. events
3. businesses
4. profiles
5. audio-guides

Each bucket has policies similar to RLS
*/

-- Example storage policy (done in Supabase dashboard):
-- Bucket: businesses
-- Policy: Anyone can view verified business images
-- Policy: Business owners can upload to their folder

-- ==========================================
-- TEST SUITE: SQL-BASED E2E TESTS
-- ==========================================
-- NOTE: All test blocks are wrapped in transactions with ROLLBACK
-- to ensure test data doesn't persist in the database.
-- IMPORTANT: These tests are commented out by default to avoid errors
-- when running the schema setup. Uncomment individual test blocks to run them.

/*
-- ==========================================
-- TEST 1: Tourist Complete Journey
-- ==========================================

BEGIN TRANSACTION;

-- Setup test data
INSERT INTO provinces (id, name_en, name_ne, code) VALUES
    (1, 'Gandaki', 'गण्डकी', 'P4');

INSERT INTO districts (id, province_id, name_en, name_ne, code) VALUES
    (1, 1, 'Kaski', 'कास्की', 'D33');

INSERT INTO palikas (id, district_id, name_en, name_ne, type, code, center_point, total_wards) VALUES
    (1, 1, 'Pokhara Metropolitan', 'पोखरा', 'metropolitan', 'PKR-001', 
     ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)::geography, 33);

-- Create test user (tourist)
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-000000000001', 'tourist@test.com');

INSERT INTO profiles (id, phone, name, user_type, default_palika_id) VALUES
    ('00000000-0000-0000-0000-000000000001', '+977-9841111111', 'Sarah Mitchell', 
     'tourist_international', 1);

-- Create heritage site
INSERT INTO heritage_sites (
    id, palika_id, name_en, name_ne, slug, category, 
    location, status, short_description
) VALUES (
    '00000000-0000-0000-0000-000000000100',
    1, 'Bindabasini Temple', 'बिन्दबासिनी मन्दिर', 'bindabasini-temple', 'temple',
    ST_SetSRID(ST_MakePoint(85.2903, 27.7172), 4326)::geography,
    'published', 'Ancient Hindu temple'
);

-- TEST: Tourist views heritage site
INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, palika_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'page_view', 'heritage_site', 
     '00000000-0000-0000-0000-000000000100', 1);

-- Verify view count updated
UPDATE heritage_sites 
SET view_count = view_count + 1 
WHERE id = '00000000-0000-0000-0000-000000000100';

-- TEST: Tourist saves favorite
INSERT INTO favorites (user_id, entity_type, entity_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'heritage_site', 
     '00000000-0000-0000-0000-000000000100');

-- VERIFY: Check favorite saved
SELECT COUNT(*) AS favorite_count
FROM favorites
WHERE user_id = '00000000-0000-0000-0000-000000000001'
AND entity_type = 'heritage_site';
-- Expected: 1

-- TEST: Tourist submits review (for a business, not heritage site)
-- First create a business
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-000000000002', 'owner@test.com');

INSERT INTO profiles (id, phone, name, user_type, default_palika_id) VALUES
    ('00000000-0000-0000-0000-000000000002', '+977-9842222222', 'Devi Sharma', 
     'resident', 1);

INSERT INTO businesses (
    id, palika_id, owner_user_id, business_name, slug, business_type,
    phone, ward_number, address, location, description, verification_status
) VALUES (
    '00000000-0000-0000-0000-000000000200',
    1, '00000000-0000-0000-0000-000000000002', 'Mountain View Homestay', 
    'mountain-view-homestay', 'accommodation', '+977-9842222222', 8,
    'Near Temple', ST_SetSRID(ST_MakePoint(85.3250, 27.7180), 4326)::geography,
    'Family-run homestay', 'verified'
);

-- Tourist submits review
INSERT INTO reviews (business_id, user_id, rating, title, comment) VALUES
    ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001',
     5, 'Amazing place!', 'The hospitality was incredible. Highly recommend!');

-- VERIFY: Check review saved and rating updated
SELECT 
    business_name,
    rating_average,
    rating_count
FROM businesses
WHERE id = '00000000-0000-0000-0000-000000000200';
-- Expected: rating_average = 5.00, rating_count = 1

ROLLBACK; -- Clean up

-- ==========================================
-- TEST 2: SOS Emergency Flow
-- ==========================================

BEGIN TRANSACTION;

-- Setup
-- (Reuse setup from TEST 1)

-- Create admin user
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-000000000003', 'admin@test.com');

INSERT INTO admin_users (id, full_name, role, palika_id) VALUES
    ('00000000-0000-0000-0000-000000000003', 'Admin User', 'palika_admin', 1);

-- TEST: User sends SOS
INSERT INTO sos_requests (
    user_id, palika_id, emergency_type, location, 
    user_name, user_phone, details, ward_number
) VALUES (
    '00000000-0000-0000-0000-000000000001', 1, 'medical',
    ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)::geography,
    'Sarah Mitchell', '+977-9841111111', 'Motorcycle accident, leg injury', 5
);

-- VERIFY: SOS created with auto-generated code
SELECT 
    request_code,
    emergency_type,
    status,
    user_phone
FROM sos_requests
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: request_code starts with 'SOS-', status = 'received'

-- TEST: Admin assigns responder
UPDATE sos_requests
SET 
    status = 'assigned',
    assigned_to = '00000000-0000-0000-0000-000000000003',
    responder_name = 'Dr. Binod Thapa',
    responder_phone = '+977-9847654321',
    responder_eta_minutes = 5,
    status_updated_at = NOW(),
    timeline = jsonb_build_array(
        jsonb_build_object('status', 'received', 'timestamp', NOW()),
        jsonb_build_object('status', 'assigned', 'timestamp', NOW())
    )
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- VERIFY: Assignment successful
SELECT 
    status,
    responder_name,
    responder_phone
FROM sos_requests
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: status = 'assigned', responder_name = 'Dr. Binod Thapa'

-- TEST: Resolve SOS
UPDATE sos_requests
SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolution_notes = 'Patient stabilized',
    status_updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- TEST: User rates response
UPDATE sos_requests
SET 
    user_rating = 5,
    user_feedback = 'Very fast response!'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- VERIFY: Complete SOS record
SELECT 
    request_code,
    status,
    resolved_at IS NOT NULL AS was_resolved,
    user_rating,
    user_feedback
FROM sos_requests
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: status = 'resolved', was_resolved = true, user_rating = 5

ROLLBACK; -- Clean up

-- ==========================================
-- TEST 3: Business Registration & Inquiry
-- ==========================================

BEGIN TRANSACTION;

-- Setup (reuse from above)

-- TEST: Business owner registers business
INSERT INTO businesses (
    palika_id, owner_user_id, business_name, slug, business_type, sub_category,
    phone, email, ward_number, address, location, description, details, price_range
) VALUES (
    1, '00000000-0000-0000-0000-000000000002', 'Mountain View Homestay',
    'mountain-view-homestay', 'accommodation', 'homestay',
    '+977-9842222222', 'mountainview@example.com', 8, 'Near Temple',
    ST_SetSRID(ST_MakePoint(85.3250, 27.7180), 4326)::geography,
    'Family-run homestay offering authentic experience',
    '{"rooms": 3, "room_types": ["single", "double"], "amenities": ["wifi", "hot_water"]}'::jsonb,
    '{"min": 1500, "max": 2500, "currency": "NPR", "unit": "night"}'::jsonb
);

-- VERIFY: Business created with pending status
SELECT 
    business_name,
    verification_status,
    owner_user_id
FROM businesses
WHERE slug = 'mountain-view-homestay';
-- Expected: verification_status = 'pending'

-- TEST: Admin verifies business
UPDATE businesses
SET 
    verification_status = 'verified',
    verified_at = NOW(),
    verified_by = '00000000-0000-0000-0000-000000000003'
WHERE slug = 'mountain-view-homestay';

-- VERIFY: Business now verified
SELECT 
    business_name,
    verification_status,
    verified_at IS NOT NULL AS is_verified
FROM businesses
WHERE slug = 'mountain-view-homestay';
-- Expected: verification_status = 'verified', is_verified = true

-- TEST: Tourist sends inquiry
INSERT INTO inquiries (business_id, user_id, inquiry_data) VALUES (
    (SELECT id FROM businesses WHERE slug = 'mountain-view-homestay'),
    '00000000-0000-0000-0000-000000000001',
    '{"check_in": "2025-10-28", "check_out": "2025-10-30", "guests": 2, 
      "room_type": "double", "special_requests": "Vegetarian meals"}'::jsonb
);

-- VERIFY: Inquiry created with auto-generated code
SELECT 
    inquiry_code,
    status,
    inquiry_data->>'check_in' AS check_in,
    inquiry_data->>'guests' AS guests
FROM inquiries
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: inquiry_code starts with 'INQ-', status = 'new'

-- TEST: Business owner updates inquiry status
UPDATE inquiries
SET 
    status = 'contacted',
    status_updated_at = NOW(),
    internal_notes = 'Called customer, confirmed availability'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- VERIFY: Status updated
SELECT 
    inquiry_code,
    status,
    internal_notes
FROM inquiries
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: status = 'contacted'

-- VERIFY: Business inquiry count updated
UPDATE businesses
SET inquiry_count = inquiry_count + 1
WHERE slug = 'mountain-view-homestay';

SELECT 
    business_name,
    inquiry_count
FROM businesses
WHERE slug = 'mountain-view-homestay';
-- Expected: inquiry_count = 1

ROLLBACK; -- Clean up

-- ==========================================
-- TEST 4: Search & Discovery
-- ==========================================

BEGIN TRANSACTION;

-- Setup test data (multiple businesses)
-- (Code omitted for brevity - insert 10+ businesses with different types)

-- TEST: Search by location (nearby businesses)
SELECT 
    business_name,
    business_type,
    ward_number,
    ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)::geography
    ) / 1000 AS distance_km
FROM businesses
WHERE 
    verification_status = 'verified'
    AND is_active = true
    AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)::geography,
        10000 -- 10km radius
    )
ORDER BY distance_km
LIMIT 10;
-- Expected: Returns businesses within 10km, sorted by distance

-- TEST: Search by business type
SELECT 
    business_name,
    business_type,
    sub_category,
    rating_average
FROM businesses
WHERE 
    verification_status = 'verified'
    AND is_active = true
    AND business_type = 'accommodation'
ORDER BY rating_average DESC
LIMIT 10;
-- Expected: Returns accommodation businesses sorted by rating

-- TEST: Full-text search
SELECT 
    business_name,
    business_type,
    description
FROM businesses
WHERE 
    verification_status = 'verified'
    AND (
        business_name ILIKE '%homestay%'
        OR description ILIKE '%homestay%'
    )
LIMIT 10;
-- Expected: Returns businesses matching 'homestay'

ROLLBACK; -- Clean up

-- ==========================================
-- TEST 5: Analytics & Reporting
-- ==========================================

BEGIN TRANSACTION;

-- Setup (create multiple analytics events)
-- (Code omitted - insert various events)

-- TEST: Business performance report
SELECT 
    b.business_name,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'business_view' THEN ae.id END) AS total_views,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'contact_click' THEN ae.id END) AS contact_clicks,
    COUNT(DISTINCT i.id) AS total_inquiries,
    b.rating_average,
    b.rating_count
FROM businesses b
LEFT JOIN analytics_events ae ON ae.entity_id = b.id AND ae.entity_type = 'business'
LEFT JOIN inquiries i ON i.business_id = b.id
WHERE b.id = '00000000-0000-0000-0000-000000000200'
GROUP BY b.id, b.business_name, b.rating_average, b.rating_count;
-- Expected: Aggregated stats for the business

-- TEST: Palika-wide analytics
SELECT 
    p.name_en AS palika_name,
    COUNT(DISTINCT hs.id) AS total_heritage_sites,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT b.id) AS total_businesses,
    COUNT(DISTINCT CASE WHEN b.verification_status = 'verified' THEN b.id END) AS verified_businesses,
    COUNT(DISTINCT sos.id) AS total_sos_requests,
    COUNT(DISTINCT CASE WHEN sos.status = 'resolved' THEN sos.id END) AS resolved_sos
FROM palikas p
LEFT JOIN heritage_sites hs ON hs.palika_id = p.id
LEFT JOIN events e ON e.palika_id = p.id
LEFT JOIN businesses b ON b.palika_id = p.id
LEFT JOIN sos_requests sos ON sos.palika_id = p.id
WHERE p.id = 1
GROUP BY p.id, p.name_en;
-- Expected: Complete statistics for the Palika

ROLLBACK; -- Clean up

*/
-- End of test suite - uncomment individual test blocks above to run them