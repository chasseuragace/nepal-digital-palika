-- ==========================================
-- MIGRATION: Fix RLS Public Policy for Authenticated Users
-- ==========================================
-- The public_read policies were allowing authenticated users to see all published content
-- This breaks RLS enforcement for admins.
-- 
-- Solution: Make public policies only apply to unauthenticated users
-- by adding a check: auth.uid() IS NULL

-- Drop all public read policies
DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;
DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "businesses_public_read" ON public.businesses;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;

-- Recreate public read policies with auth check (only for unauthenticated users)
CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites
FOR SELECT
USING (status = 'published' AND auth.uid() IS NULL);

CREATE POLICY "events_public_read"
ON public.events
FOR SELECT
USING (status = 'published' AND auth.uid() IS NULL);

CREATE POLICY "blog_posts_public_read"
ON public.blog_posts
FOR SELECT
USING (status = 'published' AND auth.uid() IS NULL);

CREATE POLICY "businesses_public_read"
ON public.businesses
FOR SELECT
USING (verification_status = 'verified' AND auth.uid() IS NULL);

CREATE POLICY "reviews_public_read"
ON public.reviews
FOR SELECT
USING (is_approved = true AND auth.uid() IS NULL);
