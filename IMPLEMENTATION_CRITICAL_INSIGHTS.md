# Marketplace Implementation: Critical Insights & Risk Assessment

**Date:** March 18, 2026
**Scope:** Database setup phase observations
**Risk Level:** 🟡 MEDIUM - Issues identified but mitigatable

---

## 🔍 Key Discoveries

### 1. **Migration Syntax Issues Indicate Testing Gap**

**Finding:**
- Cross-database FK references (`public.auth.users`) failed in local Supabase
- MySQL INDEX syntax inside CREATE TABLE not supported in PostgreSQL
- Migrations weren't validated before deployment

**Impact:**
- Original migrations were written without testing against actual local environment
- Suggests schema might have other subtle issues not yet discovered
- Risk: Production migrations could fail if not properly tested

**Recommendation:**
```bash
# Always validate migrations locally before pushing:
supabase db reset  # Test fresh apply
supabase migration list  # Verify all applied
# Query each new table to confirm existence
```

**Action Taken:** ✅ Both issues fixed before migration applied

---

### 2. **Seeding Script Idempotency Problem**

**Finding:**
- `seed-marketplace-categories.ts` used `ON CONFLICT ... DO NOTHING` but failed with unique constraint errors
- Test data script assumes clean auth state but re-runs fail on duplicate emails
- No idempotent seeding mechanism

**Root Cause:**
- Bulk upsert logic didn't account for composite unique constraints
- Auth user creation not guarded against duplicates

**Impact:**
- Can't re-run seeding scripts safely in test environments
- CI/CD pipelines would fail on retry
- Development workflow is brittle

**Recommendation:**
```typescript
// Need idempotent seeding pattern:
async function seedIdempotent() {
  // Check if already seeded
  const existing = await check()
  if (existing.count >= targetCount) {
    console.log('Already seeded, skipping')
    return
  }
  // Only insert missing items
}

// For auth users, guard against duplicates:
const { data: user } = await auth.admin.getUserByEmail(email)
if (!user) {
  // Create new user
}
```

**Action Taken:** ✅ Created direct insert script that validates before each operation

---

### 3. **RLS Policies Not Yet Tested with Real Data**

**Finding:**
- 8 RLS policies created across `marketplace_products` and `marketplace_product_comments`
- Policies look correct but haven't been validated against actual data operations
- No test cases for policy enforcement

**Policy Complexity:**
```
marketplace_products:
  - owner_access: Check business_id ownership
  - palika_staff: Check admin_regions + permission
  - public_read: Check published & approved status

marketplace_comments:
  - user_post: Check auth.uid() = user_id
  - owner_reply: Check product ownership + is_owner_reply flag
  - public_read: Check is_approved & !is_hidden
  - edit_own: Check auth.uid() = user_id
  - moderation: Complex admin_regions + permission check
```

**Critical Risk:**
- If any policy has a logic error, data could be exposed or locked down
- Tier constraints might not be enforced at product creation level
- Approval workflows might bypass RLS

**Recommendation:**
```typescript
// Create policy validation test suite:
test('Tier 1 user cannot create Tier 2 product', async () => {
  // User enrolled in Tier 1 palika
  // Attempt to create product in Tier 2 category
  // Should be rejected by RLS or tier check
})

test('Public cannot see unapproved products', async () => {
  // Product with is_approved=false
  // Public query should return 0 rows
})

test('Admin can moderate other palika comments', async () => {
  // Malika 1 admin, Palika 2 comment
  // Should be denied unless district/province admin
})
```

**Action Item:** ⚠️ MUST validate before API development

---

### 4. **Tier Enforcement is Schema-Level Only**

**Finding:**
- Tier constraint exists: `min_tier_level` in marketplace_categories
- No stored procedure or trigger to prevent Tier 1 user from creating Tier 2 product
- API will need to enforce this validation

**Current Protection:**
```sql
-- Only prevents creation of invalid category records:
min_tier_level INTEGER CHECK (min_tier_level IN (1, 2, 3))

-- Does NOT prevent users from accessing categories above their tier:
-- This must be enforced in:
-- 1. API layer (filter results)
-- 2. Business logic (prevent insert)
-- 3. RLS policies (if we add them)
```

