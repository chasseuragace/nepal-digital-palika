-- ==========================================
-- MIGRATION: Add Audit Triggers
-- ==========================================
-- Automatically logs all changes to key tables for compliance and debugging

-- ==========================================
-- AUDIT TRIGGER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_changes JSONB;
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

-- ==========================================
-- AUDIT TRIGGERS FOR ADMIN USERS
-- ==========================================

DROP TRIGGER IF EXISTS audit_admin_users ON public.admin_users;
CREATE TRIGGER audit_admin_users
AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR ADMIN REGIONS
-- ==========================================

DROP TRIGGER IF EXISTS audit_admin_regions ON public.admin_regions;
CREATE TRIGGER audit_admin_regions
AFTER INSERT OR UPDATE OR DELETE ON public.admin_regions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR HERITAGE SITES
-- ==========================================

DROP TRIGGER IF EXISTS audit_heritage_sites ON public.heritage_sites;
CREATE TRIGGER audit_heritage_sites
AFTER INSERT OR UPDATE OR DELETE ON public.heritage_sites
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR EVENTS
-- ==========================================

DROP TRIGGER IF EXISTS audit_events ON public.events;
CREATE TRIGGER audit_events
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR BUSINESSES
-- ==========================================

DROP TRIGGER IF EXISTS audit_businesses ON public.businesses;
CREATE TRIGGER audit_businesses
AFTER INSERT OR UPDATE OR DELETE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR BLOG POSTS
-- ==========================================

DROP TRIGGER IF EXISTS audit_blog_posts ON public.blog_posts;
CREATE TRIGGER audit_blog_posts
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR REVIEWS
-- ==========================================

DROP TRIGGER IF EXISTS audit_reviews ON public.reviews;
CREATE TRIGGER audit_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR SOS REQUESTS
-- ==========================================

DROP TRIGGER IF EXISTS audit_sos_requests ON public.sos_requests;
CREATE TRIGGER audit_sos_requests
AFTER INSERT OR UPDATE OR DELETE ON public.sos_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR ROLES
-- ==========================================

DROP TRIGGER IF EXISTS audit_roles ON public.roles;
CREATE TRIGGER audit_roles
AFTER INSERT OR UPDATE OR DELETE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR PERMISSIONS
-- ==========================================

DROP TRIGGER IF EXISTS audit_permissions ON public.permissions;
CREATE TRIGGER audit_permissions
AFTER INSERT OR UPDATE OR DELETE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR ROLE PERMISSIONS
-- ==========================================

DROP TRIGGER IF EXISTS audit_role_permissions ON public.role_permissions;
CREATE TRIGGER audit_role_permissions
AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR CATEGORIES
-- ==========================================

DROP TRIGGER IF EXISTS audit_categories ON public.categories;
CREATE TRIGGER audit_categories
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR PALIKAS
-- ==========================================

DROP TRIGGER IF EXISTS audit_palikas ON public.palikas;
CREATE TRIGGER audit_palikas
AFTER INSERT OR UPDATE OR DELETE ON public.palikas
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR DISTRICTS
-- ==========================================

DROP TRIGGER IF EXISTS audit_districts ON public.districts;
CREATE TRIGGER audit_districts
AFTER INSERT OR UPDATE OR DELETE ON public.districts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ==========================================
-- AUDIT TRIGGERS FOR PROVINCES
-- ==========================================

DROP TRIGGER IF EXISTS audit_provinces ON public.provinces;
CREATE TRIGGER audit_provinces
AFTER INSERT OR UPDATE OR DELETE ON public.provinces
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
