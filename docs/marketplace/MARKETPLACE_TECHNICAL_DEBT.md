# Marketplace Technical Debt & Future Work

**Date:** March 18, 2026
**Status:** Items for future review and improvement
**Priority Levels:** 🔴 High, 🟡 Medium, 🟢 Low

---

## 🔴 HIGH PRIORITY - Revisit During API Development

### 1. Tier Enforcement Architecture
**Issue:** Tier constraints are only enforced at schema level, not RLS level
**Current State:** API must validate tier access before allowing product creation
**Future Work:**
```
Session 2: API Development
- [ ] Implement tier filtering in GET /categories endpoint
- [ ] Add tier validation in POST /products (Tier 1 vs 2+)
- [ ] Validate category.min_tier_level <= user.tier_level
- [ ] Test edge cases (user tier change, palika tier change)
```

**Risk:** Without proper API validation, users could attempt to create products in unauthorized categories
**Mitigation:** API middleware must validate before database insert

---

### 2. Auto-Publish Logic Implementation
**Issue:** Schema supports it but API must enforce Tier 1 vs Tier 2+ behavior
**Current State:** Schema has `status`, `is_approved`, `requires_approval` fields but no business logic
**Future Work:**
```
Session 2: API Development
- [ ] Implement auto-publish for Tier 1:
      product.status = 'published' (forced, no draft)
      product.is_approved = true (forced, no approval)
      product.requires_approval = false (forced)

- [ ] Implement conditional publish for Tier 2+:
      product.status = 'published' (default)
      product.is_approved = true (default, unless approval enabled)
      product.requires_approval = palika_config.setting

- [ ] Add API validation to prevent users overriding Tier 1 rules
- [ ] Test approval workflow functionality
- [ ] Design approval dashboard UI
```

**Risk:** Tier 1 users seeing "approval options" they can't use, or products getting stuck in approval queue
**Mitigation:** Clear API behavior, UI should hide approval options for Tier 1

---

### 3. RLS Policy Complexity
**Issue:** 8 RLS policies are complex with nested queries and admin hierarchies
**Current State:** Policies created and validated at database level
**Future Work:**
```
Session 2-3: Testing & Optimization
- [ ] Monitor RLS policy execution time
- [ ] Profile queries to check for N+1 issues
- [ ] Consider materializing admin_regions view if needed
- [ ] Test edge cases:
      * District admin accessing Palika 1 comments
      * Palika admin accessing own palika vs other palikas
      * Public user seeing approved vs hidden comments

- [ ] Add logging for RLS policy violations
- [ ] Create monitoring alerts for unexpected denials
```

**Risk:** Complex RLS policies can have subtle bugs that expose data or lock it down incorrectly
**Mitigation:** Comprehensive test coverage and monitoring

---

### 4. Seeding Script Idempotency
**Issue:** Seeding scripts fail on re-run (auth user duplication, ON CONFLICT errors)
**Current State:** Scripts work for fresh setup but not for CI/CD re-runs
**Future Work:**
```
Session 2: DevOps/Testing
- [ ] Make seed scripts idempotent:
      * Check if user exists before creating
      * Use UPSERT pattern for categories
      * Guard against duplicate inserts

- [ ] Add idempotency check at start of each script:
      SELECT COUNT(*) FROM marketplace_categories
      IF count >= 26 THEN RETURN early

- [ ] Create seed-reset.ts to clean data for test re-runs
- [ ] Integrate with CI/CD pipeline
```

**Risk:** CI/CD pipelines fail on test re-runs, making debugging difficult
**Mitigation:** Proper idempotent seeding and cleanup functions

---

## 🟡 MEDIUM PRIORITY - Validate During Testing Phase

### 5. Palika Immutability Edge Cases
**Issue:** Trigger prevents changes but doesn't handle all scenarios
**Current State:** Trigger enforces at database level via BEFORE UPDATE
**Future Work:**
```
Session 2-3: Testing
- [ ] Test actual palika change attempt (should fail with error)
- [ ] Test NULL assignment edge case
- [ ] Test bulk update operations
- [ ] Verify error message is user-friendly
- [ ] Add API-level validation to prevent attempting change
```

