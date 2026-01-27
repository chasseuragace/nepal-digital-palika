# Design Document: Hierarchical Multi-Tenant Admin System

## Overview

The Hierarchical Multi-Tenant Admin System extends the Nepal Digital Tourism Infrastructure platform to support enterprise-scale multi-region administration. The system implements a 4-level geographic hierarchy (national → province → district → palika) with corresponding administrative roles, dynamic permission management, and complete audit logging. All access control is enforced at the database level through Row Level Security (RLS) policies, ensuring security regardless of application logic.

### Key Design Principles

1. **Hierarchical Access**: Admins at higher levels (province, district) automatically inherit access to lower levels
2. **Dynamic Permissions**: Permissions are managed in the database, not hardcoded in application logic
3. **Complete Audit Trail**: All administrative actions are automatically logged for compliance
4. **Backward Compatibility**: Existing single-palika admins continue to function without modification
5. **Database-Level Security**: RLS policies enforce access control at the database layer

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Panel (Next.js)                     │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│  │  Dashboard   │   Admins     │    Roles     │ Permissions│ │
│  │  Regions     │  Audit Log   │  Settings    │            │ │
│  └──────────────┴──────────────┴──────────────┴────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Supabase API (REST)
                             │
┌────────────────────────────▼────────────────────────────────┐
│              PostgreSQL Database (Supabase)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Core Tables                                         │   │
│  │  ├─ admin_users (extended with hierarchy)           │   │
│  │  ├─ admin_regions (multi-region assignment)         │   │
│  │  ├─ roles (with hierarchy_level)                    │   │
│  │  ├─ permissions                                     │   │
│  │  ├─ role_permissions (junction)                     │   │
│  │  ├─ audit_log (complete audit trail)               │   │
│  │  └─ geographic tables (provinces, districts, palikas)   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RLS Policies & Helper Functions                     │   │
│  │  ├─ user_has_access_to_palika()                     │   │
│  │  ├─ user_has_access_to_district()                   │   │
│  │  ├─ user_has_access_to_province()                   │   │
│  │  ├─ user_has_permission()                           │   │
│  │  └─ Policies on all content tables                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Audit Triggers                                      │   │
│  │  ├─ audit_log_trigger() function                    │   │
│  │  └─ Triggers on 13 tables                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Admin User Model (Extended)

