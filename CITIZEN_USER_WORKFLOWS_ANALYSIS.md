# Citizen & Local User Workflows Analysis
## Understanding the User Journey from Registration to Visibility

**Status:** Phase 3 Planning - User Journey Validation
**Date:** 2026-03-01
**Context:** Now that backend infrastructure is validated (216 tests passing), we analyze what user-facing workflows are needed.

---

## Executive Summary

The documents comprehensively describe how **local citizens, villagers, and business owners** interact with the platform:

1. **Local Business Registration** (homestays, producers, artisans)
2. **Citizen Service Discovery** (emergency services, local marketplace)
3. **Content Creator Workflows** (Palika admin reviewing and approving)
4. **Tourist Discovery Journeys** (QR codes, maps, heritage sites)
5. **SOS Emergency Workflows** (mobile app)

This analysis maps **what exists in documentation** → **what's implemented in database** → **what needs to be built in UI/frontend**.

---

## Section 1: LOCAL BUSINESS REGISTRATION WORKFLOW

### The Flow (From Documents)

```
DEVI'S JOURNEY (Homestay Owner)
================================

Week 1: Learning & Preparation
─────────────────────────────
Day 1:  Hears about platform at Palika town meeting
Day 2:  Contacts Palika tourism office
        "Can I list my homestay?"
Day 3-5: Gathers information with Palika tourism officer's help
        ✓ Photos (10-15 high-quality images)
        ✓ Business license copy
        ✓ Owner details (name, contact, ID)
        ✓ Facility description (rooms, amenities)
        ✓ Pricing per room
        ✓ Booking contact info

Week 2: Submission & Processing
──────────────────────────────
Day 8:  Submits information to Palika
        (Email, paper form, or USB drive)

Day 9:  Palika content creator receives
        - Reviews completeness
        - May contact Devi for clarification
        - May visit homestay to take additional photos

Day 10: Draft listing created in CMS
        - Name, description, photos, pricing
        - Status: DRAFT

Week 3: Approval & Publishing
─────────────────────────────
Day 15: Draft shown to Devi
        "Please review and approve"

Day 16: Devi reviews, approves

Day 17: Listing published
        Status: PUBLISHED
        Devi receives notification

Week 4: Visibility
────────────────
Devi's homestay now visible on:
- Kathmandu Metropolitan Palika portal
- Tourism website
- Mobile app
- Search results
- Map-based discovery
- QR code scannable

Result: First booking inquiry arrives via direct contact
```

---

## Section 2: WHAT THE SYSTEM PROVIDES TODAY

### Database-Level Support ✅

**Businesses Table** (`public.businesses`)
```sql
-- Already implemented and tested
✓ name (Devi's Homestay)
✓ category (Accommodation, Artisan, Producer, etc.)
✓ entity_type (homestay, producer, artisan, service)
✓ description (Full facility description)
✓ contact_phone, contact_email (Direct booking contact)
✓ location, coordinates (Map pinning)
✓ owner_info (JSONB: owner details)
✓ status (draft, pending_review, published, rejected, archived)
✓ images (JSONB array: photos)
✓ is_featured (Promotion support)
✓ palika_id (Kathmandu Metropolitan)
✓ created_at, updated_at (Timestamps)
✓ created_by, updated_by (Attribution)
```

**Verification/Approval Workflow** ✅
```sql
✓ Content approval workflow (draft→pending→published)
✓ Audit logging (who approved, when, what changed)
✓ Comments/feedback capability (via audit_log metadata)
✓ Multiple review rounds supported (status can go back to pending)
```

**Multi-role Support** ✅
```sql
✓ Business owner (read own listing)
✓ Content creator (create/edit draft)
✓ Reviewer/moderator (approve/reject)
✓ Palika admin (oversight)
✓ National admin (analytics)
✓ Public user (view published listings)
```

**RLS Permission Checks** ✅
```
✓ Business owner can see own unpublished business
✓ Content creator can edit in progress businesses
✓ Moderator can approve/reject
✓ Public can see published businesses
✓ Palika boundaries enforced (can't see other Palikas' businesses)
```

---

