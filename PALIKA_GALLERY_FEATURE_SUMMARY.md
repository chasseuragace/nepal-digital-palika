# Palika Gallery Feature - Complete Implementation

## Overview

A comprehensive gallery management system for palika profiles that allows administrators to upload, organize, and manage images and PDF documents. The gallery includes:
- Image upload (JPG, PNG, WebP, GIF)
- Document upload (PDF)
- Featured image selection
- Gallery organization with sort order
- Reusable image picker component
- Full RLS access control

## What's Been Created

### 1. Database Tables ✅
- **Table**: `palika_gallery` with 14 columns
- **Columns**: id, palika_id, file_name, file_type, mime_type, file_size, storage_path, display_name, description, is_featured, sort_order, uploaded_by, created_at, updated_at
- **Indexes**: 3 performance indexes
- **RLS**: 9 policies for access control

### 2. Storage Bucket ✅
- **Bucket**: `palika-gallery` (public)
- **File Size Limit**: 50MB per file
- **Allowed Types**: Images (JPEG, PNG, WebP, GIF) and PDFs
- **Storage Policies**: 5 policies for access control

### 3. API Endpoints ✅
- **GET** `/api/palika-gallery` - Fetch gallery items
- **POST** `/api/palika-gallery/upload` - Upload files
- **PUT** `/api/palika-gallery` - Update gallery items
- **DELETE** `/api/palika-gallery` - Delete gallery items

### 4. Frontend Components ✅
- **Component**: `PalikaGallery.tsx` - Reusable gallery component
- **Page**: `/palika-gallery/page.tsx` - Gallery management page
- **Features**: Tabs for images/documents, upload, delete, featured selection

### 5. Navigation ✅
- Added "Palika Gallery" link to AdminLayout
- Only visible to palika_admin and super_admin roles

### 6. Database Migrations ✅
- `20250322000050_create_palika_gallery_table.sql` - Table creation
- `20250322000051_enable_rls_palika_gallery.sql` - RLS policies
- `20250322000052_create_palika_gallery_storage.sql` - Storage bucket

## Key Features

### File Management
- Upload images and documents
- Organize by type (images/documents tabs)
- Set featured image for gallery
- Delete files (from storage and database)
- View file sizes and names

### Access Control
- Palika admins can only manage their palika's gallery
- Super admins can manage all galleries
- Public can view gallery items
- RLS enforces all access rules

### Image Picker Mode
- Reusable component for selecting images
- Can be integrated into forms
- Returns selected image data
- Supports custom callbacks

### File Validation
- File type validation (client & server)
- File size validation (50MB limit)
- MIME type checking
- Extension validation

## File Structure

```
admin-panel/
├── app/
│   ├── api/palika-gallery/
│   │   ├── route.ts              # GET, POST, PUT, DELETE
│   │   └── upload/route.ts       # File upload
│   └── palika-gallery/
│       └── page.tsx              # Gallery page
├── components/
│   ├── AdminLayout.tsx           # Updated with gallery link
│   └── PalikaGallery.tsx         # Gallery component
└── PALIKA_GALLERY_IMPLEMENTATION.md

supabase/migrations/
├── 20250322000050_create_palika_gallery_table.sql
├── 20250322000051_enable_rls_palika_gallery.sql
└── 20250322000052_create_palika_gallery_storage.sql
```

## Database Schema

```sql
CREATE TABLE palika_gallery (
  id UUID PRIMARY KEY,
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

## API Examples

### Upload File
```bash
curl -X POST http://localhost:3001/api/palika-gallery/upload \
  -F "file=@image.jpg" \
  -F "palika_id=10" \
  -F "file_type=image" \
  -F "display_name=My Image"
```

### Get Gallery
```bash
curl "http://localhost:3001/api/palika-gallery?palika_id=10&file_type=image"
```

### Update Gallery Item
```bash
curl -X PUT http://localhost:3001/api/palika-gallery \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "is_featured": true,
    "display_name": "Updated Name"
  }'
