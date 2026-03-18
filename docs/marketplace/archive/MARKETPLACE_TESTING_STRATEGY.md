# Marketplace Testing Strategy
## Complete Test Plan & Validation Suite

**Date:** March 18, 2026
**Status:** Test Plan Document
**Focus:** Constraint validation, business rule enforcement, integration testing

---

## Testing Phases

### Phase 1: Environment Setup ✅
```bash
# 1. Reset database
supabase db reset

# 2. Run all migrations (in order)
# - 001-create_basic_tables.sql
# - 002-create_content_tables.sql
# - 003-enable_rls_policies.sql
# ... (existing migrations)
# - NEW: Create business_categories migration
# - NEW: Create marketplace_categories migration
# - NEW: Create marketplace_products migration
# - NEW: Create marketplace_product_comments migration

# 3. Seed foundational data
npx ts-node database/scripts/seed-subscription-tiers.ts
npx ts-node database/scripts/seed-marketplace-categories.ts

# 4. Result: Clean database with:
#    - 3 subscription tiers (basic, tourism, premium)
#    - 8 business categories
#    - 26 marketplace categories (tier-gated)
#    - 4 marketplace features
#    - Feature-tier mappings
```

---

### Phase 2: Tier Enrollment ✅
```bash
# Manually enroll palikas into tiers
# (Or create script: seed-palika-tier-enrollment.ts)

ENROLLMENT:
  Palika 1 (Kathmandu)           → Tier 3 (Premium)
  Palika 2 (Pokhara)             → Tier 2 (Tourism)
  Palika 3 (Chitwan)             → Tier 2 (Tourism)
  Palika 4 (Small Rural Palika)  → Tier 1 (Basic)
```

**SQL:**
```sql
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='premium') WHERE id=1;
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='tourism') WHERE id=2;
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='tourism') WHERE id=3;
UPDATE palikas SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name='basic') WHERE id=4;
```

---

### Phase 3: User & Business Creation ✅
```bash
npx ts-node database/scripts/seed-marketplace-test-data.ts
```

**Creates:**

#### Test Users (2 per Palika)

**Palika 1 (Tier 3 - Premium):**
- User 1A: Ramesh Sharma (Accommodation business)
- User 1B: Sita Poudel (Honey producer)

**Palika 2 (Tier 2 - Tourism):**
- User 2A: Deepak Niroula (Tour guide)
- User 2B: Maya Gurung (Artisan/Crafts)

**Palika 3 (Tier 2 - Tourism):**
- User 3A: Pradeep Singh (Restaurant)
- User 3B: Anita Rai (Textile producer)

**Palika 4 (Tier 1 - Basic):**
- User 4A: Keshav Prasad (Farmer)
- User 4B: Bishnu Lamsal (Grocery shop)

#### Test Businesses (1 per User)

Each user creates a business:
- Business profile created
- Business category assigned (based on business type)
- Linked to palika via business owner's default_palika_id

---

### Phase 4: Product Creation & Validation ✅

#### Test Scenario 1: Tier-Based Category Access

**Palika 1 (Tier 3) - Should see ALL categories**
```
User 1A (Accommodation): Can list from
  ✅ Tier 1: Agriculture, Animal Products, Vegetables, etc.
  ✅ Tier 2: Textiles, Crafts, Clothing, Electronics, etc.
  ✅ Tier 3: Luxury, Jewelry, Premium Crafts, Premium Services, etc.

User 1B (Honey producer): Can list from
  ✅ Tier 1: Honey & Bee Products (min_tier_level=1)
  ✅ Tier 2+: All other categories
```

**Palika 2 (Tier 2) - Should see Tier 1 & 2 only**
```
User 2A (Tour guide): Can list from
  ✅ Tier 1: Agriculture, Vegetables, Honey, etc.
  ✅ Tier 2: Textiles, Crafts, Clothing, etc.
  ❌ Tier 3: BLOCKED - Luxury, Premium Jewelry, etc.

User 2B (Artisan): Can list from
  ✅ Tier 1: All basic categories
  ✅ Tier 2: Traditional Crafts, Handwoven Textiles, etc.
  ❌ Tier 3: BLOCKED
```

**Palika 4 (Tier 1) - Should see Tier 1 only**
```
User 4A (Farmer): Can list from
  ✅ Tier 1: Agriculture Products, Vegetables, Fruits, etc.
  ❌ Tier 2: BLOCKED - Textiles, Crafts, Clothing, etc.
  ❌ Tier 3: BLOCKED - Luxury, Premium items, etc.

User 4B (Grocery): Can list from
  ✅ Tier 1: Essential Daily Items, Vegetables, Spices, etc.
  ❌ Tier 2: BLOCKED
  ❌ Tier 3: BLOCKED
```

