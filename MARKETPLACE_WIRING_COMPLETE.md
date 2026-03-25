# Marketplace (m-place) - Complete Wiring Documentation

**Date:** 2026-03-24  
**Status:** ✅ FULLY WIRED & OPERATIONAL  
**Last Updated:** Session 2026-03-21+

---

## Executive Summary

The marketplace (m-place) is **fully wired and operational** with all business profile management, product management, and seller features properly connected. All UI pages are linked to their respective API endpoints, and the tier-based category system is functioning correctly.

**Key Status:**
- ✅ Business Profile Edit Form - Fully wired
- ✅ Product Management (Sell/Create/Edit) - Fully wired
- ✅ Product Listing Dashboard - Fully wired
- ✅ Tier-based Categories - Fully wired
- ✅ Navigation & Routing - Fully wired
- ✅ API Endpoints - All implemented
- ✅ Image Upload - Fully wired
- ✅ Approval Workflows - Fully wired

---

## Architecture Overview

### Pages & Routes

```
/                          → Homepage
/marketplace               → Browse all products
/product/:id              → Product detail view
/favorites                → User's favorite products
/sell                     → Create/Edit product listing
/sell?edit=:id           → Edit existing product
/profile                  → User's listings dashboard
/business/:businessId     → View business profile
/business/:businessId/edit → Edit business profile
```

### Data Flow

```
User Registration
    ↓
Auto-create Business Profile (via API)
    ↓
User can Edit Business Profile (/business/:id/edit)
    ↓
User can Create Products (/sell)
    ↓
Products appear in Dashboard (/profile)
    ↓
Products visible in Marketplace (/marketplace)
```

---

## 1. Business Profile Management

### 1.1 Business Profile View (`/business/:businessId`)

**File:** `m-place/src/pages/BusinessProfile.tsx`

**Features:**
- Display business information (name, description, contact, location)
- Show business images gallery
- Display operating hours and facilities
- Show approval status and rejection details
- Edit button (visible only to business owner)

**Key Components:**
- `BusinessApprovalStatus` - Shows verification status
- `BusinessRejectionDetails` - Shows rejection reasons if rejected

**Navigation:**
- Edit button links to `/business/:businessId/edit`
- Back button returns to previous page

**API Calls:**
```typescript
getBusinessById(businessId)  // Fetch business details
```

---

### 1.2 Business Profile Edit (`/business/:businessId/edit`)

**File:** `m-place/src/pages/BusinessProfileEdit.tsx`

**Features:**
- Edit business name (English & Nepali)
- Edit description (English & Nepali)
- Update contact information (phone, email)
- Update location (address, ward number)
- Set operating hours (24/7 or custom hours)
- Select facilities (parking, wifi, restaurant, guide service)
- Select languages spoken (EN, NE, HI, ZH)
- Set price range (min, max, currency)
- Upload and manage business images
- Set featured image

**Form Validation:**
- Business name: minimum 3 characters
- Description: minimum 10 characters
- Phone: required
- Address: required

**API Calls:**
```typescript
getBusinessById(businessId)           // Load existing data
updateBusiness(businessId, payload)   // Save changes
uploadBusinessImage(businessId, file) // Upload images
deleteBusinessImage(imageUrl)         // Remove images
```

**Permission Check:**
- Only business owner can edit (verified via `user.id === business.ownerId`)

**Approval Status:**
- Shows current verification status
- Shows rejection details if rejected
- User can resubmit after rejection

---

## 2. Product Management

### 2.1 Product Creation/Edit (`/sell` & `/sell?edit=:id`)

**File:** `m-place/src/pages/Sell.tsx`

**Features:**

#### Create Mode
- Upload up to 5 product images
- Enter product title (English & Nepali)
- Select category (tier-based)
- Enter description (English & Nepali)
- Set price in NPR
- Toggle price negotiability
- Auto-approval based on tier level

#### Edit Mode
- Load existing product data
- Update all fields
- Replace or keep existing images
- Show approval status
- Show rejection details

**Form Validation:**
- Title (EN & NE): required
- Category: required
- Description (EN & NE): required
- Price: required, must be > 0
- Images: required for create, optional for edit

**Tier-Based Categories:**
```typescript
// Fetch categories based on palika's tier
const tierInfo = await fetchPalikaTier(palika.palikaId)
const categories = await fetchTierScopedCategories(tierInfo.tierId)
```

