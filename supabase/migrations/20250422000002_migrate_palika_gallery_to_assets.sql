-- Migrate existing palika_gallery data to new generic assets table
-- This maintains backward compatibility while supporting the new schema

INSERT INTO public.assets (
  id,
  entity_type,
  entity_id,
  file_name,
  file_type,
  mime_type,
  file_size,
  storage_path,
  display_name,
  description,
  is_featured,
  sort_order,
  created_by,
  created_at,
  updated_at
)
SELECT
  id,
  'palika'::public.asset_entity_type,
  palika_id,
  file_name,
  CAST(file_type AS public.asset_file_type),
  mime_type,
  file_size,
  storage_path,
  display_name,
  description,
  is_featured,
  sort_order,
  uploaded_by,
  created_at,
  updated_at
FROM public.palika_gallery
ON CONFLICT (storage_path) DO NOTHING;
