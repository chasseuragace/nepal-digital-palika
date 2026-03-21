# Database Migration Requirements

**Date:** 2026-03-21  
**Topic:** Database changes needed for full approval workflow  
**Status:** ✅ Analysis Complete

---

## Summary

**Products:** ✅ NO migration needed (fields already exist)  
**Businesses:** ❌ MIGRATION NEEDED (add rejection_reason field)

---

## Products Table Analysis

### Current Schema

```sql
marketplace_products:
  is_approved BOOLEAN DEFAULT true
  approved_by UUID REFERENCES admin_users(id)
  approved_at TIMESTAMPTZ
  rejection_reason TEXT
```

**Status:** ✅ ALL FIELDS ALREADY EXIST

### Verification

From `MARKETPLACE_PRODUCT_SCHEMA.md`:
```sql
-- Verification (Optional - Tier 2+ only)
requires_approval BOOLEAN DEFAULT false
is_approved BOOLEAN DEFAULT true
approved_by UUID REFERENCES admin_users(id)
approved_at TIMESTAMPTZ
rejection_reason TEXT
```

**Conclusion:** ✅ No migration needed for products

---

## Businesses Table Analysis

### Current Schema

```sql
businesses:
  verification_status VARCHAR(50) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'))
  verified_by UUID REFERENCES admin_users(id)
  verified_at TIMESTAMPTZ
  rejection_reason TEXT  ← MISSING!
```

**Status:** ❌ MISSING `rejection_reason` field

### Required Migration

```sql
ALTER TABLE businesses 
ADD COLUMN rejection_reason TEXT;

-- Add index for performance
CREATE INDEX idx_businesses_rejection_reason 
ON businesses(rejection_reason);
```

---

## Migration Details

### For Products

**Status:** ✅ No migration needed

**Reason:** All fields already exist in schema

**Verification:**
- ✅ `is_approved` - exists
- ✅ `approved_by` - exists
- ✅ `approved_at` - exists
- ✅ `rejection_reason` - exists

### For Businesses

**Status:** ❌ Migration required

**Migration SQL:**
```sql
-- Migration: Add rejection_reason to businesses table
-- Date: 2026-03-21
-- Purpose: Support full business approval workflow with rejection tracking

ALTER TABLE businesses 
ADD COLUMN rejection_reason TEXT;

-- Add index for queries filtering by rejection_reason
CREATE INDEX idx_businesses_rejection_reason 
ON businesses(rejection_reason);

-- Verify migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name = 'rejection_reason';
```

**Impact:**
- ✅ No data loss
- ✅ Backward compatible
- ✅ No existing queries affected
- ✅ Minimal performance impact

---

## Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Review migration SQL
- [ ] Test in staging environment
- [ ] Notify team

### Migration
- [ ] Run ALTER TABLE statement
- [ ] Create index
- [ ] Verify column exists
- [ ] Verify index created

### Post-Migration
- [ ] Test business approval workflow
- [ ] Verify rejection_reason is stored
- [ ] Verify index is used
- [ ] Monitor performance

---

## Deployment Steps

### 1. Create Migration File

**File:** `supabase/migrations/[timestamp]_add_business_rejection_reason.sql`

```sql
-- Add rejection_reason column to businesses table
ALTER TABLE businesses 
ADD COLUMN rejection_reason TEXT;

-- Add index for performance
CREATE INDEX idx_businesses_rejection_reason 
ON businesses(rejection_reason);
```

### 2. Test in Staging

```bash
# Run migration in staging
supabase migration up

# Verify column exists
SELECT * FROM businesses LIMIT 1;

# Verify index exists
SELECT * FROM pg_indexes 
WHERE tablename = 'businesses' 
AND indexname = 'idx_businesses_rejection_reason';
```

### 3. Deploy to Production

```bash
# Run migration in production
supabase migration up

# Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name = 'rejection_reason';
```

---

## Rollback Plan

### If Migration Fails

```sql
-- Rollback: Remove rejection_reason column
DROP INDEX IF EXISTS idx_businesses_rejection_reason;
ALTER TABLE businesses DROP COLUMN IF EXISTS rejection_reason;
```

---

## Performance Impact

### Minimal
- ✅ One TEXT column (small storage)
- ✅ One index (standard performance)
- ✅ No data transformation needed
- ✅ No existing queries affected

### Estimated Time
- Migration: < 1 second
- Index creation: < 1 second
- Total: < 2 seconds

---

## Verification Queries

### Check Column Exists

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
AND column_name = 'rejection_reason';

-- Expected output:
-- column_name: rejection_reason
-- data_type: text
-- is_nullable: YES
```

### Check Index Exists

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'businesses'
AND indexname = 'idx_businesses_rejection_reason';

-- Expected output:
-- indexname: idx_businesses_rejection_reason
-- indexdef: CREATE INDEX idx_businesses_rejection_reason ON businesses(rejection_reason)
```

### Test Insert

```sql
-- Test inserting rejection reason
UPDATE businesses
SET rejection_reason = 'Test rejection reason'
WHERE id = 'test-id';

-- Verify
SELECT id, rejection_reason
FROM businesses
WHERE id = 'test-id';
```

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Create migration file | 5 min | TODO |
| Test in staging | 10 min | TODO |
| Deploy to production | 5 min | TODO |
| Verify | 5 min | TODO |
| **Total** | **25 min** | **TODO** |

---

## Related Changes

### Admin Panel
- ✅ Service layer updated (no DB changes needed)
- ✅ API endpoints updated (no DB changes needed)
- ✅ UI components created (no DB changes needed)

### M-Place
- ✅ Service layer created (no DB changes needed)
- ✅ Components created (no DB changes needed)

### Database
- ❌ Migration needed for businesses table
- ✅ No changes needed for marketplace_products

---

## Summary

### Products
```
Status: ✅ READY
Reason: All fields already exist
Action: No migration needed
```

### Businesses
```
Status: ❌ NEEDS MIGRATION
Reason: Missing rejection_reason field
Action: Run ALTER TABLE + CREATE INDEX
```

---

## Sign-Off

**Analysis Date:** 2026-03-21  
**Status:** ✅ Complete  
**Recommendation:** Proceed with business migration

---

**✅ Database Migration Analysis Complete**
