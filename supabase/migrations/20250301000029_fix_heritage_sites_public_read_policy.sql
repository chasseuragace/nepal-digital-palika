-- Fix heritage_sites public_read policy to respect admin access controls
-- Current issue: public_read allows all published sites to everyone
-- This overrides the more restrictive admin_read policy due to RLS OR logic
-- Solution: Make public_read apply only to unauthenticated users and non-admin authenticated users

-- ============================================================
-- Drop the overly permissive public_read policy
-- ============================================================

DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;

-- ============================================================
-- Create a proper public read policy that respects admin access
-- ============================================================

-- Public policy: allow unauthenticated users and non-admin authenticated users to see published sites
CREATE POLICY "heritage_sites_public_read"
ON public.heritage_sites FOR SELECT
USING (
  status = 'published' AND (
    -- Unauthenticated users can see all published sites
    auth.uid() IS NULL OR
    -- Non-admin authenticated users can see published sites
    -- (admins must use admin_read policy with proper access controls)
    (get_user_role() IS NULL OR get_user_role() NOT IN ('super_admin', 'palika_admin', 'district_admin', 'province_admin'))
  )
);