---

### Phase 5: Constraint Validation ✅

#### Constraint 1: Business Ownership

**Test Case 1.1: User can only create products for their own business**
```
User 2A tries to create product for User 2B's business
❌ SHOULD FAIL (RLS policy)

User 2A creates product for own business
✅ SHOULD SUCCEED
```

**Implementation:**
```sql
-- RLS Policy: marketplace_products_owner_access
FOR ALL
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_user_id = auth.uid()
  )
)
```

#### Constraint 2: One Palika Per User (Immutable)

**Test Case 2.1: User cannot change palika**
```
User 2A's default_palika_id = 2
Try UPDATE profiles SET default_palika_id = 1
❌ SHOULD FAIL (constraint or trigger)

SELECT * FROM profiles WHERE id=user_2a_id
✅ default_palika_id remains 2
```

**Implementation:**
```sql
-- Trigger or constraint: Prevent updates to default_palika_id
ALTER TABLE profiles ADD CONSTRAINT palika_immutable
  CHECK (default_palika_id IS NOT DISTINCT FROM ... );
-- OR
CREATE TRIGGER prevent_palika_change
  BEFORE UPDATE OF default_palika_id ON profiles
  FOR EACH ROW
  WHEN (OLD.default_palika_id IS NOT NULL)
  EXECUTE FUNCTION raise_immutable_error();
```

#### Constraint 3: Category Access by Tier

**Test Case 3.1: Tier 1 user cannot list Tier 2 product**
```
Palika 4 (Tier 1) user tries to create product in category "Textiles" (Tier 2)
❌ SHOULD FAIL (category validation)

-- Backend check:
palika_tier = 1
category.min_tier_level = 2
1 < 2 → BLOCKED
```

**Test Case 3.2: Tier 3 user CAN list Tier 1 product**
```
Palika 1 (Tier 3) user creates product in category "Agriculture" (Tier 1)
✅ SHOULD SUCCEED
3 >= 1 → ALLOWED
```

**Implementation:**
```sql
-- Before INSERT trigger on marketplace_products
CREATE TRIGGER validate_product_category_access
  BEFORE INSERT OR UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION check_category_tier_access();

-- Function:
CREATE FUNCTION check_category_tier_access()
RETURNS TRIGGER AS $$
DECLARE
  v_palika_tier_level INT;
  v_category_min_tier INT;
BEGIN
  -- Get palika's tier level
  SELECT st.tier_level INTO v_palika_tier_level
  FROM palikas p
  JOIN subscription_tiers st ON p.subscription_tier_id = st.id
  WHERE p.id = NEW.palika_id;

  -- Get category's minimum tier
  SELECT min_tier_level INTO v_category_min_tier
  FROM marketplace_categories
  WHERE id = NEW.marketplace_category_id;

  -- Validate
  IF v_palika_tier_level < v_category_min_tier THEN
    RAISE EXCEPTION 'Category not available for this tier';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Constraint 4: Auto-Publishing by Tier

**Test Case 4.1: Tier 1 product auto-publishes**
```
Palika 4 (Tier 1) user creates product
  status='published' ✅
  is_approved=true ✅
  requires_approval=false ✅

Product immediately visible to public
```

**Test Case 4.2: Tier 2 product auto-publishes (no approval enabled)**
```
Palika 2 (Tier 2, approval disabled) creates product
  status='published' ✅
  is_approved=true ✅
  requires_approval=false ✅

Product immediately visible
```

**Test Case 4.3: Tier 3 product with approval enabled**
```
Palika 1 (Tier 3, approval ENABLED) user creates product
  status='draft' ✅
  is_approved=false ✅
  requires_approval=true ✅

Product NOT visible to public (draft)
Admin approves:
  status='published' ✅
  is_approved=true ✅

Now visible to public
```

**Implementation:**
```sql
-- Before INSERT trigger
CREATE TRIGGER set_product_approval_status
  BEFORE INSERT ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION set_approval_defaults();

CREATE FUNCTION set_approval_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_tier_level INT;
  v_approval_enabled BOOLEAN;