## Section 3: WHAT'S MISSING (UI/FRONTEND LAYER)

### For Local Business Owner (Devi)

❌ **Business Registration Form**
- No UI to submit business details
- No photo upload interface
- No owner information form
- Currently: Palika staff manually enters data

❌ **Business Profile Management**
- Can't view own listing
- Can't update information
- Can't upload new photos
- Can't manage bookings/inquiries

❌ **Notification System**
- No notification when listing approved
- No notification for new inquiries
- No update status tracker

### For Palika Staff (Content Creator)

⚠️ **Business Registration CMS** (Partially built)
- Basic heritage sites form exists
- Need to extend for business registration
- Need photo upload interface
- Need owner information form
- Need verification checklist

⚠️ **Review/Approval Dashboard**
- Heritage sites review exists
- Need to extend for businesses
- Need approval comments interface
- Need preview before publishing

### For Public Users

❌ **Business Directory**
- No UI to browse local marketplace
- No search/filter by category
- No map view of businesses
- No direct booking button

❌ **QR Code Display**
- No QR code generation for businesses
- No QR scanning for quick access
- No offline access to business info

---

## Section 4: OPERATION STEPS FOR MARKETPLACE REGISTRATION

### Current State (Admin-Driven)

```
STEP 1: Business Owner Outreach
└─ Palika tourism officer visits homestays
└─ Explains platform benefits
└─ Gathers commitment

STEP 2: Information Collection
└─ In-person or email information gathering
└─ Photos collected (from owner or tourism officer)
└─ Contact details, pricing, facilities documented
└─ Verification checklist completed

STEP 3: Palika Staff Data Entry
└─ Content creator logs into admin panel
└─ Creates DRAFT business listing
└─ Enters all information
└─ Uploads photos
└─ Status: DRAFT (not visible to public)

STEP 4: Business Owner Review
└─ Palika prints draft or shares via email
└─ Business owner reviews accuracy
└─ Owner provides approval or corrections

STEP 5: Publishing
└─ Content creator updates listing if needed
└─ Changes status from DRAFT to PUBLISHED
└─ Business owner notified (manually via phone/email)

STEP 6: Public Visibility
└─ Listing appears on:
   • Kathmandu Metropolitan Palika tourism website
   • Local marketplace directory
   • Mobile app business listings
   • Map-based discovery
   • Search results
└─ Tourists can find and contact directly
```

### What Should Exist (Self-Service + Verification)

```
OPTION A: SELF-SERVICE REGISTRATION
────────────────────────────────

STEP 1: Business Owner Registration
└─ Devi opens Palika portal
└─ Clicks "Register My Business"
└─ Creates account (email + password)
└─ Status: PENDING_OWNER_INFO

STEP 2: Information Submission
└─ Devi fills form:
   • Business name
   • Category (accommodation, producer, etc.)
   • Description
   • Photos (multi-file upload)
   • Contact details
   • Pricing/services
└─ Draft auto-saved as she enters
└─ Status: DRAFT

STEP 3: Palika Verification
└─ Palika tourism officer reviews dashboard
└─ Checks completeness
└─ May contact Devi for clarification
└─ Verifies information (phone call, visit, or documents)
└─ Status: PENDING_REVIEW

STEP 4: Approval
└─ Reviewer (content moderator) reviews
└─ May request changes
└─ Approves
└─ Status: PUBLISHED

STEP 5: Owner Notification
└─ Email: "Your business is now live!"
└─ SMS: Link to published listing
└─ In-app: Notification dashboard

STEP 6: Management
└─ Devi can view:
   • Published listing
   • View count/popularity
   • Inquiry messages
   • Update listing (photos, pricing)
└─ Changes require re-approval (minor updates auto-approved)


OPTION B: ADMIN-CREATED (Current State)
────────────────────────────────────

STEP 1-2: Information Collection (Same as above)

STEP 3: Palika Creates Listing
└─ Staff creates on behalf of owner
└─ Enters all information
└─ Status: DRAFT

STEP 4: Owner Review (Email/Print)
└─ Send draft for approval
└─ Owner responds with approval/corrections

STEP 5: Publishing
└─ Staff publishes
└─ Status: PUBLISHED

STEP 6: Management
└─ Owner can't self-manage (must contact Palika for updates)
└─ Less transparency for owner
```

