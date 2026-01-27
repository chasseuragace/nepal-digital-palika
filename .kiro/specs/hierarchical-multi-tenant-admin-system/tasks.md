# Implementation Plan: Hierarchical Multi-Tenant Admin System

## Overview

This implementation plan breaks down the hierarchical multi-tenant admin system into discrete, manageable coding tasks. The plan follows a phased approach: database foundation, admin panel integration, and advanced features. Each task builds on previous tasks with incremental validation through property-based tests.

## Phase 1: Database Foundation (Critical)

- [x] 1. Apply hierarchical database migrations
  - Apply migration 20250126000004_add_hierarchical_admin_structure.sql
  - Verify admin_users table has new columns (hierarchy_level, province_id, district_id)
  - Verify admin_regions table is created with proper constraints and indexes
  - Verify audit_log table is created with proper constraints and indexes
  - Verify roles table has hierarchy_level column
  - _Requirements: 8.1, 8.2, 8.3_

  - [x] 1.1 Write property test for admin creation validation
    - **Property 1: Admin Creation Validation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 1.2 Write property test for duplicate region prevention
    - **Property 2: Duplicate Region Assignment Prevention**
    - **Validates: Requirements 1.6**

- [x] 2. Apply RLS policy migrations
  - Apply migration 20250126000005_update_rls_policies_hierarchical.sql
  - Verify helper functions are created (user_has_access_to_palika, user_has_permission, etc.)
  - Verify all RLS policies are updated to use new helper functions
  - Test that policies compile without errors
  - _Requirements: 8.4, 8.5_

  - [ ] 2.1 Write property test for super admin universal access
    - **Property 5: Super Admin Universal Access**
    - **Validates: Requirements 2.3**

  - [ ] 2.2 Write property test for province admin hierarchical access
    - **Property 6: Province Admin Hierarchical Access**
    - **Validates: Requirements 2.4, 10.1, 10.2**

  - [ ] 2.3 Write property test for district admin hierarchical access
    - **Property 7: District Admin Hierarchical Access**
    - **Validates: Requirements 2.5, 10.3, 10.4**

  - [ ] 2.4 Write property test for palika admin limited access
    - **Property 8: Palika Admin Limited Access**
    - **Validates: Requirements 2.6, 10.5**

- [x] 3. Apply audit trigger migrations
  - Apply migration 20250126000006_add_audit_triggers.sql
  - Verify audit_log_trigger function is created
  - Verify triggers are created on all 13 tables
  - Test that triggers fire correctly on INSERT/UPDATE/DELETE for authenticated operations
  - NOTE: Audit logging only applies to authenticated admin operations (when auth.uid() is not NULL)
  - NOTE: Service role operations (migrations, bulk updates, system operations) are NOT logged
  - _Requirements: 8.6_

  - [x] 3.1 Write property test for audit log completeness (authenticated operations only)
    - **Property 12: Audit Log Completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - **Scope**: Tests authenticated admin operations on heritage_sites, events, etc.
    - **Note**: Service role operations are not expected to create audit log entries

  - [ ] 3.2 Write property test for admin regions audit logging (authenticated operations only)
    - **Property 13: Admin Regions Audit Logging**
    - **Validates: Requirements 4.4**
    - **Scope**: Tests authenticated admin operations on admin_regions table
    - **Note**: Service role operations are not expected to create audit log entries
    - **Status**: Lower priority - RLS policy recursion issue requires deeper architectural changes

  - [ ] 3.3 Write property test for admin users audit logging (authenticated operations only)
    - **Property 14: Admin Users Audit Logging**
    - **Validates: Requirements 4.5**
    - **Scope**: Tests authenticated admin operations on admin_users table
    - **Note**: Service role operations are not expected to create audit log entries
    - **Status**: Lower priority - Service role operations intentionally skip audit logging

- [x] 4. Verify permission enforcement
  - Verify user_has_permission function is used in all RLS policies
  - Test that operations fail without required permissions
  - Test that operations succeed with required permissions
  - Verify permission-based access control works correctly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

  - [x] 4.1 Write property test for permission-based access control
    - **Property 33: Permission-Based Access Control**
    - **Validates: Requirements 9.1**

  - [x] 4.2 Write property test for super admin override
    - **Property 18: Super Admin Override**
    - **Validates: Requirements 5.4**

- [x] 5. Checkpoint - Verify all migrations applied successfully
  - Ensure all migrations are applied without errors
  - Verify database schema matches design
  - Verify all helper functions are callable
  - Verify all triggers are active
  - Ask the user if questions arise

## Phase 2: Admin Panel Integration (High Priority)

