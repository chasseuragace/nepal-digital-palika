-- ==========================================
-- MIGRATION: Seed Permissions and Role Permissions
-- ==========================================
-- Populates the permissions table with all required permissions
-- and assigns them to roles via role_permissions junction table

-- ==========================================
-- SEED PERMISSIONS
-- ==========================================
INSERT INTO public.permissions (name, description, resource, action)
VALUES
  ('manage_heritage_sites', 'Manage heritage sites', 'heritage_sites', 'manage'),
  ('manage_events', 'Manage events', 'events', 'manage'),
  ('manage_blog_posts', 'Manage blog posts', 'blog_posts', 'manage'),
  ('manage_businesses', 'Manage businesses', 'businesses', 'manage'),
  ('manage_sos', 'Manage SOS requests', 'sos_requests', 'manage'),
  ('moderate_content', 'Moderate user-generated content', 'content', 'moderate'),
  ('manage_admins', 'Manage admin users', 'admin_users', 'manage'),
  ('manage_roles', 'Manage roles and permissions', 'roles', 'manage'),
  ('view_audit_log', 'View audit logs', 'audit_log', 'view'),
  ('manage_regions', 'Manage geographic regions', 'regions', 'manage'),
  ('manage_categories', 'Manage content categories', 'categories', 'manage'),
  ('view_analytics', 'View analytics and reports', 'analytics', 'view')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- SEED ROLE PERMISSIONS
-- ==========================================
-- Get all role IDs and permission IDs for assignment
WITH role_ids AS (
  SELECT id, name FROM public.roles
),
permission_ids AS (
  SELECT id, name FROM public.permissions
),
-- Define which permissions each role should have
role_permission_mapping AS (
  SELECT 
    r.id as role_id,
    p.id as permission_id
  FROM role_ids r
  CROSS JOIN permission_ids p
  WHERE
    -- Super admin gets all permissions
    (r.name = 'super_admin') OR
    -- Palika admin gets content management permissions
    (r.name = 'palika_admin' AND p.name IN (
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
      'manage_businesses', 'manage_sos', 'moderate_content',
      'manage_categories'
    )) OR
    -- Content editor gets content creation permissions
    (r.name = 'content_editor' AND p.name IN (
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
      'manage_businesses', 'manage_categories'
    )) OR
    -- Content reviewer gets review permissions
    (r.name = 'content_reviewer' AND p.name IN (
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
      'manage_businesses', 'moderate_content'
    )) OR
    -- Support agent gets support permissions
    (r.name = 'support_agent' AND p.name IN (
      'manage_sos', 'view_analytics'
    )) OR
    -- Moderator gets moderation permissions
    (r.name = 'moderator' AND p.name IN (
      'moderate_content', 'view_analytics'
    ))
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_permission_mapping
ON CONFLICT (role_id, permission_id) DO NOTHING;