---

## Section 5: VERIFICATION & APPROVAL FLOW

### Current Database Support

```
VERIFICATION WORKFLOW (Implemented in RLS/Schema)
═════════════════════════════════════════════════

1. SUBMISSION STATE
   ├─ Status: DRAFT
   ├─ Only creator + Palika admin can see
   ├─ Public: Hidden
   └─ Owner: Can view if self-service future

2. REVIEW STATE
   ├─ Status: PENDING_REVIEW
   ├─ Moderator dashboard shows it
   ├─ Reviewer can:
   │  ├─ Read content
   │  ├─ View photos
   │  ├─ Add comments (via audit_log)
   │  └─ Decision options:
   │     ├─ APPROVED → status changes to PUBLISHED
   │     ├─ REQUEST_CHANGES → status stays PENDING, comment added
   │     └─ REJECTED → status changes to REJECTED, reason documented
   └─ Public: Still hidden

3. PUBLISHED STATE
   ├─ Status: PUBLISHED
   ├─ Visible to:
   │  ├─ All authenticated Palika users
   │  ├─ All public users (web/mobile)
   │  └─ Searchable, discoverable
   └─ Owner notified

4. UPDATE FLOW
   ├─ Owner or creator requests update
   ├─ New version created (DRAFT status)
   ├─ Goes through review again (or auto-approved for minor changes)
   ├─ Changes published
   └─ Version history tracked in audit_log

5. REJECTION STATE
   ├─ Status: REJECTED
   ├─ Reason documented
   ├─ Owner notified
   ├─ Owner can revise and resubmit
   └─ Goes back through review
```

### What's Missing (UI Implementation)

❌ **Reviewer Dashboard**
```
Need to build:
├─ List of pending approvals
├─ Preview mode (shows as it will appear to public)
├─ Photo gallery viewer (verify quality/appropriateness)
├─ Comments/notes section
├─ Approval buttons (Approve / Request Changes / Reject)
├─ Metrics (time in review, queue length)
└─ Bulk actions (approve multiple, prioritize)
```

❌ **Owner Notification System**
```
Need to implement:
├─ Email when listing approved
├─ SMS notification option
├─ In-app notifications dashboard
├─ Update request notifications
├─ Inquiry/message notifications
└─ Preference settings (email/SMS/in-app)
```

❌ **Audit Trail Visibility**
```
Need for transparency:
├─ Who reviewed the listing
├─ When it was reviewed
├─ What changes were requested
├─ Full version history
├─ Reason for rejection (if any)
└─ Timeline view for owner to see progress
```

---

## Section 6: QR CODE SYSTEM

### What's Documented

```
QR CODE FOR BUSINESS LISTINGS
═════════════════════════════

Use Case: Tourist discovers Devi's homestay while walking in Thamel
│
└─ Sees poster at local café with QR code
   "Scan for homestay details & booking info"
│
├─ Scans QR code (camera app or QR scanner)
│
├─ Link opens:
│  https://kathmandu.palika.np/business/devi-homestay
│
├─ Mobile phone displays:
│  • Photos of homestay (gallery)
│  • Room descriptions
│  • Pricing per room/night
│  • Amenities checklist
│  • Reviews from previous guests
│  • Contact: Phone number, email, WhatsApp
│  • Location map with directions
│  • Booking button (phone/email/WhatsApp)
│
└─ Tourist books directly with Devi
   (No platform commission - direct income)

QR Code Benefits:
├─ Print-ready PNG files
├─ Can print and laminate for durability
├─ Place at:
│  ├─ Homestay entrance
│  ├─ Tourist information centers
│  ├─ Related heritage sites
│  ├─ Local restaurants
│  └─ Travel agency partner offices
│
└─ Offline capability:
   ├─ Tourist screenshots QR before trip
   ├─ Scans from phone gallery if no internet
   └─ Content loaded from cache
```

### Database Support for QR Codes

