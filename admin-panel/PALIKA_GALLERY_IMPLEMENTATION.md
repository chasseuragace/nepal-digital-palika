# Palika Gallery Implementation Guide

## Overview

The Palika Gallery system allows palika administrators to upload, manage, and organize images and PDF documents for their palika profiles. The gallery supports two types of files:
- **Images**: JPG, PNG, WebP, GIF (up to 50MB each)
- **Documents**: PDF files (up to 50MB each)

## Architecture

### Database Layer

#### Table: `palika_gallery`
Stores metadata about uploaded files with the following columns:
- `id` (UUID) - Primary key
- `palika_id` (INTEGER) - Foreign key to palikas table
- `file_name` (VARCHAR) - Original file name
- `file_type` (VARCHAR) - Either 'image' or 'document'
- `mime_type` (VARCHAR) - MIME type of the file
- `file_size` (INTEGER) - Size in bytes
- `storage_path` (VARCHAR) - Path in Supabase storage
- `display_name` (VARCHAR) - User-friendly name
- `description` (TEXT) - Optional description
- `is_featured` (BOOLEAN) - Whether this is the featured/hero image
- `sort_order` (INTEGER) - Display order in gallery
- `uploaded_by` (UUID) - Admin who uploaded the file
- `created_at` (TIMESTAMPTZ) - Upload timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### Indexes
- `idx_palika_gallery_palika_id` - Fast lookup by palika
- `idx_palika_gallery_file_type` - Fast filtering by file type
- `idx_palika_gallery_sort_order` - Fast sorting

#### RLS Policies
- Palika admins can view/insert/update/delete their own palika's gallery
- Super admins can view/insert/update/delete all galleries
- Public can view all gallery items (read-only)

### Storage Layer

#### Bucket: `palika-gallery`
- Public bucket for storing uploaded files
- File size limit: 50MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, application/pdf
- Storage path format: `palika_{palika_id}/{timestamp}_{random}.{extension}`

#### Storage Policies
- Authenticated users can upload to their palika's folder
- Authenticated users can read/update/delete their files
- Public can read all files (for viewing gallery)

### API Layer

#### Endpoints

**GET** `/api/palika-gallery`
- Query params: `palika_id` (required), `file_type` (optional: 'image' or 'document')
- Returns: Array of gallery items
- Auth: Palika admin or super admin

**POST** `/api/palika-gallery/upload`
- Form data: `file`, `palika_id`, `file_type`, `display_name`
- Returns: Created gallery item with public URL
- Auth: Palika admin or super admin
- Validates file type and size

**PUT** `/api/palika-gallery`
- Body: `{ id, display_name?, description?, is_featured?, sort_order? }`
- Returns: Updated gallery item
- Auth: Palika admin or super admin

**DELETE** `/api/palika-gallery`
- Query param: `id` (required)
- Deletes from both storage and database
- Returns: Success message
- Auth: Palika admin or super admin

### Frontend Layer

#### Component: `PalikaGallery`
Reusable gallery component with:
- Image/Document tabs
- File upload with drag-and-drop support
- Gallery grid view
- Featured image selection
- Delete functionality
- Optional select mode for image picker

#### Page: `/palika-gallery`
Dedicated gallery management page for admins

## File Structure

```
admin-panel/
├── app/
│   ├── api/
│   │   └── palika-gallery/
│   │       ├── route.ts          # GET, POST, PUT, DELETE endpoints
│   │       └── upload/
│   │           └── route.ts      # File upload endpoint
│   └── palika-gallery/
│       └── page.tsx              # Gallery management page
├── components/
│   ├── AdminLayout.tsx           # Updated with gallery link
│   └── PalikaGallery.tsx         # Reusable gallery component
└── Documentation/
    └── PALIKA_GALLERY_IMPLEMENTATION.md

supabase/migrations/
├── 20250322000050_create_palika_gallery_table.sql
├── 20250322000051_enable_rls_palika_gallery.sql
└── 20250322000052_create_palika_gallery_storage.sql
```

## Usage

### For Palika Admins

1. **Access Gallery**
   - Login to admin panel
   - Click "Palika Gallery" in navigation
   - See gallery management interface

2. **Upload Images**
   - Click "Images" tab
   - Click upload area or select files
   - Supported formats: JPG, PNG, WebP, GIF
   - Max size: 50MB per file

3. **Upload Documents**
   - Click "Documents" tab
   - Click upload area or select files
   - Supported format: PDF
   - Max size: 50MB per file

4. **Manage Gallery**
   - Set featured image (for images only)
   - Delete items
   - View file sizes and names

### For Developers

#### Using the Gallery Component

