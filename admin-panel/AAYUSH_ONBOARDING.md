# Notification Module UI Enhancement — Handover Document for Aayush

Welcome! This document provides everything you need to continue the notification module UI enhancements for the Nepal Digital Tourism Admin Panel.

## Executive Summary

The **notification system** allows palikas (municipal bodies) to send targeted announcements to users and businesses. The backend, service layer, and API routes are **complete**. Your task is to **enhance the UI** for the notification composer and dashboard with polish, responsiveness, and user experience improvements.

**Status**: ✅ Architecture complete, 🔄 UI polish pending  
**Tech Stack**: Next.js 13+ (App Router), React hooks, inline styles, TypeScript  
**No Supabase Required**: Uses fake datasource with mock data (set via `NEXT_PUBLIC_USE_FAKE_DATASOURCES=true`)

---

## Project Structure

### Admin Panel Root
```
admin-panel/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (backend)
│   │   ├── notifications-v2/     # Notification endpoints
│   │   │   └── route.ts          # GET (list/stats), POST (send)
│   │   └── business-targeting/   # Business filtering endpoints
│   │       ├── route.ts          # GET query businesses
│   │       ├── filter-options/route.ts
│   │       ├── stats/route.ts
│   │       └── users/route.ts    # GET users for selected businesses
│   │
│   └── notifications/            # Notification UI pages
│       ├── page.tsx              # Dashboard (list sent notifications)
│       └── compose/
│           └── page.tsx          # Composer (create & send)
│
├── components/                   # React components
│   ├── BusinessTargetingSelector.tsx  # Modal: select businesses
│   └── AdminLayout.tsx           # Navigation layout
│
├── lib/                          # Utilities & datasources
│   ├── notification-datasource.ts      # INotificationDatasource interface
│   ├── notification-config.ts          # DI factory & singleton
│   ├── fake-notification-datasource.ts # Mock implementation
│   ├── supabase-notification-datasource.ts # Real Supabase
│   │
│   ├── business-targeting-datasource.ts      # IBusiness...interface
│   ├── business-targeting-config.ts          # DI factory
│   ├── fake-business-targeting.ts            # Mock implementation
│   ├── supabase-business-targeting-datasource.ts # Real Supabase
│   │
│   ├── notification-use-cases.ts      # 15 governance categories, templates
│   ├── fake-business-targeting.ts     # Mock business data
│   │
│   └── supabase.ts                    # Supabase client
│
├── services/                    # Service layer (business logic)
│   ├── notification.service.ts        # NotificationService + DTOs
│   └── business-targeting.service.ts  # BusinessTargetingService + DTOs
│
├── .env.local                   # Environment (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)
├── .env.example                 # Template
│
└── public/                      # Static assets
```

---

## Key Files for UI Enhancement

### 1. Notification Composer
**Path**: `app/notifications/compose/page.tsx` (764 lines)

**Current State**:
- ✅ Type selector (General Broadcast / Personal)
- ✅ 15 governance categories with bilingual labels
- ✅ Priority selector (4 levels)
- ✅ Quick templates (pre-filled forms)
- ✅ Title, body, full content, image, attachments
- ✅ User targeting (for personal)
- ✅ Business targeting selector (modal integration)
- ✅ Live preview panel
- 🔄 **Needs UI Polish**:
  - Responsive design (mobile)
  - Better spacing/padding
  - Loading states
  - Error handling UI
  - Accessibility (labels, ARIA)
  - Dark mode support

**Key Components**:
- `TypeButton` (sub-component)
- Form sections: type, category, priority, templates, content, targeting, attachments
- Preview panel (right side, sticky on desktop)
- Actions: Send, Preview, Cancel

**Main Hook State**:
```javascript
const [notificationType, setNotificationType] = useState<'general' | 'personal'>('general')
const [category, setCategory] = useState('announcement')
const [priority, setPriority] = useState<NotificationPriority>('normal')
const [title, setTitle] = useState('')
const [body, setBody] = useState('')
const [bodyFull, setBodyFull] = useState('')
const [imageUrl, setImageUrl] = useState('')
const [attachments, setAttachments] = useState<AttachmentInput[]>([])
const [targetUsers, setTargetUsers] = useState<{ id: string; label: string }[]>([])
const [targetBusinessIds, setTargetBusinessIds] = useState<string[]>([])
```

### 2. Notification Dashboard
**Path**: `app/notifications/page.tsx` (325 lines)

