-- ==========================================
-- MIGRATION: Create Marketplace Products Table
-- ==========================================
-- Purpose: Product listings in marketplace
-- Supports tier-based auto-publishing

CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  palika_id INTEGER NOT NULL REFERENCES public.palikas(id),

  -- Product Identity
  name_en VARCHAR(300) NOT NULL,
  name_ne VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,

  -- Category (marketplace, tier-aware)
  marketplace_category_id INTEGER NOT NULL
    REFERENCES public.marketplace_categories(id),

  -- Description
  short_description TEXT,
  short_description_ne TEXT,
  full_description TEXT,
  full_description_ne TEXT,

  -- Media
  featured_image TEXT,
  images JSONB DEFAULT '[]',

  -- Pricing
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NPR',
  unit VARCHAR(50),

  -- Stock/Availability
  quantity_available INTEGER,
  unit_of_measurement VARCHAR(100),
  is_in_stock BOOLEAN DEFAULT true,

  -- Product Details (flexible)
  details JSONB DEFAULT '{}',

  -- Status & Publishing
  status VARCHAR(40) DEFAULT 'published'
    CHECK (status IN ('published', 'archived', 'out_of_stock')),
  is_featured BOOLEAN DEFAULT false,

  -- Verification (Optional - Tier 2+ only)
  requires_approval BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES public.admin_users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,

  -- Audit
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug, palika_id)
);

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(marketplace_category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_business ON public.marketplace_products(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_palika ON public.marketplace_products(palika_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON public.marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_approved ON public.marketplace_products(is_approved);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_featured ON public.marketplace_products(is_featured);

COMMENT ON TABLE public.marketplace_products IS 'Product listings in marketplace, tier-gated';
COMMENT ON COLUMN public.marketplace_products.requires_approval IS 'Tier 1: always false. Tier 2+: configurable';
COMMENT ON COLUMN public.marketplace_products.is_approved IS 'Tier 1: always true. Tier 2+: depends on approval';

-- ==========================================
-- ENABLE RLS
-- ==========================================
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own products
DROP POLICY IF EXISTS "marketplace_products_owner_access" ON public.marketplace_products;
CREATE POLICY "marketplace_products_owner_access" ON public.marketplace_products
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    )
  );

-- Palika staff can manage products in their palika
DROP POLICY IF EXISTS "marketplace_products_palika_staff" ON public.marketplace_products;
CREATE POLICY "marketplace_products_palika_staff" ON public.marketplace_products
  FOR ALL
  USING (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM public.admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('manage_marketplace_products')
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM public.admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('manage_marketplace_products')
    )
  );

-- Public can read published products
DROP POLICY IF EXISTS "marketplace_products_public_read" ON public.marketplace_products;
CREATE POLICY "marketplace_products_public_read" ON public.marketplace_products
  FOR SELECT
  USING (status = 'published' AND is_approved = true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_products TO authenticated;
GRANT SELECT ON public.marketplace_products TO anon;