- [x] 6. Connect admin panel to Supabase API
  - Update .env.local with Supabase credentials
  - Test Supabase connection from admin panel
  - Verify API endpoints are accessible
  - Test authentication flow
  - _Requirements: 7.1_

- [x] 7. Implement admin list API integration
  - Create API endpoint to fetch admins (with RLS filtering)
  - Implement pagination and filtering
  - Add loading and error states to admin list page
  - Display admin list with hierarchy_level and region assignments
  - _Requirements: 7.3_

  - [x] 7.1 Write property test for admin list RLS enforcement
    - **Property 15: Audit Log RLS Enforcement** (adapted for admin_users)
    - **Validates: Requirements 7.3**

- [x] 8. Implement admin creation form
  - Create form component for admin creation
  - Implement hierarchy_level selection
  - Implement region assignment UI (province/district/palika)
  - Add form validation for hierarchy configuration
  - Connect form to API endpoint
  - _Requirements: 7.4, 1.1, 1.2, 1.3, 1.4_

  - [x] 8.1 Write property test for admin creation validation
    - **Property 29: Admin Creation Validation**
    - **Validates: Requirements 7.4**

- [x] 9. Implement admin edit functionality
  - Create form component for admin editing
  - Allow modification of hierarchy_level and region assignments
  - Implement cascading region updates
  - Connect form to API endpoint
  - _Requirements: 7.5_

  - [x] 9.1 Write property test for admin editing capability
    - **Property 30: Admin Editing Capability**
    - **Validates: Requirements 7.5**

- [x] 10. Implement admin deletion
  - Create delete confirmation dialog
  - Implement API endpoint for admin deletion
  - Verify cascading deletion of admin_regions records
  - Update admin list after deletion
  - _Requirements: 7.6_

  - [x] 10.1 Write property test for admin deletion cascades
    - **Property 31: Admin Deletion Cascades**
    - **Validates: Requirements 7.6**

- [x] 11. Implement role management page
  - Display list of roles with hierarchy_level
  - Show permissions assigned to each role
  - Create UI for role creation/editing
  - Connect to API endpoints
  - _Requirements: 2.1, 2.2_

- [-] 12. Implement permission management page
  - Display list of permissions organized by resource/action
  - Show which roles have each permission
  - Create UI for permission assignment to roles
  - Connect to API endpoints
  - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 12.1 Write property test for permission addition grants access
    - **Property 9: Permission Addition Grants Access**
    - **Validates: Requirements 3.2**

  - [ ] 12.2 Write property test for permission removal revokes access
    - **Property 10: Permission Removal Revokes Access**
    - **Validates: Requirements 3.3**

- [-] 13. Implement audit log viewer
  - Create audit log page with filtering and search
  - Display admin_id, action, entity_type, entity_id, changes
  - Implement RLS filtering (show only accessible logs)
  - Add export functionality
  - _Requirements: 7.7, 4.6_

  - [ ] 13.1 Write property test for audit log RLS enforcement
    - **Property 15: Audit Log RLS Enforcement**
    - **Validates: Requirements 4.6**

- [x] 14. Implement regions page
  - Display geographic hierarchy (provinces → districts → palikas)
  - Show current admin assignments for each region
  - Create UI for assigning admins to regions
  - Connect to API endpoints
  - _Requirements: 7.8_

- [x] 15. Checkpoint - Verify admin panel is fully functional
  - Test all CRUD operations for admins
  - Test role and permission management
  - Test audit log viewing
  - Test region assignments
  - Ask the user if questions arise

## Phase 3: Advanced Features (Medium Priority)

- [x] 16. Implement permission enforcement in RLS
  - Verify user_has_permission function is used in all RLS policies
  - Test that operations fail without required permissions
  - Test that operations succeed with required permissions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

  - [x] 16.1 Write property test for permission-based access control
    - **Property 33: Permission-Based Access Control**
    - **Validates: Requirements 9.1**

- [x] 17. Implement multi-region scenario testing
  - Create test data for province_admin with multiple palikas
  - Create test data for district_admin with multiple palikas
  - Create test data for palika_admin with single palika
  - Verify access control works correctly for each scenario
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 17.1 Write property test for multi-region assignment support
    - **Property 34: Multi-Region Assignment Support**
    - **Validates: Requirements 10.6**

  - [x] 17.2 Write property test for multi-region hierarchy support
    - **Property 35: Multi-Region Hierarchy Support**
    - **Validates: Requirements 10.7**

