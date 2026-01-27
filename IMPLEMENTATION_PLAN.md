# Multi-Tenant Hierarchy Implementation Plan

## Executive Summary

The current system has a solid foundation but lacks critical features for true multi-tenant hierarchical management. This plan addresses the gaps identified in the MULTI_TENANT_HIERARCHY_ANALYSIS.md and provides a phased implementation roadmap.

---

## Part 1: Current State Analysis

### ✅ What's Working Well

1. **Geographic Hierarchy Structure**
   - Clean Province → District → Palika → Ward relationships
   - Proper foreign key constraints with cascading deletes
   - PostGIS support for geographic data

2. **Basic RBAC**
   - 6 roles defined: `super_admin`, `palika_admin`, `moderator`, `support`, `content_editor`, `content_reviewer`
   - 12 permissions defined with resource/action granularity
   - Role-permission junction table exists

3. **Multi-Tenant Isolation**
   - All content tables have `palika_id` foreign key
   - RLS policies enforce palika-level isolation
   - Helper functions: `get_user_role()`, `get_user_palika_id()`

4. **Content Ownership**
   - Heritage sites, events, blog posts, businesses scoped to palikas
   - Status-based access (published vs draft)
   - Approval workflows partially implemented

---

## Part 2: Critical Gaps

### Gap 1: Single Palika Assignment Limitation
**Current:** Each admin can only be assigned to ONE palika
```sql
admin_users.palika_id INTEGER REFERENCES palikas(id)
```

**Problem:** Can't create district-level or province-level admins

**Real-world Impact:**
- A district admin needs to manage 3 palikas but must have 3 separate accounts
- No hierarchical delegation possible
- Violates geographic hierarchy structure

---

### Gap 2: Missing Hierarchical Role Levels
**Current Roles (Flat):**
- `super_admin` - All access (binary)
- `palika_admin` - Single palika access
- `moderator`, `support_agent`, `content_editor` - No hierarchy

**Missing Levels:**
- Province-level admin (manages all districts/palikas in province)
- District-level admin (manages all palikas in district)
- Palika-level admin (current `palika_admin`)

**Problem:** No way to represent administrative hierarchy matching geographic structure

---

### Gap 3: Permissions Not Linked to Roles in RLS
**Current Approach:**
- Permissions exist in `role_permissions` junction table
- RLS policies hardcode role names
- Permissions table is unused in actual access control

**Example Problem:**
```sql
-- RLS doesn't check permissions table
CREATE POLICY "heritage_sites_admin_all"
ON public.heritage_sites
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')  -- Hardcoded!
  )
)
```

**Impact:**
- Can't dynamically grant/revoke permissions
- Adding new permissions requires code changes
- Permissions table is just documentation

---

### Gap 4: No Multi-Region Assignment
**Current:** Single `palika_id` value per admin

**Needed:**
- Admin managing multiple palikas
- Admin managing entire district
- Admin managing entire province

**Missing Table:**
```sql
admin_user_regions (
  admin_id UUID,
  region_type VARCHAR (palika|district|province),
  region_id INTEGER,
  PRIMARY KEY (admin_id, region_type, region_id)
)
```

---

### Gap 5: RLS Helper Functions Are Palika-Only
```sql
-- Only returns single palika_id
CREATE OR REPLACE FUNCTION public.get_user_palika_id()
RETURNS INT AS $
BEGIN
  RETURN (
    SELECT palika_id
    FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
```

**Problem:** Can't check if user has access to multiple regions

---

### Gap 6: No Audit Trail for Hierarchical Changes
- No tracking of who created/modified content
- No tracking of approval workflows
- No tracking of permission changes
- No tracking of admin assignments

---

## Part 3: Recommended Architecture

### Phase 1: Database Schema Extensions (Critical)

#### 1.1 Extend admin_users Table
```sql
ALTER TABLE admin_users ADD COLUMN (
  hierarchy_level VARCHAR(50) CHECK (hierarchy_level IN ('national', 'province', 'district', 'palika')),
  province_id INTEGER REFERENCES provinces(id),
  district_id INTEGER REFERENCES districts(id)
  -- palika_id stays for palika-level admins
);

-- Constraint: hierarchy_level determines which ID is set
-- national: all NULLs
-- province: province_id set, district_id and palika_id NULL
-- district: province_id and district_id set, palika_id NULL
-- palika: all three set
```

#### 1.2 Create admin_regions Table
```sql
CREATE TABLE admin_regions (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  region_type VARCHAR(50) NOT NULL CHECK (region_type IN ('province', 'district', 'palika')),
  region_id INTEGER NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES admin_users(id),
  UNIQUE(admin_id, region_type, region_id)
);

CREATE INDEX idx_admin_regions_admin ON admin_regions(admin_id);
CREATE INDEX idx_admin_regions_region ON admin_regions(region_type, region_id);
```