**Gap:**
```typescript
// VULNERABLE: User could try this and API must stop them:
POST /api/marketplace/products {
  marketplace_category_id: 999,  // Tier 3 category
  // ... if user is Tier 1, this should fail
}

// ALSO VULNERABLE: Direct database insert if RLS not strict enough
```

**Recommendation:**
```typescript
// API must validate:
async function createProduct(userId, categoryId, palikaId) {
  // 1. Get user's tier
  const userTier = await getUserTier(userId)

  // 2. Get category's min tier
  const category = await getCategory(categoryId)

  // 3. Enforce constraint
  if (category.min_tier_level > userTier) {
    throw 'Category not available for your tier'
  }

  // 4. RLS will also check ownership at database level
}
```

**Action Item:** 🔴 CRITICAL - Must implement in API before users can create products

---

### 5. **Auto-Publishing Logic Incomplete**

**Finding:**
- Schema supports it (status field, is_approved flag)
- BUT: No trigger or business logic to enforce "Tier 1 auto-publish"
- API will need to handle this

**Current State:**
```sql
-- Schema allows:
status VARCHAR(40) DEFAULT 'published'  -- Always published
is_approved BOOLEAN DEFAULT true        -- Always approved

-- But Tier 1 should NEVER have approval flow
-- And Tier 2+ should have OPTIONAL approval
-- This requires API/application logic
```

**Gap:**
```typescript
// NOT ENFORCED: Tier 2 user could mark is_approved=false
// And product would never publish (becomes invisible)
// This is a workflow issue

// EXPECTED BEHAVIOR:
// Tier 1: Always published, always approved (no manual override)
// Tier 2+: Published immediately, but can be hidden by approval workflow if enabled
```

**Recommendation:**
```typescript
// API needs tier-aware publishing:
async function createProduct(product, userId) {
  const userTier = await getUserTier(userId)

  if (userTier === 1) {
    // Tier 1: Force publish
    product.status = 'published'
    product.is_approved = true
    product.requires_approval = false
  } else {
    // Tier 2+: Auto-publish but allow approval workflow
    product.status = 'published'
    product.is_approved = true
    product.requires_approval = palikaConfig.requiresApproval // Configurable per palika
  }

  // Never allow user to override for Tier 1
}
```

**Action Item:** 🔴 CRITICAL - Must implement approval logic in API

---

### 6. **Comment System is Simpler Than Usual**

**Finding:**
- Comments auto-approve (is_approved DEFAULT true)
- No moderation queue
- Staff can hide/flag after publication
- Threading supported via parent_comment_id

**Design Implication:**
- This is "publish first, moderate later"
- Good for engagement (users see responses immediately)
- Risk: Moderation must be reactive, not preventive

**Potential Issues:**
```typescript
// SCENARIO: User posts inappropriate comment
// - It's immediately visible to public
// - Staff must notice and hide it
// - No way to prevent before publication

// TIMELINE:
// T+0s: User posts comment
// T+5m: Staff notices and hides it
// T+5m: Comment visible for 5 minutes to public

// This is acceptable for enterprise use case
// But requires active moderation monitoring
```

**Workflow Implication:**
```typescript
// No approval queue needed, but need:
1. Comment reporting mechanism (mark inappropriate)
2. Moderation dashboard showing:
   - Recent comments
   - Reported comments
   - Hidden comments
3. Bulk moderation tools
4. Audit trail of deletions/hides
```

**Action Item:** ⚠️ Design moderation dashboard accordingly

---

### 7. **RLS Policy for Moderation May Be Too Permissive**

**Finding:**
```sql
-- Current logic in marketplace_comments_moderation:
WHERE (
  get_user_role() = 'super_admin' OR (
    palika_id IN (SELECT palika_id FROM admin_regions WHERE admin_id = auth.uid())
    AND user_has_permission('moderate_marketplace_comments')
  )
)
```

**Issue:**
- District/Province admins can moderate any palika below them
- Is this intended? Should palika admins only moderate their own palika?
- Current logic allows district admin to modify/hide comments in all palikas

**Question:**
- Should district admin be able to hide Palika 1 comment even though not directly assigned?
- If yes: Current RLS is correct
- If no: Need more restrictive policy

