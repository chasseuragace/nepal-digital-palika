# User → Business → Products Creation Flow

This document outlines the scripts that create users, assign them to palikas, and create business profiles with products.

## Overview

The seeding process follows this flow:
1. **Create Auth User** - Create user in Supabase Auth
2. **Create User Profile** - Create profile record with `default_palika_id` assignment
3. **Create Business** - Create business profile owned by the user in a specific palika
4. **Create Products** - Create marketplace products for the business

## Scripts That Implement This Flow

### 1. `seed-complete-flow.ts` - Simple Single User Flow

**Purpose**: Creates one test user with a business and 5 products

**Flow**:
```
Auth User → Profile (palika_id: 1) → Business → 5 Products
```

**Key Code**:
```typescript
// Step 1: Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: testEmail,
  password: testPassword,
  email_confirm: true,
})

// Step 2: Create profile with palika assignment
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .insert({
    id: userId,
    name: 'Test Seller',
    phone: '+977-9841234567',
    default_palika_id: 1,  // ← Assign to palika
  })

// Step 3: Create business
const { data: business } = await supabaseAdmin
  .from('businesses')
  .insert({
    owner_user_id: userId,
    palika_id: 1,
    business_name: businessName,
    business_type_id: 3,
    // ... other fields
  })

// Step 4: Create products
const productsList = categories.slice(0, 5).map((cat, idx) => ({
  business_id: business.id,
  palika_id: 1,
  marketplace_category_id: cat.id,
  // ... other fields
}))
```

**Location**: `database/scripts/seed-complete-flow.ts`

---

### 2. `seed-marketplace-test-data.ts` - Multi-User Multi-Tier Flow

**Purpose**: Creates multiple test users across different palikas and tiers with businesses and products

**Flow**:
```
Multiple Auth Users → Profiles (various palikas) → Businesses → Products (tier-gated)
```

**Test Data Structure**:
```typescript
const testUsers = [
  // Tier 1 (Basic) - Itahari
  { name: 'Raj Kumar', email: 'raj@test.com', palika_id: 4, tier_level: 1, business_type: 'Producer' },
  { name: 'Priya Singh', email: 'priya@test.com', palika_id: 4, tier_level: 1, business_type: 'Retail Shop' },
  
  // Tier 2 (Tourism) - Kanyam, Tilawe
  { name: 'Amit Patel', email: 'amit@test.com', palika_id: 2, tier_level: 2, business_type: 'Tour Guide & Activities' },
  { name: 'Neha Sharma', email: 'neha@test.com', palika_id: 3, tier_level: 2, business_type: 'Artisan Workshop' },
  
  // Tier 3 (Premium) - Rajbiraj
  { name: 'Vikram Singh', email: 'vikram@test.com', palika_id: 1, tier_level: 3, business_type: 'Accommodation' },
]
```

**Key Features**:
- Creates users in different palikas
- Respects tier constraints for product categories
- Creates 2 products per business
- Creates threaded comments on products

**Location**: `database/scripts/seed-marketplace-test-data.ts`

---

### 3. `seed-marketplace-proper.ts` - Comprehensive Multi-User Flow

**Purpose**: Creates comprehensive test data with multiple users, businesses, products, and threaded comments

**Flow**:
```
Multiple Auth Users → Profiles (various palikas) → Businesses → Products (tier-gated) → Threaded Comments
```

**Key Features**:
- Creates users across all tiers (Tier 1, 2, 3)
- Assigns users to different palikas based on tier
- Creates businesses with proper categorization
- Creates marketplace products respecting tier constraints
- Creates threaded comments with owner replies
- Comprehensive error handling

**Test Data Distribution**:
```
Tier 1 (Basic): 2 users, 2 businesses, 4 products
Tier 2 (Tourism): 4 users, 4 businesses, 8 products
Tier 3 (Premium): 2 users, 2 businesses, 4 products
```

**Location**: `database/scripts/seed-marketplace-proper.ts`

---

## Database Schema Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (user_id → auth.users.id)
    ├─ default_palika_id → palikas.id
    └─ user_type: 'business_owner'
        ↓
    businesses (owner_user_id → profiles.id)
        ├─ palika_id → palikas.id
        ├─ business_type_id → categories.id
        └─ business_category_id → business_categories.id
            ↓
        marketplace_products (business_id → businesses.id)
            ├─ palika_id → palikas.id
            ├─ marketplace_category_id → marketplace_categories.id
            └─ created_by → profiles.id
                ↓
            marketplace_product_comments (product_id → marketplace_products.id)
                ├─ user_id → profiles.id
                └─ palika_id → palikas.id
