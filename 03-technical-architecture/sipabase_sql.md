
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
    
    -- Phone verification
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMPTZ,
    
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
    
    -- Additional fields
    role_id INTEGER REFERENCES roles(id),
    
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
    
    category_id INTEGER NOT NULL REFERENCES categories(id),
    site_type VARCHAR(100),
    heritage_status VARCHAR(100) CHECK (heritage_status IN ('world_heritage', 'national', 'provincial', 'local', 'proposed')),
    
    ward_number INTEGER CHECK (ward_number >= 1 AND ward_number <= 35),
    address TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    short_description TEXT,
    short_description_ne TEXT,
    full_description TEXT,
    full_description_ne TEXT,
    
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
    
    -- Additional fields
    is_featured BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    reviewer_feedback TEXT,
    rejected_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_heritage_palika ON heritage_sites(palika_id);
CREATE INDEX idx_heritage_location ON heritage_sites USING GIST(location);
CREATE INDEX idx_heritage_status ON heritage_sites(status);
CREATE INDEX idx_heritage_category ON heritage_sites(category_id);
CREATE INDEX idx_heritage_featured ON heritage_sites(is_featured);
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
    
    category_id INTEGER REFERENCES categories(id),
    event_type VARCHAR(50),
    is_festival BOOLEAN DEFAULT false,
    nepali_calendar_date VARCHAR(50),
    recurrence_pattern VARCHAR(50),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    location GEOGRAPHY(POINT, 4326),
    venue_name VARCHAR(200),
    
    short_description TEXT,
    short_description_ne TEXT,
    full_description TEXT,
    full_description_ne TEXT,
    
    featured_image TEXT,
    -- Images: [{"url": "https://...", "caption": "Event photo", "order": 1}, ...]
    images JSONB DEFAULT '[]',
    
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Additional fields
    scheduled_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_palika ON events(palika_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_festival ON events(is_festival);

-- ==========================================
-- BUSINESSES
-- ==========================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    business_name VARCHAR(300) NOT NULL,
    business_name_ne VARCHAR(300),
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    business_type_id INTEGER NOT NULL REFERENCES categories(id),
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
    
    -- Additional fields
    is_featured BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_palika ON businesses(palika_id);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX idx_businesses_verification ON businesses(verification_status);
CREATE INDEX idx_businesses_type_status ON businesses(business_type_id, verification_status, is_active);
CREATE INDEX idx_businesses_featured ON businesses(is_featured);
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
    
    -- Enhanced inquiry tracking
    inquiry_status VARCHAR(30) DEFAULT 'new' CHECK (inquiry_status IN ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_revenue NUMERIC(10,2),
    actual_revenue NUMERIC(10,2),
    
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
-- BLOG/NEWS SYSTEM
-- ==========================================

CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES admin_users(id),
    
    title_en VARCHAR(300) NOT NULL,
    title_ne VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    excerpt TEXT,
    excerpt_ne TEXT,
    content TEXT NOT NULL,
    content_ne TEXT,
    featured_image TEXT,
    
    category VARCHAR(100),
    tags TEXT[],
    
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    
    view_count INTEGER DEFAULT 0,
    
    -- Additional fields
    scheduled_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_palika ON blog_posts(palika_id);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_published ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_name_search ON blog_posts USING gin(to_tsvector('english', title_en));

-- ==========================================
-- CATEGORIES/TAXONOMY MANAGEMENT
-- ==========================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    palika_id INTEGER REFERENCES palikas(id),
    
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('heritage_site', 'event', 'business', 'blog_post')),
    name_en VARCHAR(100) NOT NULL,
    name_ne VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    
    parent_id INTEGER REFERENCES categories(id),
    
    description TEXT,
    description_ne TEXT,
    icon_url TEXT,
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(palika_id, entity_type, slug)
);

CREATE INDEX idx_categories_entity ON categories(entity_type, is_active);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ==========================================
-- NOTIFICATIONS SYSTEM
-- ==========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    palika_id INTEGER REFERENCES palikas(id),
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('emergency', 'event', 'tourism_update', 'business_announcement', 'system')),
    title VARCHAR(200) NOT NULL,
    title_ne VARCHAR(200),
    message TEXT NOT NULL,
    message_ne TEXT,
    
    entity_type VARCHAR(50),
    entity_id UUID,
    
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent ON notifications(sent_at DESC);

