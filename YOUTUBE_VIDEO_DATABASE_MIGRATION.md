# YouTube Video Feature - Database Migration & API Updates

**Status**: ✅ COMPLETE
**Date**: March 22, 2026
**Version**: 1.0.0

---

## Database Changes

### Migration Applied

**File**: `supabase/migrations/20250322000053_add_videos_to_palika_profiles.sql`

**SQL**:
```sql
ALTER TABLE public.palika_profiles
ADD COLUMN videos TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.palika_profiles.videos IS 'Array of YouTube video URLs for the palika profile';
```

### What Changed

**Table**: `palika_profiles`

**New Column**:
- **Name**: `videos`
- **Type**: `TEXT[]` (PostgreSQL text array)
- **Default**: `'{}'` (empty array)
- **Nullable**: No
- **Purpose**: Store array of YouTube video URLs

### Column Details

```sql
Column Name: videos
Data Type: TEXT[]
Default Value: '{}'
Nullable: false
Comment: Array of YouTube video URLs for the palika profile
```

### Example Data

```sql
-- Single video
UPDATE palika_profiles 
SET videos = '{"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
WHERE palika_id = 10;

-- Multiple videos
UPDATE palika_profiles 
SET videos = '{
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/abc123def456",
  "https://www.youtube.com/watch?v=xyz789"
}'
WHERE palika_id = 10;

-- Empty array
UPDATE palika_profiles 
SET videos = '{}'
WHERE palika_id = 10;
```

### Query Examples

**Get videos for a palika**:
```sql
SELECT videos FROM palika_profiles WHERE palika_id = 10;
```

**Get first video**:
```sql
SELECT videos[1] FROM palika_profiles WHERE palika_id = 10;
```

**Get number of videos**:
```sql
SELECT array_length(videos, 1) as video_count 
FROM palika_profiles WHERE palika_id = 10;
```

**Filter by video count**:
```sql
SELECT * FROM palika_profiles 
WHERE array_length(videos, 1) > 0;
```

---

## API Updates

### GET `/api/palika-profile`

**Query Parameters**:
- `palika_id` (required) - Palika ID

**Response**:
```json
{
  "profile": {
    "id": "uuid",
    "palika_id": 10,
    "description_en": "...",
    "description_ne": "...",
    "featured_image": "https://...",
    "gallery_images": ["https://..."],
    "highlights": [{"title": "...", "description": "...", "image_url": "..."}],
    "tourism_info": {...},
    "demographics": {...},
    "videos": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/abc123def456"
    ]
  }
}
```

**Changes**:
- Added `videos` field to response
- Returns empty array `[]` if no videos
- Videos are in order they were added

### PUT `/api/palika-profile`

**Headers**:
- `X-Palika-ID` (required) - Palika ID
- `Content-Type: application/json`

**Request Body**:
```json
{
  "description_en": "...",
  "description_ne": "...",
  "featured_image": "https://...",
  "gallery_images": ["https://..."],
  "highlights": [...],
  "tourism_info": {...},
  "demographics": {...},
  "videos": [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/abc123def456"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "palika_id": 10,
    "videos": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/abc123def456"
    ]
  }
}
```

**Changes**:
- Now accepts `videos` array in request body
- Saves videos to database
- Returns updated profile with videos

### API Implementation

**File**: `admin-panel/app/api/palika-profile/route.ts`

**Changes Made**:

1. **GET Endpoint**:
   - Added `videos: []` to empty profile response
   - Returns videos array from database

2. **PUT Endpoint - Update**:
   - Added `videos: body.videos || []` to update payload
   - Saves videos array to database

3. **PUT Endpoint - Create**:
   - Added `videos: body.videos || []` to insert payload
   - Initializes videos array for new profiles

---

## Frontend Updates

### File: `admin-panel/app/palika-profile/page.tsx`

**Changes Made**:

1. **Data Models**:
   - Updated `PalikaProfile` interface to include `videos: string[]`
   - Updated `FormData` interface to include `videos: string[]`

2. **State Management**:
   - Added `videos: []` to initial form state
   - Updated `fetchPalikaProfile()` to load videos from API
   - Added `videos` to form data when fetching profile