**Approval Logic:**
```typescript
const tierLevel = palikaTier.tierLevel || 1
const requiresApproval = tierLevel > 1

// Tier 1 (Basic): Auto-published
// Tier 2+ (Tourism/Premium): Requires approval
```

**API Calls:**
```typescript
fetchPalikaTier(palikaId)              // Get palika tier
fetchTierScopedCategories(tierId)      // Get available categories
getUserBusiness(userId)                // Get user's business
createProduct(payload)                 // Create new product
updateProduct(productId, payload)      // Update product
uploadProductImages(files, productId)  // Upload images
fetchProductById(productId)            // Load for editing
```

**Image Handling:**
- Upload to Supabase storage
- Generate preview URLs
- Support up to 5 images
- First image becomes featured image

---

### 2.2 Product Listing Dashboard (`/profile`)

**File:** `m-place/src/pages/Profile.tsx`

**Features:**
- Display all user's products
- Filter by status (All, Active, Hidden, Pending, Out of Stock)
- Show product image, title, price, status
- Display view count and creation date
- Show approval status with badges

**Actions Available:**
- **View** - Navigate to product detail page
- **Edit** - Navigate to edit form with product ID
- **Show/Hide** - Toggle product visibility
- **Delete** - Remove product permanently

**Status Badges:**
- ✓ Active (published & approved)
- Hidden (archived)
- ⏳ Pending (awaiting approval)
- ⚠ Out of Stock

**Tab Filtering:**
```
All        → All products
Active     → Published & approved
Hidden     → Archived products
Pending    → Awaiting approval
Out of Stock → Out of stock items
```

**API Calls:**
```typescript
getUserProducts()                      // Fetch user's products
toggleProductStatus(productId, status) // Show/hide product
deleteProduct(productId)               // Delete product
```

**Rejection Details:**
- Shows rejection reason if product was rejected
- Component: `ProductRejectionDetails`

---

## 3. Navigation & Routing

### 3.1 Navbar Integration

**File:** `m-place/src/components/Navbar.tsx`

**Marketplace Links:**
- **Sell Button** - Links to `/sell`
  - Requires authentication
  - Shows auth modal if not logged in
  - Redirects to region selection if no palika assigned
  
- **Profile Dropdown** - Shows when authenticated
  - "My Profile" → `/profile`
  - "Business Profile" → `/business/:businessId`
  - "Favorites" → `/favorites`
  - "Messages" → Coming soon
  - "Logout" → Clears auth

**Authentication Flow:**
```
User clicks "Sell"
    ↓
Not authenticated? → Show AuthModal
    ↓
Authenticated but no palika? → Show RegionSelectionDialog
    ↓
Navigate to /sell
```

---

### 3.2 Route Configuration

**File:** `m-place/src/App.tsx`

```typescript
<Routes>
  <Route path="/" element={<Homepage />} />
  <Route path="/marketplace" element={<Marketplace />} />
  <Route path="/product/:id" element={<ProductDetail />} />
  <Route path="/favorites" element={<Favorites />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/sell" element={<Sell />} />
  <Route path="/business/:businessId" element={<BusinessProfile />} />
  <Route path="/business/:businessId/edit" element={<BusinessProfileEdit />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 4. API Layer

### 4.1 Products API (`m-place/src/api/products.ts`)

**Key Functions:**

```typescript
// Create new product
createProduct(payload: {
  nameEn: string
  nameNe: string
  description: string
  descriptionNe: string
  shortDescription: string
  shortDescriptionNe: string
  price: number
  categoryId: string
  businessId: string
  palikaId: number
  imageUrls: string[]
  featuredImageUrl: string
  createdBy: string
  isApprovalRequired: boolean
})

// Update existing product
updateProduct(productId: string, payload: {
  nameEn: string
  nameNe: string
  description: string
  descriptionNe: string
  shortDescription: string
  shortDescriptionNe: string
  price: number
  categoryId: string
  imageUrls: string[]
  featuredImageUrl: string
})

// Get user's products
getUserProducts(): Promise<Product[]>

// Toggle product visibility
toggleProductStatus(productId: string, status: 'published' | 'archived')

// Delete product
deleteProduct(productId: string)

// Upload images
uploadProductImages(files: File[], productId: string): Promise<string[]>

// Fetch product by ID
fetchProductById(id: string): Promise<Product>
```

---

### 4.2 Businesses API (`m-place/src/api/businesses.ts`)

**Key Functions:**

```typescript
// Get user's business
getUserBusiness(userId: string): Promise<Business | null>