**Risk:** Unclear error messages if user attempts to change palika
**Mitigation:** Clear error handling in API + user-friendly messages

---

### 6. Comment Moderation Workflow
**Issue:** Comments auto-approve (post-publish moderation) but no dashboard implemented
**Current State:** RLS policies exist, comments immediately visible
**Future Work:**
```
Session 3: UI Development
- [ ] Design moderation dashboard:
      * Show recent comments
      * Show flagged/reported comments
      * Show hidden comments
      * Bulk moderation tools

- [ ] Implement moderation actions:
      * Hide comment (set is_hidden=true)
      * Show comment (set is_hidden=false)
      * Flag for review
      * Add moderation note

- [ ] Create reporting mechanism:
      * Allow users to report inappropriate comments
      * Store report reason and count

- [ ] Add audit trail for moderation actions
```

**Risk:** Without moderation dashboard, inappropriate comments stay visible
**Mitigation:** Reactive moderation is intentional (good engagement) but needs active monitoring

---

### 7. Product Ownership Model Clarification
**Issue:** Assumptions about business ownership model need validation
**Current State:** Assumed 1 user = 1 business, no transfer mechanism
**Future Work:**
```
Session 2: Requirements Validation
- [ ] Confirm: Can users own multiple businesses? (affects RLS)
- [ ] Confirm: Can business ownership be transferred? (affects audit)
- [ ] Confirm: What happens to products if business deleted? (CASCADE already set)
- [ ] If multiple ownership allowed:
      * Extend RLS logic
      * Update API queries
      * Add business selection in product creation

- [ ] If ownership transfer allowed:
      * Create audit trail
      * Update RLS policies
      * Handle orphaned products
```

**Risk:** RLS policies assume single ownership - multi-ownership would break access control
**Mitigation:** Clarify with product team, adjust if needed before API launch

---

### 8. Moderation Hierarchy Scope
**Issue:** Unclear if district admins should moderate sub-palika comments
**Current State:** RLS allows district admin to access palika admin comments
**Future Work:**
```
Session 2: Requirements Validation
- [ ] Confirm moderation hierarchy:
      * Super admin: all palikas
      * District admin: all palikas in district
      * Palika admin: only own palika
      * (Current RLS assumes this)

- [ ] If different hierarchy needed, update RLS:
      DROP POLICY "marketplace_comments_moderation"
      CREATE POLICY "marketplace_comments_moderation" WITH NEW LOGIC

- [ ] Test actual moderation scenarios with different admin levels
```

**Risk:** Over-permissive moderation could allow district admin to censor palika content
**Mitigation:** Clarify requirements, validate RLS reflects intended permissions

---

## 🟢 MEDIUM PRIORITY - Improve for Production

### 9. Database Query Performance
**Issue:** Complex RLS policies with joins could be slow at scale
**Current State:** Policies use subqueries and multiple joins
**Future Work:**
```
Session 4: Optimization
- [ ] Profile all marketplace queries:
      * Slow log analysis
      * EXPLAIN ANALYZE on policy queries
      * Index usage statistics

- [ ] Identify bottlenecks:
      * admin_regions lookups
      * subscription_tiers joins
      * category filtering

- [ ] Optimize if needed:
      * Add materialized views
      * Add composite indexes
      * Cache user tier in session
      * Consider denormalizing frequently joined data

- [ ] Set up monitoring:
      * Query duration alerts
      * Slow query log
      * Database metrics dashboard
```

**Risk:** At scale (1000s of users, 10000s products), slow RLS could degrade UX
**Mitigation:** Monitor performance early, optimize before it's a problem

---

### 10. Approval Workflow Completeness
**Issue:** Approval workflow structure exists but behavior not fully defined
**Current State:** Schema supports `requires_approval`, `is_approved`, `approved_by`, `approved_at`
**Future Work:**
```
Session 3: Feature Development
- [ ] Design approval workflow UI:
      * Approval queue interface
      * Filter by category/palika
      * Bulk approval/rejection
      * Rejection reason field

- [ ] Implement approval logic:
      * Tier 2+ can enable per-palika
      * Products stay published while pending
      * User notified of approval/rejection
      * Rejection reason shown to product owner

- [ ] Add notifications:
      * Approval queue ready (to staff)
      * Product approved (to owner)
      * Product rejected (to owner)

- [ ] Create audit trail for approvals
```

