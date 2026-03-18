-- ==========================================
-- MIGRATION: Create Business Categories Table
-- ==========================================
-- Purpose: Define business types (not product categories)
-- These are used to categorize businesses themselves

CREATE TABLE IF NOT EXISTS public.business_categories (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_ne VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  description_ne TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug)
);

CREATE INDEX IF NOT EXISTS idx_business_categories_active ON public.business_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_business_categories_slug ON public.business_categories(slug);
CREATE INDEX IF NOT EXISTS idx_business_categories_order ON public.business_categories(display_order);

-- Update businesses table to reference business_categories
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS business_category_id INTEGER
  REFERENCES public.business_categories(id);

CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(business_category_id);

COMMENT ON TABLE public.business_categories IS 'Types of businesses (accommodation, food, producer, etc.)';
COMMENT ON COLUMN public.business_categories.name_en IS 'English name of business type';
COMMENT ON COLUMN public.business_categories.name_ne IS 'Nepali name of business type';
COMMENT ON COLUMN public.business_categories.slug IS 'URL-friendly identifier';
