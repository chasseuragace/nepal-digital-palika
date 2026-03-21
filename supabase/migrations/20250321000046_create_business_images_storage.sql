-- ==========================================
-- MIGRATION: Create Business Images Storage
-- ==========================================
-- DATE: 2026-03-21
-- PURPOSE: Set up storage bucket for business profile images
-- RELATED: Phase 6.4 - Business Profile Management

-- ==========================================
-- 1. CREATE STORAGE BUCKET
-- ==========================================

-- Create business-images bucket for storing business profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. STORAGE RLS POLICIES
-- ==========================================

-- Policy 1: Public read access to all images
-- Anyone can view business images
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'business-images')
  WITH CHECK (false);

-- Policy 2: Authenticated users can upload images
-- Only authenticated users can upload images to their business folder
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'business-images' 
    AND auth.role() = 'authenticated'
  );

-- Policy 3: Users can delete their own business images
-- Users can only delete images from their own business folder
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'business-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM businesses 
      WHERE owner_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ==========================================
-- NOTES
-- ==========================================
--
-- Storage bucket structure:
--   business-images/
--   ├── {business_id}/
--   │   ├── {timestamp}.jpg
--   │   ├── {timestamp}.png
--   │   └── ...
--
-- Image upload flow:
--   1. User uploads image via BusinessProfileEdit page
--   2. uploadBusinessImage() function stores in business-images/{businessId}/{timestamp}.{ext}
--   3. Public URL is returned and stored in businesses.images array
--   4. Images are displayed in BusinessProfile view page
--
-- Image deletion flow:
--   1. User clicks delete on image in BusinessProfileEdit page
--   2. deleteBusinessImage() function extracts file path from URL
--   3. File is deleted from storage via RLS policy
--   4. Image URL is removed from businesses.images array
--
-- RLS Enforcement:
--   - Public can READ all images (for marketplace display)
--   - Authenticated users can UPLOAD to any business folder
--   - Users can DELETE only images from their own business folder
--   - Deletion is enforced by checking if business owner_user_id = auth.uid()
--
