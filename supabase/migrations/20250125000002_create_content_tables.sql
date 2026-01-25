-- ==========================================
-- MIGRATION: Create Content Tables
-- ==========================================
-- Schema only - no data seeding
-- Data seeding is handled by TypeScript scripts

-- PROFILES (User accounts)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(40),
    name VARCHAR(200),
    profile_photo TEXT,
    user_type VARCHAR(40) DEFAULT 'resident' CHECK (user_type IN ('resident', 'tourist_domestic', 'tourist_international', 'business_owner', 'admin')),
    default_palika_id INTEGER REFERENCES palikas(id),
    current_location GEOGRAPHY(POINT, 4326),
    preferences JSONB DEFAULT '{"language": "en", "notifications": {"emergency": true, "events": true, "tourism_updates": true, "business_announcements": false}, "quiet_hours": {"enabled": false, "start": "22:00", "end": "07:00"}, "theme": "light", "offline_maps": false, "download_content": false}',
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'palika_admin', 'moderator', 'support')),
    palika_id INTEGER REFERENCES palikas(id),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HERITAGE SITES
CREATE TABLE IF NOT EXISTS heritage_sites (
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
    opening_hours JSONB DEFAULT '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
    entry_fee JSONB DEFAULT '{"local_adult": 0, "local_child": 0, "foreign_adult": 0, "foreign_child": 0, "currency": "NPR"}',
    featured_image TEXT,
    images JSONB DEFAULT '[]',
    audio_guide_url TEXT,
    languages_available TEXT[] DEFAULT '{"en", "ne"}',
    accessibility_info JSONB DEFAULT '{"wheelchair_accessible": false, "parking": false, "restrooms": false, "guide_available": false}',
    best_time_to_visit VARCHAR(100),
    average_visit_duration_minutes INTEGER CHECK (average_visit_duration_minutes > 0),
    qr_code_url TEXT,
    view_count INTEGER DEFAULT 0,
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
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

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
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
    images JSONB DEFAULT '[]',
    status VARCHAR(40) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    scheduled_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUSINESSES
CREATE TABLE IF NOT EXISTS businesses (
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
    details JSONB DEFAULT '{}',
    price_range JSONB DEFAULT '{"min": 0, "max": 0, "currency": "NPR", "unit": "per_item"}',
    operating_hours JSONB DEFAULT '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
    is_24_7 BOOLEAN DEFAULT false,
    languages_spoken TEXT[] DEFAULT '{"en", "ne"}',
    facilities JSONB DEFAULT '{"parking": false, "wifi": false, "restaurant": false, "guide_service": false}',
    featured_image TEXT,
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
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
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
    scheduled_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INQUIRIES
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    inquiry_code VARCHAR(40) UNIQUE NOT NULL,
    inquiry_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    inquiry_status VARCHAR(30) DEFAULT 'new' CHECK (inquiry_status IN ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_revenue NUMERIC(10,2),
    actual_revenue NUMERIC(10,2),
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
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

-- SOS REQUESTS
CREATE TABLE IF NOT EXISTS sos_requests (
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
    timeline JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_heritage_palika ON heritage_sites(palika_id);
CREATE INDEX IF NOT EXISTS idx_heritage_location ON heritage_sites USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_heritage_status ON heritage_sites(status);
CREATE INDEX IF NOT EXISTS idx_heritage_category ON heritage_sites(category_id);

CREATE INDEX IF NOT EXISTS idx_events_palika ON events(palika_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_businesses_palika ON businesses(palika_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_businesses_verification ON businesses(verification_status);

CREATE INDEX IF NOT EXISTS idx_blog_palika ON blog_posts(palika_id);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);

CREATE INDEX IF NOT EXISTS idx_inquiries_business ON inquiries(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_sos_palika ON sos_requests(palika_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
