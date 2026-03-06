-- ==========================================
-- MIGRATION: Consolidated Row Level Security
-- ==========================================
-- SINGLE SOURCE OF TRUTH for all RLS policies
-- All access control policies in one migration
-- Tables and functions must exist before this migration runs
--
-- Organization:
-- - Enable RLS on all tables
-- - Public/authenticated access policies first
-- - Admin access policies (hierarchical)
-- - Super admin bypass
-- - Audit and system tables

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE IF EXISTS public.heritage_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sos_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tier_assignment_log ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. ADMIN USERS POLICIES
-- ==========================================

-- Admins can see their own profile
CREATE POLICY IF NOT EXISTS "admin_users_self_read"
ON public.admin_users FOR SELECT
USING (id = auth.uid());

-- Admins can see users they manage (same palika/district/province)
CREATE POLICY IF NOT EXISTS "admin_users_managed_read"
ON public.admin_users FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.user_has_access_to_palika(palika_id) AND
    public.get_user_role() = 'palika_admin'
  )
);

-- Super admin can see and manage all
CREATE POLICY IF NOT EXISTS "admin_users_super_admin_all"
ON public.admin_users FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 3. ADMIN REGIONS POLICIES
-- ==========================================

-- Super admin: read all
CREATE POLICY IF NOT EXISTS "admin_regions_super_admin_read"
ON public.admin_regions FOR SELECT
USING (public.get_user_role() = 'super_admin');

-- Self: admins can see their own region assignments
CREATE POLICY IF NOT EXISTS "admin_regions_self_read"
ON public.admin_regions FOR SELECT
USING (admin_id = auth.uid());

-- Managed: admins can see regions of admins they manage
CREATE POLICY IF NOT EXISTS "admin_regions_managed_read"
ON public.admin_regions FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
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
CREATE POLICY IF NOT EXISTS "admin_regions_super_admin_all"
ON public.admin_regions FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 4. HERITAGE SITES POLICIES
-- ==========================================

-- Public: published sites visible to everyone
CREATE POLICY IF NOT EXISTS "heritage_sites_public_read"
ON public.heritage_sites FOR SELECT
USING (status = 'published');

-- Admin: super admin or has region access + permission
CREATE POLICY IF NOT EXISTS "heritage_sites_admin_read"
ON public.heritage_sites FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

CREATE POLICY IF NOT EXISTS "heritage_sites_admin_insert"
ON public.heritage_sites FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

CREATE POLICY IF NOT EXISTS "heritage_sites_admin_update"
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

CREATE POLICY IF NOT EXISTS "heritage_sites_admin_delete"
ON public.heritage_sites FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_heritage_sites')
  )
);

-- ==========================================
-- 5. EVENTS POLICIES
-- ==========================================

CREATE POLICY IF NOT EXISTS "events_public_read"
ON public.events FOR SELECT
USING (status = 'published');

CREATE POLICY IF NOT EXISTS "events_admin_read"
ON public.events FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

CREATE POLICY IF NOT EXISTS "events_admin_insert"
ON public.events FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

CREATE POLICY IF NOT EXISTS "events_admin_update"
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

CREATE POLICY IF NOT EXISTS "events_admin_delete"
ON public.events FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_events')
  )
);

-- ==========================================
-- 6. BLOG POSTS POLICIES
-- ==========================================

CREATE POLICY IF NOT EXISTS "blog_posts_public_read"
ON public.blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY IF NOT EXISTS "blog_posts_admin_read"
ON public.blog_posts FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

CREATE POLICY IF NOT EXISTS "blog_posts_admin_insert"
ON public.blog_posts FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

CREATE POLICY IF NOT EXISTS "blog_posts_admin_update"
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

CREATE POLICY IF NOT EXISTS "blog_posts_admin_delete"
ON public.blog_posts FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_blog_posts')
  )
);

-- ==========================================
-- 7. BUSINESSES POLICIES
-- ==========================================

CREATE POLICY IF NOT EXISTS "businesses_public_read"
ON public.businesses FOR SELECT
USING (verification_status = 'verified');

CREATE POLICY IF NOT EXISTS "businesses_admin_read"
ON public.businesses FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

CREATE POLICY IF NOT EXISTS "businesses_admin_insert"
ON public.businesses FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

CREATE POLICY IF NOT EXISTS "businesses_admin_update"
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

CREATE POLICY IF NOT EXISTS "businesses_admin_delete"
ON public.businesses FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_businesses')
  )
);

-- ==========================================
-- 8. REVIEWS POLICIES
-- ==========================================

CREATE POLICY IF NOT EXISTS "reviews_public_read"
ON public.reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY IF NOT EXISTS "reviews_admin_read"
ON public.reviews FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.get_user_role() IN ('palika_admin', 'moderator', 'district_admin', 'province_admin') AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id
      AND public.user_has_access_to_palika(b.palika_id)
    )
  )
);

