# Phase 7 Roadmap: Tourism Content in M-Place
**Date:** 2026-03-29
**Status:** Active
**Decision:** Defer Phase 6 (approval workflows), prioritize Phase 7 (tourism content)
**Future:** Dedicated session on tier-gating standardization

---

## 🔄 PHASE REPRIORITIZATION

### CURRENT (Merged to main)
```
✅ Phase 1-5: COMPLETE
  ├─ Database (34 migrations)
  ├─ Platform Admin Panel (user management)
  ├─ Setup automation
  └─ M-place marketplace (products + businesses)
```

### PHASE 6: DEFER (Address after Phase 7)
**Original:** Admin Panel Analytics & Product Approval Workflows
```
❌ DEFERRING TO LATER:
├─ Approval workflows in admin-panel
├─ Analytics dashboard in admin-panel
├─ Product status management
└─ Tier-based feature gating
```

### PHASE 7: PRIORITIZE (Next - Add Tourism Content to M-Place)
**New:** Extend M-Place with Tourism Content Types
```
🔵 NEXT:
├─ Heritage sites & attractions in m-place
├─ Festivals & events calendar in m-place
├─ Blog & storytelling content in m-place
├─ Local services directory (accommodations, restaurants, guides)
├─ SOS emergency information
└─ All PUBLIC - NO LOGIN NEEDED TO BROWSE
```

### PHASE 8+: FUTURE
```
⏳ LATER:
├─ Advanced analytics
├─ Emergency response systems
└─ Advanced approval workflows
```

---

## 🎯 PHASE 7 IMPLEMENTATION APPROACH

### Step 1: Reference Admin-Panel API Calls
```
Check admin-panel to see:
├─ What API calls fetch events/festivals for a palika
├─ What API calls fetch blog content for a palika
├─ What data structure is returned from Supabase
├─ What RLS policies protect this data
└─ This tells us EXACTLY what we can fetch in m-place
```

### Step 2: Implement in M-Place Using Clean Architecture
```
m-place has clean architecture:
├─ Data layer: Datasources (mock + real Supabase)
├─ Repository layer: Contracts & data fetching
├─ Service layer: Business logic
├─ API layer: Endpoints
└─ Presentation layer: React components

Implementation pattern:
1. Define DTO (data transfer objects) for each content type
2. Create repository methods to fetch from Supabase
3. Create datasources (mock for testing, real for Supabase)
4. Build API endpoints that use repositories
5. Build React pages using API layer
6. All testable, structured, maintainable
```

### Step 3: Tier-Gating (Mark for Future Standardization)
```
DO NOT IMPLEMENT YET.

When we tackle tier-gating, these decisions need standardization:
├─ Where is tier logic enforced? (DB or Frontend?)
├─ Where is it stored? (RLS policies? Feature flags?)
├─ How do tiers affect categories? (Bundle A/B features)
├─ How do tiers affect approval flows? (Workflow on/off)
├─ Example decision needed:
│  └─ "If approval_workflow = OFF, product status = 'approved'"
│     ├─ Should this be in: Database trigger? App logic? RLS?
│     └─ How do we standardize this pattern?
└─ FUTURE SESSION TOPIC
```

---

## 📋 PHASE 7 CONTENT TYPES TO ADD

### 1. Heritage Sites & Attractions
```
Data from: Supabase heritage_sites table (already exists)
Access: Public read (already has RLS)
In M-Place:
├─ Browse all heritage sites in a palika
├─ View details (description, images, location, QR code)
├─ See on map
└─ Read stories/blog posts about them
```

### 2. Festivals & Events Calendar
```
Data from: Supabase events table (already exists)
Access: Public read (already has RLS)
In M-Place:
├─ Browse events calendar for a palika
├─ Filter by date/type
├─ View event details
├─ See photos & videos
└─ Add to phone calendar
```

### 3. Blog & Storytelling
```
Data from: Supabase blog_posts table (already exists)
Access: Public read (already has RLS)
In M-Place:
├─ Browse blog articles
├─ Filter by category/date
├─ Read stories about palika
├─ See photos & multimedia
└─ Related content suggestions
```

### 4. Local Services Directory
```
Data from: Supabase businesses table (already exists)
Access: Public read (already has RLS)
In M-Place:
├─ Hotels & accommodations
├─ Restaurants & cafes
├─ Tour guides & services
├─ Transportation services
└─ Search by type/rating
```

### 5. SOS Emergency Information
```
Data from: Supabase sos_requests table (already exists)
Access: Palika admins populate, public reads alerts
In M-Place:
├─ Emergency contact information
├─ Emergency procedures
├─ Active alerts/notices
└─ Safe locations during disasters
```

---

## 🛠️ TECHNICAL APPROACH

