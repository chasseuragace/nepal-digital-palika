-- Remove the tier gate on marketplace_categories.
-- Rationale: tier impact should be a later dynamic-config concern, not a hardcoded
-- schema constraint. The column is retained (nullable, no CHECK) so that an eventual
-- dynamic-policy layer can still read it — but nothing in-schema gates on it any more.

ALTER TABLE public.marketplace_categories
  DROP CONSTRAINT IF EXISTS marketplace_categories_min_tier_level_check;

ALTER TABLE public.marketplace_categories
  ALTER COLUMN min_tier_level DROP NOT NULL;

-- Drop the UNIQUE(slug, min_tier_level) and replace with UNIQUE(slug) so categories
-- remain uniquely identifiable by slug alone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.marketplace_categories'::regclass
      AND conname = 'marketplace_categories_slug_min_tier_level_key'
  ) THEN
    ALTER TABLE public.marketplace_categories
      DROP CONSTRAINT marketplace_categories_slug_min_tier_level_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_categories_slug_key
  ON public.marketplace_categories(slug);

COMMENT ON COLUMN public.marketplace_categories.min_tier_level IS
  'Deprecated tier gate. Nullable since migration 20260421000065. Kept as metadata for future dynamic policy layer; do not use to gate behaviour.';
