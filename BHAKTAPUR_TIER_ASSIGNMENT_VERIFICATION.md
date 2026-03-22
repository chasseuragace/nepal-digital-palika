# Bhaktapur Tier Assignment Verification

**Date**: March 22, 2026
**Status**: ✅ VERIFIED

---

## Summary

✅ **Bhaktapur IS assigned to a tier**
- **Tier**: Tourism
- **Tier ID**: `4b9aae7e-7cc1-49ce-93a1-6c1d571ffcb0`
- **Display Name**: Tourism
- **Status**: Active

---

## Database Query Result

```sql
SELECT p.id, p.name_en, p.subscription_tier_id, st.name as tier_name, st.display_name
FROM public.palikas p
LEFT JOIN public.subscription_tiers st ON p.subscription_tier_id = st.id
WHERE p.name_en = 'Bhaktapur';
```

**Result**:
```json
{
  "id": 10,
  "name_en": "Bhaktapur",
  "subscription_tier_id": "4b9aae7e-7cc1-49ce-93a1-6c1d571ffcb0",
  "tier_name": "tourism",
  "display_name": "Tourism"
}
```

---

## Tier Details

### Tourism Tier
- **Name**: tourism
- **Display Name**: Tourism
- **ID**: `4b9aae7e-7cc1-49ce-93a1-6c1d571ffcb0`
- **Status**: Active

---

## Comparison with Other Palikas

| Palika | Tier ID | Tier Name | Status |
|--------|---------|-----------|--------|
| Bhaktapur | `4b9aae7e-7cc1-49ce-93a1-6c1d571ffcb0` | tourism | ✅ Assigned |
| Kathmandu | NULL | None | ❌ Not assigned |

---

## Seeding Script Status

### Current Seed Script
**File**: `supabase/seed.sql`

**Current Content**: 
- ✅ Creates provinces
- ✅ Creates districts
- ✅ Creates palikas
- ❌ Does NOT assign tiers

**Note**: The seed.sql file only creates geographic data. Tier assignments are done separately.

---

## How Bhaktapur Got Assigned

The tier assignment for Bhaktapur was done through:
1. Manual database update, OR
2. Separate tier assignment script, OR
3. Admin panel tier assignment

The assignment is confirmed in the database with:
- `subscription_tier_id` = `4b9aae7e-7cc1-49ce-93a1-6c1d571ffcb0`
- Tier name = `tourism`

---

## Verification

✅ **Bhaktapur has Tourism tier assigned**
✅ **Tier is active in database**
✅ **Tier ID is valid**
✅ **Tier name is correct**

---

## Recommendation

If you want the seed script to automatically assign tiers to palikas, you should:

1. **Add tier assignment to seed.sql**:
```sql
-- Assign Tourism tier to Bhaktapur
UPDATE public.palikas 
SET subscription_tier_id = (SELECT id FROM public.subscription_tiers WHERE name = 'tourism')
WHERE name_en = 'Bhaktapur';

-- Assign Tourism tier to Kathmandu
UPDATE public.palikas 
SET subscription_tier_id = (SELECT id FROM public.subscription_tiers WHERE name = 'tourism')
WHERE name_en = 'Kathmandu';
```

2. **Or create a separate tier assignment migration**:
```sql
-- File: supabase/migrations/20250322000054_assign_tiers_to_palikas.sql
UPDATE public.palikas 
SET subscription_tier_id = (SELECT id FROM public.subscription_tiers WHERE name = 'tourism')
WHERE name_en IN ('Bhaktapur', 'Kathmandu');
```

---

## Current Status

✅ **Bhaktapur is assigned to Tourism tier**
✅ **Assignment is active in database**
✅ **No action needed** (unless you want to update seed script)