✅ **Implemented in Schema**
```sql
-- Businesses table already supports QR needs:
✓ unique ID (for QR encoding)
✓ slug (friendly URL: devi-homestay)
✓ images array (photos to display)
✓ contact_phone, contact_email
✓ location, coordinates (map integration)
✓ description, amenities
```

❌ **Missing: QR Code Generation UI**
```
Need to build:
├─ QR code generation from business ID
├─ Download as PNG button
├─ Print preview
├─ Size options (business card, poster, standard)
├─ Branding options (add Palika logo)
└─ Print-ready template with business info
```

---

## Section 7: SOS EMERGENCY SYSTEM

### What's Documented (Mobile App Spec)

```
CITIZEN EMERGENCY DISCOVERY WORKFLOW
═════════════════════════════════════

Scenario: Amrita's 8-year-old is sick at 10:30 PM
Problem: Nearest pharmacy/hospital?

UI FLOW:
────────
1. Open app (PWA on home screen)
2. See SOS button prominently (floating action button)
3. Press SOS button
4. Select emergency type:
   ├─ Medical Emergency (red)
   ├─ Fire (orange)
   ├─ Police/Crime (dark blue)
   ├─ Natural Disaster (yellow)
   └─ Other
5. Choose "Medical Emergency"
6. App shows options:
   ├─ EMERGENCY SERVICES NEARBY
   │  ├─ Hospital (850m away, "St. Xavier's Medical Center")
   │  │  ├─ Status: Open 24/7
   │  │  ├─ Phone: [call button] 01-4111111
   │  │  ├─ Distance: 850m
   │  │  ├─ Directions: [maps button]
   │  │  └─ Ambulance: Available
   │  │
   │  ├─ Pharmacy (200m away, "Night Owl Pharmacy")
   │  │  ├─ Status: Open 24/7
   │  │  ├─ Phone: [call button] 01-4222222
   │  │  ├─ Distance: 200m
   │  │  └─ Directions: [maps button]
   │  │
   │  └─ Ambulance Service
   │     ├─ Phone: [call button] 102
   │     ├─ Response time: 3-5 minutes
   │     └─ Send location: Yes/No
   │
   └─ HOTLINE NUMBERS (if no GPS)
      ├─ Ambulance: 102
      ├─ Police: 100
      └─ Fire: 101


OFFLINE CAPABILITY
──────────────────
✓ Hotline numbers cached offline
✓ Directions work with saved maps
✓ Emergency list works offline
✓ If offline: Shows cached locations
✓ When online: Fetches fresh data
```

### Database Support for SOS

✅ **Implemented: SOS Requests Table**
```sql
public.sos_requests (
  ✓ id (UUID)
  ✓ palika_id (geographic scope)
  ✓ emergency_type (medical, fire, police, disaster)
  ✓ priority (high, medium, low)
  ✓ status (pending, assigned, in_progress, resolved)
  ✓ description (what happened)
  ✓ location (coordinates)
  ✓ contact_phone
  ✓ created_at, resolved_at
  ✓ audit_log (who responded, when)
)
```

❌ **Missing: SOS Service Directory**
```
Need to implement:
├─ Hospital listings with:
│  ├─ 24/7 status
│  ├─ Ambulance availability
│  ├─ Specialty services
│  └─ Contact information
│
├─ Pharmacy listings with hours
├─ Police station locations
├─ Fire department locations
├─ Emergency hotline integration
└─ Real-time service status updates
```

❌ **Missing: SOS App Features**
```
Need to build:
├─ SOS button UI (floating action button)
├─ Emergency type selection
├─ Location sharing (GPS)
├─ Direct call buttons (102, 100, 101)
├─ Map integration for directions
├─ Status tracking (responder assigned, ETA)
└─ Offline mode for hotline numbers
```

---

## Section 8: MARKETPLACE DISCOVERY (Citizen/Tourist)

### What's Documented

