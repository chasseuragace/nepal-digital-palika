# Phase 7: Supabase Table Schemas

**Date:** 2026-03-29
**Purpose:** Reference guide for existing Supabase tables used in Phase 7
**Source:** `supabase/migrations/20250125000002_create_content_tables.sql`

---

## 📋 HERITAGE_SITES TABLE

```sql
CREATE TABLE heritage_sites (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id                   INTEGER NOT NULL REFERENCES palikas(id),

    -- Identity
    name_en                     VARCHAR(300) NOT NULL,
    name_ne                     VARCHAR(300) NOT NULL,
    slug                        VARCHAR(300) UNIQUE NOT NULL,

    -- Classification
    category_id                 INTEGER NOT NULL REFERENCES categories(id),
    site_type                   VARCHAR(100),
    heritage_status             VARCHAR(100) CHECK (...IN 'world_heritage','national','provincial','local','proposed'),

    -- Location
    ward_number                 INTEGER CHECK (1-35),
    address                     TEXT,
    location                    GEOGRAPHY(POINT, 4326),

    -- Content
    short_description          TEXT,
    short_description_ne       TEXT,
    full_description           TEXT,
    full_description_ne        TEXT,
    featured_image             TEXT,
    images                     JSONB DEFAULT '[]',
    audio_guide_url            TEXT,

    -- Visitor Information
    opening_hours              JSONB DEFAULT '{"monday":"09:00-17:00", ...}',
    entry_fee                  JSONB DEFAULT '{"local_adult":0, ...}',
    languages_available        TEXT[] DEFAULT '{"en","ne"}',
    accessibility_info         JSONB DEFAULT '{"wheelchair_accessible":false, ...}',
    best_time_to_visit         VARCHAR(100),
    average_visit_duration_minutes INTEGER,

    -- Media
    qr_code_url                TEXT,

    -- Engagement
    view_count                 INTEGER DEFAULT 0,

    -- Status & Approval
    status                     VARCHAR(40) DEFAULT 'draft'
                              CHECK (status IN 'draft','published','archived'),
    published_at               TIMESTAMPTZ,
    is_featured                BOOLEAN DEFAULT false,
    rejection_reason           TEXT,
    reviewer_feedback          TEXT,
    rejected_at                TIMESTAMPTZ,
    scheduled_at               TIMESTAMPTZ,

    -- Audit
    created_by                 UUID REFERENCES auth.users(id),
    updated_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_heritage_palika ON heritage_sites(palika_id);
CREATE INDEX idx_heritage_location ON heritage_sites USING GIST(location);
CREATE INDEX idx_heritage_status ON heritage_sites(status);
CREATE INDEX idx_heritage_category ON heritage_sites(category_id);
```

### Query Pattern for M-Place

```typescript
// Fetch published heritage sites for a palika
const { data, error } = await supabase
  .from('heritage_sites')
  .select(`
    id,
    name_en,
    name_ne,
    slug,
    short_description,
    featured_image,
    location,
    palikas!inner(name_en as palika_name),
    categories!inner(name_en as category_name)
  `)
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(0, 24)
```

---

## 📅 EVENTS TABLE

```sql
CREATE TABLE events (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id                   INTEGER NOT NULL REFERENCES palikas(id),

    -- Identity
    name_en                     VARCHAR(300) NOT NULL,
    name_ne                     VARCHAR(300) NOT NULL,
    slug                        VARCHAR(300) UNIQUE NOT NULL,

    -- Classification
    category_id                 INTEGER REFERENCES categories(id),
    event_type                  VARCHAR(50),
    is_festival                 BOOLEAN DEFAULT false,
    nepali_calendar_date        VARCHAR(50),
    recurrence_pattern          VARCHAR(50),

    -- Timing
    start_date                  DATE NOT NULL,
    end_date                    DATE NOT NULL,

    -- Location
    location                    GEOGRAPHY(POINT, 4326),
    venue_name                  VARCHAR(200),

    -- Content
    short_description          TEXT,
    short_description_ne       TEXT,
    full_description           TEXT,
    full_description_ne        TEXT,
    featured_image             TEXT,
    images                     JSONB DEFAULT '[]',

    -- Status
    status                     VARCHAR(40) DEFAULT 'draft'
                              CHECK (status IN 'draft','published','archived'),
    scheduled_at               TIMESTAMPTZ,

    -- Audit
    created_by                 UUID REFERENCES auth.users(id),
    updated_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_palika ON events(palika_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_location ON events USING GIST(location);
```