#### 1.3 Create audit_log Table
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

#### 1.4 Update roles Table
```sql
ALTER TABLE roles ADD COLUMN (
  hierarchy_level VARCHAR(50) CHECK (hierarchy_level IN ('national', 'province', 'district', 'palika')),
  description_ne TEXT
);

-- Insert hierarchical roles
INSERT INTO roles (name, hierarchy_level, description, description_ne) VALUES
('super_admin', 'national', 'Full system access', 'पूर्ण प्रणाली पहुँच'),
('province_admin', 'province', 'Manages entire province', 'पूरो प्रान्त व्यवस्थापन गर्छ'),
('district_admin', 'district', 'Manages entire district', 'पूरो जिल्ला व्यवस्थापन गर्छ'),
('palika_admin', 'palika', 'Manages single palika', 'एकल पालिका व्यवस्थापन गर्छ'),
('moderator', 'palika', 'Moderates content', 'सामग्री मध्यस्थता गर्छ'),
('support_agent', 'palika', 'Provides support', 'समर्थन प्रदान गर्छ'),
('content_editor', 'palika', 'Edits content', 'सामग्री सम्पादन गर्छ'),
('content_reviewer', 'palika', 'Reviews content', 'सामग्री समीक्षा गर्छ');
```

---

### Phase 2: RLS Policy Updates (Critical)

#### 2.1 New Helper Function: user_has_access_to_palika()
```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users au
    LEFT JOIN admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND (
      -- Super admin has all access
      au.role = 'super_admin'
      -- Direct palika assignment (legacy)
      OR au.palika_id = palika_id_param
      -- Region-based access
      OR (ar.region_type = 'palika' AND ar.region_id = palika_id_param)
      OR (
        ar.region_type = 'district' AND
        EXISTS (
          SELECT 1 FROM palikas p
          WHERE p.id = palika_id_param
          AND p.district_id = ar.region_id
        )
      )
      OR (
        ar.region_type = 'province' AND
        EXISTS (
          SELECT 1 FROM palikas p
          JOIN districts d ON p.district_id = d.id
          WHERE p.id = palika_id_param
          AND d.province_id = ar.region_id
        )
      )
    )
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

#### 2.2 New Helper Function: user_has_permission()
```sql
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users au
    JOIN role_permissions rp ON au.role = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE au.id = auth.uid()
    AND p.name = permission_name
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

#### 2.3 Update Existing RLS Policies
Replace hardcoded role checks with new functions:

**Before:**
```sql
CREATE POLICY "heritage_sites_admin_all"
ON public.heritage_sites
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  (
    public.get_user_palika_id() = palika_id AND
    public.get_user_role() IN ('palika_admin', 'moderator')
  )
)
```

**After:**
```sql
CREATE POLICY "heritage_sites_admin_all"
ON public.heritage_sites
FOR ALL
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_heritage_sites')
);
```

---

### Phase 3: Audit Logging (Important)

#### 3.1 Audit Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO audit_log (admin_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    TG_ARGV[0],
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.2 Add Audit Triggers to Key Tables
```sql
CREATE TRIGGER audit_admin_users
AFTER INSERT OR UPDATE OR DELETE ON admin_users
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger('admin_change');

CREATE TRIGGER audit_admin_regions
AFTER INSERT OR UPDATE OR DELETE ON admin_regions
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger('region_assignment');

CREATE TRIGGER audit_heritage_sites
AFTER INSERT OR UPDATE OR DELETE ON heritage_sites
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger('content_change');
```

---

## Part 4: Implementation Roadmap

### Phase 1: Database Schema (Week 1)
**Deliverables:**
- [ ] Create migration: `add_hierarchical_admin_structure.sql`
  - Add columns to `admin_users`
  - Create `admin_regions` table
  - Create `audit_log` table
  - Update `roles` table with hierarchy levels
- [ ] Create migration: `add_audit_triggers.sql`
  - Add audit trigger function
  - Add triggers to key tables
- [ ] Test migrations locally with Supabase

**Files to Create:**
- `supabase/migrations/20250126000004_add_hierarchical_admin_structure.sql`
- `supabase/migrations/20250126000005_add_audit_triggers.sql`

---

### Phase 2: RLS Policy Updates (Week 1-2)
**Deliverables:**
- [ ] Create migration: `update_rls_policies_hierarchical.sql`
  - Add new helper functions
  - Update existing RLS policies
  - Test all policies
- [ ] Verify backward compatibility with existing admins
- [ ] Test multi-region access scenarios

**Files to Create:**
- `supabase/migrations/20250126000006_update_rls_policies_hierarchical.sql`

---

### Phase 3: Admin Panel UI (Week 2-3)
**Deliverables:**
- [ ] Admin Management Pages
  - List view with filters
  - Create/edit admin form
  - Region assignment UI
  - Admin details view
