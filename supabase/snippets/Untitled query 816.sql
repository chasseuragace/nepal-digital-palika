-- ==========================================
-- PART 3: ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- This script enables RLS and defines access policies for tables.
-- It ensures users can only access data they are permitted to see.
--
-- Roles:
--   super_admin  - Full access to all Palikas
--   palika_admin - Full access to own Palika
--   moderator    - Read all Palika content, write own content only
--   support      - Read-only access to own Palika
--
-- Updated: 2026-01-05

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

-- 1. Enable RLS
ALTER TABLE public.heritage_sites ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Anyone can view published sites.
CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites
FOR SELECT
USING (status = 'published');

-- Support can read all sites in their Palika (read-only)
CREATE POLICY "heritage_sites_support_read"
ON public.heritage_sites
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

-- Admins can manage sites within their own Palika. Super admins can manage all.
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

-- 1. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Anyone can view published events.
CREATE POLICY "events_public_read"
ON public.events
FOR SELECT
USING (status = 'published');

-- Support can read all events in their Palika (read-only)
CREATE POLICY "events_support_read"
ON public.events
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

-- Admins can manage events within their own Palika. Super admins can manage all.
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
-- Special handling: moderators can READ all, but WRITE only their own

-- 1. Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Anyone can view published blog posts.
CREATE POLICY "blog_posts_public_read"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Support can read all posts in their Palika (read-only)
CREATE POLICY "blog_posts_support_read"
ON public.blog_posts
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

-- Admins can read all posts in their Palika
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

-- Admins can create posts in their Palika
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

-- palika_admin can update all Palika posts; moderator can update only their own
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

-- palika_admin can delete all Palika posts; moderator can delete only their own
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

-- 1. Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Anyone can view verified businesses.
CREATE POLICY "businesses_public_read"
ON public.businesses
FOR SELECT
USING (verification_status = 'verified');

-- Support can read all businesses in their Palika (read-only)
CREATE POLICY "businesses_support_read"
ON public.businesses
FOR SELECT
USING (
  public.get_user_role() = 'support' AND
  public.get_user_palika_id() = palika_id
);

-- Admins can manage businesses within their own Palika. Super admins can manage all.
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

-- 1. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Users can view their own profile.
CREATE POLICY "admin_users_self_read"
ON public.admin_users
FOR SELECT
USING (id = auth.uid());

-- Palika admins can view other admins in their own Palika. Super admins can view all.
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

-- Super admins can manage all admin users.
CREATE POLICY "admin_users_super_admin_all"
ON public.admin_users
FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- REVIEWS (if table exists)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Enable RLS
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    
    -- Anyone can read approved reviews
    CREATE POLICY "reviews_public_read"
    ON public.reviews
    FOR SELECT
    USING (is_approved = true);
    
    -- Support can read all reviews in their Palika
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
    
    -- Admins can manage reviews for their Palika content
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
  END IF;
END $$;

-- ==========================================
-- SOS REQUESTS (if table exists)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sos_requests') THEN
    -- Enable RLS
    ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;
    
    -- Support can read SOS requests in their Palika
    CREATE POLICY "sos_requests_support_read"
    ON public.sos_requests
    FOR SELECT
    USING (
      public.get_user_role() = 'support' AND
      public.get_user_palika_id() = palika_id
    );
    
    -- Admins can manage SOS requests in their Palika
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
  END IF;
END $$;

-- ==========================================
-- POLICY SUMMARY
-- ==========================================
--
-- | Table          | Public          | Support      | Moderator           | Palika Admin | Super Admin |
-- |----------------|-----------------|--------------|---------------------|--------------|-------------|
-- | heritage_sites | READ published  | READ palika  | ALL palika          | ALL palika   | ALL         |
-- | events         | READ published  | READ palika  | ALL palika          | ALL palika   | ALL         |
-- | blog_posts     | READ published  | READ palika  | READ all, WRITE own | ALL palika   | ALL         |
-- | businesses     | READ verified   | READ palika  | ALL palika          | ALL palika   | ALL         |
-- | admin_users    | -               | -            | -                   | READ palika  | ALL         |
-- | reviews        | READ approved   | READ palika  | ALL palika          | ALL palika   | ALL         |
-- | sos_requests   | -               | READ palika  | ALL palika          | ALL palika   | ALL         |
--
-- ==========================================