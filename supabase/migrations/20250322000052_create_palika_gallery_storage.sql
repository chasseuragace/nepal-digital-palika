-- Create storage bucket for palika gallery files (images and documents)
-- This bucket will store all images and PDFs for palika profiles

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'palika-gallery',
  'palika-gallery',
  true,
  52428800, -- 50MB max file size
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for palika-gallery bucket
-- Allow authenticated users to upload to their palika's folder
CREATE POLICY "Allow authenticated users to upload to palika-gallery"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'palika-gallery' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to read from palika-gallery
CREATE POLICY "Allow authenticated users to read palika-gallery"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'palika-gallery');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update palika-gallery"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'palika-gallery' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete palika-gallery"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'palika-gallery' AND
    auth.role() = 'authenticated'
  );

-- Allow public to read from palika-gallery (for viewing gallery)
CREATE POLICY "Allow public to read palika-gallery"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'palika-gallery');
