-- ==========================================
-- MIGRATION: Update RLS Policies for Hierarchical Access
-- ==========================================
-- Replaces hardcoded role checks with dynamic permission-based access
-- Supports multi-region admin assignments

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Check if user has access to a specific palika
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.palika_id = palika_id_param
      OR (ar.region_type = 'palika' AND ar.region_id = palika_id_param)
      OR (
        ar.region_type = 'district' AND
        EXISTS (
          SELECT 1 FROM public.palikas p
          WHERE p.id = palika_id_param
          AND p.district_id = ar.region_id
        )
      )
      OR (
        ar.region_type = 'province' AND
        EXISTS (
          SELECT 1 FROM public.palikas p
          JOIN public.districts d ON p.district_id = d.id
          WHERE p.id = palika_id_param
          AND d.province_id = ar.region_id
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.role_permissions rp ON au.role = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access a district
CREATE OR REPLACE FUNCTION public.user_has_access_to_district(district_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.district_id = district_id_param
      OR (ar.region_type = 'district' AND ar.region_id = district_id_param)
      OR (
        ar.region_type = 'province' AND
        EXISTS (
          SELECT 1 FROM public.districts d
          WHERE d.id = district_id_param
          AND d.province_id = ar.region_id
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access a province
CREATE OR REPLACE FUNCTION public.user_has_access_to_province(province_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    LEFT JOIN public.admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin'
      OR au.province_id = province_id_param
      OR (ar.region_type = 'province' AND ar.region_id = province_id_param)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- DROP EXISTING POLICIES
-- ==========================================

DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_support_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_all" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_insert" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_update" ON public.heritage_sites;
DROP POLICY IF EXISTS "heritage_sites_admin_delete" ON public.heritage_sites;

DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_support_read" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
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
DROP POLICY IF EXISTS "businesses_admin_all" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_support_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

DROP POLICY IF EXISTS "sos_requests_support_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_all" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_read" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_insert" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_update" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_admin_delete" ON public.sos_requests;

-- ==========================================
-- HERITAGE SITES - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- EVENTS - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- BLOG POSTS - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- BUSINESSES - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- REVIEWS - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- SOS REQUESTS - UPDATED POLICIES
-- ==========================================

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

-- ==========================================
-- ADMIN USERS - UPDATED POLICIES
-- ==========================================

DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_palika_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_super_admin_all" ON public.admin_users;

CREATE POLICY "admin_users_self_read"
ON public.admin_users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "admin_users_managed_read"
ON public.admin_users
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND (
        (au.hierarchy_level = 'province' AND au.province_id = admin_users.province_id)
        OR (au.hierarchy_level = 'district' AND au.district_id = admin_users.district_id)
        OR (au.hierarchy_level = 'palika' AND au.palika_id = admin_users.palika_id)
      )
    )
  )
);

CREATE POLICY "admin_users_super_admin_all"
ON public.admin_users
FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');
