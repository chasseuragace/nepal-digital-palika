-- Tier-Based Feature Architecture
-- Enables feature gates based on subscription tiers
-- Created: 2026-03-01

-- 1. Create subscription_tiers table
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create tier_features mapping
CREATE TABLE IF NOT EXISTS public.tier_features (
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  unlocked_at_version VARCHAR(20),
  PRIMARY KEY (tier_id, feature_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create tier_assignment_log
CREATE TABLE IF NOT EXISTS public.tier_assignment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id UUID NOT NULL REFERENCES public.palikas(id),
  old_tier_id UUID REFERENCES public.subscription_tiers(id),
  new_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  assigned_by UUID REFERENCES public.admin_users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Add subscription_tier_id column to palikas
ALTER TABLE public.palikas ADD COLUMN IF NOT EXISTS
  subscription_tier_id UUID REFERENCES public.subscription_tiers(id);

-- 6. Add cost_per_month to subscription_tiers
ALTER TABLE public.subscription_tiers ADD COLUMN IF NOT EXISTS
  cost_per_month NUMERIC(10, 2);

-- 7. Add cost_per_year to subscription_tiers
ALTER TABLE public.subscription_tiers ADD COLUMN IF NOT EXISTS
  cost_per_year NUMERIC(10, 2);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tiers_name ON public.subscription_tiers(name);
CREATE INDEX IF NOT EXISTS idx_tiers_active ON public.subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_features_code ON public.features(code);
CREATE INDEX IF NOT EXISTS idx_features_category ON public.features(category);
CREATE INDEX IF NOT EXISTS idx_tier_features_tier ON public.tier_features(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_features_feature ON public.tier_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_palikas_tier ON public.palikas(subscription_tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_palika ON public.tier_assignment_log(palika_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_created ON public.tier_assignment_log(created_at);

-- 9. Create RLS policies for tier tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_assignment_log ENABLE ROW LEVEL SECURITY;

-- Tiers are readable by everyone (needed for feature checks)
CREATE POLICY "tiers_readable" ON public.subscription_tiers
  FOR SELECT
  USING (true);

-- Tiers are writable by super_admin only
CREATE POLICY "tiers_writable" ON public.subscription_tiers
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- Features are readable by everyone
CREATE POLICY "features_readable" ON public.features
  FOR SELECT
  USING (true);

-- Features are writable by super_admin only
CREATE POLICY "features_writable" ON public.features
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- Tier-feature mappings are readable by everyone
CREATE POLICY "tier_features_readable" ON public.tier_features
  FOR SELECT
  USING (true);

-- Tier-feature mappings are writable by super_admin only
CREATE POLICY "tier_features_writable" ON public.tier_features
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- Tier assignment logs are readable by super_admin and national admins
CREATE POLICY "tier_assignment_log_readable" ON public.tier_assignment_log
  FOR SELECT
  USING (
    get_user_role() IN ('super_admin', 'national_admin')
  );

-- Tier assignment logs are writable by super_admin only
CREATE POLICY "tier_assignment_log_writable" ON public.tier_assignment_log
  FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

-- 10. Create palika_has_feature function
CREATE OR REPLACE FUNCTION palika_has_feature(
  p_palika_id UUID,
  p_feature_code VARCHAR
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  -- Check if palika's tier has the feature enabled
  SELECT EXISTS(
    SELECT 1 FROM public.tier_features tf
    JOIN public.features f ON tf.feature_id = f.id
    JOIN public.palikas p ON p.subscription_tier_id = tf.tier_id
    WHERE p.id = p_palika_id
      AND f.code = p_feature_code
      AND tf.enabled = true
      AND f.is_active = true
  ) INTO v_has_feature;

  RETURN COALESCE(v_has_feature, false);
END;
$$;

-- 11. Create get_palika_tier function
CREATE OR REPLACE FUNCTION get_palika_tier(
  p_palika_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  SELECT subscription_tier_id INTO v_tier_id
  FROM public.palikas
  WHERE id = p_palika_id;

  RETURN v_tier_id;
END;
$$;

-- 12. Create trigger for tier assignment logging
CREATE OR REPLACE FUNCTION log_tier_assignment()
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

-- 13. Grant permissions
GRANT SELECT ON public.subscription_tiers TO anon, authenticated;
GRANT SELECT ON public.features TO anon, authenticated;
GRANT SELECT ON public.tier_features TO anon, authenticated;
GRANT SELECT ON public.tier_assignment_log TO authenticated;

GRANT EXECUTE ON FUNCTION palika_has_feature TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_palika_tier TO anon, authenticated;
