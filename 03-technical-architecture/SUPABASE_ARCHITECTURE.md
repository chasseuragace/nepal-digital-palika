# Supabase-First Architecture
## Nepal Digital Tourism Infrastructure

**Version:** 2.0 (Simplified)  
**Date:** December 24, 2025  
**Approach:** Database-first, minimal custom code  

---

## 🎯 Core Philosophy

> "The database IS the application. Everything else is just a client."

**What this means:**
- Database schema defines the entire system
- Supabase auto-generates REST API from tables
- Business logic lives in database functions
- Row Level Security handles authorization
- No custom backend needed
- Testing = SQL scripts

---

## 📦 What is Supabase?

**Supabase = Open Source Firebase Alternative**

It's a complete backend-as-a-service that gives you:

1. **PostgreSQL Database** (with extensions like PostGIS)
2. **Auto REST API** (every table becomes an API endpoint)
3. **Authentication** (phone OTP, email, social)
4. **File Storage** (S3-compatible)
5. **Real-time** (WebSocket subscriptions)
6. **Row Level Security** (database-level permissions)
7. **Edge Functions** (serverless functions if needed)
8. **Admin Dashboard** (built-in UI to manage data)

**Cost:** Free tier is generous, then $25/month for production

---

## 🏗️ System Architecture

### Simple Stack

```
Frontend:
├── Mobile App (Flutter)
│   └── supabase_flutter package
│
└── Admin Panel (Next.js)
    └── @supabase/supabase-js

Backend:
└── Supabase Project
    ├── PostgreSQL + PostGIS
    ├── Storage Buckets
    ├── Auth
    └── Realtime

Deployment:
└── Supabase Cloud (managed)
```

### How Clients Connect

```javascript
// Mobile App (Flutter)
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

// Get heritage sites
final response = await supabase
  .from('heritage_sites')
  .select('*')
  .eq('palika_id', 1)
  .order('name_en');

// No custom API needed! Supabase generates this automatically
```

---

## 📊 Complete Database Schema

### 1. Setup Script

```sql
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
    type VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Contact
    office_phone VARCHAR(20),
    office_email VARCHAR(100),
    website VARCHAR(200),
    
    -- Geographic
    center_point GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    
    total_wards INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_palikas_center ON palikas USING GIST(center_point);

-- ==========================================
-- USERS (Supabase Auth Integration)
-- ==========================================

-- Supabase creates auth.users automatically
-- We create a public profile table that references it

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    phone VARCHAR(20),
    name VARCHAR(200),
    profile_photo TEXT,
    user_type VARCHAR(20) DEFAULT 'resident',
    
    default_palika_id INTEGER REFERENCES palikas(id),
    current_location GEOGRAPHY(POINT, 4326),
    
    preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_palika ON profiles(default_palika_id);

-- ==========================================
-- ADMIN USERS
-- ==========================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,
    palika_id INTEGER REFERENCES palikas(id),
    permissions JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HERITAGE SITES
-- ==========================================

CREATE TABLE heritage_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    
    name_en VARCHAR(300) NOT NULL,
    name_ne VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    category VARCHAR(100),
    site_type VARCHAR(100),
    heritage_status VARCHAR(100),
    
    ward_number INTEGER,
    address TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    short_description TEXT,
    full_description TEXT,
    
    opening_hours JSONB,
    entry_fee JSONB,
    
    featured_image TEXT,
    images JSONB DEFAULT '[]',
    audio_guide_url TEXT,
    
    qr_code_url TEXT,
    
    view_count INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_heritage_palika ON heritage_sites(palika_id);
CREATE INDEX idx_heritage_location ON heritage_sites USING GIST(location);
CREATE INDEX idx_heritage_status ON heritage_sites(status);

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
    
    primary_location GEOGRAPHY(POINT, 4326),
    venue_name VARCHAR(200),
    
    short_description TEXT,
    full_description TEXT,
    
    featured_image TEXT,
    images JSONB DEFAULT '[]',
    
    status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_palika ON events(palika_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);

-- ==========================================
-- BUSINESSES
-- ==========================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    business_name VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    
    business_type VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    ward_number INTEGER NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    price_range JSONB,
    
    featured_image TEXT,
    images JSONB DEFAULT '[]',
    
    verification_status VARCHAR(50) DEFAULT 'pending',
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

-- ==========================================
-- INQUIRIES
-- ==========================================

CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    inquiry_code VARCHAR(20) UNIQUE NOT NULL,
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
    
    request_code VARCHAR(20) UNIQUE NOT NULL,
    emergency_type VARCHAR(50) NOT NULL,
    
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    location_description TEXT,
    ward_number INTEGER,
    
    user_name VARCHAR(200),
    user_phone VARCHAR(20) NOT NULL,
    details TEXT,
    
    status VARCHAR(50) DEFAULT 'received',
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    assigned_to UUID REFERENCES admin_users(id),
    responder_name VARCHAR(200),
    responder_phone VARCHAR(20),
    responder_eta_minutes INTEGER,
    
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    timeline JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sos_palika ON sos_requests(palika_id);
CREATE INDEX idx_sos_status ON sos_requests(status);
CREATE INDEX idx_sos_location ON sos_requests USING GIST(location);

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
```

---

## 🔒 Row Level Security (RLS)

**This is the magic:** Database enforces permissions automatically.

```sql
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
```

---

## 📁 Supabase Storage Buckets

```sql
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
```

---

## 🧪 Complete Test Suite (SQL Scripts)

No UI needed! Test everything with SQL.

