-- ==========================================
-- MIGRATION: Create Basic Tables
-- ==========================================
-- Schema only - no data seeding
-- Data seeding is handled by TypeScript scripts

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
    type VARCHAR(50) NOT NULL CHECK (type IN ('municipality', 'metropolitan', 'sub_metropolitan', 'rural_municipality')),
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

-- ROLES
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

-- CATEGORIES
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