// Get business by ID
getBusinessById(businessId: string): Promise<Business | null>

// Update business
updateBusiness(businessId: string, payload: UpdateBusinessPayload)

// Upload business image
uploadBusinessImage(businessId: string, file: File): Promise<string>

// Delete business image
deleteBusinessImage(imageUrl: string): Promise<void>

// Auto-create business for new user
createAutoBusinessForUser(userId: string, palikaId: number)
```

**UpdateBusinessPayload:**
```typescript
{
  businessName?: string
  businessNameNe?: string
  description?: string
  descriptionNe?: string
  phone?: string
  email?: string
  address?: string
  wardNumber?: number
  operatingHours?: Record<string, string>
  is24_7?: boolean
  languagesSpoken?: string[]
  facilities?: Record<string, boolean>
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  featuredImage?: string
  images?: string[]
}
```

---

### 4.3 Tiers API (`m-place/src/api/tiers.ts`)

**Key Functions:**

```typescript
// Fetch tier info for a palika
fetchPalikaTier(palikaId: number): Promise<{
  palikaId: number
  palikaName: string
  tierId: string | null
  tierName: string | null
}>

// Fetch categories available for a tier
fetchTierScopedCategories(tierId: string | null): Promise<{
  id: string
  name: string
  slug: string
  minTierLevel: number
}[]>

// Validate palika tier assignment
validatePalikaTierAssignment(palikaId: number): Promise<{
  isValid: boolean
  message: string
  tierId?: string
}>
```

---

## 5. Tier-Based Category System

### 5.1 How It Works

**Tier Levels:**
- **Tier 1 (Basic):** 2 categories
- **Tier 2 (Tourism):** 4 categories
- **Tier 3 (Premium):** 6 categories

**Category Assignment:**
```
User registers → Auto-assigned to palika
    ↓
Palika has tier assigned → User can see tier-based categories
    ↓
User creates product → Category filtered by tier
    ↓
Product created with tier-based category
```

**Database Query:**
```sql
SELECT * FROM marketplace_categories
WHERE is_active = true
  AND min_tier_level <= :tier_level
ORDER BY display_order
```

---

### 5.2 Implementation in Sell Page

```typescript
// Load tier-scoped categories
useEffect(() => {
  const loadCategories = async () => {
    if (!palika || !user) return
    
    const tierInfo = await fetchPalikaTier(palika.palikaId)
    if (tierInfo.tierId) {
      const categories = await fetchTierScopedCategories(tierInfo.tierId)
      setTierCategories(categories)
    }
  }
  
  loadCategories()
}, [palika, user])
```

---

## 6. Approval Workflow

### 6.1 Product Approval

**Auto-Approval Logic:**
```typescript
const tierLevel = palikaTier.tierLevel || 1
const requiresApproval = tierLevel > 1

// Tier 1: Auto-published (requiresApproval = false)
// Tier 2+: Requires approval (requiresApproval = true)
```

**Approval Status Display:**
- Component: `ProductApprovalStatus`
- Shows in edit form and dashboard
- Displays rejection details if rejected

**User Feedback:**
```typescript
if (requiresApproval) {
  toast.success('Product listing created! It will be published after admin approval.')
} else {
  toast.success('Product listing created and published successfully!')
}
```

---

### 6.2 Business Approval

**Status Display:**
- Component: `BusinessApprovalStatus`
- Shows in business profile and edit form
- Displays rejection details if rejected

**Rejection Details:**
- Component: `BusinessRejectionDetails`
- Shows rejection reason
- Allows user to resubmit

---

## 7. Image Management

### 7.1 Product Images

**Upload Process:**
```typescript
const imageUrls = await uploadProductImages(images, productId)
// Returns array of Supabase URLs
```

**Storage:**
- Supabase Storage bucket: `product-images`
- Path: `{productId}/{filename}`
- Supports: JPG, PNG, WebP, GIF

**Features:**
- Up to 5 images per product
- First image becomes featured image
- Preview before upload
- Remove individual images
- Replace images on edit

---

### 7.2 Business Images

**Upload Process:**
```typescript
const url = await uploadBusinessImage(businessId, file)
// Returns Supabase URL
```

**Storage:**
- Supabase Storage bucket: `business-images`
- Path: `{businessId}/{filename}`

**Features:**
- Multiple images
- Set featured image
- Remove individual images
- Preview in gallery

---

## 8. Data Models

### 8.1 Product Type

```typescript
interface Product {
  id: string
  nameEn: string
  nameNe: string
  description: string
  descriptionNe: string
  shortDescription: string
  shortDescriptionNe: string
  price: number
  categoryId: string
  category?: Category
  businessId: string
  palikaId: number
  imageUrls: string[]
  featuredImageUrl: string
  createdBy: string
  status: 'published' | 'archived' | 'out_of_stock'
  isApproved: boolean
  isApprovalRequired: boolean
  rejectionReason?: string
  views: number
  createdAt: string
  updatedAt: string
}
```

### 8.2 Business Type

```typescript
interface Business {
  id: string
  ownerId: string
  palikaId: number
  name: string
  nameNe?: string
  description: string
  descriptionNe?: string
  phone: string
  email?: string
  address: string
  wardNumber?: number
  operatingHours?: Record<string, string>
  is24_7?: boolean
  languagesSpoken?: string[]
  facilities?: {
    parking?: boolean
    wifi?: boolean
    restaurant?: boolean
    guide_service?: boolean
  }
  priceRange?: {
    min: number
    max: number
    currency: string
    unit?: string
  }
  images?: string[]
  featuredImage?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
  ratingAverage?: number
  ratingCount?: number
  viewCount?: number
  contactCount?: number
  createdAt: string
  updatedAt: string
}
```

---

## 9. User Flows

### 9.1 Create Product Flow

```
1. User clicks "Sell" in navbar
   ↓