**Current State**:
- ✅ Stats cards (Total, Broadcasts, Personal, Last 7 Days)
- ✅ Filters (Type, Category)
- ✅ Paginated table showing sent notifications
- ✅ Category badges with colors
- 🔄 **Needs UI Polish**:
  - Responsive table
  - Better empty state
  - Sorting options
  - Bulk operations (select/delete)
  - Detail view/drill-down
  - Export/download

**Main Hook State**:
```javascript
const [notifications, setNotifications] = useState<SentNotificationSummary[]>([])
const [stats, setStats] = useState<NotificationStats | null>(null)
const [typeFilter, setTypeFilter] = useState<'general' | 'personal' | ''>('')
const [categoryFilter, setCategoryFilter] = useState('')
const [page, setPage] = useState(1)
```

### 3. Business Targeting Selector
**Path**: `components/BusinessTargetingSelector.tsx` (734 lines)

**Current State**:
- ✅ Modal overlay with fixed positioning
- ✅ Simple mode: ward, business type, rating, product count filters
- ✅ Advanced mode: JSON query builder
- ✅ Real-time result filtering
- ✅ Pagination
- ✅ Select all / clear all
- ✅ Stat badges
- 🔄 **Needs UI Polish**:
  - Better loading states
  - Skeleton loaders
  - No results message
  - Filter reset button
  - Search highlighting

**Props**:
```typescript
interface BusinessTargetingSelectorProps {
  palikaId: number
  onSelectBusinesses: (selectedIds: string[]) => void
  mode?: 'simple' | 'advanced'
}
```

---

## Mock Data & Fake Datasources

### Fake Notification Datasource
**Path**: `lib/fake-notification-datasource.ts`

**Mock Data**:
- 5 mock users: Ramesh Kumar, Anita Sharma, Pradeep Poudel, Rita Tamang, Suman Rai
- 4 sample sent notifications (mixed general & personal)
- Stats: totalSent, categoryBreakdown, recentCount

**Usage**: Automatically used when `NEXT_PUBLIC_USE_FAKE_DATASOURCES=true`

### Fake Business Targeting Datasource
**Path**: `lib/fake-business-targeting.ts`

**Mock Data**:
- 8 businesses: 2 Hotels, 2 Restaurants, 1 Tour Operator, 1 Cafe, 2 Shops
- 3 wards with various ratings & product counts
- Business users (owners/staff for each business)
- Category: Hotel, Restaurant, Shop, Cafe, Tour Operator

**Example Business**:
```javascript
{
  id: 'b1',
  business_name: 'Himalayan Guest House',
  business_name_ne: 'हिमालयन गेस्ट हाउस',
  ward_number: 1,
  rating_average: 4.5,
  rating_count: 120,
  product_count: 3,
  view_count: 850
}
```

---

## API Endpoints

### Notification Endpoints

**POST /api/notifications-v2** — Send notification
```javascript
// Request body
{
  compose: {
    notification_type: 'general' | 'personal',
    category: string,
    title: string,
    body: string,
    body_full?: string,
    image_url?: string,
    palika_id: number,
    target_user_ids?: string[],  // For personal
    target_business_ids?: string[] // Optional
  },
  attachments?: AttachmentInput[]
}

// Response
{
  message: string,
  notificationId: string,
  recipientCount: number
}
```

**GET /api/notifications-v2** — List notifications
```javascript
// Query params
?palika_id=1&type=general&category=announcement&page=1&pageSize=20&stats=true

// Response
{
  data: SentNotificationSummary[],
  total: number,
  page: number,
  pageSize: number
}
```

### Business Targeting Endpoints

**GET /api/business-targeting** — Query businesses
```javascript
// Query params
?palika_id=1&wards=1,2&business_types=1&min_rating=3.5&min_product_count=2&page=1&pageSize=20

// Response
{
  data: BusinessResult[],
  total: number,
  page: number,
  pageSize: number,
  hasMore: boolean
}
```

**GET /api/business-targeting/filter-options** — Get filter dropdowns
```javascript
// Query params
?palika_id=1

// Response
{
  wards: [1, 2, 3],
  businessTypes: [{ id, name, name_ne }, ...],
  ratingRange: { min, max }
}
```

**GET /api/business-targeting/stats** — Get statistics
```javascript
// Query params
?palika_id=1

// Response
{
  totalBusinesses: number,
  activeBusinesses: number,
  publishedBusinesses: number,
  avgRating: number,
  totalProducts: number
}
```

**GET /api/business-targeting/users** — Get users for businesses
```javascript
// Query params
?business_ids=b1,b2,b3

// Response
{
  data: [{ id: string, name: string }, ...]
}
```

---

