# Marketplace Schema - Corrections & Clarifications
**Date:** March 18, 2026
**Status:** Finalized Schema Design

---

## Correction 1: Marketplace Product Approval Flow

### ❌ ORIGINAL DESIGN
```
All products require approval before publishing
├── Product created → Draft
├── Palika staff reviews
└── Publish (if approved)
```

### ✅ CORRECTED DESIGN
```
Tier-based approval logic:

TIER 1 (Palika Services):
  Product created → Published immediately
  No approval needed
  No approval workflow
  ✓ Creates/publishes by default

TIER 2+ (Tourism & Premium):
  Palika controls approval preference
  ├─ If approval disabled (default):
  │  Product created → Published immediately
  └─ If approval enabled:
     Product created → Draft
     Palika staff reviews
     Publish (if approved)
```

### Implementation
```sql
ALTER TABLE marketplace_products ADD COLUMN requires_approval BOOLEAN DEFAULT false;

-- Tier 1: requires_approval always false, is_approved always true
-- Tier 2+: requires_approval configurable, is_approved depends on approval

-- At product creation, set:
requires_approval = (
  SELECT palikas.tier_level > 1 -- Tier 2+
  WHERE palikas.id = business.palika_id
)
```

---

## Correction 2: Product Comments (Not Inquiries)

### ❌ ORIGINAL DESIGN
```
marketplace_product_inquiries
├── Customer submits inquiry
├── Business owner responds (private)
└── Transaction tracked
```

**Issue:** This is an inquiry/contact mechanism, not a comment/discussion system.

### ✅ CORRECTED DESIGN
```
marketplace_product_comments (Threaded/Nested)
├── Public discussion on product
├── Users leave comments
│   └── Everyone can read
├── Business owner replies (marked as "owner_reply")
│   └── Everyone can see response
└── Replies can be nested (comments on comments)

KEY DIFFERENCES:
✓ Public visibility (not private)
✓ Threaded replies (nested comments)
✓ No transaction tracking (for discussion, not booking)
✓ Owner marked in UI for clarity
```

### Table Structure
```sql
CREATE TABLE marketplace_product_comments (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,

  comment_text TEXT NOT NULL,
  parent_comment_id UUID, -- NULL = top-level, UUID = reply to another

  is_owner_reply BOOLEAN, -- TRUE = business owner's response
  is_approved BOOLEAN DEFAULT true, -- Auto-approved
  is_hidden BOOLEAN DEFAULT false, -- Palika staff can hide

  helpful_count INTEGER,
  unhelpful_count INTEGER,

  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
);
```

### Comparison: Comments vs. Inquiries

| Aspect | Comments (New) | Inquiries (Existing) |
|--------|---|---|
| Purpose | Public discussion | Private transaction |
| Visibility | All users | Business + customer |
| Threading | Nested comments | Flat list |
| Business Response | Marked as "owner_reply" | Message field |
| Use Case | "Thoughts on this product?" | "Can you deliver?" |
| Example | Customer asks question, owner replies, others comment | Customer requests specific booking |
| Stored In | `marketplace_product_comments` | `marketplace_product_inquiries` or existing `inquiries` |

---

## Correction 3: Automatic Publishing (Tier 1)

### ❌ ORIGINAL DESIGN
```
All products created by business owners must be approved by admin
before becoming visible
```

### ✅ CORRECTED DESIGN
```
Tier 1 Palikas: Auto-Publish
├── Business owner creates product
├── Product immediately published (status='published', is_approved=true)
└── Visible to public immediately (no waiting)

Tier 2+ Palikas: Optional Approval
├── Default: Same as Tier 1 (auto-publish)
└── Palika can enable: Requires admin approval before publishing
```

### Business Logic
```
When product created:
  1. Check product's palika tier
  2. IF tier = 1:
       status = 'published'
       is_approved = true
       requires_approval = false
  3. ELSE (tier 2+):
       IF palika.marketplace_approval_enabled:
         status = 'draft'
         is_approved = false
         requires_approval = true
       ELSE:
         status = 'published'
         is_approved = true
         requires_approval = false
```

---

## Summary of Changes

### Table Changes
| Table | Change |
|-------|--------|
| `marketplace_products` | ✓ Add `requires_approval` field |
| `marketplace_products` | ✓ Change default `status` to 'published' (not 'draft') |
| `marketplace_product_inquiries` | ❌ REMOVED (not needed for comments) |
| `marketplace_product_comments` | ✅ NEW (replaces inquiries for discussions) |

### Behavior Changes
| Behavior | Before | After |
|----------|--------|-------|
| Tier 1 Publishing | Manual approval | Auto-publish |
| Tier 2+ Publishing | Manual approval (required) | Optional (configurable) |
| Comments Visibility | Private inquiry-based | Public discussion |
| Comment Threading | Flat | Nested |
| Business Owner Response | Message field | Marked reply field |

### Database Relationships
```
marketplace_products
  ├─ user_id (creator)
  ├─ business_id (owner)
  ├─ marketplace_category_id
  └─ marketplace_product_comments (1:M)
       ├─ parent_comment_id (self-join for nesting)
       ├─ is_owner_reply (mark business response)
       └─ is_approved (public visibility)
```

---

## Implementation Checklist

### Phase 1: Create Tables
- [ ] `business_categories` - Separate from generic categories
- [ ] `marketplace_categories` - Tier-aware product categories
- [ ] `marketplace_products` - Product listings (with tier-based approval)
- [ ] `marketplace_product_comments` - Threaded public comments

### Phase 2: Update Existing Tables
- [ ] `businesses` - Change `business_type_id` to `business_category_id`
- [ ] `palikas` - Add `marketplace_approval_enabled` setting

### Phase 3: Create Functions & Policies
- [ ] Helper functions for category access, comment threading
- [ ] RLS policies for comments (public read, user post, owner reply)
- [ ] RLS policies for products (tier-based auto-approval)

### Phase 4: Seed Data
- [ ] 8 business categories
- [ ] 18 marketplace categories (Tier 1, 2, 3)
- [ ] Update tier_features to map marketplace features

---

**Status:** ✅ Schema Design Complete & Corrected
**Ready For:** SQL Migration Implementation