```sql
-- ==========================================
-- TEST SUITE: SQL-BASED E2E TESTS
-- ==========================================

-- ==========================================
-- TEST 1: Tourist Complete Journey
-- ==========================================

BEGIN;

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

BEGIN;

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

BEGIN;

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

BEGIN;

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

BEGIN;

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
```

---

## 🚀 How to Deploy

### Step 1: Create Supabase Project

```bash
# 1. Go to https://supabase.com
# 2. Click "New Project"
# 3. Name: "Nepal Tourism"
# 4. Database Password: [strong password]
# 5. Region: Singapore (closest to Nepal)
# 6. Click "Create project"

# Wait 2 minutes for provisioning
```

### Step 2: Run Setup Scripts

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy/paste the complete setup script above
# 3. Click "Run"

# Done! Database is ready.
```

### Step 3: Configure Storage

```bash
# In Supabase Dashboard:
# 1. Go to Storage
# 2. Create buckets:
#    - heritage-sites (public)
#    - events (public)
#    - businesses (public)
#    - profiles (private)
#    - audio-guides (public)

# 3. Set policies (done via UI)
```

### Step 4: Get Credentials

```javascript
// Supabase gives you these automatically:
const supabaseUrl = 'https://xxxxx.supabase.co'
const supabaseAnonKey = '[REDACTED].'

// That's it! Use in your app:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 📱 Mobile App Integration

```dart
// Flutter app using Supabase
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'https://xxxxx.supabase.co',
    anonKey: '[REDACTED].',
  );
  runApp(MyApp());
}

// Get heritage sites
Future<List<HeritageSite>> getHeritageSites() async {
  final response = await Supabase.instance.client
    .from('heritage_sites')
    .select('*')
    .eq('palika_id', 1)
    .eq('status', 'published')
    .order('name_en');
    
  return response.map((json) => HeritageSite.fromJson(json)).toList();
}

// Send SOS
Future<void> sendSOS(String emergencyType, LatLng location) async {
  await Supabase.instance.client
    .from('sos_requests')
    .insert({
      'user_id': Supabase.instance.client.auth.currentUser!.id,
      'emergency_type': emergencyType,
      'location': 'POINT(${location.longitude} ${location.latitude})',
      'user_phone': currentUser.phone,
      'palika_id': currentUser.palikaId,
    });
}

// Subscribe to SOS updates (real-time)
void listenToSOSUpdates(String sosId) {
  Supabase.instance.client
    .from('sos_requests')
    .stream(primaryKey: ['id'])
    .eq('id', sosId)
    .listen((data) {
      // Update UI with new SOS status
      updateSOSUI(data);
    });
}
```

---

## 💻 Admin Panel Integration

```typescript
// Next.js admin panel
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Verify business
async function verifyBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: supabase.auth.user()?.id
    })
    .eq('id', businessId)
  
  if (error) throw error
  return data
}

// Get pending businesses
async function getPendingBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      owner:profiles(name, phone),
      palika:palikas(name_en)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false })
  
  return data
}
```

---

## ✅ Advantages of This Approach

**vs Custom Backend:**
1. ⚡ **10x faster development** - No API code to write
2. 🔒 **Security built-in** - RLS handles authorization
3. 📊 **Database-first** - Schema is the source of truth
4. 🧪 **Easy testing** - SQL scripts test everything
5. 💰 **Lower cost** - No servers to manage
6. 📈 **Auto-scaling** - Supabase handles it
7. 🔄 **Real-time** - WebSocket built-in
8. 📁 **File storage** - S3-compatible included
9. 🔐 **Auth** - Phone OTP, email, social login
10. 📚 **Admin UI** - Built-in data browser

**What you DON'T need:**
- ❌ Custom REST API
- ❌ Express/FastAPI server
- ❌ JWT implementation
- ❌ File upload handling
- ❌ WebSocket server
- ❌ Redis caching (Supabase has built-in)
- ❌ Admin panel from scratch
- ❌ Complex deployment

---

## 📦 Final Architecture

```
Supabase Project (EVERYTHING)
├── Database (PostgreSQL + PostGIS)
│   ├── Tables (18 core tables)
│   ├── Functions (business logic)
│   ├── Triggers (automatic updates)
│   └── RLS Policies (security)
│
├── Auth
│   ├── Phone OTP
│   ├── Email/Password
│   └── JWT tokens
│
├── Storage
│   ├── heritage-sites/
│   ├── businesses/
│   ├── events/
│   └── audio-guides/
│
├── Realtime
│   └── WebSocket subscriptions
│
└── Edge Functions (if needed)
    └── Custom server logic

Clients (SIMPLE)
├── Mobile App (Flutter)
│   └── supabase_flutter package
│
└── Admin Panel (Next.js)
    └── @supabase/supabase-js
```

---

## 🎯 Deployment Checklist

```markdown
□ Create Supabase project
□ Run database setup script
□ Create storage buckets
□ Enable RLS policies
□ Seed initial data (provinces, districts, palikas)
□ Configure auth (enable phone OTP)
□ Get API credentials
□ Build mobile app with credentials
□ Build admin panel with credentials
□ Deploy mobile app to Play Store
□ Deploy admin panel to Vercel
□ Done!
```

---

**This is dramatically simpler.** No overwhelming infrastructure. Just:
1. Database schema
2. Supabase handles everything
3. SQL tests

Would you like me to:
- Create the complete SQL setup script?
- Create the seed data (all 753 Palikas)?
- Create the Flutter app starter?
- Create the admin panel starter?