2. Check authentication
   - Not logged in? → Show AuthModal
   - No palika? → Show RegionSelectionDialog
   ↓
3. Navigate to /sell
   ↓
4. Load tier-based categories
   ↓
5. Fill form:
   - Upload images
   - Enter title (EN & NE)
   - Select category
   - Enter description (EN & NE)
   - Set price
   - Toggle negotiable
   ↓
6. Submit
   ↓
7. Upload images to Supabase
   ↓
8. Create product in database
   ↓
9. Check tier level:
   - Tier 1? → Auto-published
   - Tier 2+? → Pending approval
   ↓
10. Show success toast
    ↓
11. Redirect to /profile
```

---

### 9.2 Edit Business Profile Flow

```
1. User navigates to /business/:businessId
   ↓
2. Load business data
   ↓
3. Check ownership (user.id === business.ownerId)
   ↓
4. Show "Edit Profile" button (if owner)
   ↓
5. Click "Edit Profile"
   ↓
6. Navigate to /business/:businessId/edit
   ↓
7. Load existing data into form
   ↓
8. User can:
   - Edit all fields
   - Upload new images
   - Remove images
   - Set featured image
   ↓
9. Submit
   ↓
10. Validate form
    ↓
11. Update business in database
    ↓
12. Show success toast
    ↓
13. Redirect to /business/:businessId
```

---

### 9.3 Manage Products Flow

```
1. User clicks profile dropdown → "My Profile"
   ↓
2. Navigate to /profile
   ↓
3. Load user's products
   ↓
4. Display in dashboard with tabs:
   - All
   - Active
   - Hidden
   - Pending
   - Out of Stock
   ↓
5. For each product, user can:
   - View → /product/:id
   - Edit → /sell?edit=:id
   - Show/Hide → Toggle visibility
   - Delete → Remove product
   ↓
6. Show rejection details if rejected
```

---

## 10. Components Used

### 10.1 UI Components

- `Button` - Action buttons
- `Input` - Text inputs
- `Textarea` - Multi-line text
- `Select` - Dropdown selections
- `Switch` - Toggle switches
- `Card` - Content containers
- `Tabs` - Tab navigation
- `Badge` - Status badges
- `Avatar` - User avatars
- `Label` - Form labels

### 10.2 Custom Components

- `ProductApprovalStatus` - Shows product approval status
- `ProductRejectionDetails` - Shows rejection reasons
- `BusinessApprovalStatus` - Shows business approval status
- `BusinessRejectionDetails` - Shows business rejection reasons
- `AuthModal` - Authentication dialog
- `RegionSelectionDialog` - Palika selection

---

## 11. Error Handling

### 11.1 Common Errors

**Authentication Errors:**
- Not logged in → Show AuthModal
- No business profile → Show error toast
- No palika assigned → Show RegionSelectionDialog

**Validation Errors:**
- Missing required fields → Show error toast
- Invalid price → Show error toast
- No images → Show error toast

**API Errors:**
- Network error → Show error toast
- Server error → Show error toast
- Permission denied → Show error toast

### 11.2 Error Messages

```typescript
// Product creation
'Please login to create a listing'
'You need to create a business first before listing products'
'Your region has not been assigned a tier. Contact support.'
'Failed to load available categories'
'Failed to upload images'
'Product listing created! It will be published after admin approval.'
'Product listing created and published successfully!'

