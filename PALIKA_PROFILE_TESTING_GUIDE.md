# Palika Profile System - Testing Guide

**Last Updated**: March 22, 2026

---

## Quick Start

### 1. Start Development Server
```bash
npm run dev
```
Server runs on `http://localhost:3001`

### 2. Login as Palika Admin
- **Email**: `palika.admin@bhaktapur.gov.np`
- **Password**: `BhaktapurAdmin456!`

### 3. Navigate to Palika Profile
- Click "Palika Profile" in admin panel navigation
- Or go to `http://localhost:3001/app/palika-profile`

---

## Test Scenarios

### Test 1: View Existing Profile
**Steps**:
1. Login as Bhaktapur Admin
2. Navigate to Palika Profile
3. Verify form loads with existing data (if any)
4. Check all sections display correctly

**Expected Result**: Form loads without errors, displays profile data

---

### Test 2: Edit Profile Descriptions
**Steps**:
1. Navigate to Palika Profile
2. Edit "Description (English)" field
3. Edit "Description (Nepali)" field
4. Click "Save Palika Profile"
5. Verify success message appears

**Expected Result**: Profile saved successfully, success message displays

---

### Test 3: Upload Images to Gallery
**Steps**:
1. Navigate to Palika Gallery (from admin panel)
2. Ensure "Images" tab is active
3. Click file input in upload section
4. Select 1-3 image files (JPG, PNG, WebP, or GIF)
5. Verify images appear in gallery grid
6. Check file size displays correctly

**Expected Result**: Images upload successfully, appear in gallery with correct metadata

---

### Test 4: Select Image from Gallery
**Steps**:
1. Navigate to Palika Profile
2. Scroll to "Featured Image" section
3. Click "📷 Select from Gallery" button
4. Modal opens showing gallery
5. Click on an image in the modal
6. Modal closes automatically
7. Image URL populates in input field
8. Image preview displays below input

**Expected Result**: Image selected, URL populated, preview displays, modal closes

---

### Test 5: Manual Image URL Entry
**Steps**:
1. Navigate to Palika Profile
2. In "Featured Image" section, manually enter image URL
3. Example: `https://via.placeholder.com/300x200`
4. Verify image preview displays
5. Click "Save Palika Profile"
6. Verify profile saves with image URL

**Expected Result**: Manual URL works, preview displays, saves correctly

---

### Test 6: Add Multiple Highlights
**Steps**:
1. Navigate to Palika Profile
2. Scroll to "Highlights" section
3. Fill in first highlight (title + description)
4. Click "Add Highlight" button
5. Fill in second highlight
6. Click "Add Highlight" again
7. Fill in third highlight
8. Click "Save Palika Profile"
9. Verify all highlights save

**Expected Result**: Multiple highlights added, saved, and persist on reload

---

### Test 7: Remove Highlight
**Steps**:
1. Navigate to Palika Profile with existing highlights
2. Click "Remove Highlight" on any highlight (except if only 1)
3. Verify highlight removed from form
4. Click "Save Palika Profile"
5. Verify highlight removed from database

**Expected Result**: Highlight removed successfully

---

### Test 8: Edit Tourism Information
**Steps**:
1. Navigate to Palika Profile
2. Scroll to "Tourism Information" section
3. Fill in:
   - Best Time to Visit: "October to November"
   - Accessibility: "Wheelchair accessible, parking available"
   - Languages: "English, Nepali, Chinese"
   - Currency: "NPR"
4. Click "Save Palika Profile"
5. Reload page and verify data persists

**Expected Result**: Tourism info saved and persists on reload

---

### Test 9: Edit Demographics
**Steps**:
1. Navigate to Palika Profile
2. Scroll to "Demographics" section
3. Fill in:
   - Population: "500000"
   - Area (sq km): "50.5"
   - Established Year: "2063"
4. Click "Save Palika Profile"
5. Reload page and verify data persists

**Expected Result**: Demographics saved and persists on reload

---

### Test 10: Delete Gallery Item
**Steps**:
1. Navigate to Palika Gallery
2. Click "Delete" button on any gallery item
3. Confirm deletion in dialog
4. Verify item removed from gallery
5. Verify item count decreases

**Expected Result**: Item deleted successfully, removed from gallery

---

### Test 11: Set Featured Image in Gallery
**Steps**:
1. Navigate to Palika Gallery
2. Ensure "Images" tab is active
3. Click "Set Featured" on an image
4. Verify button changes to "⭐ Featured" (green)
5. Verify other images show "Set Featured" (gray)
6. Reload page and verify featured status persists

**Expected Result**: Featured image set and persists on reload

---

### Test 12: Upload Documents
**Steps**:
1. Navigate to Palika Gallery
2. Click "Documents" tab
3. Click file input in upload section
4. Select a PDF file
5. Verify document appears in gallery with 📄 icon
6. Verify file size displays correctly

