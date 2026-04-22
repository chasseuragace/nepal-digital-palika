-- Create subscription_payments ledger table
-- This table records all payments for palika subscriptions

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id integer NOT NULL REFERENCES public.palikas(id) ON DELETE RESTRICT,
  tier_id uuid NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  paid_on timestamptz NOT NULL DEFAULT NOW(),
  method text NOT NULL DEFAULT 'cash'
    CHECK (method IN ('cash', 'bank_transfer', 'cheque', 'other')),
  reference text,
  recorded_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (period_end > period_start)
);

CREATE INDEX idx_subscription_payments_palika_id
  ON public.subscription_payments(palika_id);
CREATE INDEX idx_subscription_payments_paid_on
  ON public.subscription_payments(paid_on DESC);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Super admins can read and write everything (platform provider use case)
CREATE POLICY "super_admin_all_subscription_payments"
  ON public.subscription_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
