# Requirements Document: Hierarchical Multi-Tenant Admin System

## Introduction

The Nepal Digital Tourism Infrastructure platform requires a hierarchical multi-tenant admin system to enable enterprise-scale management across multiple geographic regions. This system must support multi-level administrative hierarchies (national, province, district, palika), dynamic permission management, complete audit trails, and backward compatibility with existing single-palika admin assignments.

## Glossary

- **System**: The Hierarchical Multi-Tenant Admin System
- **Admin**: An authenticated user with administrative privileges
- **Hierarchy_Level**: The administrative level at which an admin operates (national, province, district, or palika)
- **Region**: A geographic area (province, district, or palika)
- **Admin_Regions**: Junction table mapping admins to multiple regions
- **Permission**: A specific action an admin can perform (e.g., manage_heritage_sites)
- **Role**: A collection of permissions assigned to admins
- **Audit_Log**: Complete record of all administrative actions
- **RLS**: Row Level Security policies in PostgreSQL
- **Backward_Compatibility**: Existing single-palika admins continue to function without modification

## Requirements

### Requirement 1: Multi-Region Admin Assignment

**User Story:** As a system administrator, I want to assign admins to multiple geographic regions, so that I can create hierarchical administrative structures that match the geographic hierarchy.

#### Acceptance Criteria

1. WHEN an admin is created with hierarchy_level set to 'province', THE System SHALL allow assignment to one or more provinces
2. WHEN an admin is created with hierarchy_level set to 'district', THE System SHALL allow assignment to one or more districts within a province
3. WHEN an admin is created with hierarchy_level set to 'palika', THE System SHALL allow assignment to one or more palikas within a district
4. WHEN an admin is created with hierarchy_level set to 'national', THE System SHALL grant access to all regions without explicit assignment
5. WHEN an admin_regions record is created, THE System SHALL validate that the region_type and region_id combination is valid
6. WHEN an admin_regions record is created, THE System SHALL prevent duplicate assignments (same admin, region_type, region_id)
7. WHEN an admin_regions record is deleted, THE System SHALL remove the admin's access to that specific region

### Requirement 2: Hierarchical Role Structure

**User Story:** As a platform architect, I want to define roles at different hierarchy levels, so that I can enforce appropriate access controls based on administrative scope.

#### Acceptance Criteria

1. THE System SHALL support six role types: super_admin, province_admin, district_admin, palika_admin, moderator, support_agent, content_editor, content_reviewer
2. WHEN a role is created, THE System SHALL assign it a hierarchy_level (national, province, district, or palika)
3. WHEN a super_admin role is assigned, THE System SHALL grant access to all regions and all permissions
4. WHEN a province_admin role is assigned, THE System SHALL grant access to all districts and palikas within the assigned province
5. WHEN a district_admin role is assigned, THE System SHALL grant access to all palikas within the assigned district
6. WHEN a palika_admin role is assigned, THE System SHALL grant access only to the assigned palika
7. WHEN a moderator or support_agent role is assigned, THE System SHALL grant access only to the assigned palika

### Requirement 3: Dynamic Permission Management

**User Story:** As a security administrator, I want to manage permissions dynamically through the database, so that I can grant or revoke access without code changes.

#### Acceptance Criteria

1. WHEN a permission is checked during data access, THE System SHALL query the role_permissions table to determine if the admin has that permission
2. WHEN a permission is added to a role, THE System SHALL immediately grant that permission to all admins with that role
3. WHEN a permission is removed from a role, THE System SHALL immediately revoke that permission from all admins with that role
4. WHEN an admin attempts an action, THE System SHALL verify both region access AND permission before allowing the action
5. WHEN a permission check fails, THE System SHALL return a 403 Forbidden error with a descriptive message
6. THE System SHALL support at least 12 distinct permissions (manage_heritage_sites, manage_events, manage_blog_posts, manage_businesses, manage_sos, moderate_content, etc.)

### Requirement 4: Complete Audit Trail

**User Story:** As a compliance officer, I want to track all administrative actions, so that I can maintain a complete audit trail for regulatory compliance and security investigations.

#### Acceptance Criteria

1. WHEN an authenticated admin creates, updates, or deletes any record, THE System SHALL automatically log the action to the audit_log table
2. WHEN an audit_log entry is created, THE System SHALL record the admin_id, action (INSERT/UPDATE/DELETE), entity_type, entity_id, and changes (JSONB)
3. WHEN an audit_log entry is created, THE System SHALL record the timestamp (created_at) automatically
4. WHEN an admin_regions record is modified by an authenticated admin, THE System SHALL log the change to the audit_log table
5. WHEN an admin_users record is modified by an authenticated admin, THE System SHALL log the change to the audit_log table
6. WHEN querying the audit_log, THE System SHALL enforce RLS policies so admins can only see logs for their own actions or actions of admins they manage
7. WHEN an audit_log entry is created, THE System SHALL include the complete before/after state for UPDATE operations
8. NOTE: Operations performed via service role (system operations, migrations, bulk updates) are NOT tracked in the audit log, as they are not user-initiated administrative actions

### Requirement 5: Backward Compatibility with Existing Admins

**User Story:** As a platform operator, I want existing single-palika admins to continue functioning, so that I can migrate to the new system without disrupting current operations.

#### Acceptance Criteria