- [ ] Role Management Pages
  - List view
  - Create/edit role form
  - Permission assignment
- [ ] Permission Management Pages
  - List view
  - Create/edit permission form
- [ ] Geographic Hierarchy Pages
  - Province/district/palika management
  - Hierarchy visualization
- [ ] Audit Log Pages
  - Log viewer with filters
  - Export functionality

**Files to Create:**
- `platform-admin-panel/src/app/admins/page.tsx` (enhance)
- `platform-admin-panel/src/app/admins/[id]/page.tsx` (new)
- `platform-admin-panel/src/app/roles/page.tsx` (enhance)
- `platform-admin-panel/src/app/roles/[id]/page.tsx` (new)
- `platform-admin-panel/src/app/permissions/page.tsx` (enhance)
- `platform-admin-panel/src/app/regions/page.tsx` (enhance)
- `platform-admin-panel/src/app/audit-log/page.tsx` (new)
- `platform-admin-panel/src/components/AdminForm.tsx` (new)
- `platform-admin-panel/src/components/RegionAssignment.tsx` (new)

---

### Phase 4: API Endpoints (Week 2-3)
**Deliverables:**
- [ ] Admin Management API
  - GET/POST/PUT/DELETE admins
  - Assign regions to admin
  - Get admin details with regions
- [ ] Role Management API
  - GET/POST/PUT/DELETE roles
  - Assign permissions to role
- [ ] Permission Management API
  - GET/POST/PUT/DELETE permissions
- [ ] Geographic Hierarchy API
  - GET provinces/districts/palikas
  - GET hierarchy tree
- [ ] Audit Log API
  - GET audit logs with filters
  - Export audit logs

**Files to Create:**
- `platform-admin-panel/src/app/api/admins/route.ts` (enhance)
- `platform-admin-panel/src/app/api/admins/[id]/route.ts` (new)
- `platform-admin-panel/src/app/api/admins/[id]/regions/route.ts` (new)
- `platform-admin-panel/src/app/api/roles/route.ts` (enhance)
- `platform-admin-panel/src/app/api/roles/[id]/route.ts` (new)
- `platform-admin-panel/src/app/api/permissions/route.ts` (enhance)
- `platform-admin-panel/src/app/api/permissions/[id]/route.ts` (new)
- `platform-admin-panel/src/app/api/hierarchy/route.ts` (new)
- `platform-admin-panel/src/app/api/audit-log/route.ts` (new)

---

### Phase 5: Testing & Validation (Week 3-4)
**Deliverables:**
- [ ] Unit tests for RLS policies
- [ ] Integration tests for multi-region access
- [ ] E2E tests for admin panel workflows
- [ ] Security audit
- [ ] Performance testing

---

### Phase 6: Documentation & Deployment (Week 4)
**Deliverables:**
- [ ] Update API documentation
- [ ] Create admin panel user guide
- [ ] Create deployment guide
- [ ] Deploy to staging
- [ ] Deploy to production

---

## Part 5: Key Implementation Details

### 5.1 Admin Hierarchy Levels

| Level | Scope | Can Manage | Example |
|-------|-------|-----------|---------|
| National | All regions | All admins, all content | Super admin |
| Province | 1 province | District/palika admins in province | Province admin |
| District | 1 district | Palika admins in district | District admin |
| Palika | 1 palika | Content in palika | Palika admin |

### 5.2 Permission Model

**Permissions by Resource:**
- Heritage Sites: `manage_heritage_sites`, `view_heritage_sites`
- Events: `manage_events`, `view_events`
- Businesses: `manage_businesses`, `verify_businesses`
- Blog Posts: `manage_blog_posts`, `publish_blog_posts`
- Users: `manage_users`, `view_users`
- Admins: `manage_admins`, `view_admins`
- SOS: `manage_sos`, `view_sos`
- Support: `manage_support`, `view_support`
- Content: `moderate_content`, `view_content`
- Analytics: `view_analytics`
- Categories: `manage_categories`
- Notifications: `send_notifications`

### 5.3 Region Assignment Logic

**Rules:**
1. Super admin: No region assignment needed (has all access)
2. Province admin: Assigned to 1+ provinces
3. District admin: Assigned to 1+ districts (within assigned provinces)
4. Palika admin: Assigned to 1+ palikas (within assigned districts)

**Validation:**
- Can't assign district outside assigned province
- Can't assign palika outside assigned district
- Can't assign higher-level region to lower-level admin

---

## Part 6: Security Considerations

### 6.1 Prevent Privilege Escalation
```sql
-- Ensure admins can't assign themselves higher-level access
CREATE POLICY "admin_regions_prevent_escalation"
ON public.admin_regions
FOR INSERT
WITH CHECK (
  admin_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role = 'super_admin'
  )
);
```

