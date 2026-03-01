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

DROP POLICY IF EXISTS "businesses_public_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_palika_staff_access" ON public.businesses;
DROP POLICY IF EXISTS "businesses_super_admin_all" ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner_access" ON public.businesses;
DROP POLICY IF EXISTS "business_images_owner_access" ON public.business_images;
DROP POLICY IF EXISTS "business_images_palika_staff" ON public.business_images;
DROP POLICY IF EXISTS "business_images_public_read" ON public.business_images;
DROP POLICY IF EXISTS "approval_workflows_palika_admin" ON public.approval_workflows;
DROP POLICY IF EXISTS "approval_notes_read" ON public.approval_notes;
DROP POLICY IF EXISTS "approval_notes_author_modify" ON public.approval_notes;

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES - BUSINESSES TABLE
-- ============================================================

-- Policy 1: Business owner can read/write only their own businesses
CREATE POLICY "businesses_owner_access" ON public.businesses
  FOR ALL
  USING (
    auth.uid() = owner_user_id
    OR owner_user_id IS NULL -- Draft businesses with no owner
  )
  WITH CHECK (
    auth.uid() = owner_user_id
    OR owner_user_id IS NULL
  );

-- Policy 2: Palika staff can read/write businesses in their palika
CREATE POLICY "businesses_palika_staff_access" ON public.businesses
  FOR ALL
  USING (
    palika_id IN (
      SELECT palika_id FROM public.admin_users
      WHERE id = auth.uid()
    )
    OR get_user_role() = 'super_admin'
  )
  WITH CHECK (
    palika_id IN (
      SELECT palika_id FROM public.admin_users
      WHERE id = auth.uid()
    )
    OR get_user_role() = 'super_admin'
  );

-- Policy 3: Public can read published businesses
CREATE POLICY "businesses_public_read" ON public.businesses
  FOR SELECT
  USING (
    is_published = true
    AND status = 'approved'
  );

-- Policy 4: Super admin can do everything
CREATE POLICY "businesses_super_admin_all" ON public.businesses
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

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

-- Palika staff can manage
CREATE POLICY "business_images_palika_staff" ON public.business_images
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses b
      WHERE b.palika_id IN (
        SELECT palika_id FROM public.admin_users WHERE id = auth.uid()
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

-- Palika admin can read/write their workflows
CREATE POLICY "approval_workflows_palika_admin" ON public.approval_workflows
  FOR ALL
  USING (
    palika_id IN (
      SELECT palika_id FROM public.admin_users WHERE id = auth.uid()
    )
    OR get_user_role() = 'super_admin'
  )
  WITH CHECK (
    palika_id IN (
      SELECT palika_id FROM public.admin_users WHERE id = auth.uid()
    )
    OR get_user_role() = 'super_admin'
  );

-- ============================================================
-- 9. RLS POLICIES - APPROVAL_NOTES TABLE
-- ============================================================

-- Palika staff can read/write notes for their businesses
CREATE POLICY "approval_notes_palika_staff" ON public.approval_notes
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses b
      WHERE b.palika_id IN (
        SELECT palika_id FROM public.admin_users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses b
      WHERE b.palika_id IN (
        SELECT palika_id FROM public.admin_users WHERE id = auth.uid()
      )
    )
  );

-- Super admin can read all
CREATE POLICY "approval_notes_super_admin_read" ON public.approval_notes
  FOR SELECT
  USING (get_user_role() = 'super_admin');

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
