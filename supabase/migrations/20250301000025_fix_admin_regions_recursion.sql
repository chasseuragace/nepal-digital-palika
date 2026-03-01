-- ==========================================
-- MIGRATION: Fix Admin Regions Recursion
-- ==========================================
-- The admin_regions_managed_read policy in migration 24 joins admin_users with RLS,
-- causing infinite recursion. This fix moves the logic to a SECURITY DEFINER function.

-- Drop the problematic policy
DROP POLICY IF EXISTS "admin_regions_managed_read" ON public.admin_regions;

-- Create a SECURITY DEFINER function to check if current admin manages another admin
CREATE OR REPLACE FUNCTION public.user_manages_admin(target_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_admin_info RECORD;
  target_admin_info RECORD;
BEGIN
  -- Get current admin's info (SECURITY DEFINER bypasses RLS)
  SELECT id, role, hierarchy_level, province_id, district_id, palika_id
  INTO current_admin_info
  FROM public.admin_users
  WHERE id = auth.uid() AND is_active = true;

  IF current_admin_info IS NULL THEN
    RETURN false;
  END IF;

  -- If current user is super_admin, they manage everyone
  IF current_admin_info.role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Get target admin's info (SECURITY DEFINER bypasses RLS)
  SELECT id, role, hierarchy_level, province_id, district_id, palika_id
  INTO target_admin_info
  FROM public.admin_users
  WHERE id = target_admin_id AND is_active = true;

  IF target_admin_info IS NULL THEN
    RETURN false;
  END IF;

  -- Check if current admin manages the target admin based on hierarchy
  RETURN (
    (current_admin_info.hierarchy_level = 'province' AND current_admin_info.province_id = target_admin_info.province_id)
    OR (current_admin_info.hierarchy_level = 'district' AND current_admin_info.district_id = target_admin_info.district_id)
    OR (current_admin_info.hierarchy_level = 'palika' AND current_admin_info.palika_id = target_admin_info.palika_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Replace the managed_read policy with one that uses the SECURITY DEFINER function
CREATE POLICY "admin_regions_managed_read"
ON public.admin_regions FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    public.user_manages_admin(admin_id)
  )
);