**Current Structure**:
```typescript
interface AdminUser {
  id: UUID;
  email: string;
  role: string;
  palika_id: integer;
  is_active: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Extended Structure**:
```typescript
interface AdminUser {
  id: UUID;
  email: string;
  role: string;
  palika_id: integer | null;           // Legacy support
  hierarchy_level: 'national' | 'province' | 'district' | 'palika';
  province_id: integer | null;         // For province/district-level admins
  district_id: integer | null;         // For district-level admins
  is_active: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Constraints**:
- If `hierarchy_level = 'national'`: `province_id`, `district_id`, `palika_id` must be NULL
- If `hierarchy_level = 'province'`: `province_id` must be set, `district_id` and `palika_id` must be NULL
- If `hierarchy_level = 'district'`: `province_id` and `district_id` must be set, `palika_id` must be NULL
- If `hierarchy_level = 'palika'`: all three IDs may be set (for backward compatibility)

### 2. Admin Regions Table

**Purpose**: Maps admins to multiple regions, enabling flexible multi-region assignments

```typescript
interface AdminRegion {
  id: integer;
  admin_id: UUID;                      // Foreign key to admin_users
  region_type: 'province' | 'district' | 'palika';
  region_id: integer;                  // Foreign key to provinces/districts/palikas
  assigned_at: timestamp;
  assigned_by: UUID | null;            // Admin who made the assignment
}
```

**Indexes**:
- `idx_admin_regions_admin` on `admin_id` (fast lookup of regions for an admin)
- `idx_admin_regions_region` on `(region_type, region_id)` (fast lookup of admins for a region)
- `idx_admin_regions_assigned_by` on `assigned_by` (audit trail)

**Constraints**:
- UNIQUE constraint on `(admin_id, region_type, region_id)` prevents duplicate assignments
- Foreign key constraints ensure referential integrity

### 3. Audit Log Table

**Purpose**: Complete audit trail of all authenticated administrative actions

```typescript
interface AuditLog {
  id: integer;
  admin_id: UUID | null;               // Admin who performed the action (null for system operations)
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entity_type: string;                 // Table name (e.g., 'heritage_sites')
  entity_id: UUID;                     // ID of the modified record
  changes: JSONB;                      // Before/after state for UPDATEs
  ip_address: inet | null;             // Optional: IP address of request
  user_agent: text | null;             // Optional: User agent string
  created_at: timestamp;
}
```

**Important Notes**:
- Only operations performed by authenticated admins are logged
- Operations performed via service role (system operations, migrations, bulk updates) are NOT logged
- This ensures the audit log contains only user-initiated administrative actions
- Service role operations are considered system-level operations and are not subject to audit requirements

**Indexes**:
- `idx_audit_admin` on `admin_id` (find all actions by an admin)
- `idx_audit_entity` on `(entity_type, entity_id)` (find all changes to an entity)
- `idx_audit_created` on `created_at` (time-based queries)
- `idx_audit_action` on `action` (filter by action type)

### 4. Role Model (Extended)

**Current Structure**:
```typescript
interface Role {
  id: integer;
  name: string;
  description: string;
  description_ne: string;
}
```

**Extended Structure**:
```typescript
interface Role {
  id: integer;
  name: string;
  hierarchy_level: 'national' | 'province' | 'district' | 'palika';
  description: string;
  description_ne: string;
}
```

**Hierarchy Levels**:
- `national`: super_admin (full access)
- `province`: province_admin (province-level access)
- `district`: district_admin (district-level access)
- `palika`: palika_admin, moderator, support_agent, content_editor, content_reviewer

## Data Models

### Geographic Hierarchy

```
Province (7 total)
├─ id: integer (PK)
├─ name: string
├─ name_ne: string
└─ code: string

District (9 total)
├─ id: integer (PK)
├─ province_id: integer (FK → provinces)
├─ name: string
├─ name_ne: string
└─ code: string

Palika (8 total)
├─ id: integer (PK)
├─ district_id: integer (FK → districts)
├─ name: string
├─ name_ne: string
├─ code: string
└─ type: string (municipality, rural_municipality, etc.)
```

### Admin Hierarchy

```
Admin User
├─ id: UUID (PK)
├─ email: string
├─ role: string (FK → roles)
├─ hierarchy_level: enum
├─ province_id: integer (FK → provinces, nullable)
├─ district_id: integer (FK → districts, nullable)
├─ palika_id: integer (FK → palikas, nullable, legacy)
└─ is_active: boolean

Admin Regions (0..* per admin)
├─ id: integer (PK)
├─ admin_id: UUID (FK → admin_users)
├─ region_type: enum (province|district|palika)
├─ region_id: integer (FK → provinces/districts/palikas)
└─ assigned_at: timestamp
```

### Permission Model

```
Role (8 total)
├─ id: integer (PK)
├─ name: string
├─ hierarchy_level: enum
└─ description: string

Permission (12+ total)
├─ id: integer (PK)
├─ name: string
├─ resource: string (heritage_sites, events, etc.)
├─ action: string (create, read, update, delete)
└─ description: string

Role_Permissions (junction)
├─ role_id: integer (FK → roles)
├─ permission_id: integer (FK → permissions)
└─ PK: (role_id, permission_id)
```

## Helper Functions

### 1. user_has_access_to_palika(palika_id_param INT)

**Purpose**: Determine if the current user has access to a specific palika

**Logic**:
- If user is super_admin: return TRUE
- If user has direct palika_id assignment: check if it matches
- If user has admin_regions entry with region_type='palika': check if region_id matches
- If user has admin_regions entry with region_type='district': check if palika's district matches
- If user has admin_regions entry with region_type='province': check if palika's province matches
- Otherwise: return FALSE

**Used in**: RLS policies for all content tables (heritage_sites, events, businesses, blog_posts, sos_requests, reviews)

### 2. user_has_access_to_district(district_id_param INT)

**Purpose**: Determine if the current user has access to a specific district

**Logic**:
- If user is super_admin: return TRUE
- If user has direct district_id assignment: check if it matches
- If user has admin_regions entry with region_type='district': check if region_id matches
- If user has admin_regions entry with region_type='province': check if district's province matches
- Otherwise: return FALSE

### 3. user_has_access_to_province(province_id_param INT)

**Purpose**: Determine if the current user has access to a specific province

**Logic**:
- If user is super_admin: return TRUE
- If user has direct province_id assignment: check if it matches
- If user has admin_regions entry with region_type='province': check if region_id matches
- Otherwise: return FALSE

### 4. user_has_permission(permission_name VARCHAR)

**Purpose**: Determine if the current user has a specific permission

**Logic**:
- Query role_permissions table for the user's role
- Check if the permission_name exists in the results
- Return TRUE if found, FALSE otherwise

## RLS Policies

### Policy Pattern for Content Tables

All content tables (heritage_sites, events, businesses, blog_posts, sos_requests, reviews) follow this pattern:

```sql
-- Public read access (published content only)
CREATE POLICY "table_public_read"
ON public.table_name
FOR SELECT
USING (status = 'published');

-- Admin read access (with region and permission checks)
CREATE POLICY "table_admin_read"
ON public.table_name
FOR SELECT
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_table_name')
);

-- Admin insert (with region and permission checks)
CREATE POLICY "table_admin_insert"
ON public.table_name
FOR INSERT
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_table_name')
);

-- Admin update (with region and permission checks)
CREATE POLICY "table_admin_update"
ON public.table_name
FOR UPDATE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_table_name')
)
WITH CHECK (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_table_name')
);

-- Admin delete (with region and permission checks)
CREATE POLICY "table_admin_delete"
ON public.table_name
FOR DELETE
USING (
  public.user_has_access_to_palika(palika_id) AND
  public.user_has_permission('manage_table_name')
);
```

## Audit Triggers

### Audit Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Get current admin ID from authenticated session
  v_admin_id := auth.uid();
  