### Query Patterns for M-Place

```typescript
// Upcoming events (next 30 days)
const today = new Date().toISOString().split('T')[0]
const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const { data } = await supabase
  .from('events')
  .select(`
    id,
    name_en,
    name_ne,
    slug,
    start_date,
    end_date,
    featured_image,
    is_festival,
    location,
    palikas!inner(name_en as palika_name)
  `)
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .gte('start_date', today)
  .lte('start_date', in30Days)
  .order('start_date', { ascending: true })
  .range(0, 24)

// Calendar view - events in a specific month
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .gte('start_date', '2026-04-01')
  .lte('start_date', '2026-04-30')
  .order('start_date', { ascending: true })

// Festivals only
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('is_festival', true)
  .eq('status', 'published')
  .order('start_date', { ascending: true })
```

---

## 📝 BLOG_POSTS TABLE

```sql
CREATE TABLE blog_posts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id                   INTEGER NOT NULL REFERENCES palikas(id),
    author_id                   UUID NOT NULL REFERENCES admin_users(id),

    -- Identity
    title_en                    VARCHAR(300) NOT NULL,
    title_ne                    VARCHAR(300) NOT NULL,
    slug                        VARCHAR(300) UNIQUE NOT NULL,

    -- Content
    excerpt                     TEXT,
    excerpt_ne                  TEXT,
    content                     TEXT NOT NULL,
    content_ne                  TEXT,
    featured_image             TEXT,

    -- Classification
    category                    VARCHAR(100),
    tags                        TEXT[],

    -- Status
    status                     VARCHAR(40) DEFAULT 'draft'
                              CHECK (status IN 'draft','published','archived'),
    published_at               TIMESTAMPTZ,
    scheduled_at               TIMESTAMPTZ,

    -- Engagement
    view_count                 INTEGER DEFAULT 0,

    -- Audit
    created_by                 UUID REFERENCES auth.users(id),
    updated_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_blog_palika ON blog_posts(palika_id);
CREATE INDEX idx_blog_status ON blog_posts(status);
```

### Query Patterns for M-Place

```typescript
// All published blog posts for a palika
const { data } = await supabase
  .from('blog_posts')
  .select(`
    id,
    title_en,
    title_ne,
    slug,
    excerpt,
    featured_image,
    category,
    tags,
    view_count,
    published_at,
    admin_users!inner(full_name as author_name),
    palikas!inner(name_en as palika_name)
  `)
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .range(0, 24)

// Recent posts (latest 5)
const { data } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(5)

// Popular posts (by view count)
const { data } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .order('view_count', { ascending: false })
  .limit(10)

// Posts by category
const { data } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('category', 'tourism')
  .eq('status', 'published')
  .order('published_at', { ascending: false })

// Posts by tag
const { data } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('palika_id', palikaId)
  .contains('tags', ['festival'])  // Note: JSONB array contains
  .eq('status', 'published')
  .order('published_at', { ascending: false })

// Search posts
const { data } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .or(
    `title_en.ilike.%${query}%,` +
    `excerpt.ilike.%${query}%,` +
    `content.ilike.%${query}%`
  )
  .order('published_at', { ascending: false })
```

---

## 🏢 BUSINESSES TABLE (Local Services Directory)

