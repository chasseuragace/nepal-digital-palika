-- ==========================================
-- MIGRATION: Fix Audit Trigger for Admin Deletion
-- ==========================================
-- When admin is deleted, audit trigger shouldn't try to log with non-existent admin_id
-- Make admin_id nullable and verify admin exists before logging

-- Drop existing triggers that depend on the function
DROP TRIGGER IF EXISTS audit_admin_users ON public.admin_users;
DROP TRIGGER IF EXISTS audit_admin_regions ON public.admin_regions;
DROP TRIGGER IF EXISTS audit_heritage_sites ON public.heritage_sites;
DROP TRIGGER IF EXISTS audit_events ON public.events;
DROP TRIGGER IF EXISTS audit_businesses ON public.businesses;
DROP TRIGGER IF EXISTS audit_blog_posts ON public.blog_posts;
DROP TRIGGER IF EXISTS audit_reviews ON public.reviews;
DROP TRIGGER IF EXISTS audit_sos_requests ON public.sos_requests;

-- Make admin_id nullable in audit_log to handle system operations
ALTER TABLE public.audit_log
ALTER COLUMN admin_id DROP NOT NULL;

-- Update the audit trigger to check if admin exists before logging
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_changes JSONB;
  v_entity_id TEXT;
  v_admin_exists BOOLEAN;
BEGIN
  -- Get current admin ID
  v_admin_id := auth.uid();

  -- Skip if no admin is logged in (system operations)
  IF v_admin_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Check if the admin still exists
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = v_admin_id
  ) INTO v_admin_exists;

  -- If admin doesn't exist, set admin_id to NULL for system operations
  IF NOT v_admin_exists THEN
    v_admin_id := NULL;
  END IF;

  -- Build changes object
  IF TG_OP = 'INSERT' THEN
    v_changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := to_jsonb(OLD);
  END IF;

  -- Convert entity_id to TEXT (handles both UUID and integer IDs)
  v_entity_id := COALESCE(NEW.id, OLD.id)::TEXT;

  -- Insert audit log entry (admin_id can be NULL for system operations)
  INSERT INTO public.audit_log (
    admin_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    v_admin_id,
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all triggers
CREATE TRIGGER audit_admin_users
AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_admin_regions
AFTER INSERT OR UPDATE OR DELETE ON public.admin_regions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_heritage_sites
AFTER INSERT OR UPDATE OR DELETE ON public.heritage_sites
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_events
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_businesses
AFTER INSERT OR UPDATE OR DELETE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_blog_posts
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_sos_requests
AFTER INSERT OR UPDATE OR DELETE ON public.sos_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
