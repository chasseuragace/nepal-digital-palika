-- ==========================================
-- MIGRATION: Fix All RLS and Audit Issues
-- ==========================================
-- Fixes 5 critical RLS bugs preventing tests from passing:
-- 1. Infinite recursion in admin_regions_managed_read policy
-- 2. LEFT JOIN bug in user_has_access_to_palika (reverted from _012 in _020)
-- 3. admin_users.palika_id short-circuits access revocation
-- 4. heritage_sites_public_read blocks authenticated users
-- 5. district_admin permissions not seeded

-- ==========================================
-- PART 1: Create helper function for admin info (SECURITY DEFINER)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_current_admin_info()
RETURNS TABLE(
  admin_id UUID,
  role TEXT,
  hierarchy_level TEXT,
  province_id INTEGER,
  district_id INTEGER,
  palika_id INTEGER
) AS $$
SELECT
  au.id,
  au.role,
  au.hierarchy_level,
  au.province_id,
  au.district_id,
  au.palika_id
FROM public.admin_users au
WHERE au.id = auth.uid()
AND au.is_active = true
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ==========================================
-- PART 2: Fix user_has_access_to_palika - use EXISTS not LEFT JOIN
-- ==========================================
-- First drop all policies that depend on this function
DROP POLICY IF EXISTS "heritage_sites_support_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;

DROP POLICY IF EXISTS "events_support_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;

DROP POLICY IF EXISTS "blog_posts_support_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;

DROP POLICY IF EXISTS "businesses_support_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

DROP POLICY IF EXISTS "reviews_support_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

DROP POLICY IF EXISTS "sos_requests_support_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

-- Now drop the function
DROP FUNCTION IF EXISTS public.user_has_access_to_palika(INT);

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

-- ==========================================
-- PART 3: Drop problematic admin_regions policies and recreate them
-- ==========================================
DROP POLICY IF EXISTS "admin_regions_super_admin_read" ON public.admin_regions;
DROP POLICY IF EXISTS "admin_regions_self_read" ON public.admin_regions;
DROP POLICY IF EXISTS "admin_regions_managed_read" ON public.admin_regions;
DROP POLICY IF EXISTS "admin_regions_super_admin_all" ON public.admin_regions;

-- Super admin: read all
CREATE POLICY "admin_regions_super_admin_read"
ON public.admin_regions FOR SELECT
USING (public.get_user_role() = 'super_admin');

-- Self: admins can see their own region assignments
CREATE POLICY "admin_regions_self_read"
ON public.admin_regions FOR SELECT
USING (admin_id = auth.uid());

-- Simplified managed read: use SECURITY DEFINER function to avoid recursion
CREATE POLICY "admin_regions_managed_read"
ON public.admin_regions FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    -- For non-super admins, check if they manage the assigned-to admin
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    EXISTS (
      SELECT 1 FROM public.get_current_admin_info() current_admin
      JOIN public.admin_users target_admin ON target_admin.id = admin_regions.admin_id
      WHERE (
        (current_admin.hierarchy_level = 'province' AND current_admin.province_id = target_admin.province_id)
        OR (current_admin.hierarchy_level = 'district' AND current_admin.district_id = target_admin.district_id)
        OR (current_admin.hierarchy_level = 'palika' AND current_admin.palika_id = target_admin.palika_id)
      )
    )
  )
);

-- Super admin: write all
CREATE POLICY "admin_regions_super_admin_all"
ON public.admin_regions FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- PART 4: Fix heritage_sites public read policy
-- ==========================================
DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;

-- Published sites visible to everyone (authenticated or not)
CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites FOR SELECT
USING (status = 'published');

-- ==========================================
-- PART 5: Recreate all content admin read policies with super_admin bypass
-- ==========================================
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "events_admin_read" ON public.events;
DROP POLICY IF EXISTS "blog_posts_admin_read" ON public.blog_posts;
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;

-- Heritage sites: super admin OR has region access AND permission
CREATE POLICY "heritage_sites_admin_read"
ON public.heritage_sites FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

-- Events: super admin OR has region access AND permission
CREATE POLICY "events_admin_read"
ON public.events FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

-- Blog posts: super admin OR has region access AND permission
CREATE POLICY "blog_posts_admin_read"
ON public.blog_posts FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

-- Businesses: super admin OR has region access AND permission
CREATE POLICY "businesses_admin_read"
ON public.businesses FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

-- ==========================================
-- PART 6: Ensure all role_permissions are seeded
-- ==========================================
-- This re-runs the seeding from migrations _008 and _014 to ensure completeness
-- Insert missing permissions for new roles if not already present
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE
  (r.name = 'palika_admin' AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
    'manage_businesses', 'manage_sos', 'moderate_content'
  ))
  OR (r.name = 'district_admin' AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
    'manage_businesses', 'manage_sos', 'moderate_content'
  ))
  OR (r.name = 'province_admin' AND p.name IN (
    'manage_heritage_sites', 'manage_events', 'manage_blog_posts',
    'manage_businesses', 'manage_sos', 'moderate_content'
  ))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==========================================
-- PART 7: Recreate all UPDATE/INSERT/DELETE policies with same super_admin bypass
-- ==========================================
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

-- Heritage sites
CREATE POLICY "heritage_sites_admin_insert"
ON public.heritage_sites FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

CREATE POLICY "heritage_sites_admin_update"
ON public.heritage_sites FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

CREATE POLICY "heritage_sites_admin_delete"
ON public.heritage_sites FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

-- Events
CREATE POLICY "events_admin_insert"
ON public.events FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

CREATE POLICY "events_admin_update"
ON public.events FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

CREATE POLICY "events_admin_delete"
ON public.events FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

-- Blog posts
CREATE POLICY "blog_posts_admin_insert"
ON public.blog_posts FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

CREATE POLICY "blog_posts_admin_update"
ON public.blog_posts FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

CREATE POLICY "blog_posts_admin_delete"
ON public.blog_posts FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

-- Businesses
CREATE POLICY "businesses_admin_insert"
ON public.businesses FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

CREATE POLICY "businesses_admin_update"
ON public.businesses FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

CREATE POLICY "businesses_admin_delete"
ON public.businesses FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

-- ==========================================
-- PART 8: Ensure SOS requests also have proper policies
-- ==========================================
DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

CREATE POLICY "sos_requests_admin_read"
ON public.sos_requests FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

CREATE POLICY "sos_requests_admin_insert"
ON public.sos_requests FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

CREATE POLICY "sos_requests_admin_update"
ON public.sos_requests FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

CREATE POLICY "sos_requests_admin_delete"
ON public.sos_requests FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);
