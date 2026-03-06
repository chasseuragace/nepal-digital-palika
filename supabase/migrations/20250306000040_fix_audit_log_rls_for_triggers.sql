-- ==========================================
-- MIGRATION: Fix Audit Log RLS for Triggers
-- ==========================================
-- Issue: The audit_log_insert RLS policy requires super_admin role
-- But audit triggers need to insert logs for any user's operations
-- Solution: Update the RLS policy to allow authenticated users to insert
-- (Authorization is handled by the SECURITY DEFINER trigger function)

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

-- Create a policy that allows authenticated users to insert
-- The trigger function with SECURITY DEFINER handles authorization
CREATE POLICY "audit_log_authenticated_insert"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow anon (unauthenticated) users in case we have system operations
CREATE POLICY "audit_log_anon_insert"
ON public.audit_log
FOR INSERT
TO anon
WITH CHECK (true);
