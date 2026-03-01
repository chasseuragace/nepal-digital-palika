-- ==========================================
-- MIGRATION: Add Subscription Fields to Palikas
-- ==========================================
-- Adds subscription-based billing fields to support the Business Model
-- Features: subscription tier tracking, term dates, and cost calculation

ALTER TABLE public.palikas
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cost_per_month NUMERIC(10, 2);

-- Add comment documentation
COMMENT ON COLUMN public.palikas.subscription_tier IS 'Service tier: "basic", "tourism", "premium"';
COMMENT ON COLUMN public.palikas.subscription_start_date IS 'Subscription term start date';
COMMENT ON COLUMN public.palikas.subscription_end_date IS 'Subscription term end date';
COMMENT ON COLUMN public.palikas.cost_per_month IS 'Monthly subscription cost in NPR';

-- Index for subscription management queries
CREATE INDEX IF NOT EXISTS idx_palikas_subscription_tier
  ON public.palikas(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_palikas_subscription_dates
  ON public.palikas(subscription_start_date, subscription_end_date);