### For Each Content Type:
```
1. READ admin-panel code to see existing API patterns
2. COPY the pattern (API calls, data fetching, RLS)
3. IMPLEMENT in m-place:
   ├─ Create DTO (if needed)
   ├─ Create datasource method
   ├─ Create repository method
   ├─ Create API endpoint (via src/api/)
   ├─ Create React page/component
   └─ Add to routing
4. TEST with mock datasource
5. VERIFY with real Supabase
```

### Why This Works:
```
✅ Admin-panel already solved "how to fetch from Supabase"
✅ M-place clean architecture makes it easy to add new types
✅ We don't reinvent, we reuse patterns
✅ Fully testable before touching UI
✅ Tier-gating can be added later without refactoring
```

---

## 📝 IMPLEMENTATION CHECKLIST

```
Phase 7: Tourism Content in M-Place

□ Step 1: Analyze admin-panel API calls
  ├─ [ ] Find events/festivals API
  ├─ [ ] Find blog API
  ├─ [ ] Find heritage sites API
  ├─ [ ] Find services/accommodations API
  └─ [ ] Document data structures returned

□ Step 2: Implement Heritage Sites
  ├─ [ ] Create DTO for heritage site
  ├─ [ ] Create repository method
  ├─ [ ] Create API endpoint
  ├─ [ ] Create React page
  └─ [ ] Test with mock + real data

□ Step 3: Implement Festivals & Events
  ├─ [ ] Create DTO
  ├─ [ ] Create repository method
  ├─ [ ] Create API endpoint
  ├─ [ ] Create calendar component
  └─ [ ] Test

□ Step 4: Implement Blog & Stories
  ├─ [ ] Create DTO
  ├─ [ ] Create repository method
  ├─ [ ] Create API endpoint
  ├─ [ ] Create blog list page
  └─ [ ] Test

□ Step 5: Implement Local Services Directory
  ├─ [ ] Create DTO (or reuse business)
  ├─ [ ] Filter businesses by service type
  ├─ [ ] Create API endpoint
  ├─ [ ] Create services page
  └─ [ ] Test

□ Step 6: Implement SOS Emergency Info
  ├─ [ ] Create DTO
  ├─ [ ] Create repository method
  ├─ [ ] Create API endpoint
  ├─ [ ] Create emergency info page
  └─ [ ] Test

□ Step 7: Integration
  ├─ [ ] Add pages to m-place navigation
  ├─ [ ] Add filters/search
  ├─ [ ] Add multi-language support
  ├─ [ ] Test without login
  └─ [ ] Verify RLS policies work
```

---

## 🔮 FUTURE SESSION: TIER-GATING STANDARDIZATION

**Topic:** How to standardize tier-based feature gating across the platform

**Questions to Answer:**
```
1. Where does tier logic live?
   ├─ Database (RLS policies)
   ├─ Frontend (feature flags)
   ├─ API layer (conditional endpoints)
   └─ All of above? (How to coordinate?)

2. How do we handle conditional defaults?
   Example: "If approval_workflow = OFF, then product_status = 'approved'"
   ├─ Database trigger? (BEFORE INSERT rule)
   ├─ API logic? (Set status in code)
   ├─ RLS policy? (Enforce at query level)
   └─ Which is "right" and why?

3. What gets tier-gated?
   ├─ m-place categories (which products Bundle A vs B can show)
   ├─ Approval workflows (on/off per tier)
   ├─ Features in admin-panel (what admins can manage)
   ├─ Content types (who can create what)
   └─ Discovery options (who can search/filter what)

4. How do we document the pattern?
   ├─ Create a tier-gating architecture document
   ├─ Show examples for each content type
   ├─ Provide decision tree for tier decisions
   └─ Make it reusable for future features

5. Implementation approach:
   ├─ Centralized tier definition (database table?)
   ├─ Feature flag system (how?)
   ├─ RLS policy templates
   ├─ Frontend permission checks
   └─ Testing strategy
```

---

## 📌 SUMMARY

```
PHASE 7 FOCUS:
Make m-place the complete public tourism/citizen portal by adding:
✅ Heritage sites, events, festivals, blogs, services, SOS info
✅ All PUBLIC - no login needed to browse
✅ All data-driven from Supabase (reference admin-panel patterns)
✅ Clean architecture implementation (reusable, testable)

PHASE 6 DEFER:
Leave approval workflows & analytics in admin-panel for later

FUTURE SESSION:
Standardize tier-gating logic across the platform
```

---

## 🚀 NEXT STEPS

1. Review admin-panel API calls for events, festivals, blogs
2. Document the data patterns returned from Supabase
3. Begin Phase 7 implementation with heritage sites (simplest)
4. Progress through remaining content types
5. Schedule future session on tier-gating standardization