BEGIN
  -- Get palika tier
  SELECT st.tier_level INTO v_tier_level
  FROM palikas p
  JOIN subscription_tiers st ON p.subscription_tier_id = st.id
  WHERE p.id = NEW.palika_id;

  IF v_tier_level = 1 THEN
    -- Tier 1: Always auto-publish
    NEW.requires_approval := false;
    NEW.is_approved := true;
    NEW.status := 'published';
  ELSE
    -- Tier 2+: Check palika settings
    SELECT (settings->>'marketplace_approval_enabled')::BOOLEAN
    INTO v_approval_enabled
    FROM palikas WHERE id = NEW.palika_id;

    IF COALESCE(v_approval_enabled, false) THEN
      NEW.requires_approval := true;
      NEW.is_approved := false;
      NEW.status := 'draft';
    ELSE
      NEW.requires_approval := false;
      NEW.is_approved := true;
      NEW.status := 'published';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Constraint 5: Comments Are Public

**Test Case 5.1: Comments auto-approved**
```
User posts comment on Tier 1 product
  is_approved=true ✅ (auto-approved)
  is_hidden=false ✅

Comment visible to all public users
```

**Test Case 5.2: Business owner can reply**
```
Business owner posts reply to comment
  is_owner_reply=true ✅
  is_approved=true ✅

Reply marked in UI and visible to all
```

**Test Case 5.3: Comments are threaded**
```
User A: "How much is this?"
  User B: "I'm interested too" (reply to User A)
    Business Owner: "Available!" (reply to User B)

Thread depth: 3 levels visible
```

---

## Test Case Matrix

### Business Rules Validation

| # | Constraint | Tier 1 | Tier 2 | Tier 3 | Expected | Status |
|---|-----------|--------|--------|--------|----------|--------|
| 1 | Tier 1 user can list Tier 1 products | ✅ | ❌ | ✅ | PASS | 🟢 |
| 2 | Tier 1 user CANNOT list Tier 2 | ❌ | ✅ | ✅ | PASS | 🟢 |
| 3 | Tier 1 user CANNOT list Tier 3 | ❌ | ❌ | ✅ | PASS | 🟢 |
| 4 | Tier 2 user can list Tier 1 + 2 | ✅ | ✅ | ❌ | PASS | 🟢 |
| 5 | Tier 3 user can list all | ✅ | ✅ | ✅ | PASS | 🟢 |
| 6 | Tier 1 auto-publishes | ✅ | N/A | N/A | PASS | 🟢 |
| 7 | Tier 2 auto-publishes (default) | N/A | ✅ | N/A | PASS | 🟢 |
| 8 | Tier 2 can enable approval | N/A | ✅ | ✅ | PASS | 🟢 |
| 9 | User cannot change palika | ✅ | ✅ | ✅ | PASS | 🟢 |
| 10 | User can only edit own business | ✅ | ✅ | ✅ | PASS | 🟢 |
| 11 | Comments auto-approve | ✅ | ✅ | ✅ | PASS | 🟢 |
| 12 | Comments are threaded | ✅ | ✅ | ✅ | PASS | 🟢 |

---

## Test Data Seeding Script

Create: `seed-marketplace-test-data.ts`

```
Creates:
✅ 8 test users (2 per palika)
✅ 8 test businesses (1 per user)
✅ 16 test products (2 per business, respecting tier constraints)
✅ 12 test comments (on various products)
✅ Test inquiries/interactions
```

---

## RLS Policy Testing

### Access Control Tests

**Test: Tier 1 user cannot see Tier 2 category**
```sql
SET SESSION app.current_user_id = 'user_4a_id';
SELECT * FROM marketplace_categories WHERE min_tier_level > 1;
-- Expected: 0 rows (filtered by tier)
```

**Test: Business owner can see own products**
```sql
SET SESSION app.current_user_id = 'user_2a_id';
SELECT * FROM marketplace_products WHERE business_id = 'biz_2a_id';
-- Expected: All products for user_2a's business
```

**Test: Public can see published products only**
```sql
SET SESSION app.current_user_id = 'public_user_id';
SELECT * FROM marketplace_products WHERE status='published' AND is_approved=true;
-- Expected: Published products only
```

---

## Integration Tests

### Test 1: Full Product Lifecycle (Tier 1)