  -- Skip logging if no authenticated admin (service role operations)
  -- Service role operations are system-level and not subject to audit requirements
  IF v_admin_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Build changes object
  IF TG_OP = 'INSERT' THEN
    v_changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := to_jsonb(OLD);
  END IF;
  
  -- Insert audit log entry only for authenticated operations
  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, changes)
  VALUES (v_admin_id, TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), v_changes);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Design Decisions**:
- Only authenticated admin operations are logged (when `auth.uid()` is not NULL)
- Service role operations (migrations, bulk updates, system operations) are NOT logged
- This ensures the audit log contains only user-initiated administrative actions
- Audit logging is transparent to the application - no special code needed

**Triggers Applied To** (13 tables):
- admin_users, admin_regions
- heritage_sites, events, businesses, blog_posts, reviews, sos_requests
- roles, permissions, role_permissions
- categories, palikas, districts, provinces

## Error Handling

### Access Denied Scenarios

1. **Insufficient Region Access**: User attempts to access data outside their assigned regions
   - Response: 403 Forbidden
   - Message: "You do not have access to this region"

2. **Insufficient Permission**: User has region access but lacks required permission
   - Response: 403 Forbidden
   - Message: "You do not have permission to perform this action"

3. **Invalid Hierarchy Assignment**: User attempts to create an admin with invalid hierarchy configuration
   - Response: 400 Bad Request
   - Message: "Invalid hierarchy configuration for the specified level"

4. **Duplicate Region Assignment**: User attempts to assign an admin to a region they're already assigned to
   - Response: 409 Conflict
   - Message: "Admin is already assigned to this region"

5. **Orphaned Admin**: User attempts to delete all region assignments from an admin
   - Response: 400 Bad Request
   - Message: "Admin must have at least one region assignment"

### Audit Trail Failures

- If audit_log insertion fails, the original operation is rolled back
- Audit failures are logged to application error tracking
- System alerts are triggered for audit failures

## Testing Strategy

### Unit Testing

Unit tests validate specific examples and edge cases:

1. **Admin Creation Tests**
   - Create national-level admin (no region assignment needed)
   - Create province-level admin (requires province_id)
   - Create district-level admin (requires province_id and district_id)
   - Create palika-level admin (requires all three IDs)
   - Verify validation errors for invalid configurations

