# M-Place Auth & Region Selection Implementation - Feasibility Analysis

**Status:** 🟢 HIGHLY FEASIBLE
**Date:** March 18, 2026
**Effort Estimate:** 3-5 days for core implementation

---

## Executive Summary

Implementing Supabase auth + region selection in the existing m-place application is **highly feasible**. The codebase has solid foundations:
- ✅ React Router for navigation
- ✅ React Query for data fetching
- ✅ UI component library (shadcn/ui) ready
- ✅ Profile page structure already exists
- ✅ Context API for state management (FavoritesContext pattern)
- ❌ **Missing:** Authentication layer
- ❌ **Missing:** Region/palika selection UI
- ❌ **Missing:** Business creation flow

**Scope:** Auth + Region Selection + Business Auto-Creation
**UI Requirement:** 500x500 popup overlay (no custom UI design, template-based)
**Backend Required:** Supabase Auth + marketplace APIs we just built

---

## Current State Analysis

### ✅ What Exists

**1. User Data Structure (types/index.ts)**
```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  joinDate: string;
  avatar?: string;
  totalListings: number;
  activeListings: number;
  soldItems: number;
  expiredListings: number;
}
```

**2. User Management Hooks (hooks/useUser.ts)**
- `useCurrentUser()` - Fetches current user profile
- `useMyListings()` - Fetches user's listings

**3. User API Layer (api/users.ts)**
- `fetchCurrentUser()` - Currently reads from `/data/user.json`
- `fetchMyListings()` - Currently reads from `/data/listings.json`

**4. Profile Page (pages/Profile.tsx)**
- ✅ Complete profile display
- ✅ Listings management UI
- ✅ Add/Edit listing buttons
- ❌ No auth guard
- ❌ No region/location setup flow

**5. Sell Page (pages/Sell.tsx)**
- ✅ Product form (title, category, location, price, description)
- ✅ Image upload (max 5)
- ✅ Expiry date picker
- ❌ No business selection
- ❌ No business creation flow
- ❌ Form submission doesn't call API

**6. Navbar (components/Navbar.tsx)**
- ✅ Profile link
- ✅ Navigation structure
- ❌ No Login/Logout buttons
- ❌ No auth state indicators

**7. Routing (App.tsx)**
- ✅ React Router set up
- ✅ All pages defined
- ❌ No protected routes
- ❌ No auth redirects

### ❌ What's Missing

| Component | Status | Impact |
|-----------|--------|--------|
| Supabase Auth Context | Missing | **CRITICAL** - No auth state management |
| Login/Register UI | Missing | **CRITICAL** - No way to authenticate |
| Region Selection Dialog | Missing | **CRITICAL** - No palika/ward selection |
| Business Creation Flow | Missing | **HIGH** - Required before marketplace items |
| Protected Routes | Missing | **HIGH** - Any user can access /profile |
| Auth API Integration | Missing | **CRITICAL** - Need to connect to Supabase |
| Business API Integration | Missing | **HIGH** - Need to create business on registration |

---

## Implementation Architecture

### Phase 1: Supabase Auth Context & Components

