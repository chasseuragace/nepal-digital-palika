# Palika Gallery - Quick Start Guide

## What is Palika Gallery?

A file management system for palika profiles that allows uploading and organizing:
- **Images**: JPG, PNG, WebP, GIF (up to 50MB)
- **Documents**: PDF files (up to 50MB)

## Quick Setup

### 1. Apply Database Migrations
```bash
cd Nepal_Digital_Tourism_Infrastructure_Documentation
supabase db push
```

This creates:
- `palika_gallery` table
- RLS policies
- `palika-gallery` storage bucket

### 2. Verify Installation
```sql
-- Check table exists
SELECT COUNT(*) FROM palika_gallery;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'palika-gallery';

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'palika_gallery';
```

### 3. Test in Admin Panel
1. Login as palika admin
2. Click "Palika Gallery" in navigation
3. Upload test image
4. Verify in database

## File Locations

| File | Purpose |
|------|---------|
| `app/api/palika-gallery/route.ts` | GET, POST, PUT, DELETE endpoints |
| `app/api/palika-gallery/upload/route.ts` | File upload endpoint |
| `app/palika-gallery/page.tsx` | Gallery management page |
| `components/PalikaGallery.tsx` | Reusable gallery component |
| `components/AdminLayout.tsx` | Navigation link added |
| `supabase/migrations/20250322000050_*.sql` | Database table |
| `supabase/migrations/20250322000051_*.sql` | RLS policies |
| `supabase/migrations/20250322000052_*.sql` | Storage bucket |

## Using the Gallery

### For Admins
1. Go to "Palika Gallery" in admin panel
2. Click "Images" or "Documents" tab
3. Upload files
4. Set featured image (images only)
5. Delete files as needed

### For Developers

#### Import Component
```tsx
import PalikaGallery from '@/components/PalikaGallery'
```

#### Gallery Management Mode
```tsx
<PalikaGallery palikaId={10} />
```

#### Image Picker Mode
```tsx
<PalikaGallery 
  palikaId={10}
  selectMode={true}
  onImageSelect={(item) => {
    // Use item.storage_path to get public URL
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
  }}
/>
```

## API Endpoints

### Upload File
```bash
POST /api/palika-gallery/upload
Content-Type: multipart/form-data

file: <binary>
palika_id: 10
file_type: image
display_name: My Image
```

### Get Gallery
```bash
GET /api/palika-gallery?palika_id=10&file_type=image
```

### Update Item
```bash
PUT /api/palika-gallery
Content-Type: application/json

{
  "id": "uuid",
  "is_featured": true,
  "display_name": "New Name"
}
```

### Delete Item
```bash
DELETE /api/palika-gallery?id=uuid
```

## Integration with Palika Profile

Add gallery to palika profile form:

```tsx
import PalikaGallery from '@/components/PalikaGallery'

export default function PalikaProfilePage() {
  const [featuredImage, setFeaturedImage] = useState('')

  return (
    <>
      {/* Gallery section */}
      <div className="card">
        <h2>Gallery</h2>
        <PalikaGallery 
          palikaId={palikaId}
          selectMode={true}
          onImageSelect={(item) => {
            const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
            setFeaturedImage(url)
          }}
        />
      </div>

      {/* Use selected image */}
      <input 
        type="text" 
        value={featuredImage}
        placeholder="Featured image URL"
      />
    </>
  )
}
```

## Database Schema

```sql
CREATE TABLE palika_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL REFERENCES palikas(id),
  file_name VARCHAR NOT NULL,
  file_type VARCHAR CHECK (file_type IN ('image', 'document')),
  mime_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Access Control

| Role | Can View | Can Upload | Can Delete |
|------|----------|-----------|-----------|
| Palika Admin | Own palika only | Own palika only | Own palika only |
| Super Admin | All palikas | All palikas | All palikas |
| Public | All items | ❌ | ❌ |

## File Validation

| Aspect | Limit |
|--------|-------|
| Max file size | 50MB |
| Image formats | JPG, PNG, WebP, GIF |
| Document formats | PDF |
| Featured images | 1 per palika |

## Troubleshooting

### Upload Fails
- Check file size (max 50MB)
- Check file type (allowed types only)
- Check browser console for errors

### Files Not Appearing
- Verify palika_id is correct
- Check RLS policies
- Refresh page

### Delete Fails
- Verify file exists
- Check RLS policies
- Check database permissions

## Next Steps

1. ✅ Apply migrations: `supabase db push`
2. ✅ Test upload in admin panel
3. ✅ Integrate with palika profile
4. ✅ Test image picker mode
5. ✅ Deploy to production

## Documentation

- **Full Guide**: `PALIKA_GALLERY_IMPLEMENTATION.md`
- **Feature Summary**: `PALIKA_GALLERY_FEATURE_SUMMARY.md`
- **This Guide**: `PALIKA_GALLERY_QUICK_START.md`

---

**Last Updated**: March 22, 2026