**Expected Result**: PDF uploads successfully, displays with document icon

---

### Test 13: Switch Between Tabs
**Steps**:
1. Navigate to Palika Gallery
2. Click "Images" tab - verify images display
3. Click "Documents" tab - verify documents display
4. Click "Images" tab again - verify images still there
5. Check tab counts update correctly

**Expected Result**: Tabs switch correctly, counts accurate

---

### Test 14: Error Handling - Missing Description
**Steps**:
1. Navigate to Palika Profile
2. Clear both description fields
3. Click "Save Palika Profile"
4. Verify error message: "At least one description is required"

**Expected Result**: Error message displays, profile not saved

---

### Test 15: Error Handling - File Upload Failure
**Steps**:
1. Navigate to Palika Gallery
2. Try to upload a file larger than 50MB (if available)
3. Verify error message displays
4. Verify file not added to gallery

**Expected Result**: Error message displays, file not uploaded

---

### Test 16: Super Admin Access
**Steps**:
1. Login as Super Admin: `superadmin@nepaltourism.dev` / `SuperSecurePass123!`
2. Navigate to Palika Profile
3. Verify form loads (should show default empty profile)
4. Navigate to Palika Gallery
5. Verify gallery loads

**Expected Result**: Super admin can access both pages

---

### Test 17: Responsive Design
**Steps**:
1. Navigate to Palika Profile
2. Open browser DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Test on mobile (375px), tablet (768px), desktop (1920px)
5. Verify form elements stack properly
6. Verify gallery grid adjusts
7. Verify modal displays correctly

**Expected Result**: Layout responsive on all screen sizes

---

### Test 18: Image Preview
**Steps**:
1. Navigate to Palika Profile
2. Enter valid image URL in Featured Image field
3. Verify image preview displays below input
4. Change URL to invalid image
5. Verify preview doesn't display or shows broken image
6. Change back to valid URL
7. Verify preview displays again

**Expected Result**: Preview updates correctly with URL changes

---

### Test 19: Modal Close Button
**Steps**:
1. Navigate to Palika Profile
2. Click "📷 Select from Gallery"
3. Modal opens
4. Click "Close" button
5. Verify modal closes
6. Verify form unchanged

**Expected Result**: Modal closes without changes

---

### Test 20: Form Persistence
**Steps**:
1. Navigate to Palika Profile
2. Fill in all fields with test data
3. Don't save, navigate away
4. Navigate back to Palika Profile
5. Verify form is empty (data not persisted without save)
6. Fill in data again
7. Click "Save Palika Profile"
8. Navigate away and back
9. Verify data persists

**Expected Result**: Data only persists after explicit save

---

## Performance Testing

### Load Time
- Profile page should load in < 2 seconds
- Gallery should load in < 3 seconds
- Image uploads should complete in < 5 seconds

### Memory Usage
- Gallery with 100+ images should not cause lag
- Modal should open/close smoothly
- No memory leaks on repeated operations

---

## Browser Testing

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Accessibility Testing

### Keyboard Navigation
- Tab through form fields
- Enter to submit form
- Escape to close modal
- Space to click buttons

### Screen Reader
- Test with NVDA (Windows) or VoiceOver (Mac)
- Verify form labels read correctly
- Verify button labels read correctly
- Verify error messages announced

### Color Contrast
- Verify text readable on all backgrounds
- Check button colors meet WCAG AA standards

---

## Database Verification

### Check Profile Data
```sql
SELECT * FROM palika_profiles WHERE palika_id = 10;
```

### Check Gallery Data
```sql
SELECT * FROM palika_gallery WHERE palika_id = 10;
```

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'palika_profiles';
SELECT * FROM pg_policies WHERE tablename = 'palika_gallery';
```

---

## Common Issues and Solutions

### Issue: Image not uploading
**Solution**: 
- Check file size (max 50MB)
- Check file format (JPG, PNG, WebP, GIF for images; PDF for documents)
- Check browser console for errors
- Verify storage bucket exists

### Issue: Gallery modal not opening
**Solution**:
- Check browser console for errors
- Verify palikaId is set correctly
- Check network tab for API calls
- Verify gallery items exist

### Issue: Image preview not displaying
**Solution**:
- Check image URL is valid
- Check CORS settings
- Verify image file exists in storage
- Check browser console for errors

### Issue: Form not saving
**Solution**:
- Check browser console for errors
- Verify at least one description is filled
- Check network tab for API response
- Verify user has correct permissions

---

## Success Criteria

✅ All 20 test scenarios pass
✅ No console errors
✅ No network errors
✅ Performance acceptable
✅ Responsive on all devices
✅ Accessible with keyboard and screen reader
✅ Works on all supported browsers

---

## Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Storage bucket created
- [ ] Navigation links visible
- [ ] Test credentials work
- [ ] Documentation complete

