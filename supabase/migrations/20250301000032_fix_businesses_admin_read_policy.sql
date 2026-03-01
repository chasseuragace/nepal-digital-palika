-- ==========================================
-- FIX: Explicitly recreate businesses_admin_read policy
-- ==========================================
-- This migration ensures the businesses_admin_read policy is properly created
-- after all other policies (owner_access, public_read) from migration 028
--
-- The debug functions confirm this policy SHOULD allow access, but the actual
-- query returns zero rows, suggesting the policy may not be properly created
-- or there's a precedence issue

-- Drop existing if present
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;

-- Recreate with explicit order/naming to ensure it takes precedence
CREATE POLICY "businesses_admin_read"
ON public.businesses
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

-- Also ensure INSERT/UPDATE/DELETE policies exist
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
CREATE POLICY "businesses_admin_insert"
ON public.businesses
FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
CREATE POLICY "businesses_admin_update"
ON public.businesses
FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;
CREATE POLICY "businesses_admin_delete"
ON public.businesses
FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);