-- ==========================================
-- SUPPORT TICKETS SYSTEM
-- ==========================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(40) UNIQUE NOT NULL,
    
    palika_id INTEGER NOT NULL REFERENCES palikas(id),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES admin_users(id),
    
    subject VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_palika ON support_tickets(palika_id);
CREATE INDEX idx_support_status ON support_tickets(status);
CREATE INDEX idx_support_assigned ON support_tickets(assigned_to);

-- ==========================================
-- CONTENT MODERATION
-- ==========================================

CREATE TABLE content_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('heritage_site', 'event', 'business', 'blog_post')),
    content_id UUID NOT NULL,
    
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    reviewer_id UUID REFERENCES admin_users(id),
    
    reason TEXT,
    feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_content ON content_moderation(content_type, content_id);
CREATE INDEX idx_moderation_status ON content_moderation(status);

-- ==========================================
-- USER ROLES & PERMISSIONS
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    description_ne TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    description_ne TEXT,
    resource VARCHAR(50),
    action VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ==========================================
-- USER EVENTS (Junction Table)
-- ==========================================

CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    status VARCHAR(30) DEFAULT 'interested' CHECK (status IN ('interested', 'attending', 'attended', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_event ON user_events(event_id);

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
-- AUDIT TRAIL SYSTEM
-- ==========================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    table_name VARCHAR(50) NOT NULL,
    record_id TEXT NOT NULL,  -- Changed from UUID to TEXT to handle different ID types
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    
    user_id UUID REFERENCES auth.users(id),
    user_type VARCHAR(20) CHECK (user_type IN ('user', 'admin')),
    
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Enhance profiles with structured preferences
-- Update the default preferences to include notification settings
ALTER TABLE profiles ALTER COLUMN preferences SET DEFAULT '{
    "language": "en", 
    "notifications": {
        "emergency": true, 
        "events": true, 
        "tourism_updates": true, 
        "business_announcements": false
    }, 
    "quiet_hours": {
        "enabled": false, 
        "start": "22:00", 
        "end": "07:00"
    }, 
    "theme": "light",
    "offline_maps": false,
    "download_content": false
}';

-- ==========================================
-- ADDITIONAL TRIGGERS
-- ==========================================

-- Update blog_posts updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update support_tickets updated_at
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update content_moderation updated_at
CREATE TRIGGER update_content_moderation_updated_at BEFORE UPDATE ON content_moderation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update user_events updated_at
CREATE TRIGGER update_user_events_updated_at BEFORE UPDATE ON user_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate support ticket code automatically
CREATE OR REPLACE FUNCTION generate_support_ticket_code()
RETURNS TRIGGER AS $
BEGIN
    NEW.ticket_code = 'SUP-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER generate_support_ticket_code_trigger
BEFORE INSERT ON support_tickets
FOR EACH ROW EXECUTE FUNCTION generate_support_ticket_code();

-- Generate blog post slug automatically
CREATE TRIGGER generate_blog_slug_trigger
BEFORE INSERT ON blog_posts
FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- ==========================================
-- AUDIT TRAIL TRIGGERS
-- ==========================================

-- Function to log changes to audit_log table
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
    record_id TEXT;
BEGIN
    -- Determine old and new data based on operation
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSE -- UPDATE
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each(old_data) o
        JOIN jsonb_each(new_data) n ON o.key = n.key
        WHERE o.value IS DISTINCT FROM n.value;
    END IF;
    
    -- Get record ID (handle different primary key names)
    record_id = CASE 
        WHEN TG_TABLE_NAME IN ('roles', 'permissions', 'categories', 'provinces', 'districts', 'palikas') THEN
            COALESCE(NEW.id::TEXT, OLD.id::TEXT)
        WHEN TG_TABLE_NAME = 'role_permissions' THEN
            COALESCE(NEW.role_id::TEXT || '-' || NEW.permission_id::TEXT, OLD.role_id::TEXT || '-' || OLD.permission_id::TEXT)
        ELSE
            COALESCE(NEW.id::TEXT, OLD.id::TEXT)
    END;
    
    -- Insert audit record
    INSERT INTO audit_log (
        table_name, record_id, action, user_id, user_type,
        old_values, new_values, changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        record_id,
        TG_OP,
        auth.uid(),
        CASE 
            WHEN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN 'admin'
            ELSE 'user'
        END,
        old_data,
        new_data,
        changed_fields
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Add audit triggers to main content tables
CREATE TRIGGER audit_heritage_sites_trigger
AFTER INSERT OR UPDATE OR DELETE ON heritage_sites
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_businesses_trigger
AFTER INSERT OR UPDATE OR DELETE ON businesses
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_blog_posts_trigger
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_sos_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON sos_requests
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Add audit triggers to user management tables
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_admin_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON admin_users
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Add audit triggers to engagement tables
CREATE TRIGGER audit_reviews_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_inquiries_trigger
AFTER INSERT OR UPDATE OR DELETE ON inquiries
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Add audit triggers to operational tables
CREATE TRIGGER audit_support_tickets_trigger
AFTER INSERT OR UPDATE OR DELETE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_content_moderation_trigger
AFTER INSERT OR UPDATE OR DELETE ON content_moderation
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_notifications_trigger
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Add audit triggers to configuration tables
CREATE TRIGGER audit_categories_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_permissions_trigger
AFTER INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_role_permissions_trigger
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Add audit triggers to user activity tables
CREATE TRIGGER audit_user_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_events
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ==========================================
-- OTP SYSTEM TRIGGERS
-- ==========================================

-- Function to generate OTP code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TRIGGER AS $
BEGIN
    -- Generate 6-digit OTP
    NEW.otp_code = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Set expiry (5 minutes from now)
    NEW.expires_at = NOW() + INTERVAL '5 minutes';
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER generate_otp_code_trigger
BEFORE INSERT ON otp_verifications
FOR EACH ROW EXECUTE FUNCTION generate_otp_code();

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $
BEGIN
    DELETE FROM otp_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$ LANGUAGE plpgsql;

-- Function to update phone verification status
CREATE OR REPLACE FUNCTION update_phone_verification()
RETURNS TRIGGER AS $
BEGIN
    -- When OTP is verified for registration/login, mark phone as verified
    IF NEW.is_verified = true AND OLD.is_verified = false AND NEW.purpose IN ('registration', 'login') THEN
        UPDATE profiles 
        SET phone_verified = true, phone_verified_at = NOW()
        WHERE phone = NEW.phone;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_phone_verification_trigger
AFTER UPDATE ON otp_verifications
FOR EACH ROW EXECUTE FUNCTION update_phone_verification();

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
-- ROW LEVEL SECURITY POLICIES FOR NEW TABLES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- OTP VERIFICATION POLICIES
-- ==========================================

-- No SELECT policy - OTPs should not be readable by users for security
-- Only the backend service can create and verify OTPs

-- System can create OTP records (no user access)
-- System can verify OTP records (no user access)
-- This prevents users from reading OTP codes

-- ==========================================
-- BLOG POSTS POLICIES
-- ==========================================

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Admins can manage blog posts
CREATE POLICY "Admins can manage blog posts"
ON blog_posts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- CATEGORIES POLICIES
-- ==========================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notification status
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
ON notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- SUPPORT TICKETS POLICIES
-- ==========================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view tickets in their palika
CREATE POLICY "Admins can view palika tickets"
ON support_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND admin_users.palika_id = support_tickets.palika_id
        AND admin_users.is_active = true
    )
);

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
ON support_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND admin_users.palika_id = support_tickets.palika_id
        AND admin_users.is_active = true
    )
);