```
BIKRAM'S JOURNEY: Finding Local Honey
═════════════════════════════════════

Bikram (32, local resident) wants to:
"Compare prices for local honey before harvest season"

DESKTOP FLOW:
─────────────
1. Opens Kathmandu Metropolitan Palika portal
2. Clicks "Local Marketplace"
3. Sees categories:
   ├─ Agricultural Products (honey, tea, oils)
   ├─ Handicrafts (pottery, textiles, wood)
   ├─ Artisans (painters, sculptors)
   └─ Services (repair, cleaning, tutoring)
4. Selects "Honey Producers"
5. Sees listing:
   ┌─────────────────────────────────┐
   │ Sharma Honey Farm               │
   │ ★★★★★ (15 reviews)              │
   │ Location: Budhanilkantha        │
   │ Distance: 2.5 km from Kathmandu │
   │                                 │
   │ [Gallery: 8 photos]             │
   │                                 │
   │ Products:                       │
   │ • Wild Flower Honey: Rs 800/kg  │
   │ • Acacia Honey: Rs 600/kg       │
   │ • Processed Honey: Rs 400/kg    │
   │                                 │
   │ Owner: Ramesh Sharma            │
   │ Phone: +977-9841234567          │
   │ Email: contact@sharmahoney.np   │
   │ WhatsApp: [Quick message]       │
   │ [Get Directions]                │
   │ [Write Review]                  │
   └─────────────────────────────────┘

6. Compares with other producers
7. Makes direct contact:
   ├─ Phone call
   ├─ WhatsApp message
   └─ Email inquiry

7. Arranges purchase:
   ├─ Direct transaction
   ├─ No platform commission
   ├─ Direct delivery or pickup
   └─ Payment direct to producer

MOBILE APP FLOW:
────────────────
1. Open Palika app
2. Tap "Local Marketplace" tab
3. Search "honey" or browse "Agriculture"
4. See results (filtered by distance if location enabled)
5. Tap producer
6. Photo carousel, description, contact options
7. Tap phone/WhatsApp to contact
```

### Database Support for Marketplace Discovery

✅ **Implemented: Businesses Table with Category/Search**
```sql
SELECT * FROM businesses
WHERE palika_id = 'kathmandu-metropolitan'
  AND status = 'published'
  AND (category = 'honey' OR entity_type = 'producer')
ORDER BY is_featured DESC, created_at DESC;
```

❌ **Missing: Marketplace UI Components**
```
Need to build:
├─ Category browsing interface
├─ Search functionality
├─ Filter options:
│  ├─ Distance from user
│  ├─ Rating/reviews
│  ├─ Price range
│  └─ Availability
├─ Product gallery with zooms
├─ Reviews/ratings display
├─ Direct contact buttons (phone, WhatsApp, email)
├─ Map view of producers
└─ Featured/promoted listings
```

---

## Section 9: IMPLEMENTATION STATUS MATRIX

| **Workflow Component** | **Database** | **Backend Logic** | **Admin UI** | **Public UI** | **Mobile App** |
|---|:---:|:---:|:---:|:---:|:---:|
| **Business Registration** | ✅ | ✅ | ⚠️ Partial | ❌ None | ❌ None |
| **Business Listing View** | ✅ | ✅ | ✅ | ❌ None | ❌ None |
| **Approval Workflow** | ✅ | ✅ | ⚠️ Partial | ❌ None | ❌ None |
| **Marketplace Discovery** | ✅ | ✅ | ✅ | ❌ None | ❌ None |
| **QR Code Generation** | ✅ | ⚠️ Partial | ❌ None | ❌ None | ❌ None |
| **SOS Service Directory** | ⚠️ Partial | ❌ None | ❌ None | ❌ None | ❌ None |
| **Emergency Hotlines** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Notifications** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Reviews/Ratings** | ✅ | ❌ None | ❌ None | ❌ None | ❌ None |
| **Payment Integration** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |

---

## Section 10: PHASE 3 PRIORITIES (User-Facing Workflows)

### Priority 1: Critical Path (Weeks 1-2)
```
Without these, platform has no value to citizens and businesses:

1. BUSINESS DIRECTORY UI (Public)
   └─ Browse/search marketplace
   └─ View producer details
   └─ Contact directly (phone, WhatsApp, email)
   └─ Add to favorites

2. BUSINESS REGISTRATION FORM (Business Owner or Admin Entry)
   └─ Information submission form
   └─ Photo upload
   └─ Status tracking
   └─ Approval notifications

3. APPROVAL DASHBOARD (Palika Staff)
   └─ Review pending listings
   └─ Approve/reject with comments
   └─ Notify business owner
```

