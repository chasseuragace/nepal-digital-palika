# JSON Data Reference Guide

Quick reference for all JSON data files and their usage throughout the application.

---

## 📊 Data Files Overview

### Core Product Data

#### `marketplace.json`
- **Purpose:** All marketplace products with pagination
- **Used By:** Marketplace page, API fallback
- **Hook:** `useProducts(filters)`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "price": "number",
      "location": "string",
      "image": "string",
      "category": "string",
      "description": "string",
      "views": "number",
      "postedDate": "string",
      "isFavorited": "boolean",
      "seller": { ... }
    }
  ]
  ```

#### `products.json`
- **Purpose:** Complete product database with all details
- **Used By:** ProductDetail page
- **Hook:** `useProduct(id)`
- **Structure:** Same as marketplace.json with additional fields

#### `trending.json`
- **Purpose:** Featured/trending products for homepage
- **Used By:** Homepage trending section
- **Hook:** `useTrendingProducts()`
- **Structure:** Array of Product objects

---

### Configuration Data

#### `marketplace-config.json`
- **Purpose:** Marketplace filters, categories, locations, price range
- **Used By:** Marketplace page, Sell page
- **Hook:** `useMarketplaceConfig()`
- **Structure:**
  ```json
  {
    "id": "string",
    "header": {
      "title": "string",
      "subtitle": "string"
    },
    "categories": [
      { "value": "string", "label": "string" }
    ],
    "locations": [
      { "value": "string", "label": "string" }
    ],
    "priceRange": {
      "min": "number",
      "max": "number",
      "step": "number",
      "currency": "string"
    },
    "filters": {
      "searchPlaceholder": "string",
      "categoryLabel": "string",
      "priceLabel": "string",
      "locationLabel": "string"
    }
  }
  ```

#### `hero.json`
- **Purpose:** Hero section configuration for homepage
- **Used By:** Homepage hero section
- **Hook:** `useHero()`
- **Structure:**
  ```json
  {
    "id": "string",
    "backgroundImage": "string",
    "backgroundAlt": "string",
    "badge": {
      "icon": "string",
      "text": "string"
    },
    "title": {
      "main": "string",
      "highlight": "string"
    },
    "subtitle": "string",
    "primaryButton": {
      "text": "string",
      "icon": "string",
      "action": "string"
    },
    "secondaryButton": {
      "text": "string",
      "action": "string"
    },
    "searchPlaceholder": "string"
  }
  ```

#### `routes.json`
- **Purpose:** App routing configuration
- **Used By:** Available for routing setup
- **Hook:** `useRoutes()`
- **Structure:**
  ```json
  {
    "id": "string",
    "routes": [
      {
        "id": "string",
        "path": "string",
        "label": "string",
        "component": "string",
        "icon": "string | null",
        "visible": "boolean",
        "inNavbar": "boolean"
      }
    ]
  }
  ```

---

### Category & Feature Data

#### `categories.json`
- **Purpose:** Product categories with icons and colors
- **Used By:** CategorySlider component
- **Hook:** `useCategories()`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "icon": "string (icon name)",
      "color": "string (tailwind gradient)"
    }
  ]
  ```

#### `features.json`
- **Purpose:** "Why Choose" section features/stats
- **Used By:** Homepage features section
- **Hook:** `useFeatures()`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "subtitle": "string",
      "description": "string",
      "icon": "string (icon name)",
      "color": "string (tailwind gradient)"
    }
  ]
  ```

---

### User Data

#### `user.json`
- **Purpose:** Current logged-in user profile
- **Used By:** Profile page
- **Hook:** `useCurrentUser()`
- **Structure:**
  ```json
  {
    "id": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "location": "string",
    "joinDate": "string (ISO date)",
    "avatar": "string (URL)",
    "totalListings": "number",
    "activeListings": "number",
    "soldItems": "number",
    "expiredListings": "number"
  }
  ```

#### `listings.json`
- **Purpose:** Current user's product listings
- **Used By:** Profile page listings section
- **Hook:** `useMyListings()`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "price": "number",
      "status": "active | sold | expired",
      "category": "string",
      "location": "string",
      "image": "string",
      "createdDate": "string (ISO date)",
      "expiryDate": "string (ISO date)",
      "soldDate": "string (ISO date)",
      "views": "number"
    }
  ]
  ```

#### `favorites.json`
- **Purpose:** User's favorite products
- **Used By:** Favorites page, FavoritesContext
- **Hook:** `useFavorites()`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "price": "number",
      "location": "string",
      "image": "string"
    }
  ]
  ```

---

### Footer Data

#### `footer-company.json`
- **Purpose:** Company information for footer
- **Used By:** Footer component
- **Hook:** `useFooterCompany()`
- **Structure:**
  ```json
  {
    "name": "string",
    "tagline": "string",
    "description": "string",
    "logo": "string (URL)"
  }
  ```

#### `footer-apps.json`
- **Purpose:** App download links for footer
- **Used By:** Footer component
- **Hook:** `useFooterApps()`
- **Structure:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "label": "string",
      "url": "string",
      "icon": "string (icon name)",
      "color": "string (tailwind gradient)"
    }
  ]
  ```

