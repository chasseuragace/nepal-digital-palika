# API Layer Setup - Complete Guide

## Overview
Your app now has a complete data layer that fetches from JSON files in `public/data/`. This makes it easy to test the UI and later swap in a real backend.

## File Structure

```
src/
├── types/index.ts              ← Shared TypeScript interfaces
├── api/
│   ├── products.ts             ← Product API functions
│   └── users.ts                ← User API functions
└── hooks/
    ├── useProducts.ts          ← React Query hooks for products
    └── useUser.ts              ← React Query hooks for users

public/data/
├── products.json               ← Full product details (for detail page)
├── trending.json               ← Trending products (homepage)
├── marketplace.json            ← All marketplace products
├── user.json                   ← Current user profile
├── listings.json               ← User's listings (profile page)
└── favorites.json              ← User's favorite products
```

## How It Works

### 1. Types (`src/types/index.ts`)
Defines the shape of all data:
- `Product` - marketplace item
- `User` - user profile
- `Listing` - user's own listing
- `Seller` - seller info on product cards

### 2. API Functions (`src/api/`)
Fetch data from JSON files:
```typescript
// products.ts
fetchProducts(filters)        // Get all products with filtering
fetchTrendingProducts()       // Get trending items
fetchProductById(id)          // Get single product detail
fetchFavorites()              // Get user's favorites

// users.ts
fetchCurrentUser()            // Get logged-in user profile
fetchMyListings()             // Get user's listings
```

### 3. React Query Hooks (`src/hooks/`)
Wrap API functions with caching & loading states:
```typescript
// useProducts.ts
useProducts(filters)          // { data, isLoading, isError }
useTrendingProducts()
useProduct(id)
useFavorites()

// useUser.ts
useCurrentUser()
useMyListings()
```

### 4. Pages Use Hooks
Pages call hooks instead of managing state:
```typescript
const { data: products, isLoading } = useProducts(filters);

if (isLoading) return <LoadingState />;
return <ProductGrid products={products} />;
```

## JSON Data Files

### `public/data/products.json`
Full product details with seller info and images array.
Used by: ProductDetail page

### `public/data/trending.json`
4 trending products for homepage.
Used by: Homepage (Trending Now section)

### `public/data/marketplace.json`
6 products for marketplace browsing.
Used by: Marketplace page

### `public/data/user.json`
Current user's profile data.
Used by: Profile page (user info section)

### `public/data/listings.json`
User's 4 listings with different statuses (active, sold, expired).
Used by: Profile page (My Listings section)

### `public/data/favorites.json`
3 favorite products.
Used by: Favorites page

## Pages & Their Data Sources

| Page | Hook | JSON File | Purpose |
|------|------|-----------|---------|
| Homepage | `useTrendingProducts()` | trending.json | Show 4 trending items |
| Marketplace | `useProducts(filters)` | marketplace.json | Browse all products with filters |
| ProductDetail | `useProduct(id)` | products.json | Show full product details |
| Profile | `useCurrentUser()` + `useMyListings()` | user.json + listings.json | Show user info & listings |
| Favorites | `useFavorites()` | favorites.json | Show saved items |

## Switching to a Real Backend

When you have a backend API, just update the API functions:

```typescript
// Before (JSON)
export async function fetchProducts(filters) {
  const res = await fetch('/data/marketplace.json');
  return res.json();
}

// After (Real API)
export async function fetchProducts(filters) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`https://api.example.com/products?${params}`);
  return res.json();
}
```

**No page changes needed!** React Query handles caching & loading states automatically.

## Environment Variables

Add to `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

Then in API functions:
```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const res = await fetch(`${BASE_URL}/products`);
```

## Testing the Setup

1. Start dev server: `npm run dev`
2. Visit pages:
   - http://localhost:8081/ (Homepage)
   - http://localhost:8081/marketplace (Marketplace)
   - http://localhost:8081/product/1 (Product Detail)
   - http://localhost:8081/profile (Profile)
   - http://localhost:8081/favorites (Favorites)

All pages should load data from JSON files with proper loading states.

## Next Steps

1. **Add more products** to JSON files as needed
2. **Test filtering** on Marketplace page
3. **Build backend API** with same response format
4. **Update API functions** to call real backend
5. **Add authentication** (JWT tokens, etc.)
6. **Add mutations** (create listing, update profile, etc.) using `useMutation`
