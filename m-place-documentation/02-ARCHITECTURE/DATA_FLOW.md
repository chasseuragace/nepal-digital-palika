# Data Flow Architecture

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGES (React Components)                 │
├─────────────────────────────────────────────────────────────────┤
│  Homepage  │ Marketplace │ ProductDetail │ Profile │ Favorites  │
└──────┬──────────┬──────────────┬──────────────┬──────────┬───────┘
       │          │              │              │          │
       │ calls    │ calls        │ calls        │ calls    │ calls
       ↓          ↓              ↓              ↓          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY HOOKS                             │
├─────────────────────────────────────────────────────────────────┤
│ useTrendingProducts() │ useProducts() │ useProduct()            │
│ useCurrentUser()      │ useMyListings() │ useFavorites()        │
└──────┬──────────┬──────────────┬──────────────┬──────────┬───────┘
       │          │              │              │          │
       │ calls    │ calls        │ calls        │ calls    │ calls
       ↓          ↓              ↓              ↓          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API FUNCTIONS                                 │
├─────────────────────────────────────────────────────────────────┤
│ src/api/products.ts          │ src/api/users.ts                │
│ ├─ fetchTrendingProducts()   │ ├─ fetchCurrentUser()          │
│ ├─ fetchProducts()           │ └─ fetchMyListings()           │
│ ├─ fetchProductById()        │                                 │
│ └─ fetchFavorites()          │                                 │
└──────┬──────────┬──────────────┬──────────────┬──────────┬───────┘
       │          │              │              │          │
       │ fetch    │ fetch        │ fetch        │ fetch    │ fetch
       ↓          ↓              ↓              ↓          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    JSON DATA FILES                               │
├─────────────────────────────────────────────────────────────────┤
│ public/data/                                                     │
│ ├─ trending.json          (4 items)                             │
│ ├─ marketplace.json       (6 items)                             │
│ ├─ products.json          (full details)                        │
│ ├─ user.json              (profile)                             │
│ ├─ listings.json          (4 listings)                          │
│ └─ favorites.json         (3 items)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Homepage

```
1. User visits http://localhost:8081/
   ↓
2. Homepage component renders
   ↓
3. Homepage calls: useTrendingProducts()
   ↓
4. React Query hook calls: fetchTrendingProducts()
   ↓
5. API function fetches: /data/trending.json
   ↓
6. JSON data returned to hook
   ↓
7. Hook returns: { data: [...], isLoading: false, isError: false }
   ↓
8. Homepage renders ProductCard components with data
   ↓
9. User sees 4 trending products
```

## Data Flow Example: Marketplace with Filters

```
1. User visits http://localhost:8081/marketplace
   ↓
2. Marketplace component renders with filters
   ↓
3. User selects: category="electronics", priceRange=[0, 200000]
   ↓
4. Marketplace calls: useProducts({ category: 'electronics', maxPrice: 200000 })
   ↓
5. React Query hook calls: fetchProducts(filters)
   ↓
6. API function fetches: /data/marketplace.json
   ↓
7. API function applies client-side filtering:
   - Filter by category: "electronics"
   - Filter by price: <= 200000
   ↓
8. Filtered data returned to hook
   ↓
9. Hook returns: { data: [iPhone, Laptop], isLoading: false }
   ↓
10. Marketplace renders filtered ProductCards
    ↓
11. User sees only electronics under 200k
```

## Data Flow Example: Product Detail

```
1. User clicks on product card (id="1")
   ↓
2. Router navigates to /product/1
   ↓
3. ProductDetail component renders with id="1"
   ↓
4. ProductDetail calls: useProduct("1")
   ↓
5. React Query hook calls: fetchProductById("1")
   ↓
6. API function fetches: /data/products.json
   ↓
7. API function finds product with id="1"
   ↓
8. Full product data returned (with images array, seller info, description)
   ↓
9. Hook returns: { data: {...}, isLoading: false }
   ↓
10. ProductDetail renders full product page with:
    - Image gallery
    - Full description
    - Seller information
    - Price and location
    ↓
11. User sees complete product details
```

## Data Flow Example: Profile Page

```
1. User visits http://localhost:8081/profile
   ↓
2. Profile component renders
   ↓
3. Profile calls TWO hooks:
   - useCurrentUser()
   - useMyListings()
   ↓
4. React Query executes both in parallel:
   - Hook 1 calls: fetchCurrentUser()
   - Hook 2 calls: fetchMyListings()
   ↓
5. API functions fetch in parallel:
   - Fetch: /data/user.json
   - Fetch: /data/listings.json
   ↓
6. Both JSON files loaded
   ↓
7. Hooks return:
   - { data: userProfile, isLoading: false }
   - { data: [listing1, listing2, ...], isLoading: false }
   ↓
8. Profile renders:
   - User info section (from user.json)
   - Listings tabs (from listings.json)
   ↓
9. User sees complete profile with all listings
```

## Caching & Performance

React Query automatically caches data:

```
First visit to /marketplace
  ↓
  Fetch /data/marketplace.json
  ↓
  Cache stored in memory
  ↓
  
Second visit to /marketplace (same session)
  ↓
  Return cached data instantly
  ↓
  No network request!
  
User navigates away and back
  ↓
  Cache still valid (default: 5 minutes)
  ↓
  Return cached data
  ↓
  
Cache expires or user manually refetch
  ↓
  Fetch fresh data from /data/marketplace.json
```

## Switching to Real Backend

When you have a backend API:

```
BEFORE (JSON):
┌─────────────┐
│   Pages     │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│  React Query Hooks  │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   API Functions     │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  JSON Files         │
│  /data/*.json       │
└─────────────────────┘

AFTER (Real Backend):
┌─────────────┐
│   Pages     │  ← NO CHANGES
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│  React Query Hooks  │  ← NO CHANGES
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   API Functions     │  ← ONLY CHANGE HERE
│   (update fetch)    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  Real Backend API   │
│  https://api.../    │
└─────────────────────┘
```

## Key Benefits

1. **Separation of Concerns**: Pages don't know about data sources
2. **Easy Testing**: Mock data in JSON, test UI independently
3. **Easy Backend Swap**: Change API functions, pages stay the same
4. **Automatic Caching**: React Query handles it
5. **Loading States**: Built-in isLoading, isError flags
6. **Type Safety**: TypeScript interfaces ensure consistency
7. **Scalability**: Add new endpoints without touching pages
