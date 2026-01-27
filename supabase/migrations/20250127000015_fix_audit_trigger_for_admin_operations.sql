-- ==========================================
-- MIGRATION: Fix Audit Trigger for Admin Operations
-- ==========================================
-- Allow audit logging for admin operations performed via service role
-- For admin_users and admin_regions tables, use the admin_id from the record

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_changes JSONB;
BEGIN
  -- Get current admin ID from auth context
  v_admin_id := auth.uid();
  
  -- For admin_users and admin_regions tables, use the admin_id from the record
  -- This allows logging of admin operations performed via service role
  IF v_admin_id IS NULL THEN
    IF TG_TABLE_NAME = 'admin_users' THEN
      v_admin_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'admin_regions' THEN
      v_admin_id := COALESCE(NEW.admin_id, OLD.admin_id);
    ELSE
      -- For other tables, skip logging if no authenticated user
      RETURN COALESCE(NEW, OLD);
    END IF;
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
    COALESCE(NEW.id, OLD.id),
    v_changes
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