## UI Styling Approach

The project uses **inline styles with React.CSSProperties**. No Tailwind or CSS modules.

### Color Palette
```javascript
// Primary
#3b82f6    // Blue
#1e293b    // Dark slate
#94a3b8    // Light slate

// Status
#10b981    // Green (success)
#ef4444    // Red (error)
#f59e0b    // Amber (warning)
#8b5cf6    // Purple (secondary)

// Backgrounds
#f8fafc    // Very light
#fff       // White
```

### Common Styles
```javascript
// Cards
borderRadius: '8px' | '12px'
border: '1px solid #e2e8f0'
backgroundColor: '#fff'
padding: '16px' | '20px'

// Buttons
padding: '8px 12px' | '8px 16px'
borderRadius: '6px'
fontSize: '13px' | '14px'
fontWeight: 500 | 600

// Input fields
padding: '8px 12px'
border: '1px solid #e2e8f0'
borderRadius: '6px'
```

---

## Running the Project

### Prerequisites
```bash
Node.js 18+ (recommended 20)
npm or yarn
```

### Setup (First Time)
```bash
cd admin-panel

# Install dependencies
npm install

# Env is already set to use fake datasource
# .env.local has NEXT_PUBLIC_USE_FAKE_DATASOURCES=true
```

### Run Development Server
```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Access Notification Pages
- **Dashboard**: http://localhost:3000/notifications
- **Composer**: http://localhost:3000/notifications/compose
- **Business Selector Modal**: Click "Select target businesses..." on composer

### No Supabase Required
✅ The fake datasource automatically provides:
- Mock users for notification targeting
- Mock businesses with filters
- Mock sent notifications for dashboard
- Mock statistics

No authentication, no RLS, no network calls to Supabase.

---

## Key Architectural Patterns

### 1. Dependency Injection (DI)
**Pattern**: Services accept optional datasource, fallback to config-based DI

**File**: `lib/notification-config.ts`

```javascript
// Service reads env variable and instantiates appropriate datasource
const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
if (useFake) return new FakeNotificationDatasource()
return new SupabaseNotificationDatasource()
```

**Why**: Allows seamless switching between mock and real data without code changes.

### 2. Query Builder Pattern
**File**: `services/business-targeting.service.ts:85-166`

Conditionally chains Supabase filters:
```javascript
class BusinessQueryBuilder {
  apply() {
    this.applyLocationFilter()      // Ward filter
    this.applyBusinessTypeFilter()  // Category filter
    this.applyEngagementFilter()    // Rating, views
    this.applyOperationsFilter()    // Active, 24/7
    this.applyProductFilter()       // Product count (post-query)
    this.applyStatusFilter()        // Status, verification
    this.applySearchFilter()        // Full-text
    return this.query
  }
}
```

### 3. Service Layer + DTOs
**Pattern**: Separate business logic from API routes

**Service**: Handles validation, data transformation, error handling
**DTO**: Typed contracts between API and frontend

```typescript
// Incoming DTO
interface NotificationCompose {
  notification_type: 'general' | 'personal'
  category: string
  title: string
  body: string
  // ...
}

// Service method
async sendNotification(compose: NotificationCompose): Promise<{
  success: boolean
  notificationId?: string
  recipientCount?: number
  message?: string
}>
```

---

## Notification Categories (15 Total)

**File**: `lib/notification-use-cases.ts`

All are bilingual (English + Nepali) with default priorities and colors:

1. **Disaster & Emergency** — विपद् तथा आपतकालीन — Critical
2. **Government Notice** — सरकारी सूचना / विज्ञप्ति — Normal
3. **Revenue & Finance** — राजस्व तथा आर्थिक — Normal
4. **Vital Registration** — व्यक्तिगत घटना दर्ता — Normal
5. **Procurement & Tenders** — खरिद तथा बोलपत्र — Normal
6. **Development & Planning** — विकास तथा योजना — Normal
7. **Social Security & Welfare** — सामाजिक सुरक्षा — Important
8. **Health** — स्वास्थ्य — Important
9. **Events & Festivals** — चाडपर्व तथा कार्यक्रम — Informational
10. **Heritage Sites** — सम्पदा स्थल — Informational
11. **Business & Marketplace** — व्यवसाय तथा बजार — Normal
12. **Education** — शिक्षा — Normal
13. **Land & Infrastructure** — भूमि तथा पूर्वाधार — Normal
14. **System & App Updates** — प्रणाली अपडेट — Informational
15. **Greetings & Wishes** — शुभकामना / बधाई — Informational

Each category has:
- `value`: Unique identifier
- `label_en`, `label_ne`: Bilingual labels
- `description_en`, `description_ne`: Use case examples
- `default_priority`: Low/Normal/Important/Critical
- `default_type`: 'general' or 'personal'
- `color`: { bg, text } for badges

---

## TypeScript Interfaces (Key DTOs)

### Notification
```typescript
type NotificationType = 'general' | 'personal'

