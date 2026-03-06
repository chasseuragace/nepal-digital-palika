-- ==========================================
-- MIGRATION: Add Hierarchical Admin Structure
-- ==========================================
-- Extends admin_users table to support multi-region assignment
-- and hierarchical role levels (national, province, district, palika)

-- ==========================================
-- EXTEND ADMIN_USERS TABLE
-- ==========================================

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS hierarchy_level VARCHAR(50) CHECK (hierarchy_level IN ('national', 'province', 'district', 'palika'));

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS province_id INTEGER REFERENCES provinces(id) ON DELETE SET NULL;

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.admin_users.hierarchy_level IS 'Hierarchical level: national (all access), province (province-level), district (district-level), palika (single palika)';
COMMENT ON COLUMN public.admin_users.province_id IS 'Province assignment for province/district-level admins';
COMMENT ON COLUMN public.admin_users.district_id IS 'District assignment for district-level admins';

-- ==========================================
-- CREATE ADMIN_REGIONS TABLE
-- ==========================================
-- Allows admins to be assigned to multiple regions
-- Supports flexible region assignment (palika, district, province)

CREATE TABLE IF NOT EXISTS public.admin_regions (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  region_type VARCHAR(50) NOT NULL CHECK (region_type IN ('province', 'district', 'palika')),
  region_id INTEGER NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  UNIQUE(admin_id, region_type, region_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_regions_admin ON public.admin_regions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_regions_region ON public.admin_regions(region_type, region_id);
CREATE INDEX IF NOT EXISTS idx_admin_regions_assigned_by ON public.admin_regions(assigned_by);

-- ==========================================
-- HELPER FUNCTIONS FOR RLS
-- ==========================================

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
SELECT role
FROM public.admin_users
WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get user palika_id (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_user_palika_id()
RETURNS INT AS $$
SELECT palika_id
FROM public.admin_users
WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check user has access to a specific palika (uses admin_regions)
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      -- Super admin has access to everything
      au.role = 'super_admin'
      -- Direct palika assignment via admin_regions
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'palika'
        AND ar.region_id = palika_id_param
      )
      -- District assignment grants access to all palikas in that district
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        JOIN public.palikas p ON p.id = palika_id_param
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'district'
        AND ar.region_id = p.district_id
      )
      -- Province assignment grants access to all palikas in that province
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

-- Check user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role = r.name
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- ==========================================
-- CREATE AUDIT_LOG TABLE
-- ==========================================
-- Tracks all administrative actions for compliance and debugging

CREATE TABLE IF NOT EXISTS public.audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);

-- ==========================================
-- UPDATE ROLES TABLE
-- ==========================================
-- Add hierarchy level to roles for better organization

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS hierarchy_level VARCHAR(50) CHECK (hierarchy_level IN ('national', 'province', 'district', 'palika'));

-- Insert hierarchical roles if they don't exist
INSERT INTO public.roles (name, hierarchy_level, description, description_ne)
VALUES
  ('super_admin', 'national', 'Full system access across all regions', 'सभी क्षेत्रों में पूर्ण प्रणाली पहुँच'),
  ('province_admin', 'province', 'Manages entire province and its districts/palikas', 'पूरे प्रान्त और इसके जिल्ला/पालिका को व्यवस्थापन गर्छ'),
  ('district_admin', 'district', 'Manages entire district and its palikas', 'पूरे जिल्ला और इसके पालिका को व्यवस्थापन गर्छ'),
  ('palika_admin', 'palika', 'Manages single palika', 'एकल पालिका व्यवस्थापन गर्छ'),
  ('moderator', 'palika', 'Moderates content within assigned palika', 'नियुक्त पालिका भित्र सामग्री मध्यस्थता गर्छ'),
  ('support_agent', 'palika', 'Provides support within assigned palika', 'नियुक्त पालिका भित्र समर्थन प्रदान गर्छ'),
  ('content_editor', 'palika', 'Edits content within assigned palika', 'नियुक्त पालिका भित्र सामग्री सम्पादन गर्छ'),
  ('content_reviewer', 'palika', 'Reviews content within assigned palika', 'नियुक्त पालिका भित्र सामग्री समीक्षा गर्छ')
ON CONFLICT (name) DO UPDATE SET
  hierarchy_level = EXCLUDED.hierarchy_level,
  description_ne = EXCLUDED.description_ne;

-- ==========================================
-- ENABLE RLS ON NEW TABLES
-- ==========================================

ALTER TABLE public.admin_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR ADMIN_REGIONS
-- ==========================================

-- Super admin can see all region assignments
CREATE POLICY "admin_regions_super_admin_read"
ON public.admin_regions
FOR SELECT
USING (
  public.get_user_role() = 'super_admin'
);

-- Admins can see their own region assignments
CREATE POLICY "admin_regions_self_read"
ON public.admin_regions
FOR SELECT
USING (admin_id = auth.uid());

-- Admins can see region assignments of admins they manage
CREATE POLICY "admin_regions_managed_read"
ON public.admin_regions
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND (
        -- Province admin can see admins in their province
        (au.hierarchy_level = 'province' AND au.province_id = (
          SELECT province_id FROM public.admin_users WHERE id = admin_regions.admin_id
        ))
        -- District admin can see admins in their district
        OR (au.hierarchy_level = 'district' AND au.district_id = (
          SELECT district_id FROM public.admin_users WHERE id = admin_regions.admin_id
        ))
      )
    )
  )
);

-- Super admin can manage all region assignments
CREATE POLICY "admin_regions_super_admin_all"
ON public.admin_regions
FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- RLS POLICIES FOR AUDIT_LOG
-- ==========================================

-- Super admin can see all audit logs
CREATE POLICY "audit_log_super_admin_read"
ON public.audit_log
FOR SELECT
USING (public.get_user_role() = 'super_admin');

-- Admins can see audit logs for their own actions
CREATE POLICY "audit_log_self_read"
ON public.audit_log
FOR SELECT
USING (admin_id = auth.uid());

-- Admins can see audit logs for admins they manage
CREATE POLICY "audit_log_managed_read"
ON public.audit_log
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND (
        -- Province admin can see logs for admins in their province
        (au.hierarchy_level = 'province' AND au.province_id = (
          SELECT province_id FROM public.admin_users WHERE id = audit_log.admin_id
        ))
        -- District admin can see logs for admins in their district
        OR (au.hierarchy_level = 'district' AND au.district_id = (
          SELECT district_id FROM public.admin_users WHERE id = audit_log.admin_id
        ))
      )
    )
  )
);

-- Only super admin can insert audit logs
CREATE POLICY "audit_log_insert"
ON public.audit_log
FOR INSERT
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- MIGRATION HELPER: Migrate existing admins
-- ==========================================
-- This comment documents the migration strategy for existing admins
-- Run this after the schema changes are applied:
/*
-- Migrate existing admins to new system
INSERT INTO public.admin_regions (admin_id, region_type, region_id, assigned_at)
SELECT 
  id,
  'palika',
  palika_id,
  created_at
FROM public.admin_users
WHERE palika_id IS NOT NULL
AND hierarchy_level IS NULL;

-- Update hierarchy_level for existing admins
UPDATE public.admin_users
SET hierarchy_level = 'palika'
WHERE palika_id IS NOT NULL
AND hierarchy_level IS NULL;

-- Update super_admin hierarchy level
UPDATE public.admin_users
SET hierarchy_level = 'national'
WHERE role = 'super_admin'
AND hierarchy_level IS NULL;
*/