-- ==========================================
-- CONTENT MODERATION POLICIES
-- ==========================================

-- Only admins can access moderation
CREATE POLICY "Admins can manage moderation"
ON content_moderation FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- USER EVENTS POLICIES
-- ==========================================

-- Users can view their own event registrations
CREATE POLICY "Users can view own events"
ON user_events FOR SELECT
USING (auth.uid() = user_id);

-- Users can register for events
CREATE POLICY "Users can register for events"
ON user_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own event status
CREATE POLICY "Users can update own events"
ON user_events FOR UPDATE
USING (auth.uid() = user_id);

-- Users can cancel their event registration
CREATE POLICY "Users can cancel events"
ON user_events FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- AUDIT LOG POLICIES
-- ==========================================

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users a
        JOIN roles r ON a.role_id = r.id
        WHERE a.id = auth.uid()
        AND r.name = 'super_admin'
        AND a.is_active = true
    )
);

-- System can insert audit records (no user policy needed for INSERT)

-- ==========================================
-- USER DEVICES POLICIES
-- ==========================================

-- Users can view their own devices
CREATE POLICY "Users can view own devices"
ON user_devices FOR SELECT
USING (auth.uid() = user_id);

-- Users can register their devices
CREATE POLICY "Users can register devices"
ON user_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices"
ON user_devices FOR UPDATE
USING (auth.uid() = user_id);

