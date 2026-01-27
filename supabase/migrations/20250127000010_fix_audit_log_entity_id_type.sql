-- ==========================================
-- MIGRATION: Fix Audit Log entity_id Type
-- ==========================================
-- Change entity_id from UUID to TEXT to support both UUID and integer IDs

-- Drop the audit_log table and recreate it with TEXT entity_id
-- First, drop all triggers that depend on audit_log
DROP TRIGGER IF EXISTS audit_admin_users ON public.admin_users;
DROP TRIGGER IF EXISTS audit_admin_regions ON public.admin_regions;
DROP TRIGGER IF EXISTS audit_heritage_sites ON public.heritage_sites;
DROP TRIGGER IF EXISTS audit_events ON public.events;
DROP TRIGGER IF EXISTS audit_businesses ON public.businesses;
DROP TRIGGER IF EXISTS audit_blog_posts ON public.blog_posts;
DROP TRIGGER IF EXISTS audit_reviews ON public.reviews;
DROP TRIGGER IF EXISTS audit_sos_requests ON public.sos_requests;

-- Drop the audit_log table
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- Recreate the audit_log table with TEXT entity_id
CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_audit_log_admin_id ON public.audit_log(admin_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- Update the audit trigger function to cast IDs to TEXT
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_changes JSONB;
  v_entity_id TEXT;
BEGIN
  -- Get current admin ID
  v_admin_id := auth.uid();
  
  -- Skip if no admin is logged in (system operations)
  IF v_admin_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
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
  
  -- Insert audit log entry
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
