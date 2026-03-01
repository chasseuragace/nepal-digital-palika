-- ==========================================
-- MIGRATION: RLS Debug Functions
-- ==========================================
-- Create debug functions to trace RLS evaluation for businesses
-- This helps diagnose why businesses_admin_read policy is not matching

-- Debug function: Check user_has_access_to_palika
CREATE OR REPLACE FUNCTION public.debug_user_has_access_to_palika(palika_id_param INT)
RETURNS TABLE (
  current_user_id uuid,
  is_active boolean,
  admin_role text,
  is_super_admin boolean,
  has_palika_region boolean,
  has_district_region boolean,
  has_province_region boolean,
  final_result boolean,
  debug_message text
) AS $$
DECLARE
  v_user_id uuid;
  v_is_active boolean;
  v_role text;
  v_is_super_admin boolean;
  v_has_palika_region boolean;
  v_has_district_region boolean;
  v_has_province_region boolean;
  v_final_result boolean;
  v_debug_message text;
BEGIN
  v_user_id := auth.uid();

  -- Get admin user info
  SELECT au.is_active, au.role INTO v_is_active, v_role
  FROM public.admin_users au
  WHERE au.id = v_user_id;

  IF v_user_id IS NULL THEN
    v_debug_message := 'ERROR: auth.uid() is NULL - not authenticated';
    RETURN QUERY SELECT v_user_id, v_is_active, v_role, false, false, false, false, false, v_debug_message;
    RETURN;
  END IF;

  IF v_is_active IS NULL THEN
    v_debug_message := format('ERROR: User %s not found in admin_users', v_user_id);
    RETURN QUERY SELECT v_user_id, v_is_active, v_role, false, false, false, false, false, v_debug_message;
    RETURN;
  END IF;

  -- Check super admin
  v_is_super_admin := (v_role = 'super_admin');

  -- Check palika region assignment
  v_has_palika_region := EXISTS (
    SELECT 1 FROM public.admin_regions ar
    WHERE ar.admin_id = v_user_id
    AND ar.region_type = 'palika'
    AND ar.region_id = palika_id_param
  );

  -- Check district region assignment
  v_has_district_region := EXISTS (
    SELECT 1 FROM public.admin_regions ar
    JOIN public.palikas p ON p.id = palika_id_param
    WHERE ar.admin_id = v_user_id
    AND ar.region_type = 'district'
    AND ar.region_id = p.district_id
  );

  -- Check province region assignment
  v_has_province_region := EXISTS (
    SELECT 1 FROM public.admin_regions ar
    JOIN public.palikas p ON p.id = palika_id_param
    JOIN public.districts d ON p.district_id = d.id
    WHERE ar.admin_id = v_user_id
    AND ar.region_type = 'province'
    AND ar.region_id = d.province_id
  );

  -- Final result
  v_final_result := v_is_active AND (
    v_is_super_admin OR
    v_has_palika_region OR
    v_has_district_region OR
    v_has_province_region
  );

  v_debug_message := format(
    'User: %s | Role: %s | Active: %s | SuperAdmin: %s | PalikaRegion: %s | DistrictRegion: %s | ProvinceRegion: %s | Result: %s',
    v_user_id, v_role, v_is_active, v_is_super_admin, v_has_palika_region, v_has_district_region, v_has_province_region, v_final_result
  );

  RETURN QUERY SELECT v_user_id, v_is_active, v_role, v_is_super_admin, v_has_palika_region, v_has_district_region, v_has_province_region, v_final_result, v_debug_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Debug function: Check user_has_permission
CREATE OR REPLACE FUNCTION public.debug_user_has_permission(permission_name VARCHAR)
RETURNS TABLE (
  current_user_id uuid,
  user_role text,
  permission_exists boolean,
  role_permission_exists boolean,
  has_permission boolean,
  debug_message text
) AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_permission_exists boolean;
  v_role_permission_exists boolean;
  v_has_permission boolean;
  v_debug_message text;
