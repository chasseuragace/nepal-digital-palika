# Business Profile Edit Page - Roadmap Update

**Date:** 2026-03-21  
**Update:** Added Phase 6.4 - Business Profile Management  
**Status:** ✅ Roadmap Updated

---

## Summary

The roadmap has been updated to include **Phase 6.4: Business Profile Management** which adds business profile editing capability for marketplace sellers in m-place.

---

## What Was Added

### Phase 6.4: Business Profile Management (May 15 - May 30)

**Objective:** Add business profile editing capability for marketplace sellers

**Context:**
- Business profiles are auto-created when users register
- Sellers need ability to edit their business information
- Business profile contains: name, description, phone, address, ward, images, etc.
- Edits should be reflected immediately in marketplace

### Features

#### Business Profile View Page
- Display current business information
- Show business statistics (view count, contact count, rating)
- Display business images and featured image
- Show verification status
- Link to edit page

#### Business Profile Edit Page
- Edit business name (English & Nepali)
- Edit description (English & Nepali)
- Edit phone and email
- Edit address and ward number
- Edit operating hours
- Edit facilities (parking, wifi, restaurant, guide service)
- Edit languages spoken
- Upload/manage business images
- Set featured image
- Update price range
- Save changes with validation

#### API Endpoints
- GET /api/businesses/:id - Get business details
- PUT /api/businesses/:id - Update business (owner only)
- POST /api/businesses/:id/images - Upload images
- DELETE /api/businesses/:id/images/:imageId - Delete image

### Database Fields (from businesses table)

All these fields are editable by business owner:
- business_name, business_name_ne
- description, details
- phone, email
- address, ward_number, location
- operating_hours, is_24_7
- languages_spoken, facilities
- featured_image, images
- price_range

### Timeline
- **Start:** 2026-05-15
- **End:** 2026-05-30
- **Duration:** 2 weeks

### Dependencies
- Business profile auto-creation (Phase 5 complete)
- RLS policies for business ownership
- Image upload infrastructure

### Key Deliverables
- Business profile view page component
- Business profile edit form component
- API endpoints for get/update operations
- Image upload functionality
- Form validation
- Comprehensive tests
- User documentation

### Success Criteria
- ✅ Business owners can view their profile
- ✅ Business owners can edit all profile fields
- ✅ Changes saved to database
- ✅ Changes reflected in marketplace immediately
- ✅ RLS enforces ownership (can only edit own business)
- ✅ Image upload working
- ✅ Form validation working
- ✅ 95%+ test pass rate

---

## Database Schema Reference

### businesses table structure (relevant fields)

```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL,           -- Links to user
    palika_id INTEGER NOT NULL,            -- Links to palika
    business_name VARCHAR(300) NOT NULL,   -- Editable
    business_name_ne VARCHAR(300),         -- Editable (Nepali)
    slug VARCHAR(300) UNIQUE NOT NULL,
    business_type_id INTEGER NOT NULL,
    phone VARCHAR(40) NOT NULL,            -- Editable
    email VARCHAR(255),                    -- Editable
    ward_number INTEGER NOT NULL,          -- Editable
    address TEXT NOT NULL,                 -- Editable
    location GEOGRAPHY(POINT, 4326),       -- Editable
    description TEXT NOT NULL,             -- Editable
    details JSONB DEFAULT '{}',            -- Editable
    price_range JSONB,                     -- Editable
    operating_hours JSONB,                 -- Editable
    is_24_7 BOOLEAN DEFAULT false,         -- Editable
    languages_spoken TEXT[],               -- Editable
    facilities JSONB,                      -- Editable
    featured_image TEXT,                   -- Editable
    images JSONB DEFAULT '[]',             -- Editable
    verification_status VARCHAR(50),
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2),
    rating_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### business_images table (for image management)

```sql
CREATE TABLE business_images (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER,
    created_at TIMESTAMPTZ
);
```

---

## m-place Integration

### Current State
- ✅ Business profiles auto-created on user registration
- ✅ Business linked to palika
- ✅ Business linked to user
- ✅ Business information displayed in marketplace

### What's Missing
- ❌ Business profile view page
- ❌ Business profile edit page
- ❌ Business profile edit form
- ❌ Image upload functionality
- ❌ API endpoints for get/update

### Phase 6.4 Will Add
- ✅ Business profile view page
- ✅ Business profile edit page
- ✅ Business profile edit form
- ✅ Image upload functionality
- ✅ API endpoints for get/update
- ✅ Form validation
- ✅ RLS enforcement (owner only)

---

## Implementation Notes

### RLS Enforcement
Business profile edits must be restricted to business owner:

```sql
-- Only business owner can update their business
CREATE POLICY business_owner_update ON businesses
    FOR UPDATE
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());
```

### Image Upload
- Store images in Supabase Storage
- Reference in business_images table
- Support multiple images per business
- Allow setting featured image

### Form Validation
- Business name required (min 3, max 300 chars)
- Description required (min 10, max 1000 chars)
- Phone required (valid format)
- Email optional (valid format if provided)
- Ward number required (1-35)
- Address required
- Operating hours optional (JSON format)
- Facilities optional (JSON format)

### API Response Format
```json
{
  "id": "uuid",
  "businessName": "string",
  "businessNameNe": "string",
  "description": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "wardNumber": number,
  "operatingHours": object,
  "is24_7": boolean,
  "languagesSpoken": array,
  "facilities": object,
  "featuredImage": "string",
  "images": array,
  "priceRange": object,
  "verificationStatus": "string",
  "viewCount": number,
  "contactCount": number,
  "ratingAverage": number,
  "ratingCount": number,
  "isActive": boolean,
  "isFeatured": boolean,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## Updated Roadmap Timeline

```
Phase 6: Admin Panel Analytics (2026-04-01 to 2026-05-15)
  ├─ Phase 6.1: Analytics Dashboard (Apr 1-15)
  ├─ Phase 6.2: Product Management (Apr 15 - May 1)
  ├─ Phase 6.3: Admin Panel Commit (May 1-15)
  └─ Phase 6.4: Business Profile Management (May 15-30) ← NEW

Phase 7: SOS Frontend Integration (2026-06-15 to 2026-09-01)
  ├─ Phase 7.1: SOS Frontend (Jun 15 - Jul 15)
  ├─ Phase 7.2: m-place Upgrade (Jul 15 - Aug 15)
  └─ Phase 7.3: Module Integration (Aug 15 - Sep 1)
```

---

## Related Documentation

### Supabase Tables
- `businesses` - Business profile data
- `business_images` - Business images
- `business_categories` - Business categories

### m-place Files
- `src/api/businesses.ts` - Business API functions
- `src/utils/business-templates.ts` - Business templates

### Documentation
- `docs/marketplace/MARKETPLACE_PRODUCT_SCHEMA.md` - Schema details
- `docs/marketplace/MARKETPLACE_READY_FOR_API.md` - API readiness

---

## Next Steps

1. ✅ Roadmap updated with Phase 6.4
2. 🔵 Implement business profile view page
3. 🔵 Implement business profile edit page
4. 🔵 Create API endpoints
5. 🔵 Add image upload functionality
6. 🔵 Write tests
7. 🔵 Document implementation

---

**Update Completed:** 2026-03-21  
**Status:** ✅ Roadmap Updated  
**Next Review:** 2026-05-15 (Phase 6.4 Start)
