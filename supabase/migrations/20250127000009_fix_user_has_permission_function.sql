-- ==========================================
-- MIGRATION: Fix user_has_permission Function
-- ==========================================
-- The user_has_permission function was trying to join au.role (string) with rp.role_id (integer)
-- This migration fixes the function to properly join through the roles table

-- Drop all policies that depend on the function
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

-- Drop the incorrect function
DROP FUNCTION IF EXISTS public.user_has_permission(VARCHAR);

-- Create the corrected function
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the policies with the fixed function
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