-- ==========================================
-- SEARCH HISTORY POLICIES
-- ==========================================

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
ON search_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can create search history
CREATE POLICY "Users can create search history"
ON search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view aggregated search data
CREATE POLICY "Admins can view search analytics"
ON search_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- USER DOWNLOADS POLICIES
-- ==========================================

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads"
ON user_downloads FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their downloads
CREATE POLICY "Users can manage downloads"
ON user_downloads FOR ALL
USING (auth.uid() = user_id);

-- ==========================================
-- QR CODES POLICIES
-- ==========================================

-- Anyone can view active QR codes
CREATE POLICY "Anyone can view QR codes"
ON qr_codes FOR SELECT
USING (is_active = true);

-- Admins can manage QR codes
CREATE POLICY "Admins can manage QR codes"
ON qr_codes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_active = true
    )
);

-- ==========================================
-- TRIGGERS (Automatic Updates)
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
-- OTP VERIFICATION SYSTEM
-- ==========================================

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    phone VARCHAR(40) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('registration', 'login', 'password_reset', 'phone_change')),
    
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    expires_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent multiple active OTPs for same phone/purpose
    UNIQUE(phone, purpose, is_verified) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_otp_phone ON otp_verifications(phone);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX idx_otp_purpose ON otp_verifications(purpose, is_verified);

-- ==========================================
-- PHONE VERIFICATION TRACKING
-- ==========================================

-- ==========================================
-- DEVICE & SESSION MANAGEMENT
-- ==========================================

CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(200),
    device_type VARCHAR(50) CHECK (device_type IN ('android', 'ios', 'web')),
    
    fcm_token TEXT,
    
    app_version VARCHAR(20),
    os_version VARCHAR(50),
    
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_active ON user_devices(is_active, last_active_at);

-- ==========================================
-- SEARCH HISTORY & ANALYTICS
-- ==========================================

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    palika_id INTEGER REFERENCES palikas(id),
    
    query TEXT NOT NULL,
    search_type VARCHAR(50),
    filters JSONB DEFAULT '{}',
    
    results_count INTEGER DEFAULT 0,
    clicked_result_id UUID,
    clicked_result_type VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_query ON search_history(query);
CREATE INDEX idx_search_history_created ON search_history(created_at DESC);

-- ==========================================
-- OFFLINE CONTENT TRACKING
-- ==========================================

CREATE TABLE user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('heritage_site', 'event', 'business', 'blog_post', 'map_area')),
    content_id UUID,
    
    download_size_mb NUMERIC(8,2),
    download_status VARCHAR(20) DEFAULT 'completed' CHECK (download_status IN ('downloading', 'completed', 'failed', 'deleted')),
    
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    
    UNIQUE(user_id, device_id, content_type, content_id)
);

CREATE INDEX idx_user_downloads_user_device ON user_downloads(user_id, device_id);
CREATE INDEX idx_user_downloads_content ON user_downloads(content_type, content_id);

-- ==========================================
-- APP VERSION MANAGEMENT
-- ==========================================

CREATE TABLE app_versions (
    id SERIAL PRIMARY KEY,
    
    version_name VARCHAR(20) NOT NULL,
    version_code INTEGER NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios')),
    
    is_required BOOLEAN DEFAULT false,
    is_latest BOOLEAN DEFAULT false,
    
    release_notes TEXT,
    download_url TEXT,
    
    min_supported_version INTEGER,
    
    released_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(platform, version_code)
);

CREATE INDEX idx_app_versions_platform ON app_versions(platform, is_latest);

-- ==========================================
-- QR CODE MANAGEMENT
-- ==========================================

CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('heritage_site', 'event', 'business')),
    entity_id UUID NOT NULL,
    
    qr_code_data TEXT NOT NULL,
    qr_code_url TEXT NOT NULL,
    
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_qr_codes_entity ON qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_active ON qr_codes(is_active);

