-- Tier-Based Feature Gating: Business Registration & Verification
-- Created: 2026-03-01
-- Purpose: Enable citizen self-service business registration with verification workflow
-- NOTE: businesses table columns are added in migration _027

-- ============================================================
-- 1. BUSINESSES TABLE - ALREADY EXISTS (columns added in _027)
-- ============================================================
-- See migration _027 for businesses table structure and indexes

-- ============================================================
-- 2. BUSINESS IMAGES TABLE (Optional - for separate image management)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url VARCHAR(512) NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_business_images_business ON public.business_images(business_id);

-- ============================================================
-- 3. APPROVAL WORKFLOWS TABLE (Custom rules per Palika)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id INTEGER NOT NULL REFERENCES public.palikas(id) ON DELETE CASCADE,

  -- Rules
  rules JSONB DEFAULT '[]'::jsonb, -- Array of {id, name, enabled, order, type}

  -- SLA Settings
  sla_days INTEGER DEFAULT 7,
  auto_approve_after_days INTEGER,
  requires_supervisor_review BOOLEAN DEFAULT false,

  -- Configuration
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  UNIQUE(palika_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_palika ON public.approval_workflows(palika_id);

-- ============================================================
-- 4. APPROVAL NOTES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Note Content
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- Internal notes not visible to owner

  -- Author
  author_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_notes_business ON public.approval_notes(business_id);
CREATE INDEX IF NOT EXISTS idx_approval_notes_author ON public.approval_notes(author_id);

-- ============================================================
-- 5. DROP EXISTING CONFLICTING POLICIES
-- ============================================================

-- Note: businesses table policies are handled by migration 024
-- We only drop and recreate policies for new tables (business_images, approval_workflows, approval_notes)
DROP POLICY IF EXISTS "business_images_owner_access" ON public.business_images;
DROP POLICY IF EXISTS "business_images_palika_staff" ON public.business_images;
DROP POLICY IF EXISTS "business_images_public_read" ON public.business_images;
DROP POLICY IF EXISTS "approval_workflows_palika_admin" ON public.approval_workflows;
DROP POLICY IF EXISTS "approval_notes_read" ON public.approval_notes;
DROP POLICY IF EXISTS "approval_notes_author_modify" ON public.approval_notes;

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.business_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_notes ENABLE ROW LEVEL SECURITY;

-- Note: businesses table RLS is already enabled by migration 024

-- ============================================================
-- 7. RLS POLICIES - BUSINESS_IMAGES TABLE
-- ============================================================

-- Owner can manage their images
CREATE POLICY "business_images_owner_access" ON public.business_images
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE auth.uid() = owner_user_id
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE auth.uid() = owner_user_id
    )
  );

-- Palika staff can manage (using admin_regions for access control, not just palika_id)
CREATE POLICY "business_images_palika_staff" ON public.business_images
  FOR ALL
  USING (
    public.get_user_role() = 'super_admin' OR (
      business_id IN (
        SELECT id FROM public.businesses b
        WHERE public.user_has_access_to_palika(b.palika_id) AND
              public.user_has_permission('manage_businesses')
      )
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      business_id IN (
        SELECT id FROM public.businesses b
        WHERE public.user_has_access_to_palika(b.palika_id) AND
              public.user_has_permission('manage_businesses')
      )
    )
  );

-- Public can read published
CREATE POLICY "business_images_public_read" ON public.business_images
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE is_published = true AND status = 'approved'
    )
  );

-- ============================================================
-- 8. RLS POLICIES - APPROVAL_WORKFLOWS TABLE
-- ============================================================

-- Palika admin can read/write their workflows (using admin_regions for access control)
CREATE POLICY "approval_workflows_palika_admin" ON public.approval_workflows
  FOR ALL
  USING (
    public.get_user_role() = 'super_admin' OR
    public.user_has_access_to_palika(palika_id)
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR
    public.user_has_access_to_palika(palika_id)
  );

-- ============================================================
-- 9. RLS POLICIES - APPROVAL_NOTES TABLE
-- ============================================================

-- Palika staff can read/write notes for their businesses (using admin_regions for access control)
CREATE POLICY "approval_notes_palika_staff" ON public.approval_notes
  FOR ALL
  USING (
    public.get_user_role() = 'super_admin' OR (
      business_id IN (
        SELECT id FROM public.businesses b
        WHERE public.user_has_access_to_palika(b.palika_id) AND
              public.user_has_permission('manage_businesses')
      )
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      business_id IN (
        SELECT id FROM public.businesses b
        WHERE public.user_has_access_to_palika(b.palika_id) AND
              public.user_has_permission('manage_businesses')
      )
    )
  );

-- Super admin can read all
CREATE POLICY "approval_notes_super_admin_read" ON public.approval_notes
  FOR SELECT
  USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 10. TRIGGER: Update updated_at on business changes
-- ============================================================

CREATE OR REPLACE FUNCTION update_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_business_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_updated_at();

-- ============================================================
-- 11. TRIGGER: Audit log business changes
-- ============================================================

CREATE OR REPLACE FUNCTION audit_business_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
BEGIN
  -- Calculate changes only for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    v_changes := (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(row_to_json(NEW)::jsonb - row_to_json(OLD)::jsonb)
    );
  ELSE
    v_changes := NULL;
  END IF;

  INSERT INTO public.audit_log (
    admin_id,
    operation_type,
    table_name,
    record_id,
    old_values,
    new_values,
    changes
  ) VALUES (
    auth.uid(),
    TG_OP,
    'businesses',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_business_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION audit_business_changes();

-- ============================================================
-- 12. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.business_images TO authenticated;
GRANT SELECT ON public.business_images TO anon;
GRANT SELECT, INSERT, UPDATE ON public.approval_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_notes TO authenticated;

-- ============================================================
-- 13. HELPER FUNCTION: Get businesses pending approval
-- ============================================================

CREATE OR REPLACE FUNCTION get_pending_businesses_for_palika(p_palika_id INTEGER)
RETURNS TABLE (
  id UUID,
  business_name VARCHAR,
  business_type VARCHAR,
  status VARCHAR,
  verification_status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  owner_phone VARCHAR,
  owner_email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.business_name,
    b.business_type,
    b.status,
    b.verification_status,
    b.created_at,
    b.contact_phone,
    b.contact_email
  FROM public.businesses b
  WHERE b.palika_id = p_palika_id
    AND b.status = 'pending_review'
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. HELPER FUNCTION: Check if business is visible to user
-- ============================================================

CREATE OR REPLACE FUNCTION user_can_see_business(p_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_see BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id
    AND (
      -- Published and approved
      (is_published = true AND status = 'approved')
      -- Owner
      OR owner_user_id = auth.uid()
      -- Palika staff
      OR palika_id IN (
        SELECT palika_id FROM public.admin_users
        WHERE id = auth.uid()
      )
      -- Super admin
      OR (SELECT EXISTS(
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid() AND role = 'super_admin'
      ))
    )
  ) INTO v_can_see;

  RETURN COALESCE(v_can_see, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