### 6.2 Audit All Changes
- Log all admin assignments
- Log all permission changes
- Log all content modifications
- Include IP address and user agent

### 6.3 Validate Hierarchies
- Ensure district admin can't access palikas outside their district
- Ensure province admin can't access districts outside their province
- Enforce hierarchy constraints at database level

### 6.4 Rate Limiting
- Implement rate limiting on admin API endpoints
- Prevent brute-force permission checks
- Monitor for suspicious activity patterns

---

## Part 7: Migration Strategy

### 7.1 Backward Compatibility
- Keep existing `palika_id` column in `admin_users`
- Support both old and new access models during transition
- Gradual migration of existing admins to new system

### 7.2 Data Migration
```sql
-- Migrate existing admins to new system
INSERT INTO admin_regions (admin_id, region_type, region_id, assigned_at)
SELECT 
  id,
  'palika',
  palika_id,
  created_at
FROM admin_users
WHERE palika_id IS NOT NULL
AND hierarchy_level IS NULL;

-- Update hierarchy_level for existing admins
UPDATE admin_users
SET hierarchy_level = 'palika'
WHERE palika_id IS NOT NULL
AND hierarchy_level IS NULL;
```

### 7.3 Testing Strategy
1. Test in local Supabase environment
2. Test in staging environment
3. Verify all existing functionality works
4. Test new multi-region scenarios
5. Deploy to production with rollback plan

---

## Part 8: Success Metrics

- [ ] All admins can be assigned to multiple regions
- [ ] RLS policies enforce hierarchical access correctly
- [ ] Audit log captures all admin actions
- [ ] Admin panel UI is intuitive and responsive
- [ ] API endpoints return correct data for multi-region scenarios
- [ ] Zero unauthorized access incidents
- [ ] 99.9% uptime
- [ ] Admin satisfaction score > 4.5/5

---

## Part 9: Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| RLS policy errors | Comprehensive testing, gradual rollout |
| Data migration issues | Backup before migration, rollback plan |
| Performance degradation | Index optimization, query analysis |
| Unauthorized access | Audit logging, security review |
| User confusion | Clear documentation, training |

---

## Part 10: Next Steps

1. **Review & Approval** (Day 1)
   - Review this plan with stakeholders
   - Get approval to proceed

2. **Database Migrations** (Days 2-3)
   - Create migration files
   - Test locally
   - Deploy to staging

3. **RLS Policy Updates** (Days 3-4)
   - Update helper functions
   - Update RLS policies
   - Test access scenarios

4. **Admin Panel Development** (Days 5-10)
   - Build UI components
   - Implement API endpoints
   - Integrate with database

5. **Testing & Validation** (Days 11-12)
   - Run test suite
   - Security audit
   - Performance testing

6. **Deployment** (Day 13)
   - Deploy to production
   - Monitor for issues
   - Gather feedback

---

## Appendix: File Structure

```
supabase/migrations/
├── 20250125000001_create_basic_tables.sql (existing)
├── 20250125000002_create_content_tables.sql (existing)
├── 20250125000003_enable_rls_policies.sql (existing)
├── 20250126000004_add_hierarchical_admin_structure.sql (NEW)
├── 20250126000005_add_audit_triggers.sql (NEW)
└── 20250126000006_update_rls_policies_hierarchical.sql (NEW)

platform-admin-panel/src/
├── app/
│   ├── admins/
│   │   ├── page.tsx (enhance)
│   │   └── [id]/page.tsx (NEW)
│   ├── roles/
│   │   ├── page.tsx (enhance)
│   │   └── [id]/page.tsx (NEW)
│   ├── permissions/
│   │   ├── page.tsx (enhance)
│   │   └── [id]/page.tsx (NEW)
│   ├── regions/
│   │   └── page.tsx (enhance)
│   ├── audit-log/
│   │   └── page.tsx (NEW)
│   └── api/
│       ├── admins/
│       │   ├── route.ts (enhance)
│       │   ├── [id]/route.ts (NEW)
│       │   └── [id]/regions/route.ts (NEW)
│       ├── roles/
│       │   ├── route.ts (enhance)
│       │   └── [id]/route.ts (NEW)
│       ├── permissions/
│       │   ├── route.ts (enhance)
│       │   └── [id]/route.ts (NEW)
│       ├── hierarchy/
│       │   └── route.ts (NEW)
│       └── audit-log/
│           └── route.ts (NEW)
├── components/
│   ├── AdminForm.tsx (NEW)
│   ├── RegionAssignment.tsx (NEW)
│   └── AuditLogViewer.tsx (NEW)
└── lib/
    ├── admin-service.ts (NEW)
    ├── role-service.ts (NEW)
    ├── permission-service.ts (NEW)
    └── audit-service.ts (NEW)
```