### Priority 2: Enhancement (Weeks 2-4)
```
Improves user experience:

4. QR CODE SYSTEM
   └─ Generate for each business
   └─ Print/download interface
   └─ Link to business detail page

5. SOS EMERGENCY SYSTEM
   └─ Service directory (hospitals, pharmacies)
   └─ Hotline integration (102, 100, 101)
   └─ Location-based searching
   └─ Directions integration

6. REVIEWS & RATINGS
   └─ Customer reviews on listings
   └─ Rating system
   └─ Verified purchase badges
```

### Priority 3: Engagement (Weeks 4-6)
```
Drives long-term adoption:

7. NOTIFICATIONS
   └─ Email/SMS when new businesses
   └─ Inquiry notifications for business owners
   └─ Event reminders
   └─ Emergency alerts

8. MESSAGING SYSTEM
   └─ In-app inquiries (don't expose direct contact)
   └─ Owner-to-tourist communication
   └─ Support messages
   └─ Message history

9. ANALYTICS FOR OWNERS
   └─ View count on listing
   └─ Inquiry sources
   └─ Contact method preferences
   └─ Popular times
```

---

## Section 11: KEY DECISIONS NEEDED

### Decision 1: Business Registration Model

**Option A: Self-Service**
- Pros: Scalable, low Palika workload, fast registration
- Cons: May have poor quality initial listings, needs moderation
- Database: ✅ Ready

**Option B: Admin-Created (Current)**
- Pros: High quality, controlled, verified
- Cons: Doesn't scale, slow, Palika bottleneck
- Database: ✅ Ready

**Option C: Hybrid**
- Pros: Fast onboarding + quality control
- Cons: Most complex, requires clear rules
- Database: ✅ Ready

### Decision 2: Direct Contact vs. Messaging Platform

**Option A: Direct Contact (Current Plan)**
- Phone, email, WhatsApp buttons
- No commission charged
- Direct transactions
- Pros: Simple, fast, direct income to owners
- Cons: Less platform control, safety concerns

**Option B: Messaging Through Platform**
- In-app messaging system
- Platform tracks inquiries
- Optional payment integration
- Pros: Safety, analytics, possible commission revenue
- Cons: More complexity, less direct income

### Decision 3: QR Code Distribution

**Option A: Print & Physical Signage**
- Palika prints and posts
- Business owners print
- Partner locations
- Pros: Physical presence, discoverable
- Cons: Cost, maintenance

**Option B: Digital Only**
- Share QR via email, WhatsApp
- Include on business listings
- Pros: Free, instant, trackable
- Cons: Less physical presence

---

## Conclusion

**Current State:**
- ✅ **Backend infrastructure complete** - All tables, RLS, workflows ready
- ✅ **Database validation passing** - 216 business concern tests
- ✅ **Workflows documented** - Detailed user journeys exist
- ⚠️ **UI/Frontend layer** - Largely missing

**What's Needed:**
- Public-facing business directory interface
- Business owner registration/management UI
- Approval dashboard for Palika staff
- QR code system
- SOS emergency service directory
- Notification system
- Mobile app implementations

**Strategic Insight:**
The system architecture is sound and ready for Phase 3 UI development. The citizen/user workflows are well-documented and the database supports them. Focus Phase 3 on building the public-facing UX to connect citizens (local businesses) with tourists and emergency services.

**Estimated Phase 3 Effort:**
- Weeks 1-2: Business directory + registration (MVP)
- Weeks 2-3: QR code + approval dashboard
- Weeks 3-4: SOS system + mobile enhancements
- Weeks 4-6: Notifications, messaging, analytics, optimization

---

**Next Actions:**
1. Review and approve business registration model (self-service vs admin-created vs hybrid)
2. Finalize marketplace discovery UI design
3. Plan QR code system technical approach
4. Design SOS emergency directory structure
5. Begin Phase 3 sprint planning with these user journey requirements
