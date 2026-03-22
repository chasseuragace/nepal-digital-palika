-- Create palika_profiles table for digital profiling of palikas
-- Stores descriptions, images, highlights, tourism info, and demographics

CREATE TABLE IF NOT EXISTS palika_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL UNIQUE REFERENCES palikas(id) ON DELETE CASCADE,
  description_en TEXT,
  description_ne TEXT,
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb COMMENT 'Array of {title, description} objects',
  tourism_info JSONB DEFAULT '{
    "best_time_to_visit": null,
    "accessibility": null,
    "languages": [],
    "currency": "NPR"
  }'::jsonb COMMENT 'Tourism-related information',
  demographics JSONB DEFAULT '{
    "population": 0,
    "area_sq_km": 0,
    "established_year": 0
  }'::jsonb COMMENT 'Demographic information',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_palika_profiles_palika_id ON palika_profiles(palika_id);

-- Add comment to table
COMMENT ON TABLE palika_profiles IS 'Digital profiles for palikas with descriptions, images, and metadata';