2. **Region Assignment Tests**
   - Assign admin to single palika
   - Assign admin to multiple palikas
   - Assign admin to district (grants access to all palikas)
   - Assign admin to province (grants access to all districts/palikas)
   - Verify duplicate prevention

3. **Permission Tests**
   - Grant permission to role
   - Verify admin with role has permission
   - Revoke permission from role
   - Verify admin no longer has permission

4. **Audit Log Tests**
   - Verify INSERT operations are logged
   - Verify UPDATE operations capture before/after state
   - Verify DELETE operations are logged
   - Verify audit entries include admin_id and timestamp

5. **RLS Policy Tests**
   - Verify super_admin can access all data
   - Verify province_admin can access only their province
   - Verify district_admin can access only their district
   - Verify palika_admin can access only their palika
   - Verify unauthorized access is denied

6. **Backward Compatibility Tests**
   - Verify existing single-palika admins still work
   - Verify legacy palika_id field is respected
   - Verify migration doesn't break existing data

### Property-Based Testing

Property-based tests validate universal properties across many generated inputs. Each property is implemented as a single property-based test with minimum 100 iterations.


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Admin Creation Validation

*For any* admin creation request with a valid hierarchy_level and corresponding region IDs, the admin should be successfully created with the specified hierarchy_level and region assignments.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Duplicate Region Assignment Prevention

*For any* admin and region combination, attempting to create a second admin_regions record with the same admin_id, region_type, and region_id should fail with a UNIQUE constraint violation.

**Validates: Requirements 1.6**

### Property 3: Region Assignment Deletion Revokes Access

*For any* admin with an admin_regions record, deleting that record should immediately revoke the admin's access to that region (verified by querying the user_has_access_to_palika function).

**Validates: Requirements 1.7**

### Property 4: Role Hierarchy Level Assignment

*For any* role creation, the role should have a valid hierarchy_level (national, province, district, or palika) assigned.

**Validates: Requirements 2.2**

### Property 5: Super Admin Universal Access

*For any* super_admin user and any region, the user_has_access_to_palika function should return TRUE for all palikas regardless of admin_regions assignments.

**Validates: Requirements 2.3**

### Property 6: Province Admin Hierarchical Access

*For any* province_admin assigned to a province, the user_has_access_to_palika function should return TRUE for all palikas in that province and all districts in that province.

**Validates: Requirements 2.4, 10.1, 10.2**

### Property 7: District Admin Hierarchical Access

*For any* district_admin assigned to a district, the user_has_access_to_palika function should return TRUE for all palikas in that district but FALSE for palikas in other districts.

**Validates: Requirements 2.5, 10.3, 10.4**

### Property 8: Palika Admin Limited Access

*For any* palika_admin assigned to a palika, the user_has_access_to_palika function should return TRUE only for that specific palika.

**Validates: Requirements 2.6, 10.5**

### Property 9: Permission Addition Grants Access

*For any* role and permission, after adding the permission to the role via role_permissions, the user_has_permission function should return TRUE for all admins with that role.

**Validates: Requirements 3.2**

### Property 10: Permission Removal Revokes Access

*For any* role and permission, after removing the permission from the role via role_permissions, the user_has_permission function should return FALSE for all admins with that role.

**Validates: Requirements 3.3**

### Property 11: Dual Access Check Requirement

*For any* admin attempting a data operation, the operation should succeed only if BOTH user_has_access_to_palika(palika_id) AND user_has_permission(required_permission) return TRUE.

**Validates: Requirements 3.4**

### Property 12: Audit Log Completeness

*For any* INSERT, UPDATE, or DELETE operation on a tracked table, an audit_log entry should be created with admin_id, action, entity_type, entity_id, and changes fields populated.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 13: Admin Regions Audit Logging

*For any* INSERT, UPDATE, or DELETE operation on the admin_regions table, an audit_log entry should be created recording the change.

**Validates: Requirements 4.4**

### Property 14: Admin Users Audit Logging

*For any* INSERT, UPDATE, or DELETE operation on the admin_users table, an audit_log entry should be created recording the change.

**Validates: Requirements 4.5**

### Property 15: Audit Log RLS Enforcement