1. WHEN an existing admin has a palika_id but no hierarchy_level, THE System SHALL treat them as hierarchy_level='palika'
2. WHEN an existing admin has a palika_id, THE System SHALL grant access to that palika even if no admin_regions record exists
3. WHEN an existing admin is accessed, THE System SHALL check both the legacy palika_id field AND the admin_regions table for access determination
4. WHEN a super_admin is accessed, THE System SHALL grant access to all regions regardless of palika_id or admin_regions assignments
5. WHEN an admin is migrated to the new system, THE System SHALL create corresponding admin_regions records for their existing palika_id
6. WHEN an admin is migrated, THE System SHALL set hierarchy_level based on their role and existing assignments

### Requirement 6: Hierarchical Access Control with RLS

**User Story:** As a security architect, I want to enforce access control at the database level, so that no unauthorized data access is possible regardless of application logic.

#### Acceptance Criteria

1. WHEN an admin queries heritage_sites, THE System SHALL only return sites in palikas they have access to
2. WHEN an admin queries events, THE System SHALL only return events in palikas they have access to
3. WHEN an admin queries businesses, THE System SHALL only return businesses in palikas they have access to
4. WHEN an admin queries blog_posts, THE System SHALL only return posts in palikas they have access to
5. WHEN an admin queries sos_requests, THE System SHALL only return requests in palikas they have access to
6. WHEN an admin attempts to insert a record, THE System SHALL verify they have access to the target palika
7. WHEN an admin attempts to update a record, THE System SHALL verify they have access to the target palika
8. WHEN an admin attempts to delete a record, THE System SHALL verify they have access to the target palika
9. WHEN a province_admin queries data, THE System SHALL return data from all palikas in their province
10. WHEN a district_admin queries data, THE System SHALL return data from all palikas in their district

### Requirement 7: Admin Panel Integration

**User Story:** As an admin panel developer, I want to connect the admin panel to the Supabase API, so that admins can manage the system through the UI.

#### Acceptance Criteria

1. WHEN the admin panel loads, THE System SHALL authenticate the user with Supabase Auth
2. WHEN an authenticated admin accesses the admin panel, THE System SHALL display only the pages and features they have permission to access
3. WHEN an admin views the admins page, THE System SHALL display a list of admins they can manage (based on hierarchy)
4. WHEN an admin creates a new admin, THE System SHALL validate the hierarchy_level and region assignments
5. WHEN an admin edits an admin, THE System SHALL allow modification of hierarchy_level and region assignments
6. WHEN an admin deletes an admin, THE System SHALL remove all associated admin_regions records
7. WHEN an admin views the audit log, THE System SHALL display only logs they have permission to see
8. WHEN an admin views the regions page, THE System SHALL display the geographic hierarchy with current admin assignments

### Requirement 8: Database Migration and Validation

**User Story:** As a database administrator, I want to apply hierarchical migrations safely, so that I can upgrade the system without data loss or corruption.

#### Acceptance Criteria

1. WHEN the first hierarchical migration is applied, THE System SHALL add hierarchy_level, province_id, and district_id columns to admin_users
2. WHEN the first migration is applied, THE System SHALL create the admin_regions table with proper constraints and indexes
3. WHEN the first migration is applied, THE System SHALL create the audit_log table with proper constraints and indexes
4. WHEN the second migration is applied, THE System SHALL create helper functions (user_has_access_to_palika, user_has_permission, etc.)
5. WHEN the second migration is applied, THE System SHALL update all RLS policies to use the new helper functions
6. WHEN the third migration is applied, THE System SHALL create audit triggers on all relevant tables
7. WHEN migrations are applied, THE System SHALL maintain referential integrity with existing data
8. WHEN migrations are applied, THE System SHALL not modify existing admin_users records (except adding new columns)

### Requirement 9: Permission Enforcement in RLS Policies

**User Story:** As a security officer, I want permissions to be enforced at the database level, so that access control is guaranteed regardless of application code.

#### Acceptance Criteria

1. WHEN an admin attempts to manage heritage sites, THE System SHALL check if they have the 'manage_heritage_sites' permission
2. WHEN an admin attempts to manage events, THE System SHALL check if they have the 'manage_events' permission
3. WHEN an admin attempts to manage businesses, THE System SHALL check if they have the 'manage_businesses' permission
4. WHEN an admin attempts to manage blog posts, THE System SHALL check if they have the 'manage_blog_posts' permission
5. WHEN an admin attempts to moderate content, THE System SHALL check if they have the 'moderate_content' permission
6. WHEN an admin lacks a required permission, THE System SHALL deny the operation and return a 403 error
7. WHEN a permission is checked, THE System SHALL query the role_permissions junction table to determine access

### Requirement 10: Multi-Region Scenario Testing

**User Story:** As a QA engineer, I want to test multi-region scenarios, so that I can verify the system works correctly with complex hierarchies.

#### Acceptance Criteria

1. WHEN a province_admin is assigned to a province, THE System SHALL grant access to all districts in that province
2. WHEN a province_admin is assigned to a province, THE System SHALL grant access to all palikas in all districts in that province
3. WHEN a district_admin is assigned to a district, THE System SHALL grant access to all palikas in that district
4. WHEN a district_admin is assigned to a district, THE System SHALL NOT grant access to palikas in other districts
5. WHEN a palika_admin is assigned to a palika, THE System SHALL grant access only to that palika
6. WHEN an admin is assigned to multiple regions of the same type, THE System SHALL grant access to all assigned regions
7. WHEN an admin is assigned to multiple regions of different types, THE System SHALL grant access to all assigned regions and their children