// Business edit
'Business not found'
'You do not have permission to edit this business'
'Business name must be at least 3 characters'
'Description must be at least 10 characters'
'Phone number is required'
'Address is required'
```

---

## 12. Testing Scenarios

### 12.1 Product Creation

**Scenario 1: Tier 1 (Basic) - Auto-publish**
```
1. User in Tier 1 palika
2. Create product
3. Product auto-published
4. Appears in marketplace immediately
```

**Scenario 2: Tier 2+ - Requires Approval**
```
1. User in Tier 2+ palika
2. Create product
3. Product pending approval
4. Shows in dashboard as "Pending"
5. Admin approves
6. Product appears in marketplace
```

**Scenario 3: Edit Product**
```
1. User edits existing product
2. Update fields
3. Replace or keep images
4. Submit
5. Product updated
6. Redirect to profile
```

### 12.2 Business Profile

**Scenario 1: View Business**
```
1. Navigate to /business/:businessId
2. Load business data
3. Display all information
4. Show gallery
```

**Scenario 2: Edit Business (Owner)**
```
1. Navigate to /business/:businessId
2. Click "Edit Profile"
3. Update fields
4. Upload images
5. Submit
6. Redirect to profile
```

**Scenario 3: View Business (Non-owner)**
```
1. Navigate to /business/:businessId
2. Load business data
3. No "Edit Profile" button
4. View-only mode
```

---

## 13. Known Limitations & Future Improvements

### 13.1 Current Limitations

1. **Product Search** - Basic search only, no advanced filters
2. **Product Reviews** - Infrastructure exists but UI not fully implemented
3. **Messaging** - Coming soon (placeholder in navbar)
4. **Product Analytics** - Basic view count only
5. **Bulk Operations** - No bulk edit/delete for products
6. **Product Variants** - Not supported
7. **Inventory Management** - Basic status only

### 13.2 Future Improvements

1. Implement advanced product search and filtering
2. Add product review system UI
3. Implement messaging system
4. Add product analytics dashboard
5. Add bulk product operations
6. Support product variants
7. Add inventory management
8. Add product recommendations
9. Add seller ratings
10. Add product comparison

---

## 14. Deployment Checklist

- ✅ All routes configured
- ✅ All API endpoints implemented
- ✅ Authentication flow working
- ✅ Image upload working
- ✅ Tier-based categories working
- ✅ Approval workflow working
- ✅ Error handling implemented
- ✅ Form validation implemented
- ✅ Navigation properly wired
- ✅ Components properly integrated

---

## 15. Quick Reference

### Navigation Links

| Feature | Route | Component |
|---------|-------|-----------|
| Create Product | `/sell` | Sell.tsx |
| Edit Product | `/sell?edit=:id` | Sell.tsx |
| View Products | `/profile` | Profile.tsx |
| View Business | `/business/:id` | BusinessProfile.tsx |
| Edit Business | `/business/:id/edit` | BusinessProfileEdit.tsx |
| Browse Products | `/marketplace` | Marketplace.tsx |
| Product Detail | `/product/:id` | ProductDetail.tsx |

### API Endpoints

| Function | Purpose |
|----------|---------|
| `createProduct()` | Create new product |
| `updateProduct()` | Update product |
| `deleteProduct()` | Delete product |
| `getUserProducts()` | Get user's products |
| `toggleProductStatus()` | Show/hide product |
| `uploadProductImages()` | Upload images |
| `getBusinessById()` | Get business details |
| `updateBusiness()` | Update business |
| `uploadBusinessImage()` | Upload business image |
| `fetchPalikaTier()` | Get palika tier |
| `fetchTierScopedCategories()` | Get tier categories |

---

## 16. Conclusion

The marketplace is **fully wired and operational** with all features properly connected:

✅ Business profile management complete  
✅ Product creation and editing complete  
✅ Product dashboard complete  
✅ Tier-based categories complete  
✅ Approval workflows complete  
✅ Image management complete  
✅ Navigation and routing complete  
✅ API layer complete  

All features are ready for production use and testing.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** 2026-03-24  
**Next Review:** After Phase 6 implementation