**Risk:** Incomplete approval workflow could confuse users or admins
**Mitigation:** Design workflow early, test before launch

---

## 🟢 LOW PRIORITY - Nice to Have

### 11. Product Engagement Analytics
**Issue:** Schema has `view_count` and `inquiry_count` fields but no tracking
**Current State:** Fields exist, no business logic
**Future Work:**
```
Session 4: Analytics
- [ ] Implement view tracking:
      * Increment view_count on product page view
      * Consider unique visitor logic

- [ ] Implement inquiry tracking:
      * Define "inquiry" event
      * Track when inquiry sent
      * Create inquiry history

- [ ] Create analytics dashboard:
      * Most viewed products
      * Most inquired products
      * Engagement by category
      * Engagement by tier
```

**Risk:** Product owners want to see engagement but it's not critical for launch
**Mitigation:** Post-launch feature, collect data structure in place

---

### 12. Comment Editing & History
**Issue:** Users can edit comments but no edit history tracked
**Current State:** Schema has `is_edited`, `edited_at` but no version tracking
**Future Work:**
```
Session 4: Enhancement
- [ ] Implement edit history:
      * Create comment_versions table
      * Store old text on edit
      * Show "edited" indicator in UI

- [ ] Or: Simple approach - mark as edited but don't store history
      * Already have is_edited and edited_at
      * Show indicator only, no history access

- [ ] Consider: Should edits require re-approval?
      * Probably not for comments
      * Discuss with product team
```

**Risk:** Users could edit comments to hide original meaning, moderation doesn't see history
**Mitigation:** Track edits or disable editing - decide post-launch

---

### 13. Marketplace Category Hierarchy
**Issue:** Schema supports parent_id but not using it (all top-level now)
**Current State:** parent_id exists in database, set to NULL for all
**Future Work:**
```
Session 4: Enhancement
- [ ] Implement subcategories:
      * Clothing → Women's, Men's, Children's
      * Electronics → Computers, Phones, Accessories
      * etc.

- [ ] Update API to handle hierarchy:
      * GET /categories?parent_id=X (get subcategories)
      * UI shows expandable categories

- [ ] Update RLS if needed (probably not)
- [ ] Update test data with hierarchy examples
```

**Risk:** Category list gets long without hierarchy
**Mitigation:** Post-launch enhancement, foundation already in place

---

## 📋 Revisit Checklist

### Before API Launch
- [x] Tier enforcement architecture
- [x] Auto-publish logic specification
- [x] RLS policy validation
- [ ] Seeding script idempotency (during testing)
- [ ] Palika immutability testing
- [ ] Comment moderation dashboard design

### Before Production
- [ ] RLS policy complexity validation
- [ ] Moderation hierarchy scope clarification
- [ ] Product ownership model confirmation
- [ ] Database query performance profiling
- [ ] Approval workflow complete implementation

### Post-Launch Enhancements
- [ ] Product engagement analytics
- [ ] Comment edit history tracking
- [ ] Category subcategory hierarchy
- [ ] Advanced moderation features

---

## 🔗 Related Documents

- **MARKETPLACE_READY_FOR_API.md** - What API team needs to know
- **MARKETPLACE_PRODUCT_SCHEMA.md** - Schema reference for current implementation
- **TESTING_CHECKLIST.md** - Tests to validate implementation

---

## 📝 Notes for Future Sessions

1. **Session 2 (API Development):** Focus on tier enforcement and auto-publish logic - these are critical for correctness
2. **Session 3 (Testing):** Validate RLS edge cases and moderation workflow assumptions
3. **Session 4 (Optimization):** Profile queries, implement analytics, enhance features
4. **Ongoing:** Monitor production metrics, address performance issues as they arise

---

**Status:** Technical debt inventory complete
**Last Updated:** 2026-03-18
**Owner:** Architecture team
