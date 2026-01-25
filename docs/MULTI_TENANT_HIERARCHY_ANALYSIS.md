# Multi-Tenant Hierarchy Analysis

## Current System Design Assessment

### ✅ What's Working

**1. Geographic Hierarchy Structure**
```
Province (7 total)
  └─ District (9 major)
      └─ Palika (8 major)
          └─ Ward (1-35)
```
- Clean hierarchical relationships via foreign keys
- Proper cascading deletes
- Geographic data support (PostGIS)

**2. Role-Based Access Control (RBAC)**
- 6 roles defined: `super_admin`, `palika_admin`, `content_editor`, `content_reviewer`, `support_agent`, `moderator`
- 12 permissions defined with resource/action granularity
- Junction table for role-permission mapping

**3. Multi-Tenant Isolation**
- `admin_users.palika_id` links admins to specific palikas
- RLS policies enforce palika-level data isolation
- `get_user_palika_id()` helper function for context-aware access

**4. Content Ownership**
- All content tables have `palika_id` foreign key
- Heritage sites, events, blog posts, businesses scoped to palikas
- RLS policies restrict access by palika

---

## ❌ Critical Gaps & Issues

### 1. **Single Palika Assignment Limitation**
**Problem:** Each admin can only be assigned to ONE palika
```sql
-- Current design
admin_users.palika_id INTEGER REFERENCES palikas(id)
```

**Real-world scenario:** A district-level admin needs to manage multiple palikas within their district, but current design doesn't support this.

**Impact:** 
- Can't create district-level or province-level admins
- Requires separate admin accounts for each palika
- No hierarchical delegation

---

### 2. **Missing Hierarchical Role Levels**
**Current roles are flat:**
- `super_admin` - All access (binary)
- `palika_admin` - Single palika access
- `moderator`, `support_agent`, `content_editor` - No hierarchy

**Missing levels:**
- Province-level admin (manages all districts/palikas in province)
- District-level admin (manages all palikas in district)
- Palika-level admin (current `palika_admin`)

**Problem:** No way to represent administrative hierarchy matching geographic structure.

---

### 3. **Permissions Not Linked to Roles in RLS**
**Current approach:**
- Permissions exist in `role_permissions` junction table
- RLS policies hardcode role names: `WHERE role IN ('palika_admin', 'moderator')`
- Permissions table is unused in actual access control

**Problem:**
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
- Permissions table is just documentation
- Adding new permissions requires code changes

---

### 4. **No Multi-Region Assignment**
**Current design:**
```sql
admin_users.palika_id -- Single value
```

**Needed for multi-tenant:**
- Admin managing multiple palikas
- Admin managing entire district
- Admin managing entire province

**Missing table:**
```sql
-- Should exist but doesn't
admin_user_regions (
  admin_id UUID,
  region_type VARCHAR (palika|district|province),
  region_id INTEGER,
  PRIMARY KEY (admin_id, region_type, region_id)
)
```

---

### 5. **RLS Helper Functions Are Palika-Only**
```sql
-- Only returns single palika_id
CREATE OR REPLACE FUNCTION public.get_user_palika_id()
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT palika_id
    FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Problem:** Can't check if user has access to multiple regions.

---

### 6. **No Audit Trail for Hierarchical Changes**
- No tracking of who created/modified content
- No tracking of approval workflows
- No tracking of permission changes

---

## 📋 Recommended Architecture

### 1. **Extend Admin User Model**
```sql
-- Add hierarchical context
ALTER TABLE admin_users ADD COLUMN (
  hierarchy_level VARCHAR(50) CHECK (hierarchy_level IN ('national', 'province', 'district', 'palika')),
  province_id INTEGER REFERENCES provinces(id),
  district_id INTEGER REFERENCES districts(id),
  -- palika_id stays for palika-level admins
);

-- Constraint: hierarchy_level determines which ID is set
-- national: all NULLs
-- province: province_id set, district_id and palika_id NULL
-- district: province_id and district_id set, palika_id NULL
-- palika: all three set
```

### 2. **Create Admin Region Mapping**
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

-- Indexes for fast lookups
CREATE INDEX idx_admin_regions_admin ON admin_regions(admin_id);
CREATE INDEX idx_admin_regions_region ON admin_regions(region_type, region_id);
```

### 3. **Implement Permission-Based RLS**
```sql
-- New helper function
CREATE OR REPLACE FUNCTION public.user_has_access_to_palika(palika_id_param INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users au
    LEFT JOIN admin_regions ar ON au.id = ar.admin_id
    WHERE au.id = auth.uid()
    AND (
      -- Super admin has all access
      au.role = 'super_admin'
      -- Direct palika assignment
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Use in RLS policies
CREATE POLICY "heritage_sites_admin_all"
ON public.heritage_sites
FOR ALL
USING (
  public.get_user_role() = 'super_admin' OR
  public.user_has_access_to_palika(palika_id)
)
WITH CHECK (
  public.get_user_role() = 'super_admin' OR
  public.user_has_access_to_palika(palika_id)
);
```

### 4. **Implement Permission Checking**
```sql
-- New helper function
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users au
    JOIN role_permissions rp ON au.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE au.id = auth.uid()
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Use in RLS policies
CREATE POLICY "heritage_sites_create"
ON public.heritage_sites
FOR INSERT
WITH CHECK (
  public.user_has_permission('manage_heritage_sites') AND
  public.user_has_access_to_palika(palika_id)
);
```

### 5. **Add Audit Trail**
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

---

## 🎯 Implementation Priority

### Phase 1 (Critical)
1. Add `admin_regions` table for multi-region assignment
2. Implement `user_has_access_to_palika()` function
3. Update RLS policies to use new function
4. Add `hierarchy_level` to `admin_users`

### Phase 2 (Important)
1. Implement permission-based RLS with `user_has_permission()`
2. Add audit logging
3. Create admin dashboard for region assignment

### Phase 3 (Nice-to-have)
1. Add approval workflows
2. Add delegation capabilities
3. Add analytics by region

---

## 📊 Current vs. Proposed

| Feature | Current | Proposed |
|---------|---------|----------|
| Admin assignment | Single palika | Multiple regions (palika/district/province) |
| Role hierarchy | Flat (6 roles) | Hierarchical (national → province → district → palika) |
| Permission enforcement | Hardcoded in RLS | Dynamic via permissions table |
| Multi-region access | ❌ Not supported | ✅ Supported |
| Audit trail | ❌ None | ✅ Complete |
| Delegation | ❌ Not supported | ✅ Supported |

---

## 🔒 Security Considerations

1. **Prevent privilege escalation:** Ensure admins can't assign themselves higher-level access
2. **Audit all changes:** Log who assigned what access and when
3. **Validate hierarchies:** Ensure district admin can't access palikas outside their district
4. **Rate limiting:** Prevent brute-force permission checks

---

## 📝 Next Steps

1. Review this analysis with stakeholders
2. Decide on implementation timeline
3. Create migration for `admin_regions` table
4. Update RLS policies incrementally
5. Test multi-region scenarios thoroughly
