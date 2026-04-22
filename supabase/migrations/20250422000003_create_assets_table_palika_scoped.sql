-- Create standardized assets table scoped to palika
-- Replaces the entity-specific palika_gallery table

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_file_type') THEN
        CREATE TYPE public.asset_file_type AS ENUM ('image', 'document');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id integer REFERENCES public.palikas(id) ON DELETE CASCADE,
  file_name character varying NOT NULL,
  file_type public.asset_file_type NOT NULL,
  mime_type character varying NOT NULL,
  file_size integer NOT NULL CHECK (file_size >= 0),
  storage_path character varying NOT NULL UNIQUE,
  public_url text NOT NULL,
  display_name character varying,
  description text,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_assets_palika_id ON public.assets(palika_id);
CREATE INDEX IF NOT EXISTS idx_assets_palika_id_file_type ON public.assets(palika_id, file_type);
CREATE INDEX IF NOT EXISTS idx_assets_is_featured_sort_order ON public.assets(is_featured DESC, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_assets_storage_path ON public.assets(storage_path);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to read assets
CREATE POLICY "assets_public_read" ON public.assets
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert assets
CREATE POLICY "assets_authenticated_write" ON public.assets
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update assets
CREATE POLICY "assets_authenticated_update" ON public.assets
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete assets
CREATE POLICY "assets_authenticated_delete" ON public.assets
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_assets_timestamp()
RETURNS TRIGGER AS $$ 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_updated_at_trigger ON public.assets;
CREATE TRIGGER assets_updated_at_trigger
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_assets_timestamp();