CREATE POLICY IF NOT EXISTS "reviews_admin_update"
ON public.reviews FOR UPDATE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.get_user_role() IN ('palika_admin', 'moderator', 'district_admin', 'province_admin') AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id
      AND public.user_has_access_to_palika(b.palika_id)
    )
  )
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.get_user_role() IN ('palika_admin', 'moderator', 'district_admin', 'province_admin') AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id
      AND public.user_has_access_to_palika(b.palika_id)
    )
  )
);

CREATE POLICY IF NOT EXISTS "reviews_admin_delete"
ON public.reviews FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.get_user_role() IN ('palika_admin', 'moderator', 'district_admin', 'province_admin') AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id
      AND public.user_has_access_to_palika(b.palika_id)
    )
  )
);

-- ==========================================
-- 9. SOS REQUESTS POLICIES
-- ==========================================

CREATE POLICY IF NOT EXISTS "sos_requests_admin_read"
ON public.sos_requests FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

CREATE POLICY IF NOT EXISTS "sos_requests_admin_insert"
ON public.sos_requests FOR INSERT
WITH CHECK (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

CREATE POLICY IF NOT EXISTS "sos_requests_admin_update"
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

CREATE POLICY IF NOT EXISTS "sos_requests_admin_delete"
ON public.sos_requests FOR DELETE
USING (
  public.get_user_role() = 'super_admin' OR (
    public.user_has_access_to_palika(palika_id) AND
    public.user_has_permission('manage_sos')
  )
);

-- ==========================================
-- 10. SUBSCRIPTION TIERS POLICIES
-- ==========================================

-- Tiers are readable by everyone (needed for feature checks)
CREATE POLICY IF NOT EXISTS "subscription_tiers_readable"
ON public.subscription_tiers FOR SELECT
USING (true);

-- Tiers are writable by super_admin only
CREATE POLICY IF NOT EXISTS "subscription_tiers_writable"
ON public.subscription_tiers FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 11. FEATURES POLICIES
-- ==========================================

-- Features are readable by everyone
CREATE POLICY IF NOT EXISTS "features_readable"
ON public.features FOR SELECT
USING (true);

-- Features are writable by super_admin only
CREATE POLICY IF NOT EXISTS "features_writable"
ON public.features FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 12. TIER_FEATURES POLICIES
-- ==========================================

-- Tier-feature mappings are readable by everyone
CREATE POLICY IF NOT EXISTS "tier_features_readable"
ON public.tier_features FOR SELECT
USING (true);

-- Tier-feature mappings are writable by super_admin only
CREATE POLICY IF NOT EXISTS "tier_features_writable"
ON public.tier_features FOR ALL
USING (public.get_user_role() = 'super_admin')
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 13. TIER_ASSIGNMENT_LOG POLICIES
-- ==========================================

-- Tier assignment logs are readable by super_admin
CREATE POLICY IF NOT EXISTS "tier_assignment_log_readable"
ON public.tier_assignment_log FOR SELECT
USING (public.get_user_role() = 'super_admin');

-- Tier assignment logs are writable by super_admin only
CREATE POLICY IF NOT EXISTS "tier_assignment_log_writable"
ON public.tier_assignment_log FOR INSERT
WITH CHECK (public.get_user_role() = 'super_admin');

-- ==========================================
-- 14. AUDIT_LOG POLICIES
-- ==========================================

-- Super admin can see all audit logs
CREATE POLICY IF NOT EXISTS "audit_log_super_admin_read"
ON public.audit_log FOR SELECT
USING (public.get_user_role() = 'super_admin');

-- Admins can see audit logs for their own actions
CREATE POLICY IF NOT EXISTS "audit_log_self_read"
ON public.audit_log FOR SELECT
USING (admin_id = auth.uid());

-- Admins can see audit logs for admins they manage
CREATE POLICY IF NOT EXISTS "audit_log_managed_read"
ON public.audit_log FOR SELECT
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_role() IN ('province_admin', 'district_admin', 'palika_admin') AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND (
        (au.hierarchy_level = 'province' AND au.province_id = (SELECT au2.province_id FROM public.admin_users au2 WHERE au2.id = audit_log.admin_id))
        OR (au.hierarchy_level = 'district' AND au.district_id = (SELECT au2.district_id FROM public.admin_users au2 WHERE au2.id = audit_log.admin_id))
        OR (au.hierarchy_level = 'palika' AND au.palika_id = (SELECT au2.palika_id FROM public.admin_users au2 WHERE au2.id = audit_log.admin_id))
      )
    )
  )
);

-- ==========================================
-- 15. GRANT PERMISSIONS TO USERS
-- ==========================================

GRANT SELECT ON public.subscription_tiers TO anon, authenticated;
GRANT SELECT ON public.features TO anon, authenticated;
GRANT SELECT ON public.tier_features TO anon, authenticated;
GRANT SELECT ON public.tier_assignment_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.palika_has_feature(INTEGER, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_palika_tier(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_access_to_palika(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(VARCHAR) TO authenticated;

-- ==========================================
-- END: Consolidated RLS Migration
-- ==========================================