*For any* audit_log query by a non-super_admin user, the results should only include entries where admin_id equals the current user's ID or the current user manages the admin who performed the action.

**Validates: Requirements 4.6**

### Property 16: UPDATE Operation State Capture

*For any* UPDATE operation on a tracked table, the audit_log entry's changes field should contain a JSONB object with 'old' and 'new' keys containing the before and after states.

**Validates: Requirements 4.7**

### Property 17: Legacy Palika ID Support

*For any* existing admin with a palika_id but no hierarchy_level, the user_has_access_to_palika function should return TRUE for that palika_id.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 18: Super Admin Override

*For any* super_admin user, the user_has_access_to_palika function should return TRUE for all palikas regardless of palika_id or admin_regions assignments.

**Validates: Requirements 5.4**

### Property 19: Heritage Sites RLS Enforcement

*For any* heritage_sites query by a non-super_admin user, the results should only include sites in palikas where user_has_access_to_palika returns TRUE.

**Validates: Requirements 6.1**

### Property 20: Events RLS Enforcement

*For any* events query by a non-super_admin user, the results should only include events in palikas where user_has_access_to_palika returns TRUE.

**Validates: Requirements 6.2**

### Property 21: Businesses RLS Enforcement

*For any* businesses query by a non-super_admin user, the results should only include businesses in palikas where user_has_access_to_palika returns TRUE.

**Validates: Requirements 6.3**

### Property 22: Blog Posts RLS Enforcement

*For any* blog_posts query by a non-super_admin user, the results should only include posts in palikas where user_has_access_to_palika returns TRUE.

**Validates: Requirements 6.4**

### Property 23: SOS Requests RLS Enforcement

*For any* sos_requests query by a non-super_admin user, the results should only include requests in palikas where user_has_access_to_palika returns TRUE.

**Validates: Requirements 6.5**

### Property 24: INSERT RLS Enforcement

*For any* INSERT operation on a content table by a non-super_admin user, the operation should fail if user_has_access_to_palika(palika_id) returns FALSE.

**Validates: Requirements 6.6**

### Property 25: UPDATE RLS Enforcement

*For any* UPDATE operation on a content table by a non-super_admin user, the operation should fail if user_has_access_to_palika(palika_id) returns FALSE.

**Validates: Requirements 6.7**

### Property 26: DELETE RLS Enforcement

*For any* DELETE operation on a content table by a non-super_admin user, the operation should fail if user_has_access_to_palika(palika_id) returns FALSE.

**Validates: Requirements 6.8**

### Property 27: Province Admin Data Visibility

*For any* province_admin assigned to a province, querying content tables should return only records from palikas in that province.

**Validates: Requirements 6.9**

### Property 28: District Admin Data Visibility

*For any* district_admin assigned to a district, querying content tables should return only records from palikas in that district.

**Validates: Requirements 6.10**

### Property 29: Admin Creation Validation

*For any* admin creation request with invalid hierarchy_level and region ID combinations, the creation should fail with a validation error.

**Validates: Requirements 7.4**

### Property 30: Admin Editing Capability

*For any* admin edit request with valid hierarchy_level and region assignments, the admin should be updated with the new values.

**Validates: Requirements 7.5**

### Property 31: Admin Deletion Cascades

*For any* admin deletion, all associated admin_regions records should be automatically deleted via CASCADE constraint.

**Validates: Requirements 7.6**

### Property 32: Migration Schema Integrity

*For any* migration application, existing admin_users records should remain unchanged except for the addition of new columns (hierarchy_level, province_id, district_id).

**Validates: Requirements 8.7, 8.8**

### Property 33: Permission-Based Access Control

*For any* admin attempting to manage heritage sites, the operation should fail if user_has_permission('manage_heritage_sites') returns FALSE.

**Validates: Requirements 9.1**

### Property 34: Multi-Region Assignment Support

*For any* admin assigned to multiple regions of the same type, the user_has_access_to_palika function should return TRUE for all assigned regions.

**Validates: Requirements 10.6**

### Property 35: Multi-Region Hierarchy Support

*For any* admin assigned to multiple regions of different types (e.g., both a district and a palika), the user_has_access_to_palika function should return TRUE for all assigned regions and their children.

**Validates: Requirements 10.7**

