-- ==========================================
-- MIGRATION: Critical RLS Security Fixes
-- ==========================================
-- DATE: 2026-03-06
-- SEVERITY: CRITICAL
--
-- Bug #1: RLS access functions have backdoor shortcuts
--   - user_has_access_to_palika() checks OR au.palika_id = palika_id_param
--   - user_has_access_to_district() checks OR au.district_id = district_id_param
--   - user_has_access_to_province() checks OR au.province_id = province_id_param
--   - Result: Admins retain access after admin_regions deleted
--   - Fix: Remove shortcuts, use ONLY admin_regions table
--
-- Bug #2: Audit log schema constraint mismatch
--   - Column: admin_id NOT NULL
--   - Trigger tries to insert NULL (for system operations)
--   - Result: Audit logs fail silently
--   - Fix: Allow NULL admin_id in schema

-- ==========================================
-- FIX #1: Update RLS Access Functions
-- ==========================================
-- Drop dependent policies first
-- IMPORTANT: Drop the old admin_all policy that uses palika_id shortcut!
DROP POLICY IF EXISTS "heritage_sites_admin_all" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;

-- Drop old shortcut policies from other tables
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
DROP POLICY IF EXISTS "events_admin_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;

DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;

DROP POLICY IF EXISTS "businesses_admin_all" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

DROP POLICY IF EXISTS "sos_requests_admin_all" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

DROP POLICY IF EXISTS "admin_users_managed_read" ON public.admin_users;

-- Recreate functions without shortcuts
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
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
        AND ar.region_type = 'palika'
        AND ar.region_id = palika_id_param
      )
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        JOIN public.palikas p ON p.id = palika_id_param
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'district'
        AND ar.region_id = p.district_id
      )
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

-- Recreate policies
CREATE POLICY "heritage_sites_admin_read"
ON public.heritage_sites FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_insert"
ON public.heritage_sites FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_update"
ON public.heritage_sites FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_delete"
ON public.heritage_sites FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "events_admin_read"
ON public.events FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_insert"
ON public.events FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_update"
ON public.events FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_delete"
ON public.events FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "blog_posts_admin_read"
ON public.blog_posts FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_blog_posts')
);

CREATE POLICY "blog_posts_admin_insert"
ON public.blog_posts FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_blog_posts')
);

CREATE POLICY "blog_posts_admin_update"
ON public.blog_posts FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  (
    public.user_has_permission('manage_blog_posts') OR
    (public.get_user_role() = 'moderator' AND author_id = auth.uid())
  )
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_blog_posts')
);

CREATE POLICY "blog_posts_admin_delete"
ON public.blog_posts FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  (
    public.user_has_permission('manage_blog_posts') OR
    (public.get_user_role() = 'moderator' AND author_id = auth.uid())
  )
);

CREATE POLICY "businesses_admin_read"
ON public.businesses FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_insert"
ON public.businesses FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_update"
ON public.businesses FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_delete"
ON public.businesses FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "reviews_admin_read"
ON public.reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
);

CREATE POLICY "reviews_admin_update"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
);

CREATE POLICY "reviews_admin_delete"
ON public.reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
);

CREATE POLICY "sos_requests_admin_read"
ON public.sos_requests FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_insert"
ON public.sos_requests FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_update"
ON public.sos_requests FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_delete"
ON public.sos_requests FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "admin_users_managed_read"
ON public.admin_users FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.user_has_access_to_palika(palika_id) AND
    public.get_user_role() = 'palika_admin'
  )
);

-- ==========================================
-- FIX #2: Audit Log Schema
-- ==========================================

-- Allow NULL admin_id for system operations
ALTER TABLE public.audit_log
ALTER COLUMN admin_id DROP NOT NULL;

-- Fix foreign key constraint
ALTER TABLE public.audit_log
DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;

ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id
ON public.audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
ON public.audit_log(action);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id
ON public.audit_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON public.audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity_action_time
ON public.audit_log(entity_type, entity_id, action, created_at DESC);

-- Grant permissions
GRANT SELECT ON public.audit_log TO authenticated;
