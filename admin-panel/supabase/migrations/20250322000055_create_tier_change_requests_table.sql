-- Create tier_change_requests table
CREATE TABLE public.tier_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL,
  current_tier_id UUID NOT NULL,
  requested_tier_id UUID NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending',
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  effective_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (palika_id) REFERENCES palikas(id),
  FOREIGN KEY (current_tier_id) REFERENCES subscription_tiers(id),
  FOREIGN KEY (requested_tier_id) REFERENCES subscription_tiers(id),
  FOREIGN KEY (requested_by) REFERENCES admin_users(id),
  FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
);

-- Create index for faster queries
CREATE INDEX idx_tier_change_requests_palika_id ON public.tier_change_requests(palika_id);
CREATE INDEX idx_tier_change_requests_status ON public.tier_change_requests(status);
CREATE INDEX idx_tier_change_requests_requested_by ON public.tier_change_requests(requested_by);