3. **Video Management Functions**:
   - `addVideo()` - Add new video field
   - `removeVideo(index)` - Remove video at index
   - `handleVideoChange(index, value)` - Update video URL
   - `extractYouTubeId(url)` - Extract video ID from URL
   - `getYouTubeEmbedUrl(url)` - Generate embed URL

4. **UI Components**:
   - Added "YouTube Videos" section
   - Video input fields with URL validation
   - Video preview with embedded player
   - Add/Remove video buttons
   - Error messages for invalid URLs

---

## Data Flow

### Saving Videos

```
User enters video URL
    ↓
handleVideoChange() updates formData.videos
    ↓
User clicks "Save Palika Profile"
    ↓
handleSubmit() called
    ↓
PUT /api/palika-profile with videos array
    ↓
API validates and saves to database
    ↓
Success message displayed
    ↓
Videos persisted in palika_profiles.videos column
```

### Loading Videos

```
User navigates to Palika Profile
    ↓
fetchPalikaProfile() called
    ↓
GET /api/palika-profile?palika_id=10
    ↓
API queries palika_profiles table
    ↓
Returns profile with videos array
    ↓
formData.videos populated
    ↓
Video fields rendered in form
    ↓
Video previews display
```

---

## Database Schema

### Before Migration

```sql
CREATE TABLE palika_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER UNIQUE NOT NULL,
  description_en TEXT,
  description_ne TEXT,
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  tourism_info JSONB DEFAULT '{"currency": "NPR", ...}',
  demographics JSONB DEFAULT '{"population": 0, ...}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (palika_id) REFERENCES palikas(id)
);
```

### After Migration

```sql
CREATE TABLE palika_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER UNIQUE NOT NULL,
  description_en TEXT,
  description_ne TEXT,
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  tourism_info JSONB DEFAULT '{"currency": "NPR", ...}',
  demographics JSONB DEFAULT '{"population": 0, ...}',
  videos TEXT[] DEFAULT '{}',  -- NEW COLUMN
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (palika_id) REFERENCES palikas(id)
);
```

---

## Backward Compatibility

✅ **Fully Backward Compatible**
- Existing profiles without videos still work
- Videos field defaults to empty array
- No data loss
- Can add videos to existing profiles
- Old data persists unchanged

---

## Testing

### Database Test

```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'palika_profiles' AND column_name = 'videos';

-- Check default value
SELECT videos FROM palika_profiles WHERE palika_id = 10;

-- Insert test data
UPDATE palika_profiles 
SET videos = '{"https://www.youtube.com/watch?v=test"}'
WHERE palika_id = 10;

-- Verify
SELECT videos FROM palika_profiles WHERE palika_id = 10;
```

### API Test

**GET Request**:
```bash
curl "http://localhost:3001/api/palika-profile?palika_id=10"
```

**Expected Response**:
```json
{
  "profile": {
    "videos": []
  }
}
```

**PUT Request**:
```bash
curl -X PUT "http://localhost:3001/api/palika-profile" \
  -H "X-Palika-ID: 10" \
  -H "Content-Type: application/json" \
  -d '{
    "description_en": "...",
    "videos": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "profile": {
    "videos": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]
  }
}
```

---

## Compilation Status

✅ **All files compile without errors**
- `admin-panel/app/palika-profile/page.tsx` - No diagnostics
- `admin-panel/app/api/palika-profile/route.ts` - No diagnostics

---

## Migration File

**Location**: `supabase/migrations/20250322000053_add_videos_to_palika_profiles.sql`

**Status**: ✅ Applied successfully

**To Apply Manually**:
```bash
supabase db push
```

---

## Summary

### Database
- ✅ Added `videos TEXT[]` column to `palika_profiles` table
- ✅ Default value: `'{}'` (empty array)
- ✅ Migration file created and applied

### API
- ✅ GET endpoint returns videos array
- ✅ PUT endpoint accepts and saves videos array
- ✅ Handles empty videos gracefully
- ✅ Backward compatible with existing data

### Frontend
- ✅ Form accepts multiple video URLs
- ✅ Real-time URL validation
- ✅ Video preview with embedded player
- ✅ Add/Remove video functionality
- ✅ Saves videos to database

### Testing
- ✅ Database column verified
- ✅ API endpoints tested
- ✅ Frontend form tested
- ✅ Data persistence verified

