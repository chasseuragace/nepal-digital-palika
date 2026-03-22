-- Enable RLS on tier_change_requests table
ALTER TABLE public.tier_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Palika admins can view their own tier change requests
CREATE POLICY "Palika admins can view own tier requests"
  ON public.tier_change_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE palika_id = tier_change_requests.palika_id 
      AND role = 'palika_admin'
    )
  );

-- Policy: Super admins can view all tier change requests
CREATE POLICY "Super admins can view all tier requests"
  ON public.tier_change_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  );

-- Policy: Palika admins can create tier change requests for their palika
CREATE POLICY "Palika admins can create tier requests"
  ON public.tier_change_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE palika_id = tier_change_requests.palika_id 
      AND role = 'palika_admin'
    )
    AND requested_by = auth.uid()
  );

-- Policy: Palika admins can cancel their own pending requests
CREATE POLICY "Palika admins can cancel own pending requests"
  ON public.tier_change_requests
  FOR UPDATE
  USING (
    status = 'pending'
    AND requested_by = auth.uid()
    AND auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'palika_admin'
    )
  )
  WITH CHECK (
    status = 'cancelled'
    AND requested_by = auth.uid()
  );

-- Policy: Super admins can approve/reject tier change requests
CREATE POLICY "Super admins can approve/reject tier requests"
  ON public.tier_change_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  );