-- ==========================================
-- INITIAL DATA SETUP
-- ==========================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('super_admin', 'Full system access across all palikas'),
    ('palika_admin', 'Full access within assigned palika'),
    ('content_editor', 'Can create and edit content'),
    ('content_reviewer', 'Can review and approve content'),
    ('support_agent', 'Can handle support tickets'),
    ('moderator', 'Can moderate content and users');

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('manage_heritage_sites', 'Create, edit, delete heritage sites', 'heritage_site', 'manage'),
    ('manage_events', 'Create, edit, delete events', 'event', 'manage'),
    ('manage_businesses', 'Verify, edit, delete businesses', 'business', 'manage'),
    ('manage_blog_posts', 'Create, edit, delete blog posts', 'blog_post', 'manage'),
    ('manage_users', 'Create, edit, delete user accounts', 'user', 'manage'),
    ('manage_admins', 'Create, edit, delete admin accounts', 'admin', 'manage'),
    ('manage_sos', 'Handle SOS requests and responses', 'sos_request', 'manage'),
    ('manage_support', 'Handle support tickets', 'support_ticket', 'manage'),
    ('moderate_content', 'Review and approve content', 'content', 'moderate'),
    ('view_analytics', 'Access analytics and reports', 'analytics', 'view'),
    ('manage_categories', 'Create and manage content categories', 'category', 'manage'),
    ('send_notifications', 'Send notifications to users', 'notification', 'send');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'; -- Super admin gets all permissions

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'palika_admin'
AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_businesses', 
    'manage_blog_posts', 'manage_sos', 'manage_support', 
    'moderate_content', 'view_analytics', 'manage_categories', 
    'send_notifications'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content_editor'
AND p.name IN ('manage_heritage_sites', 'manage_events', 'manage_blog_posts');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content_reviewer'
AND p.name IN ('moderate_content', 'view_analytics');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'support_agent'
AND p.name IN ('manage_support', 'manage_sos');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'moderator'
AND p.name IN ('moderate_content', 'manage_businesses');

-- Insert default categories for different entity types
INSERT INTO categories (palika_id, entity_type, name_en, name_ne, slug, display_order) VALUES
    -- Heritage site categories
    (NULL, 'heritage_site', 'Temple', 'मन्दिर', 'temple', 1),
    (NULL, 'heritage_site', 'Monastery', 'गुम्बा', 'monastery', 2),
    (NULL, 'heritage_site', 'Palace', 'दरबार', 'palace', 3),
    (NULL, 'heritage_site', 'Fort', 'किल्ला', 'fort', 4),
    (NULL, 'heritage_site', 'Museum', 'संग्रहालय', 'museum', 5),
    (NULL, 'heritage_site', 'Archaeological Site', 'पुरातत्व स्थल', 'archaeological', 6),
    (NULL, 'heritage_site', 'Natural Heritage', 'प्राकृतिक सम्पदा', 'natural', 7),
    
    -- Event categories
    (NULL, 'event', 'Festival', 'चाड पर्व', 'festival', 1),
    (NULL, 'event', 'Cultural', 'सांस्कृतिक', 'cultural', 2),
    (NULL, 'event', 'Sports', 'खेलकुद', 'sports', 3),
    (NULL, 'event', 'Religious', 'धार्मिक', 'religious', 4),
    (NULL, 'event', 'Food', 'खाना', 'food', 5),
    (NULL, 'event', 'Music', 'संगीत', 'music', 6),
    (NULL, 'event', 'Educational', 'शैक्षिक', 'educational', 7),
    
    -- Business categories
    (NULL, 'business', 'Accommodation', 'बास स्थान', 'accommodation', 1),
    (NULL, 'business', 'Restaurant', 'रेस्टुरेन्ट', 'restaurant', 2),
    (NULL, 'business', 'Tour Operator', 'भ्रमण संचालक', 'tour-operator', 3),
    (NULL, 'business', 'Transport', 'यातायात', 'transport', 4),
    (NULL, 'business', 'Shopping', 'किनमेल', 'shopping', 5),
    (NULL, 'business', 'Entertainment', 'मनोरञ्जन', 'entertainment', 6),
    (NULL, 'business', 'Emergency Services', 'आपतकालीन सेवा', 'emergency', 7),
    (NULL, 'business', 'Government Office', 'सरकारी कार्यालय', 'government', 8),
    
    -- Blog post categories
    (NULL, 'blog_post', 'Tourism News', 'पर्यटन समाचार', 'tourism-news', 1),
    (NULL, 'blog_post', 'Cultural Stories', 'सांस्कृतिक कथा', 'cultural-stories', 2),
    (NULL, 'blog_post', 'Local Events', 'स्थानीय कार्यक्रम', 'local-events', 3),
    (NULL, 'blog_post', 'Heritage Updates', 'सम्पदा अपडेट', 'heritage-updates', 4),
    (NULL, 'blog_post', 'Community News', 'समुदायिक समाचार', 'community-news', 5);

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