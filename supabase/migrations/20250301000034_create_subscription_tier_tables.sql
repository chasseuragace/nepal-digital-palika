-- ==========================================
-- MIGRATION: Create Subscription Tier Tables
-- ==========================================
-- Complete tier-based feature architecture with:
-- - Subscription tiers, features, and mappings
-- - Audit trail for tier assignments
-- - Full RLS policies and permissions
-- - Audit trigger for changes

-- 1. SUBSCRIPTION_TIERS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  cost_per_month NUMERIC(10, 2),
  cost_per_year NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_tiers IS 'Service tiers: Basic, Tourism, Premium';
COMMENT ON COLUMN public.subscription_tiers.name IS 'Internal name: basic, tourism, premium';
COMMENT ON COLUMN public.subscription_tiers.display_name IS 'User-friendly display name';

-- 2. FEATURES TABLE
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.features IS 'Platform features that can be enabled/disabled by tier';
COMMENT ON COLUMN public.features.code IS 'Machine-readable feature code (e.g., qr_print_support)';

-- 3. TIER_FEATURES MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.tier_features (
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  unlocked_at_version VARCHAR(20),
  PRIMARY KEY (tier_id, feature_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tier_features IS 'Maps which features are available in each tier';

-- 4. TIER ASSIGNMENT LOG (audit trail)
CREATE TABLE IF NOT EXISTS public.tier_assignment_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  palika_id INTEGER NOT NULL REFERENCES public.palikas(id) ON DELETE CASCADE,
  old_tier_id UUID REFERENCES public.subscription_tiers(id),
  new_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  assigned_by UUID REFERENCES public.admin_users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tier_assignment_log IS 'Audit trail for palika tier changes';

-- 5. UPDATE PALIKAS TABLE TO REFERENCE subscription_tiers
ALTER TABLE public.palikas ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES public.subscription_tiers(id);
CREATE INDEX IF NOT EXISTS idx_palikas_subscription_tier_id ON public.palikas(subscription_tier_id);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name ON public.subscription_tiers(name);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON public.subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_features_code ON public.features(code);
CREATE INDEX IF NOT EXISTS idx_features_category ON public.features(category);
CREATE INDEX IF NOT EXISTS idx_tier_features_tier ON public.tier_features(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_features_feature ON public.tier_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_log_palika ON public.tier_assignment_log(palika_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_log_created ON public.tier_assignment_log(created_at);

-- 7. HELPER FUNCTION: Check if palika has feature
CREATE OR REPLACE FUNCTION public.palika_has_feature(
  p_palika_id INTEGER,
  p_feature_code VARCHAR
) RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tier_features tf
    JOIN public.features f ON f.id = tf.feature_id
    JOIN public.palikas p ON p.subscription_tier_id = tf.tier_id
    WHERE p.id = p_palika_id
      AND f.code = p_feature_code
      AND tf.enabled = true
      AND f.is_active = true
  );
$$;

COMMENT ON FUNCTION public.palika_has_feature(INTEGER, VARCHAR) IS 'Check if a palika has access to a specific feature';

-- 8. HELPER FUNCTION: Get palika tier
CREATE OR REPLACE FUNCTION public.get_palika_tier(
  p_palika_id INTEGER
) RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT subscription_tier_id
  FROM public.palikas
  WHERE id = p_palika_id;
$$;

COMMENT ON FUNCTION public.get_palika_tier(INTEGER) IS 'Get the subscription tier for a palika';

-- 9. TRIGGER: Log tier assignment changes
CREATE OR REPLACE FUNCTION public.log_tier_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if tier actually changed
  IF NEW.subscription_tier_id IS DISTINCT FROM OLD.subscription_tier_id THEN
    INSERT INTO public.tier_assignment_log (
      palika_id,
      old_tier_id,
      new_tier_id,
      assigned_by
    ) VALUES (
      NEW.id,
      OLD.subscription_tier_id,
      NEW.subscription_tier_id,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on palikas table
DROP TRIGGER IF EXISTS trg_log_tier_assignment ON public.palikas;
CREATE TRIGGER trg_log_tier_assignment
  AFTER UPDATE OF subscription_tier_id ON public.palikas
  FOR EACH ROW
  EXECUTE FUNCTION log_tier_assignment();

-- ==========================================
-- NOTE: RLS Policies for tier tables
-- are defined in migration 036 (consolidated RLS)
-- ==========================================
