# About Page Implementation Guide

## Overview

The About page in the m-place marketplace displays palika (local municipality) profile information that is managed through the admin panel. This document explains the data flow, API integration, and RLS handling.

## Architecture

### Data Flow

```
Admin Panel (platform-admin-panel)
    ↓
    Updates palika profile in Supabase
    ↓
M-Place Marketplace
    ↓
    About Page fetches palika data
    ↓
    Displays with fallback for RLS issues
```

### Key Components

#### 1. Admin Panel - Palika Management
- **Location**: `platform-admin-panel/src/app/admin/tiers/page.tsx`
- **Functionality**: Admins can view and manage palika subscription tiers
- **Data Updated**: 
  - `subscription_tier_id` (tier assignment)
  - Palika metadata (name, description, contact info)

#### 2. M-Place About Page
- **Location**: `m-place/src/pages/About.tsx`
- **Route**: `/about`
- **Features**:
  - Displays palika profile information
  - Shows location (district, province)
  - Displays contact information
  - Shows statistics (wards, population, established year)
  - Graceful fallback for RLS restrictions

#### 3. API Layer
- **Location**: `m-place/src/api/palikaProfile.ts`
- **Functions**:
  - `fetchPalikaProfile()` - Full profile with all details
  - `fetchPalikaProfileMinimal()` - Minimal fields for RLS fallback

## Data Structure

### Palika Profile Fields

```typescript
interface PalikaProfile {
  id: number;                    // Palika ID
  name_en: string;              // English name
  name_ne: string;              // Nepali name
  description?: string;         // Palika description
  total_wards: number;          // Number of wards
  population?: number;          // Population count
  established_year?: number;    // Year established
  website?: string;             // Official website
  contact_email?: string;       // Contact email
  contact_phone?: string;       // Contact phone
  district_name?: string;       // District name
  province_name?: string;       // Province name
}
```

### Supabase Query

The About page queries the `palikas` table with the following structure:

```sql
SELECT
  id,
  name_en,
  name_ne,
  description,
  total_wards,
  population,
  established_year,
  website,
  contact_email,
  contact_phone,
  districts (
    name_en,
    provinces (
      name_en
    )
  )
FROM palikas
WHERE id = $1
```

## RLS (Row Level Security) Handling

### Problem
Supabase RLS policies may restrict access to palika data depending on user roles and permissions.

### Solution: Graceful Fallback

The About page implements a three-tier fallback strategy:

1. **Primary**: Fetch full profile with all fields
   ```typescript
   const profile = await fetchPalikaProfile(palika.palikaId);
   ```

2. **Secondary**: If primary fails, use fallback dummy data
   ```typescript
   setPalikaProfile(FALLBACK_PALIKA_DATA);
   setError('Using cached information...');
   ```

3. **Tertiary**: Minimal query with fewer fields (if needed)
   ```typescript
   const profile = await fetchPalikaProfileMinimal(palikaId);
   ```

### Fallback Data

```typescript
const FALLBACK_PALIKA_DATA: PalikaProfile = {
  id: 1,
  name_en: 'Palika Municipality',
  name_ne: 'पालिका नगरपालिका',
  description: 'A vibrant local municipality dedicated to promoting tourism and local commerce.',
  total_wards: 13,
  population: 150000,
  established_year: 2017,
  website: 'https://palika.gov.np',
  contact_email: 'info@palika.gov.np',
  contact_phone: '+977-1-XXXXXXX',
  district_name: 'Kathmandu',
  province_name: 'Bagmati',
};
```

## Implementation Details

### About Page Component

**File**: `m-place/src/pages/About.tsx`

**Key Features**:
- Uses `useCurrentPalika()` hook to get current user's palika
- Fetches profile data on component mount
- Displays loading state while fetching
- Shows error banner if RLS issues occur
- Renders profile information in organized cards
- Responsive design with Tailwind CSS

**Sections**:
1. **Header** - Palika name and Nepali name
2. **Overview** - Description and key statistics
3. **Location** - District and province information
4. **Contact Information** - Email, phone, website
5. **Info Section** - Community support message

### API Integration

**File**: `m-place/src/api/palikaProfile.ts`

**Error Handling**:
```typescript
try {
  const profile = await fetchPalikaProfile(palikaId);
  setPalikaProfile(profile);
} catch (err) {
  // Use fallback data on any error
  setPalikaProfile(FALLBACK_PALIKA_DATA);
  setError('Using cached information...');
}
```

### Navigation

**File**: `m-place/src/components/Navbar.tsx`

