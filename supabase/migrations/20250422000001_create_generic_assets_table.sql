-- Create generic assets table to replace entity-specific galleries
-- Supports blog_post, event, heritage_site, palika, notification entities

CREATE TYPE public.asset_entity_type AS ENUM ('blog_post', 'event', 'heritage_site', 'palika', 'notification');
CREATE TYPE public.asset_file_type AS ENUM ('image', 'document');

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.asset_entity_type NOT NULL,
  entity_id integer NOT NULL,
  file_name character varying NOT NULL,
  file_type public.asset_file_type NOT NULL,
  mime_type character varying NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0),
  storage_path character varying NOT NULL UNIQUE,
  display_name character varying,
  description text,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_assets_entity_type_id ON public.assets(entity_type, entity_id);
CREATE INDEX idx_assets_entity_type_id_file_type ON public.assets(entity_type, entity_id, file_type);
CREATE INDEX idx_assets_sort_order ON public.assets(entity_type, entity_id, sort_order);
CREATE INDEX idx_assets_storage_path ON public.assets(storage_path);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "assets_public_read" ON public.assets
  FOR SELECT
  USING (true);

CREATE POLICY "assets_authenticated_write" ON public.assets
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "assets_authenticated_update" ON public.assets
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

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

CREATE TRIGGER assets_updated_at_trigger
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_assets_timestamp();