```sql
CREATE TABLE businesses (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id                   INTEGER NOT NULL REFERENCES palikas(id),
    owner_user_id              UUID NOT NULL REFERENCES profiles(id),

    -- Identity
    business_name              VARCHAR(300) NOT NULL,
    business_name_ne           VARCHAR(300),
    slug                       VARCHAR(300) UNIQUE NOT NULL,

    -- Classification
    business_type_id           INTEGER NOT NULL REFERENCES categories(id),
    sub_category               VARCHAR(100),

    -- Contact
    phone                      VARCHAR(40) NOT NULL,
    email                      VARCHAR(255),

    -- Location
    ward_number                INTEGER NOT NULL CHECK (1-35),
    address                    TEXT NOT NULL,
    location                   GEOGRAPHY(POINT, 4326) NOT NULL,

    -- Details
    description                TEXT NOT NULL,
    details                    JSONB DEFAULT '{}',
    price_range                JSONB DEFAULT '{"min":0,"max":0,"currency":"NPR"}',
    operating_hours            JSONB DEFAULT '{"monday":"09:00-17:00",...}',
    is_24_7                    BOOLEAN DEFAULT false,
    languages_spoken           TEXT[] DEFAULT '{"en","ne"}',
    facilities                 JSONB DEFAULT '{"parking":false,"wifi":false,...}',

    -- Media
    featured_image             TEXT,
    images                     JSONB DEFAULT '[]',

    -- Verification
    verification_status        VARCHAR(50) DEFAULT 'pending'
                              CHECK (...IN 'pending','verified','rejected','suspended'),
    verified_at                TIMESTAMPTZ,
    verified_by                UUID REFERENCES admin_users(id),

    -- Engagement
    view_count                 INTEGER DEFAULT 0,
    contact_count              INTEGER DEFAULT 0,
    inquiry_count              INTEGER DEFAULT 0,
    rating_average             NUMERIC(3,2) DEFAULT 0.00,
    rating_count               INTEGER DEFAULT 0,

    -- Status
    is_active                  BOOLEAN DEFAULT true,
    is_featured                BOOLEAN DEFAULT false,

    -- Audit
    created_by                 UUID REFERENCES auth.users(id),
    updated_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_businesses_palika ON businesses(palika_id);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX idx_businesses_verification ON businesses(verification_status);
```

### Query Patterns for M-Place

```typescript
// All hotels/accommodations
const { data } = await supabase
  .from('businesses')
  .select(`
    id,
    business_name,
    slug,
    description,
    featured_image,
    location,
    rating_average,
    rating_count,
    price_range,
    facilities,
    palikas!inner(name_en as palika_name)
  `)
  .eq('palika_id', palikaId)
  .eq('business_type_id', 15)  // Hotels category_id
  .eq('verification_status', 'verified')
  .eq('is_active', true)
  .order('rating_average', { ascending: false })
  .range(0, 24)

// Restaurants in area
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('business_type_id', 16)  // Restaurants category_id
  .eq('is_active', true)
  .order('rating_average', { ascending: false })

// Tour guides
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('sub_category', 'tour_guide')
  .eq('is_active', true)
  .order('rating_average', { ascending: false })

// Nearby services (within 5km)
const { data } = await supabase
  .rpc('nearby_businesses', {
    lat: latitude,
    lon: longitude,
    radius_km: 5,
    palika_id: palikaId,
    limit: 25
  })
```

---

## 🆘 SOS_REQUESTS TABLE (Emergency Information)

```sql
CREATE TABLE sos_requests (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID REFERENCES profiles(id),
    palika_id                   INTEGER NOT NULL REFERENCES palikas(id),

    -- Request Identity
    request_code               VARCHAR(40) UNIQUE NOT NULL,
    emergency_type             VARCHAR(50) NOT NULL
                              CHECK (...IN 'medical','accident','fire','security','natural_disaster','other'),

    -- Location
    location                   GEOGRAPHY(POINT, 4326) NOT NULL,
    location_accuracy          FLOAT CHECK (> 0),
    location_description       TEXT,
    ward_number                INTEGER CHECK (1-35),

    -- Caller Info
    user_name                  VARCHAR(200),
    user_phone                 VARCHAR(40) NOT NULL,

    -- Details
    details                    TEXT,

    -- Status
    status                     VARCHAR(50) DEFAULT 'received'
                              CHECK (...IN 'received','assigned','in_progress','resolved','cancelled'),
    status_updated_at          TIMESTAMPTZ DEFAULT NOW(),

    -- Responder Assignment
    assigned_to                UUID REFERENCES admin_users(id),
    responder_name             VARCHAR(200),
    responder_phone            VARCHAR(40),
    responder_eta_minutes      INTEGER CHECK (> 0),

    -- Resolution
    resolved_at                TIMESTAMPTZ,
    resolution_notes           TEXT,

    -- Feedback
    user_rating                INTEGER CHECK (1-5),
    user_feedback              TEXT,

    -- Offline Support
    sent_offline               BOOLEAN DEFAULT false,
    queued_at                  TIMESTAMPTZ,
    timeline                   JSONB DEFAULT '[]',

    -- Audit
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sos_palika ON sos_requests(palika_id);
```

### Query Patterns for M-Place

