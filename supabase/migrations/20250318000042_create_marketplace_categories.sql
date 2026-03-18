-- ==========================================
-- MIGRATION: Create Marketplace Categories Table
-- ==========================================
-- Purpose: Product categories for marketplace, tier-aware
-- Each category has a min_tier_level that gates access

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id SERIAL PRIMARY KEY,

  -- Category identity
  name_en VARCHAR(150) NOT NULL,
  name_ne VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  description_ne TEXT,

  -- Tier association (CRITICAL)
  min_tier_level INTEGER NOT NULL CHECK (min_tier_level IN (1, 2, 3)),
  -- min_tier_level=1: Available in Tier 1, 2, 3
  -- min_tier_level=2: Available in Tier 2, 3 only
  -- min_tier_level=3: Available in Tier 3 only

  -- Hierarchy (optional parent for subcategories)
  parent_id INTEGER REFERENCES public.marketplace_categories(id),

  -- Display
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug, min_tier_level)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_tier ON public.marketplace_categories(min_tier_level);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON public.marketplace_categories(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON public.marketplace_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON public.marketplace_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_order ON public.marketplace_categories(display_order);

COMMENT ON TABLE public.marketplace_categories IS 'Product categories for marketplace, tier-gated by min_tier_level';
COMMENT ON COLUMN public.marketplace_categories.min_tier_level IS 'Minimum tier required to list in this category (1, 2, or 3)';
COMMENT ON COLUMN public.marketplace_categories.parent_id IS 'For hierarchical categories (subcategories)';