```

---

## Key Fields

### Profile Creation
```typescript
{
  id: userId,                    // From auth.users.id
  name: string,
  phone: string,
  user_type: 'business_owner',   // Important for business owners
  default_palika_id: number,     // ← Assigns user to palika
  phone_verified: boolean,
  phone_verified_at: timestamp,
}
```

### Business Creation
```typescript
{
  owner_user_id: userId,         // ← Links to profile
  palika_id: number,             // ← Business location
  business_name: string,
  business_type_id: number,      // ← Category from categories table
  business_category_id: number,  // ← Optional: business_categories
  slug: string,
  phone: string,
  address: string,
  location: geography,           // POINT(longitude latitude)
  ward_number: number,
  description: string,
  is_active: boolean,
  verification_status: 'verified' | 'pending' | 'rejected',
}
```

### Product Creation
```typescript
{
  business_id: uuid,             // ← Links to business
  palika_id: number,             // ← Must match business.palika_id
  marketplace_category_id: number, // ← Tier-gated category
  name_en: string,
  name_ne: string,
  slug: string,
  price: number,
  currency: 'NPR',
  quantity_available: number,
  status: 'published' | 'archived',
  is_approved: boolean,          // Tier 1: always true, Tier 2+: depends
  requires_approval: boolean,    // Tier 1: false, Tier 2+: configurable
  created_by: userId,            // ← Links to profile
}
```

---

## Tier Constraints

### Tier 1 (Basic)
- Can list in Tier 1 categories only
- Products auto-approved
- No approval workflow

### Tier 2 (Tourism)
- Can list in Tier 1 & 2 categories
- Products may require approval (configurable)
- Approval workflow available

### Tier 3 (Premium)
- Can list in all categories (Tier 1, 2, 3)
- Products may require approval (configurable)
- Full approval workflow

---

## Running the Scripts

### Option 1: Simple Test (Single User)
```bash
cd database
npx ts-node scripts/seed-complete-flow.ts
```

### Option 2: Multi-User Test Data
```bash
cd database
npx ts-node scripts/seed-marketplace-test-data.ts
```

### Option 3: Comprehensive Test Data
```bash
cd database
npx ts-node scripts/seed-marketplace-proper.ts
```

### Option 4: Run All Seeds (Recommended)
```bash
bash session-2026-03-21/run-seeds.sh
```

---

## Example: Creating a User for Bhaktapur

To create a user for Bhaktapur (Palika ID: 10, Tourism Tier):

```typescript
// 1. Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: 'seller@bhaktapur.com',
  password: 'SecurePassword123!',
  email_confirm: true,
})

// 2. Create profile with Bhaktapur assignment
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .insert({
    id: authUser.user.id,
    name: 'Bhaktapur Seller',
    phone: '+977-9841234567',
    user_type: 'business_owner',
    default_palika_id: 10,  // ← Bhaktapur
  })

// 3. Create business in Bhaktapur
const { data: business } = await supabaseAdmin
  .from('businesses')
  .insert({
    owner_user_id: authUser.user.id,
    palika_id: 10,  // ← Bhaktapur
    business_name: 'Bhaktapur Crafts',
    business_type_id: 6,  // Artisan Workshop
    slug: 'bhaktapur-crafts',
    phone: '+977-9841234567',
    address: 'Ward 1, Bhaktapur',
    location: 'POINT(85.8246 27.6728)',
    ward_number: 1,
    description: 'Traditional Bhaktapur crafts',
  })

// 4. Create products
const { data: products } = await supabaseAdmin
  .from('marketplace_products')
  .insert([
    {
      business_id: business.id,
      palika_id: 10,
      marketplace_category_id: 5,  // Tier 2 category
      name_en: 'Bhaktapur Pottery',
      slug: 'bhaktapur-pottery',
      price: 500,
      currency: 'NPR',
      quantity_available: 20,
      status: 'published',
      is_approved: true,
      created_by: authUser.user.id,
    }
  ])
```

---

## Testing Checklist

- [ ] User created in auth
- [ ] Profile created with correct palika_id
- [ ] Business created with correct owner_user_id
- [ ] Business assigned to correct palika
- [ ] Products created with correct business_id
- [ ] Products respect tier constraints
- [ ] Products have correct palika_id
- [ ] Comments can be created on products
- [ ] RLS policies allow user to see their own data
- [ ] RLS policies prevent unauthorized access
