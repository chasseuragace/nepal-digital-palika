-- ==========================================
-- PART 1: BASIC TABLES (No dependencies)
-- ==========================================
-- Run this FIRST in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- PROVINCES
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ne VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISTRICTS
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    province_id INTEGER REFERENCES provinces(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_ne VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PALIKAS
CREATE TABLE IF NOT EXISTS palikas (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    name_en VARCHAR(200) NOT NULL,
    name_ne VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('municipality', 'metropolitan', 'sub_metropolitan')),
    code VARCHAR(40) UNIQUE NOT NULL,
    office_phone VARCHAR(40),
    office_email VARCHAR(100),
    website VARCHAR(200),
    center_point GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    total_wards INTEGER DEFAULT 0 CHECK (total_wards >= 0),
    settings JSONB DEFAULT '{"logo_url": null, "theme_color": "#1a73e8", "contact_email": null, "languages": ["en", "ne"]}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROLES (Create before admin_users)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    description_ne TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    description_ne TEXT,
    resource VARCHAR(50),
    action VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES (Create before content tables)
CREATE TABLE IF NOT EXISTS categories (
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

-- APP VERSIONS
CREATE TABLE IF NOT EXISTS app_versions (
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

-- ROLE PERMISSIONS (junction table)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Insert initial data
INSERT INTO roles (name, description) VALUES
    ('super_admin', 'Full system access across all palikas'),
    ('palika_admin', 'Full access within assigned palika'),
    ('content_editor', 'Can create and edit content'),
    ('content_reviewer', 'Can review and approve content'),
    ('support_agent', 'Can handle support tickets'),
    ('moderator', 'Can moderate content and users')
ON CONFLICT (name) DO NOTHING;

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
    ('send_notifications', 'Send notifications to users', 'notification', 'send')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (palika_id, entity_type, name_en, name_ne, slug, display_order) VALUES
    -- Heritage site categories
    (NULL, 'heritage_site', 'Temple', 'मन्दिर', 'temple', 1),
    (NULL, 'heritage_site', 'Monastery', 'गुम्बा', 'monastery', 2),
    (NULL, 'heritage_site', 'Palace', 'दरबार', 'palace', 3),
    (NULL, 'heritage_site', 'Museum', 'संग्रहालय', 'museum', 4),
    -- Event categories  
    (NULL, 'event', 'Festival', 'चाड पर्व', 'festival', 1),
    (NULL, 'event', 'Cultural', 'सांस्कृतिक', 'cultural', 2),
    (NULL, 'event', 'Religious', 'धार्मिक', 'religious', 3),
    -- Business categories
    (NULL, 'business', 'Accommodation', 'बास स्थान', 'accommodation', 1),
    (NULL, 'business', 'Restaurant', 'रेस्टुरेन्ट', 'restaurant', 2),
    (NULL, 'business', 'Tour Operator', 'भ्रमण संचालक', 'tour-operator', 3),
    -- Blog categories
    (NULL, 'blog_post', 'Tourism News', 'पर्यटन समाचार', 'tourism-news', 1),
    (NULL, 'blog_post', 'Cultural Stories', 'सांस्कृतिक कथा', 'cultural-stories', 2)
ON CONFLICT (palika_id, entity_type, slug) DO NOTHING;

INSERT INTO app_versions (version_name, version_code, platform, is_latest, release_notes) VALUES
    ('1.0.0', 1, 'android', true, 'Initial release'),
    ('1.0.0', 1, 'ios', true, 'Initial release')
ON CONFLICT (platform, version_code) DO NOTHING;