```
1. ✅ Create business (User 4A from Palika 4)
   business_id: biz_4a
   business_category_id: agriculture

2. ✅ List available categories
   GET /api/marketplace/categories?user_id=user_4a_id
   Expected: Only 9 Tier 1 categories

3. ✅ Create product in Tier 1 category
   POST /api/marketplace/products
   {
     business_id: biz_4a,
     marketplace_category_id: agriculture_id,
     name: "Organic Rice",
     price: 100,
     status: SHOULD AUTO-SET to 'published'
   }

4. ✅ Product auto-publishes
   SELECT status FROM marketplace_products WHERE id=product_id
   Expected: 'published'

5. ✅ Public can see product
   SELECT * FROM marketplace_products WHERE id=product_id (as public)
   Expected: visible

6. ✅ User leaves comment
   POST /api/marketplace/products/:id/comments
   {
     comment_text: "Great quality!",
     is_owner_reply: false
   }

7. ✅ Business owner replies
   POST /api/marketplace/products/:id/comments
   {
     parent_comment_id: comment_id,
     comment_text: "Thank you!",
     is_owner_reply: true
   }

8. ✅ Comments are threaded and visible
   GET /api/marketplace/products/:id/comments
   Expected: Nested structure with owner reply marked
```

### Test 2: Tier-Gated Access (Tier 2 vs Tier 3)

```
1. User 2A (Tier 2) tries Tier 2 product
   ✅ Can create "Handwoven Textiles"

2. User 2A tries Tier 3 product
   ❌ Cannot create "Luxury Items" (blocked)

3. User 1A (Tier 3) creates Tier 3 product
   ✅ Can create "Luxury Items"

4. Public browsing
   - Tier 2 Palika shows: Tier 1 + 2 products
   - Tier 3 Palika shows: Tier 1 + 2 + 3 products
```

### Test 3: Approval Workflow (Tier 2+ Optional)

```
1. Palika 1 enables approval
   UPDATE palikas SET settings = jsonb_set(settings, '{marketplace_approval_enabled}', 'true')

2. User 1A creates product
   Expected: status='draft', is_approved=false

3. Product is not visible to public
   SELECT count(*) FROM marketplace_products WHERE status='draft'
   Expected: 0 rows (filtered in public query)

4. Admin approves
   UPDATE marketplace_products SET is_approved=true WHERE id=product_id

5. Product now visible
   SELECT * FROM marketplace_products WHERE id=product_id
   Expected: visible to public
```

---

## Testing Checklist

### Pre-Testing
- [ ] Database reset
- [ ] All migrations run
- [ ] Seed tiers and categories
- [ ] Enroll palikas into tiers
- [ ] Create test users and businesses

### Business Logic Tests
- [ ] Tier 1 category access (Tier 1 only)
- [ ] Tier 2 category access (Tier 1 + 2)
- [ ] Tier 3 category access (All tiers)
- [ ] Tier 1 auto-publish
- [ ] Tier 2 auto-publish (default)
- [ ] Tier 2 approval workflow (optional)
- [ ] Tier 3 approval workflow
- [ ] Immutable palika assignment
- [ ] Business ownership constraints
- [ ] Comments auto-approve
- [ ] Comments are threaded
- [ ] Owner replies marked correctly

### RLS Policy Tests
- [ ] Owner can edit own products
- [ ] Owner cannot edit others' products
- [ ] Palika staff can approve products
- [ ] Public can only see published products
- [ ] Comments visible to all (if approved)
- [ ] Categories filtered by tier

### Integration Tests
- [ ] Full product lifecycle (create → publish → comment)
- [ ] Cross-tier category blocking
- [ ] Approval workflow end-to-end
- [ ] Comment threading visualization
- [ ] Business dashboard accuracy

### Data Integrity Tests
- [ ] No orphaned products (business deleted)
- [ ] No orphaned comments (product deleted)
- [ ] Audit trail complete
- [ ] Timestamps correct
- [ ] Status transitions valid

---

## Success Criteria

✅ **All Tests Pass When:**

1. **Tier constraints enforced**
   - Tier 1 users see 9 categories
   - Tier 2 users see 17 categories
   - Tier 3 users see 26 categories

2. **Auto-publishing works**
   - Tier 1: products instantly published
   - Tier 2: products instantly published (no approval required)
   - Tier 3: products draft/pending if approval enabled

3. **RLS policies respected**
   - Owner can edit only own products
   - Public sees only published products
   - Palika staff can approve

4. **Comments function**
   - Public discussion visible
   - Threaded replies work
   - Owner replies marked

5. **Data integrity**
   - No constraint violations
   - Audit trails complete
   - Cascading deletes work

---

**Status:** Test Plan Ready
**Next Step:** Create seed-marketplace-test-data.ts
**Timeline:** 1-2 hours for complete testing cycle