BEGIN
  v_user_id := auth.uid();

  -- Get user role
  SELECT au.role INTO v_role
  FROM public.admin_users au
  WHERE au.id = v_user_id AND au.is_active = true;

  IF v_user_id IS NULL THEN
    v_debug_message := 'ERROR: auth.uid() is NULL - not authenticated';
    RETURN QUERY SELECT v_user_id, v_role, false, false, false, v_debug_message;
    RETURN;
  END IF;

  IF v_role IS NULL THEN
    v_debug_message := format('ERROR: User %s not found in active admin_users', v_user_id);
    RETURN QUERY SELECT v_user_id, v_role, false, false, false, v_debug_message;
    RETURN;
  END IF;

  -- Check if permission exists
  v_permission_exists := EXISTS (
    SELECT 1 FROM public.permissions p
    WHERE p.name = permission_name
  );

  -- Check if role has this permission
  v_role_permission_exists := EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role = r.name
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE au.id = v_user_id
    AND au.is_active = true
    AND p.name = permission_name
  );

  -- Final result (simplified - just check if has permission)
  v_has_permission := v_role_permission_exists;

  v_debug_message := format(
    'User: %s | Role: %s | Permission: %s | PermissionExists: %s | RoleHasPermission: %s | Result: %s',
    v_user_id, v_role, permission_name, v_permission_exists, v_role_permission_exists, v_has_permission
  );

  RETURN QUERY SELECT v_user_id, v_role, v_permission_exists, v_role_permission_exists, v_has_permission, v_debug_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Debug function: Combined check for businesses_admin_read policy
CREATE OR REPLACE FUNCTION public.debug_businesses_admin_read(palika_id_param INT)
RETURNS TABLE (
  current_user_id uuid,
  user_role text,
  is_super_admin boolean,
  access_to_palika boolean,
  has_manage_businesses_permission boolean,
  policy_should_allow boolean,
  detailed_log text
) AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_is_super_admin boolean;
  v_access_to_palika boolean;
  v_has_permission boolean;
  v_policy_should_allow boolean;
  v_detailed_log text;
  v_debug_access record;
  v_debug_permission record;
BEGIN
  v_user_id := auth.uid();

  -- Get user role
  SELECT au.role INTO v_role
  FROM public.admin_users au
  WHERE au.id = v_user_id AND au.is_active = true;

  IF v_user_id IS NULL THEN
    v_detailed_log := 'CRITICAL: auth.uid() is NULL - user not authenticated!';
    RETURN QUERY SELECT v_user_id, v_role, false, false, false, false, v_detailed_log;
    RETURN;
  END IF;

  IF v_role IS NULL THEN
    v_detailed_log := format('CRITICAL: User %s not found in admin_users or not active!', v_user_id);
    RETURN QUERY SELECT v_user_id, v_role, false, false, false, false, v_detailed_log;
    RETURN;
  END IF;

  -- Check super admin
  v_is_super_admin := (v_role = 'super_admin');

  -- Get debug info for access
  SELECT * INTO v_debug_access FROM public.debug_user_has_access_to_palika(palika_id_param);
  v_access_to_palika := v_debug_access.final_result;

  -- Get debug info for permission
  SELECT * INTO v_debug_permission FROM public.debug_user_has_permission('manage_businesses');
  v_has_permission := v_debug_permission.has_permission;

  -- Calculate policy result
  v_policy_should_allow := v_is_super_admin OR (v_access_to_palika AND v_has_permission);

  v_detailed_log := format(
    E'=== BUSINESSES_ADMIN_READ POLICY DEBUG ===\n' ||
    E'Current User: %s\n' ||
    E'User Role: %s\n' ||
    E'Palika ID Param: %s\n' ||
    E'\n--- Part 1: Super Admin Check ---\n' ||
    E'get_user_role() = super_admin: %s\n' ||
    E'\n--- Part 2: Access & Permission Check ---\n' ||
    E'user_has_access_to_palika(%s): %s\n' ||
    E'  %s\n' ||
    E'user_has_permission(manage_businesses): %s\n' ||
    E'  %s\n' ||
    E'(access AND permission): %s\n' ||
    E'\n--- Final Policy Evaluation ---\n' ||
    E'super_admin OR (access AND permission): %s\n' ||
    E'POLICY SHOULD %s ACCESS',
    v_user_id, v_role, palika_id_param, v_is_super_admin,
    palika_id_param, v_access_to_palika, v_debug_access.debug_message,
    v_has_permission, v_debug_permission.debug_message,
    (v_access_to_palika AND v_has_permission),
    v_policy_should_allow,
    CASE WHEN v_policy_should_allow THEN 'ALLOW' ELSE 'DENY' END
  );

  RETURN QUERY SELECT v_user_id, v_role, v_is_super_admin, v_access_to_palika, v_has_permission, v_policy_should_allow, v_detailed_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