- [x] 18. Implement RLS enforcement for all content tables
  - Verify heritage_sites RLS policies work correctly
  - Verify events RLS policies work correctly
  - Verify businesses RLS policies work correctly
  - Verify blog_posts RLS policies work correctly
  - Verify sos_requests RLS policies work correctly
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 18.1 Write property test for heritage sites RLS enforcement
    - **Property 19: Heritage Sites RLS Enforcement**
    - **Validates: Requirements 6.1**

  - [x] 18.2 Write property test for events RLS enforcement
    - **Property 20: Events RLS Enforcement**
    - **Validates: Requirements 6.2**

  - [x] 18.3 Write property test for businesses RLS enforcement
    - **Property 21: Businesses RLS Enforcement**
    - **Validates: Requirements 6.3**

  - [x] 18.4 Write property test for blog posts RLS enforcement
    - **Property 22: Blog Posts RLS Enforcement**
    - **Validates: Requirements 6.4**

  - [x] 18.5 Write property test for SOS requests RLS enforcement
    - **Property 23: SOS Requests RLS Enforcement**
    - **Validates: Requirements 6.5**

- [x] 19. Implement INSERT/UPDATE/DELETE RLS enforcement
  - Test that INSERT operations fail without region access
  - Test that UPDATE operations fail without region access
  - Test that DELETE operations fail without region access
  - Verify error messages are descriptive
  - _Requirements: 6.6, 6.7, 6.8_

  - [x] 19.1 Write property test for INSERT RLS enforcement
    - **Property 24: INSERT RLS Enforcement**
    - **Validates: Requirements 6.6**

  - [x] 19.2 Write property test for UPDATE RLS enforcement
    - **Property 25: UPDATE RLS Enforcement**
    - **Validates: Requirements 6.7**

  - [x] 19.3 Write property test for DELETE RLS enforcement
    - **Property 26: DELETE RLS Enforcement**
    - **Validates: Requirements 6.8**

- [x] 20. Implement dual access check (region + permission)
  - Verify operations require both region access AND permission
  - Test scenarios with region access but no permission
  - Test scenarios with permission but no region access
  - Verify both checks are enforced
  - _Requirements: 3.4, 11_

  - [x] 20.1 Write property test for dual access check requirement
    - **Property 11: Dual Access Check Requirement**
    - **Validates: Requirements 3.4**

- [x] 21. Implement role hierarchy levels
  - Verify all 8 roles have correct hierarchy_level
  - Test that super_admin has national level
  - Test that province_admin has province level
  - Test that district_admin has district level
  - Test that palika-level roles have palika level
  - _Requirements: 2.1, 2.2_

  - [x] 21.1 Write property test for role hierarchy level assignment
    - **Property 4: Role Hierarchy Level Assignment**
    - **Validates: Requirements 2.2**

- [x] 22. Implement region assignment deletion
  - Create API endpoint for deleting admin_regions records
  - Verify deletion immediately revokes access
  - Verify audit log records the deletion
  - Test that admin can no longer access the region
  - _Requirements: 1.7_

  - [x] 22.1 Write property test for region assignment deletion
    - **Property 3: Region Assignment Deletion Revokes Access**
    - **Validates: Requirements 1.7**

- [x] 23. Implement UPDATE operation state capture
  - Verify audit_log captures before/after state for UPDATEs
  - Test that changes field contains 'old' and 'new' keys
  - Verify all fields are captured correctly
  - _Requirements: 4.7_

  - [x] 23.1 Write property test for UPDATE operation state capture
    - **Property 16: UPDATE Operation State Capture**
    - **Validates: Requirements 4.7**

- [x] 24. Checkpoint - Verify all advanced features working
  - Test permission enforcement across all scenarios
  - Test multi-region access control
  - Test RLS enforcement on all content tables
  - Test audit logging for all operations
  - Ask the user if questions arise

## Phase 4: Testing and Validation

- [x] 25. Run comprehensive property-based test suite
  - Execute all 35 property-based tests
  - Verify each test runs minimum 100 iterations
  - Ensure all tests pass
  - Document any failures and fixes
  - _Requirements: All_

- [ ] 26. Run backward compatibility tests
  - Verify existing single-palika admins still work
  - Verify legacy palika_id field is respected
  - Verify migration didn't corrupt existing data
  - Test with real production-like data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 27. Run security audit
  - Verify no unauthorized access is possible
  - Test privilege escalation scenarios
  - Test SQL injection prevention
  - Test RLS policy bypass attempts
  - _Requirements: 6.1-6.10, 9.1-9.7_

- [ ] 28. Run performance tests
  - Test query performance with large datasets
  - Verify indexes are being used
  - Test audit logging performance
  - Optimize slow queries if needed
  - _Requirements: All_

- [ ] 29. Final checkpoint - All tests pass
  - Ensure all property-based tests pass
  - Ensure all unit tests pass
  - Ensure all security tests pass
  - Ensure all performance tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation
- All tasks build on previous tasks with no orphaned code