```

### Delete Gallery Item
```bash
curl -X DELETE "http://localhost:3001/api/palika-gallery?id=uuid"
```

## Component Usage

### Gallery Management
```tsx
import PalikaGallery from '@/components/PalikaGallery'

<PalikaGallery palikaId={10} />
```

### Image Picker
```tsx
<PalikaGallery 
  palikaId={10}
  selectMode={true}
  onImageSelect={(item) => {
    console.log('Selected:', item)
  }}
/>
```

## Integration with Palika Profile

The gallery can be integrated into the palika profile form:

```tsx
// In palika-profile/page.tsx
import PalikaGallery from '@/components/PalikaGallery'

// Add gallery section
<div className="card">
  <h2>Gallery</h2>
  <PalikaGallery 
    palikaId={palikaId}
    selectMode={true}
    onImageSelect={(item) => {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
      setFormData(prev => ({
        ...prev,
        featured_image: url
      }))
    }}
  />
</div>
```

## Deployment Steps

1. **Apply Migrations**
   ```bash
   cd Nepal_Digital_Tourism_Infrastructure_Documentation
   supabase db push
   ```

2. **Verify Setup**
   ```sql
   SELECT COUNT(*) FROM palika_gallery;
   SELECT * FROM storage.buckets WHERE name = 'palika-gallery';
   ```

3. **Test Upload**
   - Login as palika admin
   - Go to Palika Gallery
   - Upload test image
   - Verify in database

4. **Test Integration**
   - Open Palika Profile
   - Use gallery image picker
   - Select image
   - Save profile

## Testing Checklist

- [ ] Upload image successfully
- [ ] Upload PDF successfully
- [ ] View gallery items
- [ ] Set featured image
- [ ] Delete gallery item
- [ ] Switch between image/document tabs
- [ ] Verify RLS access control
- [ ] Test image picker mode
- [ ] Verify file size validation
- [ ] Verify file type validation
- [ ] Test on mobile device
- [ ] Test with large files
- [ ] Test with multiple files

## Security Features

1. **File Type Validation**
   - Client-side validation
   - Server-side MIME type checking
   - Extension validation

2. **File Size Limits**
   - 50MB per file
   - Enforced on server

3. **Access Control**
   - RLS policies on database
   - Storage policies on bucket
   - Palika admins isolated to their palika

4. **Storage Security**
   - Public bucket for viewing
   - Authenticated users only for upload/delete
   - Unique storage paths prevent collisions

## Performance Considerations

1. **Indexes**
   - Index on palika_id for fast lookups
   - Index on file_type for filtering
   - Index on sort_order for sorting

2. **Caching**
   - Gallery list cached in component state
   - Invalidated on upload/delete

3. **Lazy Loading**
   - Consider implementing for large galleries
   - Load images on demand

4. **Image Optimization**
   - Consider WebP format
   - Implement thumbnails
   - Compress on upload

## Future Enhancements

1. Image cropping tool
2. Drag-to-reorder functionality
3. Bulk upload with progress
4. Image compression
5. Image watermarking
6. Gallery templates
7. Image metadata extraction
8. Duplicate detection
9. Storage usage analytics
10. Advanced search/filtering

## Known Limitations

1. No image cropping/editing
2. No drag-to-reorder
3. No bulk upload progress
4. No image compression
5. No watermarking
6. No pagination (loads all items)
7. No search functionality
8. No image optimization

## Support & Documentation

- **Implementation Guide**: `PALIKA_GALLERY_IMPLEMENTATION.md`
- **API Documentation**: See API Examples section
- **Component Usage**: See Component Usage section
- **Integration Guide**: See Integration with Palika Profile section

## Status

✅ **Complete and Ready for Testing**

All components have been created and are ready for:
1. Database migration application
2. Manual testing
3. Integration with palika profile
4. Production deployment

---

**Feature**: Palika Gallery Management
**Status**: ✅ Complete
**Last Updated**: March 22, 2026
**Version**: 1.0.0
