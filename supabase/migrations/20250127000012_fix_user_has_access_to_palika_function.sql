-- ==========================================
-- MIGRATION: Fix user_has_access_to_palika Function
-- ==========================================
-- The user_has_access_to_palika function was using LEFT JOIN which returns NULL rows
-- when admin_regions is empty, breaking the OR logic.
-- This migration replaces LEFT JOIN with EXISTS subqueries for proper NULL handling.

-- Drop all policies that depend on the function
DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_support_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;

DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_support_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;

DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_support_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;

DROP POLICY IF EXISTS "businesses_public_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_support_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_support_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

DROP POLICY IF EXISTS "sos_requests_support_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

DROP POLICY IF EXISTS "heritage_sites_support_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "events_support_read" ON public.events;
DROP POLICY IF EXISTS "blog_posts_support_read" ON public.blog_posts;
DROP POLICY IF EXISTS "businesses_support_read" ON public.businesses;
DROP POLICY IF EXISTS "reviews_support_read" ON public.reviews;
DROP POLICY IF EXISTS "sos_requests_support_read" ON public.sos_requests;

-- Drop the incorrect function
DROP FUNCTION IF EXISTS public.user_has_access_to_palika(INT);

-- Create the corrected function using EXISTS instead of LEFT JOIN
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.palika_id = palika_id_param
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Also fix user_has_access_to_district function
DROP FUNCTION IF EXISTS public.user_has_access_to_district(INT);

CREATE OR REPLACE FUNCTION public.user_has_access_to_district(district_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.district_id = district_id_param
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Also fix user_has_access_to_province function
DROP FUNCTION IF EXISTS public.user_has_access_to_province(INT);

CREATE OR REPLACE FUNCTION public.user_has_access_to_province(province_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.province_id = province_id_param
      OR EXISTS (
        SELECT 1 FROM public.admin_regions ar
        WHERE ar.admin_id = au.id
        AND ar.region_type = 'province'
        AND ar.region_id = province_id_param
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- RECREATE ALL RLS POLICIES
-- ==========================================

-- HERITAGE SITES POLICIES
CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites
FOR SELECT
USING (status = 'published');

CREATE POLICY "heritage_sites_support_read"
ON public.heritage_sites
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.user_has_access_to_palika(palika_id)
);

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

-- EVENTS POLICIES
CREATE POLICY "events_public_read"
ON public.events
FOR SELECT
USING (status = 'published');

CREATE POLICY "events_support_read"
ON public.events
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.user_has_access_to_palika(palika_id)
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

-- BLOG POSTS POLICIES
CREATE POLICY "blog_posts_public_read"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

CREATE POLICY "blog_posts_support_read"
ON public.blog_posts
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.user_has_access_to_palika(palika_id)
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

-- BUSINESSES POLICIES
CREATE POLICY "businesses_public_read"
ON public.businesses
FOR SELECT
USING (verification_status = 'verified');

CREATE POLICY "businesses_support_read"
ON public.businesses
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.user_has_access_to_palika(palika_id)
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

-- REVIEWS POLICIES
CREATE POLICY "reviews_public_read"
ON public.reviews
FOR SELECT
USING (is_approved = true);

CREATE POLICY "reviews_support_read"
ON public.reviews
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = reviews.business_id 
    AND public.user_has_access_to_palika(b.palika_id)
  )
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

-- SOS REQUESTS POLICIES
CREATE POLICY "sos_requests_support_read"
ON public.sos_requests
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.user_has_access_to_palika(palika_id)
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