```typescript
// Get active emergency alerts for a palika
const { data } = await supabase
  .from('sos_requests')
  .select(`
    id,
    request_code,
    emergency_type,
    location,
    status,
    responder_eta_minutes,
    palikas!inner(name_en as palika_name)
  `)
  .eq('palika_id', palikaId)
  .in('status', ['received', 'assigned', 'in_progress'])  // Active statuses
  .order('status_updated_at', { ascending: false })

// Emergency contacts for a palika (from SOS history)
const { data } = await supabase
  .from('sos_requests')
  .select('responder_phone, responder_name')
  .eq('palika_id', palikaId)
  .eq('status', 'resolved')
  .limit(10)
```

---

## 🏷️ CATEGORIES TABLE (Shared Classification)

```sql
-- Assumed table structure (used by heritage_sites, events, businesses)
CREATE TABLE categories (
    id                          SERIAL PRIMARY KEY,
    entity_type                 VARCHAR(50),  -- 'heritage_site', 'event', 'business', etc.
    category_en_name           VARCHAR(150),
    category_ne_name           VARCHAR(150),
    slug                       VARCHAR(100),
    description                TEXT,
    icon_url                   TEXT,
    display_order              INTEGER DEFAULT 0,
    is_active                  BOOLEAN DEFAULT true,
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);
```

### Query for Categories

```typescript
// Get all categories for heritage sites
const { data: categories } = await supabase
  .from('categories')
  .select('id, category_en_name, category_ne_name, slug')
  .eq('entity_type', 'heritage_site')
  .eq('is_active', true)
  .order('display_order', { ascending: true })
```

---

## 🔐 RLS POLICIES FOR M-PLACE

All public content access (for m-place) uses these policies:

```sql
-- Heritage Sites: Public can read published
CREATE POLICY heritage_sites_public_read
ON heritage_sites FOR SELECT
USING (
  status = 'published' OR
  (auth.uid() = created_by)
)

-- Events: Public can read published
CREATE POLICY events_public_read
ON events FOR SELECT
USING (status = 'published')

-- Blog Posts: Public can read published
CREATE POLICY blog_posts_public_read
ON blog_posts FOR SELECT
USING (status = 'published')

-- Businesses: Public can read verified
CREATE POLICY businesses_public_read
ON businesses FOR SELECT
USING (
  is_active = true AND
  verification_status = 'verified'
)

-- SOS: Public can read active emergencies
CREATE POLICY sos_public_read
ON sos_requests FOR SELECT
USING (
  status IN ('received', 'assigned', 'in_progress')
)
```

**Important:** M-place uses `supabaseAnonKey` which has limited RLS permissions.
No login required to browse published content.

---

## 📊 KEY RELATIONSHIPS

```
palikas (1) ──→ (∞) heritage_sites
palikas (1) ──→ (∞) events
palikas (1) ──→ (∞) blog_posts
palikas (1) ──→ (∞) businesses
palikas (1) ──→ (∞) sos_requests

categories (1) ──→ (∞) heritage_sites
categories (1) ──→ (∞) events
categories (1) ──→ (∞) businesses

admin_users (1) ──→ (∞) blog_posts (author)
auth.users (1) ──→ (∞) heritage_sites (created_by)
auth.users (1) ──→ (∞) businesses (owner_user_id)
```

---

## 🔄 TYPICAL M-PLACE QUERIES

### Browse Heritage Sites by Category
```typescript
const { data } = await supabase
  .from('heritage_sites')
  .select('*, categories!inner(slug, category_en_name)')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .eq('categories.slug', 'religious-sites')
  .order('created_at', { ascending: false })
```

### Timeline View: Events This Month
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('palika_id', palikaId)
  .eq('status', 'published')
  .gte('start_date', '2026-04-01')
  .lt('start_date', '2026-05-01')
  .order('start_date', { ascending: true })
```

### Search Across Multiple Content Types
```typescript
// Would need to query each table separately and merge results:
const heritagePromise = supabase
  .from('heritage_sites')
  .select('id, name_en, slug, "heritage_site" as entity_type')
  .eq('status', 'published')
  .ilike('name_en', `%${query}%`)

const eventsPromise = supabase
  .from('events')
  .select('id, name_en, slug, "event" as entity_type')
  .eq('status', 'published')
  .ilike('name_en', `%${query}%`)

const [heritage, events] = await Promise.all([heritagePromise, eventsPromise])
// Merge and sort results...
```

---

## ✅ NEXT STEPS

1. **Use these schemas** as reference for DTO design
2. **Copy the query patterns** into datasources
3. **Test with mock data** before querying real Supabase
4. **Verify RLS policies** allow anonymous reads
5. **Monitor view counts** for engagement analytics (Phase 6)

