-- ==========================================
-- MIGRATION: Add Permissions to District and Province Admins
-- ==========================================
-- District and province admins need the same permissions as palika admins
-- to manage content in their regions

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE
  -- District admin gets content management permissions
  (r.name = 'district_admin' AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
    'manage_businesses', 'manage_sos', 'moderate_content',
    'manage_categories'
  )) OR
  -- Province admin gets content management permissions
  (r.name = 'province_admin' AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
    'manage_businesses', 'manage_sos', 'moderate_content',
    'manage_categories'
  ))
ON CONFLICT (role_id, permission_id) DO NOTHING;
