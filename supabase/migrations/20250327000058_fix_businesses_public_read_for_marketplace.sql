-- Migration: Fix businesses RLS policies for marketplace seller visibility
-- Issue: Seller information not visible to non-owners on product detail pages
-- Date: 2025-03-27
-- 
-- Problem: The existing businesses_public_read policy only applies to unauthenticated
-- users (auth.uid() IS NULL), which means authenticated users viewing products
-- cannot see seller information unless they own the business.
--
-- Solution: Create separate policies for anon and authenticated roles that allow
-- viewing published and approved businesses.

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "businesses_public_read" ON public.businesses;
DROP POLICY IF EXISTS "businesses_authenticated_read" ON public.businesses;

-- Policy 1: Allow anonymous (unauthenticated) users to view published businesses
-- This enables seller information to be visible on product pages for logged-out users
CREATE POLICY "businesses_public_read"
ON public.businesses
FOR SELECT
TO anon
USING (
  is_published = true 
  AND status = 'approved'
);

-- Policy 2: Allow authenticated users to view published businesses OR their own business
-- This enables:
-- - Viewing seller information on any product (if business is published/approved)
-- - Viewing their own business regardless of status (for editing, etc.)
CREATE POLICY "businesses_authenticated_read"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  (is_published = true AND status = 'approved')
  OR (owner_user_id = auth.uid())
);

-- Verification: Check that policies were created successfully
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'businesses' 
    AND policyname IN ('businesses_public_read', 'businesses_authenticated_read');
  
  IF policy_count = 2 THEN
    RAISE NOTICE 'SUCCESS: Both RLS policies created successfully';
  ELSE
    RAISE WARNING 'WARNING: Expected 2 policies, found %', policy_count;
  END IF;
END $$;

-- Display the created policies for verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'businesses' 
  AND policyname IN ('businesses_public_read', 'businesses_authenticated_read')
ORDER BY policyname;
