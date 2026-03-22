# Palika Profile Implementation Plan

## ✅ Completed
1. **Frontend Page** - `/app/palika-profile/page.tsx`
   - Form for editing palika profile
   - Sections: Descriptions, Featured Image, Highlights, Tourism Info, Demographics
   - Fetches profile from API
   - Submits updates to API
   - Navigation link added to AdminLayout

## 📋 Next Steps

### 1. Database Migration
Create migration to add `palika_profiles` table:

```sql
CREATE TABLE palika_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL UNIQUE REFERENCES palikas(id) ON DELETE CASCADE,
  description_en TEXT,
  description_ne TEXT,
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  tourism_info JSONB DEFAULT '{
    "best_time_to_visit": null,
    "accessibility": null,
    "languages": [],
    "currency": "NPR"
  }'::jsonb,
  demographics JSONB DEFAULT '{
    "population": 0,
    "area_sq_km": 0,
    "established_year": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_palika_profiles_palika_id ON palika_profiles(palika_id);
```

### 2. Row Level Security (RLS)
Enable RLS on `palika_profiles` table:

```sql
ALTER TABLE palika_profiles ENABLE ROW LEVEL SECURITY;

-- Palika admins can view their own profile
CREATE POLICY palika_profiles_select_own ON palika_profiles
  FOR SELECT
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Palika admins can update their own profile
CREATE POLICY palika_profiles_update_own ON palika_profiles
  FOR UPDATE
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Super admins can view all
CREATE POLICY palika_profiles_select_super ON palika_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update all
CREATE POLICY palika_profiles_update_super ON palika_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### 3. API Endpoints

#### GET `/api/palika-profile`
- Query param: `palika_id`
- Returns: Palika profile data
- Auth: Palika admin or super admin

#### PUT `/api/palika-profile`
- Header: `X-Palika-ID`
- Body: Profile data
- Returns: Updated profile
- Auth: Palika admin or super admin

### 4. API Implementation
Create `/app/api/palika-profile/route.ts`:
- GET handler: Fetch profile by palika_id
- PUT handler: Update profile with validation
- Error handling and auth checks

## Form Fields

### Descriptions
- `description_en` - English description (textarea)
- `description_ne` - Nepali description (textarea)

### Featured Image
- `featured_image` - URL to featured image

### Highlights
- Array of objects with `title` and `description`
- Add/remove highlights dynamically

### Tourism Information
- `best_time_to_visit` - String
- `accessibility` - String
- `languages` - Array of strings
- `currency` - String (default: NPR)

### Demographics
- `population` - Number
- `area_sq_km` - Number
- `established_year` - Number

## Testing Checklist
- [ ] Migration runs successfully
- [ ] RLS policies work correctly
- [ ] API GET returns profile data
- [ ] API PUT updates profile
- [ ] Frontend form loads data
- [ ] Frontend form submits updates
- [ ] Palika admin can only edit own profile
- [ ] Super admin can edit any profile
- [ ] Validation works on form
- [ ] Error messages display correctly