#### `footer-contact.json`
- **Purpose:** Contact information for footer
- **Used By:** Footer component
- **Hook:** `useFooterContact()`
- **Structure:**
  ```json
  {
    "phones": ["string"],
    "email": "string",
    "address": {
      "street": "string",
      "city": "string",
      "country": "string"
    }
  }
  ```

---

## 🔄 Data Flow by Page

### Homepage
```
Homepage.tsx
├── useHero() → hero.json
├── useTrendingProducts() → trending.json
├── useFeatures() → features.json
└── CategorySlider
    └── useCategories() → categories.json
```

### Marketplace
```
Marketplace.tsx
├── useMarketplaceConfig() → marketplace-config.json
└── useProducts(filters) → marketplace.json (+ API fallback)
    └── Pagination: page, pageSize, total, totalPages
```

### Product Detail
```
ProductDetail.tsx
└── useProduct(id) → products.json
```

### Profile
```
Profile.tsx
├── useCurrentUser() → user.json
└── useMyListings() → listings.json
```

### Favorites
```
Favorites.tsx
└── useFavorites() → favorites.json (via FavoritesContext)
```

### Sell
```
Sell.tsx
└── useMarketplaceConfig() → marketplace-config.json
    ├── categories (filtered)
    └── locations (filtered)
```

### Footer (All Pages)
```
Footer.tsx
├── useFooterCompany() → footer-company.json
├── useFooterApps() → footer-apps.json
└── useFooterContact() → footer-contact.json
```

---

## 🎯 Quick Lookup: What Data Do I Need?

### I want to display...

| What | JSON File | Hook | Component/Page |
|------|-----------|------|---|
| All products | marketplace.json | useProducts() | Marketplace |
| Single product | products.json | useProduct(id) | ProductDetail |
| Trending items | trending.json | useTrendingProducts() | Homepage |
| Categories | categories.json | useCategories() | CategorySlider |
| Features/Stats | features.json | useFeatures() | Homepage |
| Hero section | hero.json | useHero() | Homepage |
| User profile | user.json | useCurrentUser() | Profile |
| User listings | listings.json | useMyListings() | Profile |
| Favorites | favorites.json | useFavorites() | Favorites |
| Marketplace config | marketplace-config.json | useMarketplaceConfig() | Marketplace, Sell |
| Footer company | footer-company.json | useFooterCompany() | Footer |
| Footer apps | footer-apps.json | useFooterApps() | Footer |
| Footer contact | footer-contact.json | useFooterContact() | Footer |

---

## 🔌 API Endpoints

### Primary API (with fallback)
```
GET http://127.0.0.1:53652/marketplace
  ?category=sports
  &minPrice=1000
  &maxPrice=50000
  &search=phone
  &location=kathmandu
  &page=1
  &pageSize=12

Response:
{
  "data": [Product[]],
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 150,
    "totalPages": 13
  }
}
```

### Fallback (JSON Files)
```
GET /data/marketplace.json
GET /data/products.json
GET /data/trending.json
GET /data/categories.json
GET /data/features.json
GET /data/hero.json
GET /data/routes.json
GET /data/user.json
GET /data/listings.json
GET /data/favorites.json
GET /data/marketplace-config.json
GET /data/footer-company.json
GET /data/footer-apps.json
GET /data/footer-contact.json
```

---

## 📝 Adding New Data

### Step 1: Create JSON File
```bash
# Create new file in public/data/
public/data/my-data.json
```

### Step 2: Define Type
```typescript
// src/types/index.ts
export interface MyData {
  id: string;
  // ... fields
}
```

### Step 3: Create API Function
```typescript
// src/api/products.ts or src/api/users.ts
export async function fetchMyData(): Promise<MyData[]> {
  try {
    const res = await fetch('/data/my-data.json');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
```

### Step 4: Create Hook
```typescript
// src/hooks/useProducts.ts
export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: fetchMyData,
  });
}
```

### Step 5: Use in Component
```typescript
// src/components/MyComponent.tsx
const { data: myData } = useMyData();
```

---

## ✅ Checklist for Data Compliance

- [ ] All data comes from JSON files
- [ ] No hardcoded arrays or objects in components
- [ ] All data is typed in `src/types/index.ts`
- [ ] API functions exist in `src/api/`
- [ ] Hooks exist in `src/hooks/`
- [ ] Components use hooks, not direct fetches
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] Pagination implemented (if applicable)

---

## 🚀 Performance Tips

1. **Use React Query Caching**
   - Automatic caching of fetched data
   - Stale-while-revalidate pattern

2. **Pagination**
   - Load only needed data per page
   - Reduces initial load time

3. **Lazy Loading**
   - Load images with `loading="lazy"`
   - Defer non-critical data

4. **Error Boundaries**
   - Wrap components with error boundaries
   - Graceful error handling

---

## 📚 Related Documentation

- See `DATA_ARCHITECTURE_ANALYSIS.md` for detailed analysis
- See `src/types/index.ts` for all type definitions
- See `src/api/` for API implementation details
- See `src/hooks/` for hook implementations