**Recommendation:**
```sql
-- If only palika admins can moderate (more restrictive):
WHERE palika_id IN (
  SELECT palika_id FROM admin_regions
  WHERE admin_id = auth.uid() AND role = 'palika_admin'
)

-- If hierarchical (district can moderate palikas below):
-- Current logic is correct

-- Need to clarify in requirements
```

**Action Item:** ⚠️ Clarify moderation hierarchy with stakeholders

---

### 8. **Tier Gating Not Enforced at Retrieval Layer**

**Finding:**
```sql
-- When Tier 1 user queries categories:
SELECT * FROM marketplace_categories WHERE min_tier_level <= 1

-- This works IF API filters correctly
-- But RLS policy doesn't enforce this
```

**Current RLS on marketplace_categories:**
- NO RLS policies defined!
- Any authenticated user can see all 26 categories
- API must filter, but database doesn't prevent cheating

**Risk:**
```typescript
// User could query directly:
supabase
  .from('marketplace_categories')
  .select('*')
  // Gets all 26 categories, including Tier 2 and 3
  // API filtering doesn't apply to direct queries
```

**Recommendation:**
```sql
-- Add RLS policy to marketplace_categories:
CREATE POLICY "category_access_by_tier" ON marketplace_categories
  FOR SELECT
  USING (
    min_tier_level <= (
      SELECT tier_level FROM subscription_tiers t
      JOIN palikas p ON t.id = p.subscription_tier_id
      WHERE p.id = user_palika_id()
    )
  )
```

**Action Item:** 🔴 CRITICAL - Add RLS policy to marketplace_categories table

---

### 9. **Product Ownership Validation Complex**

**Finding:**
```sql
-- Current RLS for product ownership:
business_id IN (
  SELECT id FROM public.businesses
  WHERE owner_user_id = auth.uid()
)
```

**Assumptions:**
- Every product has a business_id (required, not null ✅)
- Every business has an owner_user_id (need to verify)
- User can only own one business (need to verify)

**Potential Issues:**
```typescript
// SCENARIO: User owns Business A and Business B
// Product P1 belongs to Business A
// Can user edit via Business B's context?
// Current RLS allows it IF they own the business

// SCENARIO: Business ownership transferred
// Old owner can still edit products they created?
// Depends on: is ownership transfer possible?
```

**Recommendation:**
```typescript
// Verify business ownership rules:
1. Can a user own multiple businesses? (affects RLS)
2. Can business ownership be transferred? (affects audit)
3. What happens to products if business is deleted? (currently CASCADE)

// RLS logic assumes single ownership, check this assumption
```

**Action Item:** ⚠️ Clarify business ownership model

---

### 10. **Missing Palika Immutability Enforcement**

**Finding:**
```markdown
From MARKETPLACE_IMPLEMENTATION_INDEX.md:
"Never change palika after enrollment - It's immutable by design"

But WHERE is this enforced?
```

**Current State:**
```sql
-- palikas.subscription_tier_id can be updated (that's OK)
-- But what prevents changing a user's default_palika_id?
-- No RLS policy enforces this
```

**Risk:**
```typescript
// User could theoretically update their palika:
UPDATE profiles SET default_palika_id = 999 WHERE id = user_id
// This would break the tier architecture

// All their products would be in wrong palika
// Their tier would apply to wrong jurisdiction
```

**Recommendation:**
```sql
-- Add RLS policy to prevent this:
CREATE POLICY "palika_immutable" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Allow updates to other fields
    -- But prevent palika_id changes
    (default_palika_id IS NOT DISTINCT FROM OLD.default_palika_id)
    OR default_palika_id IS NULL  -- Allow NULL -> value
  )
```

**Action Item:** 🔴 CRITICAL - Add immutability enforcement to profiles table

---

## 📊 Risk Summary Matrix

