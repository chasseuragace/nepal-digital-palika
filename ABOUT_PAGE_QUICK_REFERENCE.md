# About Page - Quick Reference

## What Was Added

### 1. New About Page
- **File**: `m-place/src/pages/About.tsx`
- **Route**: `/about`
- **Navigation**: Added "About" link in navbar (hidden on mobile)

### 2. API Layer
- **File**: `m-place/src/api/palikaProfile.ts`
- **Functions**:
  - `fetchPalikaProfile(palikaId)` - Fetch full palika profile
  - `fetchPalikaProfileMinimal(palikaId)` - Fallback with minimal fields

### 3. Navigation Updates
- **Navbar**: Added About button
- **Router**: Added `/about` route in App.tsx

## How It Works

### Data Flow

```
User visits /about
    ↓
About component loads
    ↓
Fetches current palika from useCurrentPalika()
    ↓
Calls fetchPalikaProfile(palikaId)
    ↓
Supabase returns palika data
    ↓
If error → Use FALLBACK_PALIKA_DATA
    ↓
Display on page
```

### What Data Is Displayed

| Field | Source | Display |
|-------|--------|---------|
| Name (EN/NE) | Supabase | Header |
| Description | Supabase | Overview section |
| Total Wards | Supabase | Statistics card |
| Population | Supabase | Statistics card |
| Established Year | Supabase | Statistics card |
| District | Supabase (via join) | Location card |
| Province | Supabase (via join) | Location card |
| Email | Supabase | Contact section |
| Phone | Supabase | Contact section |
| Website | Supabase | Contact section |

## Admin Panel Connection

### Where Admin Updates Palika Data

**Platform Admin Panel**: `platform-admin-panel/src/app/admin/tiers/page.tsx`

- Admins can view all palikas
- Can assign/change subscription tiers
- Can update palika metadata

### How Changes Flow to About Page

1. Admin updates palika in admin panel
2. Data saved to Supabase `palikas` table
3. User visits `/about` in m-place
4. About page queries same `palikas` table
5. Latest data displays immediately

## RLS Handling

### What Happens If RLS Blocks Access

```typescript
try {
  const profile = await fetchPalikaProfile(palikaId);
  setPalikaProfile(profile);
} catch (err) {
  // Fallback to dummy data
  setPalikaProfile(FALLBACK_PALIKA_DATA);
  setError('Using cached information...');
}
```

### Fallback Data

If Supabase returns an error (RLS, network, etc.), the page displays:

```typescript
{
  name_en: 'Palika Municipality',
  name_ne: 'पालिका नगरपालिका',
  description: 'A vibrant local municipality...',
  total_wards: 13,
  population: 150000,
  established_year: 2017,
  website: 'https://palika.gov.np',
  contact_email: 'info@palika.gov.np',
  contact_phone: '+977-1-XXXXXXX',
  district_name: 'Kathmandu',
  province_name: 'Bagmati',
}
```

## API Calls

### Fetch Palika Profile

```typescript
import { fetchPalikaProfile } from '@/api/palikaProfile';

try {
  const profile = await fetchPalikaProfile(1); // palikaId = 1
  console.log(profile.name_en); // "Palika Municipality"
} catch (error) {
  console.error('Failed to fetch:', error);
}
```

### Supabase Query

```sql
SELECT
  id, name_en, name_ne, description, total_wards,
  population, established_year, website,
  contact_email, contact_phone,
  districts (name_en),
  districts!inner (provinces (name_en))
FROM palikas
WHERE id = 1
```

## Testing

### View About Page
```
http://localhost:3000/about
```

### Check Console
- Open browser DevTools (F12)
- Go to Console tab
- Look for any fetch errors
- Check if fallback data is being used

### Test RLS Fallback
1. Temporarily restrict Supabase RLS
2. Refresh About page
3. Should show fallback data with warning message
4. Page should remain functional

## Common Issues & Fixes

### Issue: Blank About page
**Fix**: Check browser console for errors, verify Supabase connection

### Issue: Fallback data always showing
**Fix**: Check Supabase RLS policies, verify user permissions

### Issue: Contact info not showing
**Fix**: Update palika record in admin panel with contact details

### Issue: Location showing "N/A"
**Fix**: Verify district/province relationships in Supabase

## File Locations

```
m-place/
├── src/
│   ├── pages/
│   │   └── About.tsx                 ← New About page
│   ├── api/
│   │   └── palikaProfile.ts          ← New API functions
│   ├── components/
│   │   └── Navbar.tsx                ← Updated with About link
│   └── App.tsx                       ← Updated with /about route
```

## Key Hooks Used

- `useCurrentPalika()` - Get current user's palika
- `useState()` - Manage profile data and loading state
- `useEffect()` - Fetch data on component mount

## UI Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Layout
- `MapPin`, `Users`, `Award`, `AlertCircle` - Icons
- Tailwind CSS - Styling

## Environment Variables

No new environment variables needed. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Next Steps

1. **Test the page**: Visit `/about` and verify data displays
2. **Update admin panel**: Add palika contact info if missing
3. **Monitor errors**: Check browser console for any issues
4. **Gather feedback**: Get user feedback on page layout
5. **Enhance**: Add images, social links, or more details

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Review this guide
5. Check ABOUT_PAGE_IMPLEMENTATION.md for detailed info
