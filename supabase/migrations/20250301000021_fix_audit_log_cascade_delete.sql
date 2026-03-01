-- ==========================================
-- MIGRATION: Fix Audit Log Cascade Delete
-- ==========================================
-- The audit_log table's foreign key to admin_users needs ON DELETE CASCADE
-- This allows admin deletion to cascade and delete related audit logs

-- Drop the existing foreign key constraint
ALTER TABLE public.audit_log
DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;

-- Recreate the foreign key with ON DELETE CASCADE
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;
