-- ===========================================================
-- MIGRATION: Verify RLS Functions Are Correct
-- ===========================================================
-- This migration verifies that the RLS access functions
-- do NOT contain shortcuts to admin_users.palika_id/district_id/province_id

-- Check user_has_access_to_palika function
-- It should only use admin_regions table, not au.palika_id shortcut

CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      -- Access through palika assignment
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'palika'
        AND ar.region_id = palika_id_param
      )
      -- Access through district assignment (can access all palikas in district)
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        JOIN public.palikas p ON p.id = palika_id_param
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'district'
        AND ar.region_id = p.district_id
      )
      -- Access through province assignment (can access all palikas in province)
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        JOIN public.palikas p ON p.id = palika_id_param
        JOIN public.districts d ON p.district_id = d.id
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'province'
        AND ar.region_id = d.province_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

CREATE OR REPLACE FUNCTION public.user_has_access_to_district(district_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'district'
        AND ar.region_id = district_id_param
      )
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        JOIN public.districts d ON d.id = district_id_param
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'province'
        AND ar.region_id = d.province_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

CREATE OR REPLACE FUNCTION public.user_has_access_to_province(province_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'province'
        AND ar.region_id = province_id_param
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;