| Risk | Severity | Status | Owner |
|------|----------|--------|-------|
| RLS policies untested with real data | 🔴 High | ⚠️ CRITICAL | Testing |
| Tier enforcement only in schema | 🔴 High | ⚠️ CRITICAL | API |
| Auto-publish logic incomplete | 🔴 High | ⚠️ CRITICAL | API |
| Missing RLS on marketplace_categories | 🔴 High | ⚠️ CRITICAL | Migration |
| Palika immutability not enforced | 🔴 High | ⚠️ CRITICAL | Migration |
| Seeding scripts not idempotent | 🟡 Medium | ✅ FIXED | DevOps |
| Moderation hierarchy unclear | 🟡 Medium | ⚠️ CLARIFY | Requirements |
| Product ownership assumptions | 🟡 Medium | ⚠️ VERIFY | Design |
| Migration syntax issues | 🟡 Medium | ✅ FIXED | Database |
| Comment moderation workflow | 🟡 Medium | ⚠️ PLAN | UI/UX |

---

## 🚨 Must-Fix Before API Development

### 1. Add RLS to marketplace_categories
```sql
-- Enforce tier-based category visibility at database level
CREATE POLICY "category_access_by_tier" ON marketplace_categories
  FOR SELECT
  USING (
    min_tier_level <= (
      SELECT tier_level
      FROM subscription_tiers t
      JOIN palikas p ON t.id = p.subscription_tier_id
      WHERE p.id = get_user_palika_id()
    )
  )
```

### 2. Enforce Palika Immutability
```sql
-- Prevent changing palika_id after initial assignment
CREATE POLICY "palika_id_immutable" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    (default_palika_id = OLD.default_palika_id)
    OR (OLD.default_palika_id IS NULL)
  )
```

### 3. Test All RLS Policies
```typescript
// Create comprehensive RLS test suite before API uses them
// Test: ownership, tier, palika, moderation, visibility
```

### 4. Implement Tier-Aware Product Creation
```typescript
// API must enforce:
// - Tier 1: No choice, auto-publish
// - Tier 2+: Can request approval, but publishes by default
// - Prevent category crossing
```

---

## 💡 Design Decisions to Confirm

1. **Can users own multiple businesses?**
   - Affects: RLS policy logic, palika assignment
   - Current assumption: Single business per user (based on RLS)

2. **Can business ownership be transferred?**
   - Affects: Product ownership, audit trail
   - Current assumption: No transfer mechanism

3. **Can Tier 2+ palikas disable approval workflow?**
   - Affects: API logic for auto-publish
   - Current assumption: Optional per palika

4. **Should district admins moderate sub-palikas?**
   - Affects: RLS policy scope
   - Current assumption: Yes (hierarchical)

5. **Should comments be editable after creation?**
   - Affects: Audit trail, moderation
   - Current assumption: Only own comments, only initial edit

---

## ✅ Action Items (Priority Order)

### 🔴 CRITICAL (Before API Development)
- [ ] Add RLS policy to marketplace_categories table
- [ ] Add palika immutability enforcement
- [ ] Create comprehensive RLS policy test suite
- [ ] Implement tier-aware product creation API logic
- [ ] Test all RLS policies with real data

### 🟡 IMPORTANT (Before Production)
- [ ] Clarify business ownership rules (single vs multiple)
- [ ] Clarify moderation hierarchy
- [ ] Define product ownership transfer rules
- [ ] Design moderation dashboard
- [ ] Create audit trail for all moderation actions

### 🟢 NICE-TO-HAVE (Phase 2)
- [ ] Make seeding scripts fully idempotent
- [ ] Add data validation on API endpoints
- [ ] Implement comment edit history tracking

---

## 📝 Conclusion

**Database structure is solid, but enforcement gaps exist.**

The marketplace schema is well-designed with proper tier hierarchy, RLS policies, and constraints. However:

1. **Tier enforcement is incomplete** - Schema defines it, but database and API both need to validate
2. **RLS policies exist but untested** - Must validate before API relies on them
3. **Some constraints missing** - Palika immutability and category access need database enforcement
4. **Assumptions need verification** - Business ownership, moderation scope, approval workflow

**These are all fixable before production, but must be addressed before API development begins.**

Recommend: **2-3 hour focused session on RLS testing + 2 new policies before API work starts.**

---

**Next Review:** After TESTING_CHECKLIST.md Phase 4-7 execution
**Owner:** Database & API architects
**Updated:** 2026-03-18
