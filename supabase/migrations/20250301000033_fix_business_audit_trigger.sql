-- ==========================================
-- FIX: Update business audit trigger to match audit_log schema
-- ==========================================
-- Migration 028 created an audit trigger for businesses that doesn't match
-- the actual audit_log table schema from migration 010
--
-- Actual audit_log columns: id, admin_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at
-- Trigger was trying to use: operation_type, table_name, record_id, old_values, new_values (which don't exist)

-- Drop the conflicting trigger and function
DROP TRIGGER IF EXISTS trg_audit_business_changes ON public.businesses;
DROP FUNCTION IF EXISTS audit_business_changes();

-- Create a corrected trigger that matches the audit_log schema
CREATE OR REPLACE FUNCTION audit_business_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
BEGIN
  -- Calculate changes only for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    v_changes := (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(row_to_json(NEW)::jsonb - row_to_json(OLD)::jsonb)
    );
  ELSE
    v_changes := NULL;
  END IF;

  -- Insert into audit_log using the correct schema
  INSERT INTO public.audit_log (
    admin_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    TG_OP,
    'businesses',
    COALESCE(NEW.id, OLD.id)::TEXT,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trg_audit_business_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION audit_business_changes();