interface NotificationCompose {
  notification_type: NotificationType
  category: string
  title: string
  body: string
  body_full?: string
  image_url?: string
  palika_id: number
  target_user_ids?: string[]
  target_business_ids?: string[]
}

interface SentNotificationSummary {
  title: string
  body: string
  notification_type: NotificationType
  category: string
  image_url?: string
  created_at: string
  recipient_count: number
  target_user_id?: string
  sample_notification_id: string
}

interface NotificationStats {
  totalSent: number
  generalCount: number
  personalCount: number
  categoryBreakdown: Record<string, number>
  recentCount: number
}
```

### Business Targeting
```typescript
interface BusinessResult {
  id: string
  business_name: string
  business_name_ne: string
  ward_number: number
  rating_average: number
  rating_count: number
  product_count: number
  view_count: number
}

interface BusinessTargetingStats {
  totalBusinesses: number
  activeBusinesses: number
  publishedBusinesses: number
  avgRating: number
  totalProducts: number
}
```

---

## Common Tasks & Quick Starts

### 1. Add Loading State to Compose Form
**File**: `app/notifications/compose/page.tsx`

Add to state:
```javascript
const [isSending, setIsSending] = useState(false)
```

Show during submission:
```javascript
{isSending && <div>Sending...</div>}
```

### 2. Enhance Modal with Skeleton Loader
**File**: `components/BusinessTargetingSelector.tsx`

When `isLoading`:
```javascript
{isLoading ? <SkeletonLoader /> : <ResultsTable />}
```

### 3. Add Notification Detail View
Create new page: `app/notifications/[id]/page.tsx`

Fetch: `await notificationService.getNotificationDetail(id)`

### 4. Add Responsive Design
Use CSS media queries or conditional rendering:
```javascript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

// Or use CSS Media Query object
const responsiveStyle = {
  display: isMobile ? 'flex' : 'grid',
  padding: isMobile ? '12px' : '24px',
}
```

### 5. Add Error Boundaries
Wrap components:
```javascript
<ErrorBoundary fallback={<ErrorMessage />}>
  <NotificationComposer />
</ErrorBoundary>
```

---

## Testing the Full Flow

1. **Go to Composer**: http://localhost:3000/notifications/compose
2. **Select Notification Type**: General Broadcast
3. **Pick Category**: "Business & Marketplace"
4. **Fill Content**: Title + Body
5. **Click "Target Businesses"**: Modal opens with 8 mock businesses
6. **Select Ward**: Filters to businesses in that ward
7. **Select Business Type**: E.g., "Hotel" (filters further)
8. **Select Rating**: E.g., min 4.0 stars
9. **Check a Business**: E.g., "Himalayan Guest House"
10. **Watch**: User list updates automatically with business staff
11. **Send**: Notification created with those targets

---

## Environment Configuration

### Current Setup
**File**: `.env.local`

```bash
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true  # ← Currently enabled
```

### To Switch to Real Supabase
Set to `false` and ensure Supabase server is running:
```bash
NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For development, **keep fake datasource enabled**.

---

## Contact & Questions

- **Architecture Docs**: See `./CLEAN_ARCHITECTURE.md`
- **Project Roadmap**: See `./README.md` (root)
- **Backend Status**: Service layer + API routes complete ✅
- **Your Focus**: UI polish, responsiveness, UX enhancements 🎨

---

## Checklist: Before You Start

- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000/notifications loads
- [ ] http://localhost:3000/notifications/compose loads
- [ ] Business selector modal opens and shows 8 businesses
- [ ] Filtering (ward, type, rating) works in real-time
- [ ] Selecting businesses auto-adds users to target list
- [ ] No console errors

---

## Next Steps

1. **Responsive Design**: Make composer/dashboard work on mobile
2. **Loading States**: Add spinners, skeleton loaders
3. **Error Handling**: Better error messages, retry logic
4. **Accessibility**: ARIA labels, keyboard navigation, color contrast
5. **Polish**: Better spacing, subtle animations, dark mode
6. **Empty States**: "No notifications sent yet" messaging
7. **Notifications**: Toast/snackbar for success/error feedback

Good luck! 🚀
