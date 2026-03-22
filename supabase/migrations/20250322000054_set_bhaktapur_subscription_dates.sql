-- Set subscription dates and cost for Bhaktapur
-- Bhaktapur is assigned to Tourism tier

UPDATE public.palikas
SET 
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 year',
  cost_per_month = (SELECT cost_per_month FROM public.subscription_tiers WHERE name = 'tourism')
WHERE name_en = 'Bhaktapur' AND subscription_tier_id IS NOT NULL;