```tsx
import PalikaGallery from '@/components/PalikaGallery'

// Gallery management mode
<PalikaGallery palikaId={10} />

// Image picker mode
<PalikaGallery 
  palikaId={10}
  selectMode={true}
  onImageSelect={(item) => {
    console.log('Selected image:', item)
    // Use item.storage_path or construct public URL
  }}
/>
```

#### Getting Public URLs

```tsx
const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
```

#### API Usage

**Upload File**
```bash
curl -X POST http://localhost:3001/api/palika-gallery/upload \
  -F "file=@image.jpg" \
  -F "palika_id=10" \
  -F "file_type=image" \
  -F "display_name=My Image"
```

**Get Gallery**
```bash
curl "http://localhost:3001/api/palika-gallery?palika_id=10&file_type=image"
```

**Update Gallery Item**
```bash
curl -X PUT http://localhost:3001/api/palika-gallery \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-here",
    "display_name": "Updated Name",
    "is_featured": true
  }'
```

**Delete Gallery Item**
```bash
curl -X DELETE "http://localhost:3001/api/palika-gallery?id=uuid-here"
```

## Integration with Palika Profile

The gallery can be integrated into the palika profile form to allow image selection:

```tsx
import PalikaGallery from '@/components/PalikaGallery'

export default function PalikaProfilePage() {
  const [selectedImage, setSelectedImage] = useState<string>('')

  return (
    <>
      {/* Gallery in select mode */}
      <PalikaGallery 
        palikaId={palikaId}
        selectMode={true}
        onImageSelect={(item) => {
          const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
          setSelectedImage(publicUrl)
        }}
      />

      {/* Use selected image in form */}
      <input 
        type="text" 
        value={selectedImage}
        onChange={(e) => setSelectedImage(e.target.value)}
        placeholder="Featured image URL"
      />
    </>
  )
}
```

## Database Migrations

### Migration 1: Create Table
File: `20250322000050_create_palika_gallery_table.sql`
- Creates `palika_gallery` table
- Creates indexes for performance
- Adds comments

### Migration 2: Enable RLS
File: `20250322000051_enable_rls_palika_gallery.sql`
- Enables RLS on table
- Creates 9 policies for access control

### Migration 3: Create Storage
File: `20250322000052_create_palika_gallery_storage.sql`
- Creates `palika-gallery` storage bucket
- Creates storage policies

## Deployment Steps

1. **Apply Migrations**
   ```bash
   cd Nepal_Digital_Tourism_Infrastructure_Documentation
   supabase db push
   ```

2. **Verify Database**
   ```sql
   SELECT * FROM palika_gallery LIMIT 1;
   SELECT policyname FROM pg_policies WHERE tablename = 'palika_gallery';
   ```

3. **Test Upload**
   - Login as palika admin
   - Navigate to Palika Gallery
   - Upload test image
   - Verify in database and storage

4. **Test Integration**
   - Open Palika Profile page
   - Use gallery image picker
   - Select image for featured image
   - Save profile

## Limitations & Future Enhancements

### Current Limitations
1. No image cropping/editing
2. No drag-to-reorder functionality
3. No bulk upload progress tracking
4. No image compression
5. No watermarking

### Future Enhancements
1. Image cropping tool
2. Drag-to-reorder gallery items
3. Bulk upload with progress bar
4. Automatic image compression
5. Image watermarking
6. Image optimization (WebP conversion)
7. Gallery templates
8. Image metadata extraction
9. Duplicate detection
10. Storage usage analytics

## Troubleshooting

### Upload Fails
- Check file size (max 50MB)
- Check file type (allowed types only)
- Check storage bucket permissions
- Check RLS policies

### Files Not Appearing
- Verify palika_id is correct
- Check RLS policies allow access
- Verify storage path is correct
- Check browser console for errors

### Delete Fails
- Verify file exists in storage
- Check RLS policies allow delete
- Check database record exists
- Check storage permissions

## Security Considerations

1. **File Type Validation**
   - Validated on both client and server
   - MIME type checking
   - File extension validation

2. **File Size Limits**
   - 50MB per file limit
   - Enforced on server

3. **Access Control**
   - RLS policies enforce access
   - Palika admins can only access their palika
   - Super admins can access all

4. **Storage Security**
   - Files stored in public bucket (for viewing)
   - Storage policies enforce access
   - Authenticated users only

## Performance Optimization

1. **Indexes**
   - Index on palika_id for fast lookups
   - Index on file_type for filtering
   - Index on sort_order for sorting

2. **Pagination**
   - Consider adding pagination for large galleries
   - Limit initial load to 20 items

3. **Caching**
   - Cache gallery list in component state
   - Invalidate on upload/delete

4. **Image Optimization**
   - Consider lazy loading images
   - Use WebP format for better compression
   - Implement image thumbnails

---

**Last Updated**: March 22, 2026
**Status**: Ready for Implementation
