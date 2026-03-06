-- ==========================================
-- MIGRATION: Create Subscription Tier Tables
-- ==========================================
-- Creates the tables for subscription tier management:
-- subscription_tiers, features, tier_features, and tier_assignment_log

-- 1. SUBSCRIPTION_TIERS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    cost_per_year NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_tiers IS 'Service tiers: Basic, Tourism, Premium';
COMMENT ON COLUMN public.subscription_tiers.name IS 'Internal name: basic, tourism, premium';
COMMENT ON COLUMN public.subscription_tiers.display_name IS 'User-friendly display name';
COMMENT ON COLUMN public.subscription_tiers.cost_per_year IS 'Annual subscription cost in NPR';

-- 2. FEATURES TABLE
CREATE TABLE IF NOT EXISTS public.features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.features IS 'Platform features that can be enabled/disabled by tier';
COMMENT ON COLUMN public.features.code IS 'Machine-readable feature code (e.g., qr_print_support)';
COMMENT ON COLUMN public.features.category IS 'Feature category (e.g., registration, contact, qr)';

-- 3. TIER_FEATURES MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.tier_features (
    tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tier_id, feature_id)
);

COMMENT ON TABLE public.tier_features IS 'Maps which features are available in each tier';

-- 4. TIER ASSIGNMENT LOG (for audit trail)
CREATE TABLE IF NOT EXISTS public.tier_assignment_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    palika_id INTEGER NOT NULL REFERENCES public.palikas(id) ON DELETE CASCADE,
    old_tier_id UUID REFERENCES public.subscription_tiers(id),
    new_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
    changed_by UUID REFERENCES auth.users(id),
    reason VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tier_assignment_log IS 'Audit trail for palika tier changes';

-- 5. UPDATE PALIKAS TABLE TO REFERENCE subscription_tiers
ALTER TABLE public.palikas
    ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES public.subscription_tiers(id);

CREATE INDEX IF NOT EXISTS idx_palikas_subscription_tier_id ON public.palikas(subscription_tier_id);

-- 6. HELPER FUNCTION: Check if palika has feature
CREATE OR REPLACE FUNCTION public.palika_has_feature(
    p_palika_id INTEGER,
    p_feature_code VARCHAR
)
RETURNS BOOLEAN
LANGUAGE SQL
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
    )
$$;

COMMENT ON FUNCTION public.palika_has_feature IS 'Check if a palika has access to a specific feature';

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name ON public.subscription_tiers(name);
CREATE INDEX IF NOT EXISTS idx_features_code ON public.features(code);
CREATE INDEX IF NOT EXISTS idx_features_category ON public.features(category);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_log_palika ON public.tier_assignment_log(palika_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignment_log_created_at ON public.tier_assignment_log(created_at);

-- 8. ENABLE RLS (if needed, can be managed separately)
-- ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tier_features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tier_assignment_log ENABLE ROW LEVEL SECURITY;