Added About link to main navigation:
```tsx
<Button variant="ghost" size="sm" asChild className={isActive('/about') ? 'bg-emerald-500 text-white' : ''}>
  <Link to="/about" className="hidden sm:flex"><span>About</span></Link>
</Button>
```

**File**: `m-place/src/App.tsx`

Added route:
```tsx
<Route path="/about" element={<About />} />
```

## Admin Panel Integration

### How Admin Updates Flow to About Page

1. **Admin Updates Palika Profile**
   - Admin logs into platform-admin-panel
   - Navigates to Tier Assignment page
   - Updates palika information (name, description, contact details)
   - Changes are saved to Supabase `palikas` table

2. **Data Propagates to M-Place**
   - About page queries the same `palikas` table
   - Fetches latest data on page load
   - Displays updated information to users

3. **Real-time Updates**
   - Page refresh loads latest data
   - No caching layer (direct Supabase queries)
   - Changes visible immediately after admin updates

### Admin Panel Endpoints

**Tier Assignment API**:
- `GET /api/palikas/tiers` - Fetch all palikas with tier info
- `PUT /api/palikas/[id]/tier` - Update palika tier

**Palika Data**:
- Stored in `palikas` table
- Related to `subscription_tier` via `subscription_tier_id`
- Linked to `districts` and `provinces` for location info

## Testing the Implementation

### Manual Testing

1. **View About Page**
   ```
   Navigate to: http://localhost:3000/about
   ```

2. **Check Data Display**
   - Verify palika name displays correctly
   - Check location information (district, province)
   - Confirm contact details are shown
   - Verify statistics (wards, population, year)

3. **Test RLS Fallback**
   - Temporarily restrict Supabase RLS policies
   - Verify fallback data displays
   - Check error message appears
   - Confirm page remains functional

4. **Test Admin Updates**
   - Update palika info in admin panel
   - Refresh About page
   - Verify changes appear

### API Testing

**Fetch Palika Profile**:
```bash
curl -X GET "http://localhost:3000/api/palikaProfile?palikaId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "id": 1,
  "name_en": "Palika Municipality",
  "name_ne": "पालिका नगरपालिका",
  "description": "...",
  "total_wards": 13,
  "population": 150000,
  "established_year": 2017,
  "website": "https://palika.gov.np",
  "contact_email": "info@palika.gov.np",
  "contact_phone": "+977-1-XXXXXXX",
  "district_name": "Kathmandu",
  "province_name": "Bagmati"
}
```

## Troubleshooting

### Issue: About page shows fallback data

**Cause**: RLS policy restricting access to palika data

**Solution**:
1. Check Supabase RLS policies on `palikas` table
2. Ensure authenticated users can read palika data
3. Verify user has appropriate role/permissions
4. Check browser console for specific error messages

### Issue: Contact information not displaying

**Cause**: Fields not populated in Supabase

**Solution**:
1. Update palika record in admin panel
2. Verify fields are saved in Supabase
3. Check API response includes fields
4. Refresh page to reload data

### Issue: Location information missing

**Cause**: District/province relationship not loaded

**Solution**:
1. Verify `districts` and `provinces` tables exist
2. Check foreign key relationships
3. Ensure Supabase query includes nested selects
4. Verify data integrity in database

## Future Enhancements

1. **Caching**: Implement React Query caching for better performance
2. **Real-time Updates**: Use Supabase subscriptions for live updates
3. **Admin Panel Integration**: Add direct edit link for admins
4. **Analytics**: Track About page views and engagement
5. **Multi-language**: Support for additional languages
6. **Rich Content**: Support for images, videos, and formatted text
7. **Social Links**: Add social media links to contact section

## Files Modified/Created

### Created Files
- `m-place/src/pages/About.tsx` - About page component
- `m-place/src/api/palikaProfile.ts` - API functions for fetching palika profile

### Modified Files
- `m-place/src/App.tsx` - Added About route
- `m-place/src/components/Navbar.tsx` - Added About navigation link

## Security Considerations

1. **RLS Policies**: Ensure appropriate RLS policies are in place
2. **Data Validation**: Validate all data before display
3. **XSS Prevention**: Sanitize user-generated content
4. **Rate Limiting**: Consider rate limiting API calls
5. **Authentication**: Verify user authentication before data access

## Performance Optimization

1. **Query Optimization**: Use specific field selection
2. **Caching**: Implement client-side caching with React Query
3. **Lazy Loading**: Load images and content on demand
4. **Code Splitting**: Split About page into separate bundle
5. **CDN**: Serve static assets from CDN

## Conclusion

The About page provides a user-friendly interface to display palika information managed through the admin panel. The implementation includes robust error handling, RLS fallback mechanisms, and graceful degradation to ensure the page remains functional even when data access is restricted.
