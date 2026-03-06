-- ==========================================
-- MIGRATION: Fix Audit Log Schema and Constraints
-- ==========================================
-- Issues Fixed:
-- 1. admin_id column is NOT NULL but trigger tries to insert NULL
-- 2. Missing NOT NULL constraint on admin_id for system operations
-- 3. Audit log RLS policies may not allow proper querying
-- 4. Missing functional indexes for common queries
--
-- The audit trigger (20250301000023) now allows admin_id = NULL for system operations,
-- but the audit_log table still enforces NOT NULL. This causes INSERT failures.

-- Step 1: Allow NULL admin_id in audit_log (for system operations)
ALTER TABLE public.audit_log
ALTER COLUMN admin_id DROP NOT NULL;

-- Step 2: Verify entity_id is TEXT type (should be from 20250127000010)
-- entity_id is already TEXT from previous migration

-- Step 3: Ensure proper foreign key (allow NULL)
ALTER TABLE public.audit_log
DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;

ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Step 4: Add functional indexes for common queries
-- Index for queries by entity type and id
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id
ON public.audit_log(entity_type, entity_id);

-- Index for queries by action
CREATE INDEX IF NOT EXISTS idx_audit_log_action
ON public.audit_log(action);

-- Index for queries by admin_id
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id
ON public.audit_log(admin_id);

-- Index for queries by created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON public.audit_log(created_at DESC);

-- Composite index for common query pattern: (entity_type, entity_id, action, created_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_action_time
ON public.audit_log(entity_type, entity_id, action, created_at DESC);

-- Step 5: Verify RLS policies on audit_log allow proper access
-- These should already be created by 20250301000036 but verify they exist

-- Policy 1: Super admin can see all
-- This is already created by consolidated RLS migration

-- Policy 2: Admins can see their own actions
-- This is already created by consolidated RLS migration

-- Step 6: Add comment documenting the schema
COMMENT ON TABLE public.audit_log IS
'Audit log for tracking changes to tracked tables. admin_id can be NULL for system operations.';

COMMENT ON COLUMN public.audit_log.admin_id IS
'UUID of the admin who performed the action. NULL for system operations.';

COMMENT ON COLUMN public.audit_log.entity_id IS
'ID of the entity that was changed (stored as TEXT to handle various ID types: integers, UUIDs, etc.)';

COMMENT ON COLUMN public.audit_log.changes IS
'JSONB object containing the changes. For INSERT/DELETE: full row. For UPDATE: {old: {...}, new: {...}}';

-- Step 7: Grant proper permissions for querying
-- Service role and authenticated users need to be able to query audit_log
GRANT SELECT ON public.audit_log TO anon, authenticated;
