-- ==========================================
-- MIGRATION: Enable Row-Level Security (RLS)
-- ==========================================
-- This migration enables RLS and defines access policies for tables.
-- It ensures users can only access data they are permitted to see.

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Helper function to get the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to get the palika_id of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_user_palika_id()
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT palika_id
    FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- HERITAGE SITES
-- ==========================================

ALTER TABLE public.heritage_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites
FOR SELECT
USING (status = 'published');

CREATE POLICY "heritage_sites_support_read"
ON public.heritage_sites
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

CREATE POLICY "heritage_sites_admin_all"
ON public.heritage_sites
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

-- ==========================================
-- EVENTS
-- ==========================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read"
ON public.events
FOR SELECT
USING (status = 'published');

CREATE POLICY "events_support_read"
ON public.events
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

CREATE POLICY "events_admin_all"
ON public.events
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

-- ==========================================
-- BLOG POSTS
-- ==========================================

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

CREATE POLICY "blog_posts_support_read"
ON public.blog_posts
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

CREATE POLICY "blog_posts_admin_read"
ON public.blog_posts
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

CREATE POLICY "blog_posts_admin_insert"
ON public.blog_posts
FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

CREATE POLICY "blog_posts_admin_update"
ON public.blog_posts
FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    (
      public.get_user_role() = 'palika_admin' OR
      (public.get_user_role() = 'moderator' AND author_id = auth.uid())
    )
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

CREATE POLICY "blog_posts_admin_delete"
ON public.blog_posts
FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    (
      public.get_user_role() = 'palika_admin' OR
      (public.get_user_role() = 'moderator' AND author_id = auth.uid())
    )
  )
);

-- ==========================================
-- BUSINESSES
-- ==========================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_public_read"
ON public.businesses
FOR SELECT
USING (verification_status = 'verified');

CREATE POLICY "businesses_support_read"
ON public.businesses
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

CREATE POLICY "businesses_admin_all"
ON public.businesses
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);

-- ==========================================
-- ADMIN USERS
-- ==========================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_self_read"
ON public.admin_users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "admin_users_palika_read"
ON public.admin_users
FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() = 'palika_admin'
  )
);

CREATE POLICY "admin_users_super_admin_all"
ON public.admin_users
FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- REVIEWS
-- ==========================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

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
    AND b.palika_id = public.get_user_palika_id()
  )
);

CREATE POLICY "reviews_admin_all"
ON public.reviews
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('palika_admin', 'moderator') AND
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = reviews.business_id 
      AND b.palika_id = public.get_user_palika_id()
    )
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('palika_admin', 'moderator') AND
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = reviews.business_id 
      AND b.palika_id = public.get_user_palika_id()
    )
  )
);

-- ==========================================
-- SOS REQUESTS
-- ==========================================

ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sos_requests_support_read"
ON public.sos_requests
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

CREATE POLICY "sos_requests_admin_all"
ON public.sos_requests
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
);
