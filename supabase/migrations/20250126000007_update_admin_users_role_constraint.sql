-- ==========================================
-- MIGRATION: Update admin_users role constraint
-- ==========================================
-- Updates the role CHECK constraint to include new hierarchical roles

-- Drop the old constraint
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Add the new constraint with all roles
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('super_admin', 'province_admin', 'district_admin', 'palika_admin', 'moderator', 'support_agent', 'content_editor', 'content_reviewer', 'support'));
