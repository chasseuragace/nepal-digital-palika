# Business Profile Edit - Quick Start Guide

**Status:** ✅ Ready to integrate  
**Time to Production:** ~4 hours

---

## What's Ready

✅ **Type Definitions** - Business interface with 28 fields  
✅ **API Functions** - getBusinessById, updateBusiness, uploadBusinessImage, deleteBusinessImage  
✅ **View Page** - Read-only business profile display  
✅ **Edit Page** - Full-featured edit form with image upload  
✅ **Error Handling** - Comprehensive error handling  
✅ **Validation** - Form validation on all fields  
✅ **Responsive Design** - Mobile and desktop support  

---

## 3-Step Integration

### Step 1: Add Routes (5 min)

```typescript
// In your router configuration (e.g., App.tsx)
import BusinessProfile from '@/pages/BusinessProfile';
import BusinessProfileEdit from '@/pages/BusinessProfileEdit';

// Add these routes:
{
  path: '/business/:businessId',
  element: <BusinessProfile />
},
{
  path: '/business/:businessId/edit',
  element: <BusinessProfileEdit />
}
```

### Step 2: Setup Supabase (Already Done!) ✅

The required RLS policies already exist in the migrations:

**Owner-only edit policy** (from `20250301000028_tier_gating_business_registration.sql`):
- Business owners can update their own business profile
- Policy: `businesses_owner_access`

**Storage bucket** (from new migration `20250321000046_create_business_images_storage.sql`):
- Run the migration to create the `business-images` storage bucket
- Policies for public read, authenticated upload, owner delete

**What you need to do:**
1. Ensure all migrations are applied to your Supabase database
2. Verify the `business-images` storage bucket exists
3. If not, run migration `20250321000046_create_business_images_storage.sql`

```bash
# Check if migrations are applied
# In Supabase dashboard: SQL Editor → Run the migration file
```

### Step 3: Add Navigation (5 min)

```typescript
// Link to view profile
<Link to={`/business/${business.id}`}>
  View Profile
</Link>

// Link to edit profile (owner only)
{isOwner && (
  <Link to={`/business/${business.id}/edit`}>
    Edit Profile
  </Link>
)}
```

---

## File Locations

```
m-place/src/
├── api/
│   └── businesses.ts ✅ (Updated with 4 new functions)
├── types/
│   └── index.ts ✅ (Business interface expanded)
└── pages/
    ├── BusinessProfile.tsx ✅ (650 lines - View page)
    └── BusinessProfileEdit.tsx ✅ (750 lines - Edit page)
```

---

## API Functions

### getBusinessById
```typescript
const business = await getBusinessById(businessId);
// Returns: Business | null
```

### updateBusiness
```typescript
const updated = await updateBusiness(businessId, {
  businessName: 'New Name',
  description: 'New description',
  phone: '9841234567',
  // ... other fields
});
// Returns: Business
```

### uploadBusinessImage
```typescript
const url = await uploadBusinessImage(businessId, file);
// Returns: string (public URL)
```

### deleteBusinessImage
```typescript
await deleteBusinessImage(imageUrl);
// Returns: void
```

---

## Form Validation

**Required Fields:**
- Business name (min 3 characters)
- Description (min 10 characters)
- Phone (required)
- Address (required)

**Optional Fields:**
- Business name (Nepali)
- Description (Nepali)
- Email
- Ward number
- Operating hours
- Facilities
- Languages
- Price range
- Images

---

## Features

### View Page
- Display all business information
- Show featured image and gallery
- Display ratings and statistics
- Edit button (owner only)
- Responsive layout

### Edit Page
- Edit all business fields
- Bilingual support (EN/NE)
- Image upload with drag-and-drop
- Image gallery with delete
- Set featured image
- Operating hours editor
- Facilities checkboxes
- Languages selection
- Price range editor
- Form validation
- Error handling

---

## Testing Checklist

- [ ] Routes configured
- [ ] Storage bucket created
- [ ] RLS policies set
- [ ] View page loads
- [ ] Edit page loads
- [ ] Form validation works
- [ ] Image upload works
- [ ] Image delete works
- [ ] Save changes works
- [ ] Changes reflected in marketplace
- [ ] Owner-only access enforced
- [ ] Mobile responsive
- [ ] Error handling works

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/contexts/AuthContext'"
**Solution:** Ensure import path is correct: `@/contexts/AuthContext` (not `@/context/AuthContext`)

### Issue: "Storage bucket not found"
**Solution:** Create bucket in Supabase: `INSERT INTO storage.buckets (id, name, public) VALUES ('business-images', 'business-images', true);`

### Issue: "Permission denied" on image upload
**Solution:** Check RLS policies on storage bucket - ensure authenticated users can insert

### Issue: "Cannot update business" (403 error)
**Solution:** Check RLS policy on businesses table - ensure `owner_user_id = auth.uid()` policy exists

### Issue: Images not displaying
**Solution:** Ensure storage bucket is public and RLS policy allows SELECT for all users

---

## Performance Tips

- Compress images before upload
- Lazy load gallery images
- Cache business data
- Debounce form inputs
- Use pagination for large galleries

---

## Accessibility Improvements

- Add ARIA labels to form fields
- Add alt text to images
- Ensure keyboard navigation
- Test with screen readers
- Use semantic HTML

---

## Next Phase

After this is deployed, Phase 6.4 will be complete. Next phase (Phase 7) includes:
- SOS Frontend Integration
- m-place Upgrade
- Module Integration

---

## Support

For issues or questions:
1. Check `BUSINESS_PROFILE_IMPLEMENTATION.md` for detailed guide
2. Check `BUSINESS_PROFILE_IMPLEMENTATION_SUMMARY.md` for overview
3. Review database schema in migrations
4. Check Supabase documentation

---

**Ready to Deploy:** ✅ Yes  
**Estimated Time:** 4 hours  
**Last Updated:** 2026-03-21