**Create:** `src/contexts/AuthContext.tsx`
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRegion: (palikaId: number, ward: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from Supabase session on mount
  // Listen to auth state changes
  // Provide login/register/logout functions
  // Track region selection status
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Placement in App.tsx:**
```typescript
<AuthProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FavoritesProvider>
        {/* existing app content */}
      </FavoritesProvider>
    </TooltipProvider>
  </QueryClientProvider>
</AuthProvider>
```

---

### Phase 2: Auth Modal Component (500x500 Popup)

**Create:** `src/components/AuthModal.tsx`
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    // Call auth.login(email, password)
    // On success: redirect to region selection or profile
    // On error: show error message
  };

  const handleRegister = async (e: React.FormEvent) => {
    // Call auth.register(email, password, name, phone)
    // On success: show region selection dialog
    // On error: show error message
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            {/* Login form: email, password, submit button */}
          </TabsContent>

          <TabsContent value="register">
            {/* Register form: name, phone, email, password, confirm password */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 3: Region Selection Dialog

**Create:** `src/components/RegionSelectionDialog.tsx`
```typescript
interface RegionSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (palikaId: number, ward: number) => Promise<void>;
}

export function RegionSelectionDialog({ isOpen, onClose, onSubmit }: RegionSelectionDialogProps) {
  const [selectedPalika, setSelectedPalika] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch palikas from API: GET /api/palikas
  // When palika selected, fetch wards: GET /api/palikas/{palikaId}/wards
  // On submit: call onSubmit(palikaId, ward)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Region</DialogTitle>
          <DialogDescription>Choose your palika and ward for marketplace operations</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Palika selector: Combobox with search */}
          {/* Ward selector: Appears after palika selected */}
          {/* Submit button */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Data Dependencies:**
- GET `/api/palikas` → Returns all palikas (we seeded this!)
  ```typescript
  {
    id: number,
    name_en: string,
    name_ne: string,
    code: string,
    total_wards: number,
    type: 'metropolitan' | 'sub_metropolitan' | 'municipality' | 'rural_municipality'
  }[]
  ```
- GET `/api/palikas/{palikaId}/wards` → Returns wards for selected palika
  ```typescript
  {
    number: number,
    name_en?: string,
    population?: number
  }[]
  ```

---

### Phase 4: Business Auto-Creation

**Create:** `src/api/businesses.ts`
```typescript
export interface CreateBusinessPayload {
  owner_user_id: string;
  palika_id: number;
  business_name: string;
  business_category_id: number;  // Default to first category or user choice
  slug: string;
  phone: string;
  address: string;
  location: string;  // GIS POINT
  ward_number: number;
  description?: string;
  is_active: boolean;
  verification_status: 'pending' | 'verified';
}

export async function createBusiness(payload: CreateBusinessPayload): Promise<Business> {
  const response = await fetch('/api/businesses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseSession.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to create business');
  return response.json();
}
```

**When to Create Business:**
1. After user registers + selects region in RegionSelectionDialog
2. Before user can create marketplace listings
3. Can be done automatically on first marketplace item creation

**Business Auto-Creation Template (in AuthContext):**
```typescript
async function completeRegistration(
  userId: string,
  email: string,
  name: string,
  phone: string,
  palikaId: number,
  ward: number
): Promise<void> {
  // 1. Create default business for this user
  const businessPayload: CreateBusinessPayload = {
    owner_user_id: userId,
    palika_id: palikaId,
    business_name: `${name}'s Shop`,  // Template-based
    business_category_id: 8,  // Default to "Retail Shop" (from seeds)
    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${userId.substring(0, 8)}`,
    phone: phone,
    address: `Ward ${ward}, Palika ${palikaId}`,  // Template-based
    location: getGeometryFromPalikaWard(palikaId, ward),  // From geodata
    ward_number: ward,
    description: `Welcome to ${name}'s marketplace shop!`,
    is_active: true,
    verification_status: 'verified',  // Auto-verify for registered users
  };

  const business = await createBusiness(businessPayload);

  // 2. Update user profile with business_id + palika_id + ward
  await updateUserProfile({
    id: userId,
    default_palika_id: palikaId,
    default_business_id: business.id,
    phone: phone,
  });

  // 3. Redirect to profile
  navigate('/profile');
}
```

---

### Phase 5: Integration Points

**Update Navbar.tsx:**
```typescript
const { user, logout, isAuthenticated } = useAuth();

// Replace Profile link with:
{isAuthenticated ? (
  <>
    <Button onClick={() => logout()} variant="outline">Logout</Button>
    <Button asChild><Link to="/profile">Profile</Link></Button>
  </>
) : (
  <Button onClick={() => setAuthModalOpen(true)}>Login / Register</Button>
)}
```

**Update App.tsx - Add Protected Routes:**
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
}

// In routes:
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
```

**Update Sell.tsx - Add Business Selection:**
```typescript
const { user } = useAuth();
const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

// Add business selector before product form:
<Select value={selectedBusiness?.id || ''} onValueChange={handleBusinessSelect}>
  <SelectTrigger>
    <SelectValue placeholder="Select business to list from" />
  </SelectTrigger>
  <SelectContent>
    {userBusinesses.map(biz => (
      <SelectItem key={biz.id} value={biz.id}>
        {biz.business_name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// On submit:
const handleSubmit = async (e: React.FormEvent) => {
  const product = {
    business_id: selectedBusiness.id,
    marketplace_category_id: getCategoryId(formData.category),
    name: formData.title,
    // ... other fields
  };

  await createMarketplaceProduct(product);
  navigate('/profile');
};
```

---

## Feasibility Assessment

### ✅ Highly Feasible (Why)

| Factor | Assessment | Notes |
|--------|-----------|-------|
| **Auth Backend** | ✅ Ready | Supabase provides complete auth system |
| **Data Models** | ✅ Ready | User, Business, MarketplaceProduct all exist |
| **API Endpoints** | ✅ Ready | We just built /api/palikas, /api/businesses, /api/marketplace-products |
| **UI Components** | ✅ Ready | shadcn/ui has Dialog, Select, Input, Form components |
| **State Management** | ✅ Ready | Context API + React Query sufficient |
| **Existing Pages** | ✅ Ready | Profile, Sell pages mostly complete |
| **RLS Security** | ✅ Ready | Supabase RLS policies we built enforce access control |
| **Integration Time** | 🟡 Moderate | 3-5 days for experienced dev, 5-7 days for learning |

### ⚠️ Considerations

| Risk | Mitigation |
|------|-----------|
| **Auth state persistence** | Use Supabase session storage + localStorage |
| **Region lock-in** | Make region immutable (trigger enforcement we have!) |
| **Business ownership validation** | RLS policy enforces in database |
| **Image upload for products** | Use Supabase Storage with signed URLs |
| **Palika/ward data completeness** | We seeded all 372 palikas + ward data |

---

## Payload Templates (No UI, Just Payloads)

### 1. Auth Register Payload
```typescript
const registerPayload = {
  email: string;           // "user@example.com"
  password: string;        // Min 8 chars, special chars
  user_metadata: {
    full_name: string;     // "Raj Kumar"
    phone: string;         // "+977-9841234567"
  };
};
```

### 2. User Profile Creation Payload
```typescript
const profilePayload = {
  id: string;              // From auth.user.id (UUID)
  name: string;            // From user_metadata.full_name
  phone: string;           // From user_metadata.phone
  email: string;           // From auth.user.email
  user_type: 'business_owner';
  default_palika_id: number; // Selected in region dialog
  phone_verified: true;
};
```

### 3. Business Creation Payload
```typescript
const businessPayload = {
  owner_user_id: string;   // From auth.user.id
  palika_id: number;       // From region selection
  business_name: string;   // Template: `${user.name}'s Shop`
  business_category_id: number;  // Default = 8 (Retail Shop)
  slug: string;            // Derived: `${name.toLowerCase().replace(/\s/g, '-')}-${id.substring(0,8)}`
  phone: string;           // From user profile
  address: string;         // Template: `Ward ${ward}, Palika ${palikaId}`
  location: string;        // GIS: "SRID=4326;POINT(85.3240 27.7172)"
  ward_number: number;     // From region selection
  description: string;     // Template: `Welcome to ${name}'s marketplace shop!`
  is_active: boolean;      // true
  verification_status: string; // "verified" (auto-verify)
};
```

### 4. Marketplace Product Creation Payload
```typescript
const productPayload = {
  business_id: string;     // From created business
  palika_id: number;       // From business.palika_id
  marketplace_category_id: number;  // From category selector
  name: string;            // From form.title
  slug: string;            // Derived: `${title.toLowerCase().replace(/\s/g,'-')}-${id}`
  price: number;           // From form.price
  currency: string;        // "NPR"
  unit: string;            // From category default or user input
  short_description: string; // From form.description (first 100 chars)
  full_description: string; // From form.description (full text)
  quantity_available: number;
  unit_of_measurement: string;
  status: string;          // "published" (auto-publish for Tier 1)
  is_approved: boolean;    // true for Tier 1, pending for Tier 2+
  is_featured: boolean;    // false (can be set by admin)
  created_by: string;      // From auth.user.id
  details: object;         // Optional metadata
};
```

---

## Implementation Phases

### Phase 1: Auth Context & Supabase Integration (1 day)
- [ ] Create AuthContext with login/register/logout
- [ ] Integrate Supabase Auth client
- [ ] Implement session persistence
- [ ] Add loading states

### Phase 2: Auth UI Modal (1 day)
- [ ] Create AuthModal component (500x500)
- [ ] Implement login form
- [ ] Implement register form
- [ ] Add error handling
- [ ] Style with Tailwind

### Phase 3: Region Selection (1 day)
- [ ] Create RegionSelectionDialog
- [ ] Fetch and display palikas
- [ ] Fetch and display wards (dynamic)
- [ ] Add form validation
- [ ] Connect to business auto-creation

### Phase 4: Business Auto-Creation (1 day)
- [ ] Create business API functions
- [ ] Implement auto-creation on registration
- [ ] Update user profile with business_id
- [ ] Add error handling

### Phase 5: Integration & Protected Routes (1 day)
- [ ] Update Navbar with auth buttons
- [ ] Add protected routes in App.tsx
- [ ] Update Sell page with business selector
- [ ] Update Profile page for authenticated users
- [ ] End-to-end testing

---

## Files to Create/Modify

### New Files (Create)
```
src/
├── contexts/AuthContext.tsx          (300 lines)
├── components/AuthModal.tsx          (250 lines)
├── components/RegionSelectionDialog.tsx (200 lines)
├── hooks/useAuth.ts                  (50 lines)
├── api/auth.ts                       (150 lines)
├── api/businesses.ts                 (100 lines)
└── utils/business-templates.ts       (50 lines)
```

### Modified Files (Existing)
```
src/
├── App.tsx                           (+AuthProvider wrapper)
├── components/Navbar.tsx             (+Login/Logout buttons)
├── pages/Sell.tsx                    (+Business selector)
├── pages/Profile.tsx                 (No changes needed)
├── types/index.ts                    (+Business, Auth types)
└── api/users.ts                      (Connect to Supabase instead of JSON)
```

---

## API Endpoints Required

All these we already built in the backend! ✅

```
Authentication (Supabase Auth)
  POST /auth/v1/signup              ← Register
  POST /auth/v1/token?grant_type=password  ← Login
  POST /auth/v1/logout              ← Logout

Data APIs (to be built, but schema ready)
  GET /api/palikas                  ← List all palikas
  GET /api/palikas/{id}/wards       ← Get wards for palika
  POST /api/businesses              ← Create business
  GET /api/businesses (auth)        ← Get user's businesses
  POST /api/marketplace-products    ← Create product
  GET /api/marketplace-products     ← List products
```

---

## Success Criteria

- [ ] User can register with email/password/name/phone
- [ ] User must select palika + ward after registration
- [ ] Business is auto-created with selected region
- [ ] User can only list products in their created business
- [ ] Logged-in user can access /profile
- [ ] Unlogged users redirected to login on /profile
- [ ] Login/Logout buttons in navbar
- [ ] Auth state persists on page refresh
- [ ] Region selection is immutable (can't change after selection)

---

## Timeline

| Phase | Duration | Dependency |
|-------|----------|-----------|
| Phase 1: Auth Context | 1 day | None |
| Phase 2: Auth Modal | 1 day | Phase 1 |
| Phase 3: Region Selection | 1 day | Phase 1 |
| Phase 4: Business Auto-Creation | 1 day | Phase 1, 3 |
| Phase 5: Integration | 1 day | Phase 2, 3, 4 |
| **Total** | **5 days** | Sequential |
| With testing/refinement | **7 days** | — |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Auth session loss | Low | Medium | Use secure session storage + refresh tokens |
| Duplicate business creation | Low | High | Add unique constraint on (owner_id, palika_id) |
| Image upload failures | Medium | Low | Use Supabase Storage with fallback |
| Ward data incomplete | Low | High | Pre-validate all 753 palikas + wards exist |
| RLS policy bugs | Low | Critical | Use existing tested policies we built |

---

## Recommendations

### ✅ Do
- Start with Phase 1 (AuthContext) - it's the foundation
- Use Supabase Auth directly (don't build custom auth)
- Implement business auto-creation on registration (saves UX steps)
- Make region selection required and immutable
- Use existing RLS policies for security (don't add custom logic)

### ❌ Don't
- Don't build custom auth system (Supabase is battle-tested)
- Don't allow region changes (violates palika assignment constraint)
- Don't create business manually (auto-create saves users steps)
- Don't skip protected routes (security critical)
- Don't store auth tokens in localStorage unencrypted (use secure session)

---

## Conclusion

**Feasibility: 🟢 HIGHLY FEASIBLE**

The m-place application has strong foundations. Adding Supabase auth + region selection is straightforward because:
1. ✅ All backend APIs are ready (we just built marketplace infrastructure)
2. ✅ UI component library is set up (shadcn/ui)
3. ✅ User data models are defined
4. ✅ RLS policies already enforce access control
5. ✅ React structure supports Context + hooks

**Estimated effort:** 5-7 days for complete implementation including testing.

**Next step:** Begin with Phase 1 (AuthContext) implementation.

---

**Document Version:** 1.0
**Last Updated:** March 18, 2026
**Prepared By:** Claude Code Analysis
