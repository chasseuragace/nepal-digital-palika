-- ==========================================
-- RLS FIX: Apply Critical Security Fixes
-- ==========================================
-- This script applies the two critical fixes:
-- 1. Remove shortcuts from access functions (20250306000037)
-- 2. Fix audit log schema (20250306000038)

-- ==========================================
-- FIX #1: User Access Functions (Remove Shortcuts)
-- ==========================================

-- Drop dependent policies first
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;

DROP POLICY IF EXISTS "events_admin_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;

DROP POLICY IF EXISTS "blog_posts_admin_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;

DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

DROP POLICY IF EXISTS "reviews_admin_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

DROP POLICY IF EXISTS "admin_users_managed_read" ON public.admin_users;

-- ==========================================
-- FIXED FUNCTIONS - Only use admin_regions
-- ==========================================

CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      -- REMOVED: OR au.palika_id = palika_id_param
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
      -- REMOVED: OR au.district_id = district_id_param
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
      -- REMOVED: OR au.province_id = province_id_param
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

-- ==========================================
-- RECREATE DEPENDENT POLICIES
-- ==========================================

CREATE POLICY "heritage_sites_admin_read"
ON public.heritage_sites
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_insert"
ON public.heritage_sites
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_update"
ON public.heritage_sites
FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "heritage_sites_admin_delete"
ON public.heritage_sites
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);

CREATE POLICY "events_admin_read"
ON public.events
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_insert"
ON public.events
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_update"
ON public.events
FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "events_admin_delete"
ON public.events
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_events')
);

CREATE POLICY "blog_posts_admin_read"
ON public.blog_posts
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_blog_posts')
);

CREATE POLICY "blog_posts_admin_insert"
ON public.blog_posts
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_blog_posts')
);

CREATE POLICY "blog_posts_admin_update"
ON public.blog_posts
FOR UPDATE
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
ON public.blog_posts
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  (
    public.user_has_permission('manage_blog_posts') OR
    (public.get_user_role() = 'moderator' AND author_id = auth.uid())
  )
);

CREATE POLICY "businesses_admin_read"
ON public.businesses
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_insert"
ON public.businesses
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_update"
ON public.businesses
FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "businesses_admin_delete"
ON public.businesses
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_businesses')
);

CREATE POLICY "reviews_admin_read"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
);

CREATE POLICY "reviews_admin_update"
ON public.reviews
FOR UPDATE
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
ON public.reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = reviews.business_id
    AND public.user_has_access_to_palika(b.palika_id)
  ) AND
  public.user_has_permission('moderate_content')
);

CREATE POLICY "sos_requests_admin_read"
ON public.sos_requests
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_insert"
ON public.sos_requests
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_update"
ON public.sos_requests
FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

CREATE POLICY "sos_requests_admin_delete"
ON public.sos_requests
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_sos')
);

-- Recreate admin_users_managed_read policy
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

-- Allow NULL admin_id in audit_log (for system operations)
ALTER TABLE public.audit_log
ALTER COLUMN admin_id DROP NOT NULL;

-- Ensure proper foreign key (allow NULL)
ALTER TABLE public.audit_log
DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;

ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Add functional indexes for common queries
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

-- Add permissions for querying
GRANT SELECT ON public.audit_log TO anon, authenticated;

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Verify functions were updated
SELECT 'user_has_access_to_palika' as function_name;
SELECT 'user_has_access_to_district' as function_name;
SELECT 'user_has_access_to_province' as function_name;

-- Verify audit_log schema
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'audit_log'
AND column_name = 'admin_id';
