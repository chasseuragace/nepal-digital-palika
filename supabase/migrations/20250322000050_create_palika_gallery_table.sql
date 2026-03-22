-- Create palika_gallery table for managing images and documents in palika profiles
-- Supports images (jpg, png, webp) and documents (pdf)
-- Each palika can have multiple gallery items organized by type

CREATE TABLE IF NOT EXISTS palika_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL REFERENCES palikas(id) ON DELETE CASCADE,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL CHECK (file_type IN ('image', 'document')),
  mime_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  storage_path VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_palika_gallery_palika_id ON palika_gallery(palika_id);
CREATE INDEX IF NOT EXISTS idx_palika_gallery_file_type ON palika_gallery(palika_id, file_type);
CREATE INDEX IF NOT EXISTS idx_palika_gallery_sort_order ON palika_gallery(palika_id, sort_order);

-- Add comments
COMMENT ON TABLE palika_gallery IS 'Gallery for palika profile images and documents';
COMMENT ON COLUMN palika_gallery.file_type IS 'Type of file: image or document';
COMMENT ON COLUMN palika_gallery.mime_type IS 'MIME type of the file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN palika_gallery.storage_path IS 'Path in Supabase storage bucket (palika-gallery/palika_id/filename)';
COMMENT ON COLUMN palika_gallery.is_featured IS 'Whether this is a featured/hero image for the gallery';
COMMENT ON COLUMN palika_gallery.sort_order IS 'Display order in gallery (lower numbers first)';
