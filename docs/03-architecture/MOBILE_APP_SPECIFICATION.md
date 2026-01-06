# Mobile App Specification
## Citizen-Facing Application for Nepal Digital Tourism Infrastructure

---

## Document Overview

This specification defines the **citizen and tourist mobile application** - the primary interface through which people interact with Palika digital services. This is distinct from the web-based admin/content management system.

**Target Users:**
- Local residents (citizens)
- Domestic tourists
- International tourists
- Local business seekers

**Platforms:**
- Android (primary - 80%+ market share in Nepal)
- iOS (secondary - for international tourists)

---

## Table of Contents

1. [App Architecture Overview](#1-app-architecture-overview)
2. [Technical Stack Decision](#2-technical-stack-decision)
3. [User Onboarding Flow](#3-user-onboarding-flow)
4. [Core Navigation Structure](#4-core-navigation-structure)
5. [Feature Specifications](#5-feature-specifications)
6. [Notification System](#6-notification-system)
7. [Offline Functionality](#7-offline-functionality)
8. [Map Integration](#8-map-integration)
9. [SOS Emergency System](#9-sos-emergency-system)
10. [Business Discovery & Marketplace](#10-business-discovery--marketplace)
11. [User Profile & Settings](#11-user-profile--settings)
12. [Data Sync & Performance](#12-data-sync--performance)
13. [Security & Privacy](#13-security--privacy)
14. [Technical Requirements](#14-technical-requirements)

---

## 1. App Architecture Overview

### 1.1 Hybrid Architecture Decision

**Approach: Native Shell + WebView Content**

```
┌─────────────────────────────────────────┐
│         Native App Container            │
│  (Navigation, Maps, GPS, Notifications) │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────┐  ┌──────────────────┐   │
│  │  Native   │  │    WebView       │   │
│  │ Features  │  │  (Content from   │   │
│  │           │  │   Palika CMS)    │   │
│  │ • Map     │  │                  │   │
│  │ • GPS     │  │  • Heritage      │   │
│  │ • Camera  │  │  • Events        │   │
│  │ • SOS     │  │  • Blog Posts    │   │
│  │ • Notif.  │  │  • Business      │   │
│  └───────────┘  │    Listings      │   │
│                 └──────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│        Native ↔ Web Bridge API          │
├─────────────────────────────────────────┤
│         Local Data Layer                │
│    (SQLite, Cached Content, Prefs)      │
└─────────────────────────────────────────┘
```

### 1.2 Why This Architecture?

**Native Components Handle:**
- ✓ Performance-critical features (maps, scrolling)
- ✓ Hardware access (GPS, camera, notifications)
- ✓ Offline-first features (SOS, emergency contacts)
- ✓ Smooth animations and gestures

**WebView Components Handle:**
- ✓ Content-heavy sections that change frequently
- ✓ Heritage site descriptions and galleries
- ✓ Event listings and festival information
- ✓ Business directory (updates without app store)
- ✓ Blog posts and news

**Benefits:**
- Content updates don't require app store approval
- Consistent with web portal experience
- Reduced development cost vs fully native
- Better than pure PWA for notifications and offline

---

## 2. Technical Stack Decision

### 2.1 Recommended: Flutter

**Why Flutter:**
- Single codebase for Android + iOS
- Native-level performance
- Excellent map support (Google Maps)
- Built-in WebView plugins
- Strong offline capabilities
- Good GPS/location handling
- Growing developer community in Nepal/India

**Tech Stack:**
```
Framework: Flutter (Dart)
Maps: Google Maps Flutter Plugin
WebView: flutter_webview_pro
Local Storage: SQLite (sqflite package)
HTTP: dio (with caching)
Notifications: firebase_messaging + flutter_local_notifications
State Management: Riverpod or Provider
Location: geolocator package
Camera: camera plugin
Offline: Hive for key-value, SQLite for structured data
```

### 2.2 Alternative: React Native

**If team has JavaScript experience:**
```
Framework: React Native
Maps: react-native-maps
WebView: react-native-webview
Storage: AsyncStorage + SQLite
Notifications: @react-native-firebase/messaging
State: Redux Toolkit or Context API
```

**Decision Point:** Choose based on team expertise. Flutter recommended for better performance and smaller app size.

---

## 3. User Onboarding Flow

### 3.1 First Launch Experience

```
SCREEN 1: Welcome Splash
━━━━━━━━━━━━━━━━━━━━━━━
[App Logo/Brand]
"Digital Palika Services"
"Tourism • Services • Emergency"

[Continue Button]
━━━━━━━━━━━━━━━━━━━━━━━

↓

SCREEN 2: Language Selection
━━━━━━━━━━━━━━━━━━━━━━━
"Select Your Language"
भाषा छान्नुहोस्

[Flag] नेपाली     [Selected]
[Flag] English
[Flag] हिन्दी
[Flag] 中文

[Continue]
━━━━━━━━━━━━━━━━━━━━━━━

↓

SCREEN 3: Permission Requests
━━━━━━━━━━━━━━━━━━━━━━━
"App Permissions"

📍 Location
"Find nearby places and services"
[Required for core features]

📸 Camera
"Scan QR codes at heritage sites"
[Optional - can enable later]

🔔 Notifications
"Get emergency alerts and updates"
[Recommended]

[Allow All] [Choose Individually]
━━━━━━━━━━━━━━━━━━━━━━━

↓

SCREEN 4: Palika Selection
━━━━━━━━━━━━━━━━━━━━━━━
"Which Palika are you in?"

[📍 Auto-detect using GPS]

OR

[Search: "Type Palika name..."]

Recently Popular:
• Kathmandu Metropolitan
• Pokhara Metropolitan  
• Lalitpur Metropolitan
• Chitwan Metropolitan

[Browse by Province →]

━━━━━━━━━━━━━━━━━━━━━━━

↓

SCREEN 5: User Type (Optional)
━━━━━━━━━━━━━━━━━━━━━━━
"How will you use this app?"
(Helps us personalize)

[Icon] Local Resident
[Icon] Tourist - Domestic
[Icon] Tourist - International
[Icon] Business Owner

[Skip for Now]
━━━━━━━━━━━━━━━━━━━━━━━

↓

SCREEN 6: Notification Preferences
━━━━━━━━━━━━━━━━━━━━━━━
"What notifications do you want?"

☑ Emergency Alerts (Recommended)
☑ Festival & Events
☑ Tourism Updates
☐ Business Announcements
☐ Local News

[Save & Continue]
━━━━━━━━━━━━━━━━━━━━━━━

↓

HOME SCREEN
```

### 3.2 Registration Options

**Philosophy: Registration Optional Initially**

**Anonymous Use (No Registration):**
- Browse all content
- View heritage sites, events
- Use map and navigation
- Access emergency contacts
- **Cannot:** Save favorites, receive personalized notifications, register business

**Registered Use (Phone Number):**
```
Registration Flow:

1. Phone Number Entry
   "+977 [__________]"
   
2. OTP Verification
   "Enter 6-digit code sent to +977-98X-XXX-1234"
   [_ _ _ _ _ _]
   [Resend OTP] [Change Number]
   
3. Basic Profile (Optional)
   Name: [         ]
   Email: [        ] (optional)
   
4. Done - Profile Created
   • Favorites synced across devices
   • Personalized notifications
   • Can register business later
```

**Social Login (Phase 2):**
- Google Sign-In (international tourists)
- Facebook (popular in Nepal)
- Apple Sign-In (iOS requirement)

---

## 4. Core Navigation Structure

### 4.1 Bottom Navigation Bar (5 Tabs)

```
┌────────────────────────────────────────┐
│                                        │
│         [CONTENT AREA]                 │
│                                        │
│                                        │
└────────────────────────────────────────┘
┌──────┬──────┬──────┬──────┬──────────┐
│ 🏠   │ 🗺️   │ 📅   │ 🏪   │   ⋯     │
│ Home │ Map  │Events│Services│ More   │
└──────┴──────┴──────┴──────┴──────────┘
```

### 4.2 Tab Details

#### **Tab 1: Home 🏠**

**Purpose:** Quick access to everything, personalized feed

**Components:**
1. **Emergency SOS Button** (Floating, always visible)
2. **Current Palika Header** with weather
3. **Quick Actions Grid** (4x2)
4. **Featured Content** (Carousel)
5. **Upcoming Events** (List preview)
6. **Nearby Places** (Based on GPS)

**Screen Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[<] Pokhara Metropolitan      [🔔]
    🌤️ 24°C • Partly Cloudy

        [🆘 EMERGENCY SOS]
           (Red, prominent)

Quick Actions:
┌────────┬────────┐┌────────┬────────┐
│ 🏛️     │ 🎉     ││ 🍽️     │ 🏨     │
│Heritage│Festival││ Food   │ Stay   │
└────────┴────────┘└────────┴────────┘
┌────────┬────────┐┌────────┬────────┐
│ 🚍     │ 🏥     ││ 🏪     │ ℹ️      │
│Transport│Medical││Business│ Info   │
└────────┴────────┘└────────┴────────┘

Featured Heritage Sites:
[← Photo Carousel →]
📷 Bindabasini Temple
   "Ancient Hindu temple..."

Upcoming Events:
• Oct 15 - Dashain Festival
• Oct 20 - Cultural Dance
• Oct 25 - Food Fair
[View All →]

Nearby Places: (2.3 km from you)
📍 Phewa Lake - 1.2 km
📍 World Peace Pagoda - 3.5 km
📍 Old Bazaar - 0.8 km
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

#### **Tab 2: Map 🗺️**

**Purpose:** Visual discovery of everything on a map

**Type:** Fully native map component (Google Maps)

**Features:**
- All heritage sites marked
- Business locations
- Emergency services
- Current location tracking
- Navigation to any point
- Offline map tiles (cached)

**Screen Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[≡ Layers] [🔍 Search]      [⊙ Center]

╔════════════════════════════════╗
║                                ║
║    [Google Maps View]          ║
║                                ║
║  📍 (Various pins/markers)     ║
║     🏛️ Heritage                ║
║     🏨 Accommodation           ║
║     🍽️ Restaurant              ║
║     🏥 Hospital                ║
║     🏪 Business                ║
║                                ║
║  [Your Location: Blue dot]     ║
║                                ║
╚════════════════════════════════╝

[Bottom Sheet - Draggable]
──────────────────────────
📍 Bindabasini Temple
   Hindu Temple • 1.2 km away
   ⭐ 4.5 • Open Now
   
   [View Details] [Navigate]
──────────────────────────

[Filter Button: 🎛️]
 ☑ Heritage Sites
 ☑ Accommodations
 ☐ Restaurants
 ☑ Emergency Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Map Layers Toggle:**
```
┌─────────────────────┐
│ Map Layers          │
├─────────────────────┤
│ ☑ Heritage Sites    │
│ ☑ Accommodations    │
│ ☑ Restaurants       │
│ ☐ Shops & Services  │
│ ☑ Emergency         │
│ ☐ Public Transport  │
│ ☐ Walking Trails    │
│ ☐ Tourist Info      │
└─────────────────────┘
```

**Interaction Behaviors:**
- Tap marker → Show bottom sheet with preview
- Tap bottom sheet → Open full detail page
- Long press map → Drop custom pin, "What's here?"
- Pinch to zoom (standard)
- GPS tracking button → Center on user location

---

#### **Tab 3: Events 📅**

**Purpose:** Festival, cultural events, activities calendar

**Type:** Hybrid (Native calendar UI + WebView for details)

**Screen Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Events & Festivals          [🔔][⋯]

[Month View Calendar]
    October 2025
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 8  9 10 11 12 13 14
15●16 17 18 19 20●21  ← Dots = events
22 23 24 25 26 27 28
29 30 31

Upcoming Events:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ 📷 [Event Photo]                │
│ 🎉 Dashain Festival             │
│    Oct 15-24 • 10 days          │
│    📍 Multiple locations        │
│    🎫 Free Entry                │
│    [View Details →]             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📷 [Event Photo]                │
│ 🎭 Cultural Dance Performance   │
│    Oct 20 • 6:00 PM             │
│    📍 Community Hall            │
│    🎫 NPR 200                   │
│    [View Details →]             │
└─────────────────────────────────┘

[View All Events →]

Categories:
[Festivals][Cultural][Sports]
[Religious][Food][Music][Other]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Event Detail Page:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[< Back]                      [⋯]

📷 [Full-width Event Photo]

🎉 Dashain Festival
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 October 15-24, 2025 (10 days)
⏰ Various times throughout day
📍 Multiple locations across Palika

[🔔 Remind Me] [📤 Share] [⭐ Save]

About the Festival:
[WebView Content]
Dashain is the most important Hindu 
festival in Nepal, celebrating the 
victory of good over evil...

Schedule:
Day 1 (Oct 15): Ghatasthapana
Day 7 (Oct 21): Fulpati
Day 8 (Oct 22): Maha Ashtami
Day 9 (Oct 23): Maha Navami
Day 10 (Oct 24): Vijaya Dashami

Key Locations:
📍 Bindabasini Temple
📍 Old Bazaar Area
📍 Community Centers

What to Expect:
• Traditional rituals
• Tika ceremony
• Family gatherings
• Cultural programs
• Local food stalls

Tips for Visitors:
• Dress modestly
• Ask permission for photos
• Try local delicacies
• Respect ceremonies

[Show on Map] [Get Directions]

Contact:
Tourism Office: +977-61-XXXXXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Calendar Features:**
- Monthly view with event dots
- Tap date → See all events that day
- Subscribe to calendar (export .ics)
- Filter by category
- Search events
- Notification reminders

---

#### **Tab 4: Services 🏪**

**Purpose:** Local businesses, marketplace, services directory

**Type:** Hybrid (Native UI + WebView listings)

**Screen Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Services & Marketplace      [🔍]

Categories:
[🏨 Stay] [🍽️ Food] [🚗 Transport]
[🏪 Shopping] [🎨 Artisans] [🥾 Activities]
[🏥 Healthcare] [🏛️ Government]

Featured Businesses:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ 📷         ⭐ Palika Verified   │
│ 🏨 Mountain View Homestay       │
│    📍 Ward 8 • 2.3 km away      │
│    💰 NPR 2000/night            │
│    ⭐ 4.5 (23 reviews)          │
│    🛏️ 3 rooms • WiFi • Meals   │
│    [View Details →]             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📷         ⭐ Palika Verified   │
│ 🍯 Organic Honey Producer       │
│    📍 Ward 12 • 4.5 km away     │
│    💰 NPR 800/kg                │
│    ⭐ 4.8 (15 reviews)          │
│    🐝 Natural • Organic • Local │
│    [View Details →]             │
└─────────────────────────────────┘

Emergency Services: (Quick Access)
┌──────────┬──────────┬──────────┐
│ 🚑       │ 🚒       │ 👮       │
│ Ambulance│   Fire   │  Police  │
│   102    │   101    │   100    │
└──────────┴──────────┴──────────┘

Government Offices:
• Palika Office - Ward 1
• Ward Offices - View All
• Health Post - Ward 5
• Police Station - Main Road

[View All Services →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Business Detail Page:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[< Back]                      [⋯]

📷 [Photo Gallery - Swipeable]
   [• • ○ ○ ○] 2/5

🏨 Mountain View Homestay
   ⭐ Palika Verified Business

⭐ 4.5 ★★★★☆ (23 reviews)
📍 Ward 8, Near Temple • 2.3 km away
📞 +977-9841234567
💰 NPR 2000-2500 per night

[📞 Call] [📧 Message] [🗺️ Directions]

About:
[WebView Content]
Family-run homestay offering authentic 
Nepali hospitality. Clean rooms with 
mountain views, traditional home-cooked 
meals included.

Facilities & Amenities:
✓ 3 Guest Rooms (2 double, 1 single)
✓ WiFi Available
✓ Hot Shower
✓ Traditional Nepali Meals
✓ Parking Available
✓ Mountain Views
✓ Garden
✓ Cultural Experience Programs

Room Types & Pricing:
• Single Room: NPR 1500/night
• Double Room: NPR 2000/night
• Triple Room: NPR 2500/night
• Meals: Included
• Discount: 10% for 5+ nights

Owner Information:
Devi Sharma - 5 years experience
Languages: Nepali, English, Hindi

Location:
[Embedded Map]
Ward 8, 500m from Main Road
Turn left at temple, 100m uphill

Reviews (23): ★★★★☆ 4.5
[Show All Reviews]

Recent (⭐⭐⭐⭐⭐):
"Amazing homestay! Devi and her family 
were so welcoming. Food was delicious..."
- Sarah, UK • 2 weeks ago

Nearby:
• Bindabasini Temple - 500m
• Old Bazaar - 1.2 km
• Phewa Lake - 2 km

[🔔 Save to Favorites]
[📤 Share with Friends]

Last Updated: 2 weeks ago
Business ID: HMS-PKR-0234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Business Categories:**
```
Accommodation:
• Hotels
• Homestays
• Guest Houses
• Hostels

Food & Drink:
• Restaurants
• Cafes
• Local Eateries
• Street Food

Shopping:
• Handicrafts
• Local Products
• Souvenirs
• Groceries

Services:
• Tour Guides
• Transportation
• Photography
• Equipment Rental

Local Products:
• Honey Producers
• Tea Gardens
• Organic Farms
• Artisan Workshops

Activities:
• Trekking Guides
• Paragliding
• Boating
• Cycling Tours

Healthcare:
• Hospitals
• Clinics
• Pharmacies
• Ayurvedic Centers

Professional:
• Lawyers
• Accountants
• IT Services
• Consultants
```

---

#### **Tab 5: More ⋯**

**Purpose:** Settings, profile, additional features

**Screen Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
More                          [⚙️]

👤 User Profile
   Ram Sharma
   +977-9841234567
   [Edit Profile →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
My Content
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ Saved Places (12)
📅 My Events (3)
💼 My Business
📝 My Reviews (5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Settings & Preferences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Language - English
📍 My Palika - Pokhara
🔔 Notifications
📥 Download Content
🗺️ Offline Maps
🌙 Dark Mode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ About App - v1.2.0
📖 User Guide
❓ Help & Support
📞 Contact Palika
⭐ Rate App
🔒 Privacy Policy
📜 Terms of Service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Security & Password
📲 Connected Devices
🚪 Logout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. Feature Specifications

### 5.1 Heritage Site Discovery

**QR Code Scanning:**
```
User Flow:
1. User at heritage site sees QR code
2. Opens app → Home → "Scan QR" button
   OR Camera tab → Scan mode
3. Points camera at QR code
4. App auto-detects and decodes
5. Opens heritage site detail page

Heritage Site Detail:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[< Back]                  [❤️][⋯]

📷 [Image Gallery]
   [← 1/8 →]

🏛️ Bindabasini Temple
   Hindu Temple • Shakti Peetha

⭐ 4.6 ★★★★☆ (342 visitors)
📍 Ward 2, Old Bazaar • Open Now
⏰ 5:00 AM - 8:00 PM Daily
🎫 Free Entry

[🎧 Audio Guide] [🗺️ Show on Map]

[WebView Content Below]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
About:
Bindabasini Temple is one of the oldest 
and most revered temples in Pokhara. 
Dedicated to Goddess Bhagwati, it was 
built in the 18th century...

History:
The temple was constructed by King 
Kulmandhan in 1845 CE. According to 
legend...

Architecture:
The temple showcases traditional pagoda-
style architecture with intricate wood 
carvings...

Religious Significance:
Important pilgrimage site during Dashain 
and Navaratri. Daily rituals performed 
morning and evening...

Visitor Information:
• Best time: Early morning (5-7 AM)
• Dress code: Modest clothing
• Photography: Allowed outside only
• Facilities: Parking, restrooms, water
• Accessibility: 50 steps to temple

Nearby Sites:
📍 Old Bazaar - 200m
📍 Seti River Gorge - 500m
📍 Mahendra Cave - 3.2 km

What to Bring:
• Respectful clothing
• Offerings (optional)
• Water bottle
• Camera for views

Tips:
• Remove shoes before entering
• Ask permission before photography
• Local guides available
• Avoid leather items

Reviews (342):
[Show All Reviews →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Audio Guide Feature:**
```
Tap "🎧 Audio Guide" button:

┌─────────────────────────────┐
│ 🎧 Audio Guide              │
│                             │
│ Select Language:            │
│ [नेपाली] [English] [हिन्दी]│
│                             │
│ [Play Icon] 00:00 / 08:32   │
│ ════════○────────────        │
│                             │
│ [⏮️] [⏸️/▶️] [⏭️]           │
│                             │
│ Chapters:                   │
│ 1. Introduction (0:00)      │
│ 2. History (1:30)           │
│ 3. Architecture (3:45)      │
│ 4. Festivals (5:20)         │
│ 5. Visitor Tips (7:00)      │
│                             │
│ [Download for Offline]      │
└─────────────────────────────┘
```

### 5.2 Search Functionality

**Global Search Bar:**
```
Home Screen → Tap Search Bar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[🔍] Search places, events, services...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent Searches:
• Bindabasini Temple
• homestay
• Dashain festival

Popular Searches:
• temples
• hotels
• restaurants near me
• trekking
• festivals

Categories:
[🏛️ Heritage] [🎉 Events] [🏨 Stay]
[🍽️ Food] [🚗 Transport] [🏪 Services]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User types: "temple"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Search Results for "temple"      [X]

🏛️ Heritage Sites (8):
┌────────────────────────────────┐
│ 📷 Bindabasini Temple          │
│    Hindu • 1.2 km • ⭐ 4.6    │
└────────────────────────────────┘
┌────────────────────────────────┐
│ 📷 Tal Barahi Temple           │
│    Hindu • 3.5 km • ⭐ 4.4    │
└────────────────────────────────┘
[See all heritage →]

📅 Related Events (2):
• Temple Festival - Oct 20
• Puja Ceremony - Oct 25

🏨 Near Temples (5):
• Mountain View Homestay - 500m
• Temple Guest House - 300m
[See all accommodations →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Search Features:**
- Auto-complete suggestions
- Recent searches saved
- Search by category
- Voice search (optional)
- Filter results
- Sort by: Distance, Rating, Popularity

---

## 6. Notification System

### 6.1 Notification Architecture

**Problem:** PWA notifications unreliable on mobile  
**Solution:** Native notification system with Firebase Cloud Messaging

**Implementation:**
```
Backend (Palika CMS):
→ Admin creates notification
→ Selects target audience
→ Sends to Firebase Cloud Messaging
→ FCM delivers to devices

App:
→ Receives notification via FCM
→ Shows using flutter_local_notifications
→ Stores in local database
→ User can view notification history
```

### 6.2 Notification Types

**1. Emergency Alerts (Critical)**
```
Priority: MAX
Sound: Loud emergency tone
Display: Full-screen alert
Persistent: Yes (can't dismiss easily)

Example:
┌─────────────────────────────────┐
│ 🚨 EMERGENCY ALERT               │
│                                 │
│ FLASH FLOOD WARNING             │
│                                 │
│ Heavy rainfall. Flash flood     │
│ expected in Ward 3, 4, 5 by     │
│ 4:00 PM.                        │
│                                 │
│ EVACUATE immediately to:        │
│ • Community Hall (Ward 2)       │
│ • School (Ward 6)               │
│                                 │
│ Emergency: 100 / 9841234567     │
│                                 │
│ [View Full Alert]               │
│ [Call Emergency]                │
└─────────────────────────────────┘
```

**2. Event & Festival Notifications**
```
Priority: HIGH
Sound: Pleasant chime
Display: Banner notification

Example:
┌─────────────────────────────────┐
│ 🎉 Pokhara Metropolitan         │
│                                 │
│ Dashain Festival Tomorrow       │
│                                 │
│ Oct 15-24 • Tika ceremony       │
│ at Bindabasini Temple           │
│                                 │
│ Tap to view festival guide →   │
└─────────────────────────────────┘
```

**3. Tourism Updates**
```
Priority: DEFAULT
Sound: Standard notification
Display: Banner

Example:
┌─────────────────────────────────┐
│ ℹ️ Pokhara Metropolitan         │
│                                 │
│ New Heritage Trail Launched     │
│                                 │
│ Explore 10 ancient sites in     │
│ the Old Bazaar area             │
│                                 │
│ Tap to learn more →             │
└─────────────────────────────────┘
```

**4. Business Announcements**
```
Priority: LOW
Sound: Subtle tone
Display: Silent notification

Example:
┌─────────────────────────────────┐
│ 🏪 Local Business Update         │
│                                 │
│ 5 New Homestays Added           │
│                                 │
│ Check out new accommodation     │
│ options in your area            │
│                                 │
│ Tap to browse →                 │
└─────────────────────────────────┘
```

### 6.3 Notification Settings

**User Control:**
```
Settings → Notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Notification Preferences

Master Switch:
[●======] All Notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Emergency Alerts
[●======] Always On (Recommended)
⚠️ Cannot be disabled (safety)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Festival & Events
[●======] Enabled

  Reminder Time:
  [ ] Day before event
  [✓] Morning of event
  [✓] 1 hour before event

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tourism Updates
[○------] Disabled

  Frequency:
  ( ) Daily
  ( ) Weekly
  (•) As they happen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Business Announcements
[○------] Disabled

  Categories:
  [ ] Accommodation
  [ ] Food & Dining
  [ ] Shopping
  [ ] Activities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quiet Hours
[●======] Enabled
  From: 10:00 PM
  To:   7:00 AM
  ⚠️ Emergency alerts still shown

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.4 Notification Center

**In-App Notification History:**
```
More Tab → Notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Notifications               [⚙️]

[All] [Emergency] [Events] [Updates]

Today:
┌────────────────────────────────┐
│ 🎉 Dashain Festival Tomorrow   │
│    2 hours ago                 │
│    Pokhara Metropolitan        │
└────────────────────────────────┘
┌────────────────────────────────┐
│ ℹ️ New Heritage Trail Added    │
│    5 hours ago • Read ✓        │
│    Tourism Department          │
└────────────────────────────────┘

Yesterday:
┌────────────────────────────────┐
│ 🚨 Weather Warning              │
│    Oct 13, 3:00 PM • Read ✓    │
│    Heavy rainfall expected     │
└────────────────────────────────┘

This Week:
[Show More →]

[Clear All Read] [Settings]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 7. Offline Functionality

### 7.1 Offline-First Design

**Critical Offline Features:**
- ✓ Emergency contacts (always cached)
- ✓ SOS button (works without internet)
- ✓ Downloaded content (heritage sites, events)
- ✓ Offline maps (cached tiles)
- ✓ Saved favorites
- ✓ Notification history

**Requires Internet:**
- Real-time updates
- Business listings (fresh data)
- Image galleries (unless pre-downloaded)
- Reviews and ratings
- Search (live results)

### 7.2 Content Download System

**Download Manager:**
```
Settings → Download Content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Offline Content

📊 Storage Used: 145 MB / 500 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Palika:
Pokhara Metropolitan

[Download All Content]
   Heritage sites, events, maps
   Estimated size: 87 MB
   
   [●====================] 100%
   ✓ Downloaded • 2 days ago

[Update Now] [Delete]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nearby Palikas:

Kaski Rural Municipality
   58 MB • Not downloaded
   [Download]

Annapurna Rural Municipality
   42 MB • Not downloaded
   [Download]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Offline Maps:

Google Maps (Offline)
   [Define Area →]
   Current: 10 km radius
   Size: 156 MB
   
   [●====================] 100%
   ✓ Downloaded • 1 week ago

[Update Maps] [Expand Area]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Settings:

[●======] Auto-download on WiFi
[○------] Download images
[●======] Update automatically
[○------] Download videos

Delete Offline Content:
[Clear Cache] [Remove All]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.3 Offline Indicators

**Visual Feedback:**
```
When offline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ⚠️ Offline Mode ] 

Limited features available.
Using cached content.

[Dismiss]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Heritage site page:
[📡 Offline] Content may be outdated
Last updated: 2 days ago

Business listing:
[📡 Offline] Can't call or message now
Tap to save for later

Map:
[📡 Offline Maps] Limited area available
Download more for full coverage
```

### 7.4 Sync Strategy

**Background Sync:**
```
When internet reconnects:
1. Check for urgent updates (emergency alerts)
2. Sync notification history
3. Update saved favorites
4. Refresh cached content (if stale)
5. Upload queued actions:
   - SOS requests sent while offline
   - Reviews written offline
   - Favorites marked offline
```

---

## 9. SOS Emergency System

### 9.1 SOS Button Placement

**Always Accessible:**
```
Option 1: Floating Action Button (FAB)
┌────────────────────────────────┐
│                                │
│                                │
│          [Content]             │
│                                │
│                                │
│                                │
│                      [🆘]      │ ← Bottom right
└────────────────────────────────┘

Option 2: Prominent Home Screen Button
[Center of home screen, red, large]

Option 3: Both (Recommended)
- FAB on all screens (except emergency flow)
- Large button on home screen
- Quick access from notification shade
```

### 9.2 SOS Flow

**Step-by-Step:**
```
1. User Presses SOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🆘 EMERGENCY

   What's the emergency?

   [🚑] Medical Emergency
   [🚒] Fire
   [👮] Police / Crime
   [🌊] Natural Disaster
   [🚗] Accident
   [❓] Other Emergency

   [Cancel]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. User Selects Type (e.g., Medical)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚑 MEDICAL EMERGENCY

   Tell us more: (Optional)

   [ ] Unconscious person
   [ ] Severe injury
   [ ] Heart attack
   [ ] Difficulty breathing
   [ ] Other: [____________]

   Your Location:
   📍 Detecting GPS...
   Ward 5, Near Temple
   [📍 Correct] [✏️ Edit]

   Your Phone:
   +977-9841234567
   [✏️ Edit]

   [🆘 SEND EMERGENCY REQUEST]

   This will alert:
   • Palika Emergency Coordinator
   • Ward Office (Ward 5)
   • Nearby health volunteers

   [Cancel]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. SOS Sent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✓ EMERGENCY REQUEST SENT

   Request ID: #SOS-2025-1234

   📍 Your location shared:
   Ward 5, Near Temple
   [View on Map]

   Status: RECEIVED ●
   
   Waiting for response...
   Estimated response: 5-10 minutes

   Emergency Contacts:
   🚑 Ambulance: 102
   👮 Police: 100
   🚒 Fire: 101

   [Call 102] [Call Palika]

   [Cancel Request]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Status Updates (Push Notifications)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚑 Emergency Response

   Your request #SOS-2025-1234
   
   Status: ASSIGNED ●
   
   Responder: Ram Bahadur (Volunteer)
   Phone: +977-9847654321
   
   "On my way. 5 minutes."
   
   [Track on Map] [Call Responder]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. Live Tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Map View]
   
   📍 Your Location (Blue)
   🚑 Responder (Moving)
   
   Distance: 1.2 km
   ETA: 3 minutes
   
   Status: EN ROUTE ●
   
   [Call Responder: Ram]
   [Call Emergency: 102]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. Responder Arrives
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✓ RESPONDER ARRIVED

   Status: ON SITE ●
   
   Ram Bahadur is at your location
   
   [Mark as Resolved]
   [Need More Help]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. Resolution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✓ EMERGENCY RESOLVED

   Request #SOS-2025-1234
   
   Thank you for using emergency services.
   
   Response time: 8 minutes
   Responder: Ram Bahadur
   
   [Rate Response]
   [Provide Feedback]
   
   [Done]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 9.3 SOS Offline Capability

**Critical: SOS must work offline**

**Offline SOS Strategy:**
```
When offline:
1. User presses SOS
2. App tries to send immediately → Fails
3. Shows message:
   "⚠️ No internet connection
   
   Your SOS request will be sent
   as soon as connection is restored.
   
   Meanwhile, call emergency numbers:
   🚑 Ambulance: 102
   👮 Police: 100
   
   [Call 102] [Call 100]"

4. Request queued locally
5. When internet returns:
   → Automatically sends
   → Notifies user: "SOS request sent"
```

**Always Available Offline:**
- Emergency contact list (cached)
- Direct call buttons (102, 100, 101)
- Last known location (GPS works offline)
- SOS history

---

## 10. Business Discovery & Marketplace

### 10.1 Business Registration (User Side)

**For Business Owners:**
```
More → My Business → Register Business

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Register Your Business

Step 1/5: Basic Information

Business Type:
( ) Accommodation (Hotel/Homestay)
( ) Restaurant / Cafe
( ) Shop / Store
( ) Tour Guide / Activity
( ) Producer (Honey/Tea/Crafts)
( ) Professional Service
( ) Other

[Next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2/5: Business Details

Business Name:
[Mountain View Homestay_______]

Owner Name:
[Devi Sharma_________________]

Phone Number:
+977-[9841234567_____________]

Email (Optional):
[devi@example.com____________]

Ward Number:
[8___]

Address/Location:
[Near Temple, Main Road_______]

📍 Pin Location on Map:
[Show Map to Pin Location]

[Back] [Next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3/5: Business Information

For Homestay:

Number of Rooms:
[3___]

Room Types:
☑ Single Room
☑ Double Room
☐ Triple Room
☐ Dormitory

Amenities:
☑ WiFi
☑ Hot Water
☑ Meals Included
☐ Parking
☑ Garden
☐ Laundry

Price Range:
From NPR [1500__] to [2500__] per night

Description:
[Family-run homestay offering___
 authentic Nepali experience...
 _____________________________
 (max 500 words)              ]

[Back] [Next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 4/5: Photos & Documents

Business Photos: (Required)
[📷 Add Photos] (5-10 recommended)

[Added: 6 photos]
📷 📷 📷
📷 📷 📷

Business License: (If applicable)
[📄 Upload Document]
License Number: [______________]

PAN Number: (If applicable)
[______________]

[Back] [Next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5/5: Review & Submit

Review your information:

Mountain View Homestay
Devi Sharma • +977-9841234567
Ward 8, Near Temple

Homestay • 3 Rooms
NPR 1500-2500/night
WiFi, Hot Water, Meals

6 photos attached
License: [View]

[✓] I confirm this information 
    is accurate

[✓] I agree to terms of service

[Submit for Verification]

Your business will be reviewed 
within 2-3 business days.

[Back] [Submit]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Submission Confirmation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Business Registration Submitted

Request ID: #BUS-2025-5678

Your business registration has been
submitted to Pokhara Metropolitan
for verification.

Status: PENDING VERIFICATION

You'll receive a notification when:
• Your business is approved
• More information is needed
• Site visit is scheduled

Track Status:
More → My Business → Status

[Done]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 10.2 Business Dashboard (After Approval)

**Business Owner View:**
```
More → My Business

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
My Business

🏨 Mountain View Homestay
⭐ Palika Verified
Status: ACTIVE ●

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick Stats (This Month):

👁️ 234 Views
📞 12 Contacts
⭐ 4.5 Rating (5 reviews)
📈 +15% vs last month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actions:

[✏️ Edit Business Info]
[📷 Update Photos]
[💬 View Reviews]
[📊 View Analytics]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recent Activity:

• New review: ⭐⭐⭐⭐⭐ (2 days ago)
• Contact inquiry (5 days ago)
• Photo updated (1 week ago)

[View All Activity →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Settings:

[🔔] Notification Preferences
[🔒] Business Verification
[📄] Documents & License
[❌] Deactivate Listing

[Help & Support]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 10.3 Transaction Tracking (Without Payment)

**Inquiry-Based Tracking:**

```
Customer Journey:

1. Tourist Finds Business
   → Views "Mountain View Homestay"
   → Clicks [Contact Business]

2. Inquiry Generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Contact Business

   Your inquiry code: XYZ-1234
   (Please mention this when contacting)

   Contact Options:
   [📞 Call Now: +977-9841234567]
   [💬 WhatsApp]
   [✉️ Send Message]

   Inquiry Details:
   • Property: Mountain View Homestay
   • Date: Oct 25, 2025
   • Inquiry ID: XYZ-1234

   Please mention inquiry code when
   booking to help us track.

   [Send Inquiry]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Business Owner Receives Inquiry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Notification:

   💬 New Inquiry #XYZ-1234

   Sarah (UK) is interested in
   Mountain View Homestay

   Dates: Oct 28-30 (2 nights)
   Contact: +977-9876543210

   [View Details] [Call Customer]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Business Arranges Directly
   → Phone call / WhatsApp
   → Booking confirmed outside app
   → Business owner notes inquiry code

5. Transaction Logging (Business Owner)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   My Business → Inquiries

   Inquiry #XYZ-1234
   Sarah (UK)
   Status: CONTACTED ●

   Mark as:
   ( ) Booking Confirmed
   ( ) Booking Completed
   ( ) Customer Cancelled
   ( ) Did Not Book

   If Booking Confirmed:
   Check-in: [Oct 28, 2025]
   Check-out: [Oct 30, 2025]
   Guests: [2]
   Rooms: [1]

   [Save]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. Customer Confirmation (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   After check-out:
   
   Notification to Tourist:

   Did you stay at Mountain View 
   Homestay? (Inquiry #XYZ-1234)

   [Yes, I stayed there]
   [No, I didn't stay]

   If Yes:
   → Prompts for review
   → Transaction confirmed in system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Analytics for Palika:**
```
Admin Dashboard:

Business Analytics:

Mountain View Homestay:
• Total Inquiries: 45
• Confirmed Bookings: 23 (51%)
• Completed Stays: 20 (44%)
• Customer Verified: 18 (40%)
• Cancellations: 3 (7%)

Revenue Estimation:
• Average Stay: 2.5 nights
• Average Rate: NPR 2000/night
• Estimated Revenue: NPR 100,000/month
```

**Limitations Acknowledged:**
- Relies on business owner honesty
- Customer confirmation improves accuracy
- Not all transactions tracked
- Good enough for policy/planning estimates
- Exact revenue unknown (by design - no payment)

---

## 11. User Profile & Settings

### 11.1 Profile System

**Registration Options:**
```
Option 1: Phone Number (Primary)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create Account

Phone Number:
+977 [__________]

[Send OTP]

We'll send a verification code to
your phone number.

[Continue]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 2: Social Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Continue with Google]
[Continue with Facebook]
[Continue with Apple]

OR

[📱 Use Phone Number]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Profile Page:**
```
More → Profile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Ram Sharma
   [Edit Photo]

📞 +977-9841234567 ✓ Verified
📧 ram.sharma@email.com
🏠 Ward 5, Pokhara Metropolitan

User Type: Local Resident
Member Since: Jan 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
My Activity:

⭐ Saved Places: 12
📅 Attended Events: 5
💬 Reviews Written: 3
🏪 My Business: 1 listing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account Settings:

[✏️ Edit Profile]
[🔒 Change Password]
[📱 Phone Number]
[✉️ Email Address]
[🗑️ Delete Account]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 11.2 Settings Screen

**Comprehensive Settings:**
```
More → Settings ⚙️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL

🌍 Language
   English →
   (नेपाली, हिन्दी, 中文 available)

📍 Default Palika
   Pokhara Metropolitan →
   [Change]

👤 User Type
   Local Resident →
   (Tourist, Business Owner)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPEARANCE

🌙 Theme
   ( ) Light
   (•) Dark
   ( ) Auto (System)

🎨 App Color
   [Blue] [Green] [Red] [Purple]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTIFICATIONS

🔔 Push Notifications
   [●======] Enabled

Emergency Alerts
   [●======] Always On

Festival & Events
   [●======] Enabled

Tourism Updates
   [○------] Disabled

Quiet Hours
   [●======] 10 PM - 7 AM

[More Notification Settings →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA & STORAGE

📥 Download Settings
   
   Auto-download on WiFi
   [●======] Enabled
   
   Download Images
   [●======] Enabled
   
   Download Videos
   [○------] Disabled

📊 Storage Used: 245 MB

   [Manage Downloaded Content →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAPS & LOCATION

🗺️ Map Type
   (•) Standard
   ( ) Satellite
   ( ) Terrain

📍 Location Services
   [●======] Always Allow
   (Required for core features)

Offline Maps: 156 MB
   [Manage Offline Maps →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIVACY & SECURITY

🔒 Privacy
   [Lock App with PIN]
   [Biometric Login]
   [Clear Search History]

🔐 Account Security
   [Change Password]
   [Two-Factor Authentication]
   [Active Sessions]

📊 Data & Privacy
   [Privacy Policy]
   [Data We Collect]
   [Delete My Data]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVANCED

🔧 Advanced Settings
   [Developer Mode]
   [Reset App]
   [Clear Cache]

📱 App Info
   Version: 1.2.0 (Build 45)
   [Check for Updates]
   [Release Notes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 12. Data Sync & Performance

### 12.1 Sync Strategy

**Data Layers:**
```
┌─────────────────────────────────┐
│     Remote Server (Palika CMS)  │
│  (Source of truth for content)  │
└─────────────────────────────────┘
           ↕ (API)
┌─────────────────────────────────┐
│        App Cache Layer          │
│    (SQLite + In-Memory)         │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│         User Interface          │
└─────────────────────────────────┘
```

**Sync Rules:**

**Real-Time (Immediate Sync):**
- Emergency SOS requests
- Emergency alerts/notifications
- Critical updates

**Background Sync (Periodic):**
- Content updates (every 6 hours)
- Business listings (daily)
- Event calendar (daily)
- Heritage site info (weekly)

**On-Demand (User-Triggered):**
- Pull-to-refresh gestures
- Explicit "Update" button
- App foreground after long background

**Offline-First:**
- Show cached content immediately
- Sync in background
- Update UI when complete
- Indicate freshness

### 12.2 Performance Optimization

**App Launch:**
```
Target: < 2 seconds to interactive

Strategy:
1. Splash screen (0-1 sec)
2. Load critical data from cache
3. Show home screen with cached content
4. Background sync new data
5. Update UI seamlessly
```

**Image Loading:**
```
Strategy:
1. Show low-res placeholder
2. Load optimized image from cache
3. If cache miss, download from CDN
4. Progressive loading
5. Cache for future

Image Optimization:
- WebP format (smaller size)
- Multiple resolutions (thumbnail, medium, full)
- Lazy loading (only visible images)
- Compression (60-80% quality)
```

**Map Performance:**
```
Strategy:
- Native map component (fast)
- Cluster markers when zoomed out
- Load markers progressively
- Cache map tiles aggressively
- Reduce marker density at far zoom
```

**List Performance:**
```
Strategy:
- Virtualized lists (only render visible)
- Pagination (20-50 items per page)
- Infinite scroll with threshold
- Cache list data
- Debounce search queries
```

### 12.3 Network Handling

**Connection States:**
```
1. Online:
   → Full functionality
   → Background sync active
   → Real-time updates

2. Slow Connection:
   → Show cached content first
   → Load critical data only
   → Defer heavy assets
   → Show "Slow connection" indicator

3. Offline:
   → Full offline mode
   → Show cached content
   → Queue actions for later
   → Clear offline indicator
   → Disable features requiring internet

4. Reconnection:
   → Sync queued actions first
   → Update cached content
   → Notify user of updates
   → Resume normal operation
```

**Error Handling:**
```
User-Friendly Messages:

Network Error:
"⚠️ Connection issue
Please check your internet and try again.
[Retry]"

Server Error:
"⚠️ Something went wrong
We're working on it. Please try again later.
[Retry]"

Timeout:
"⚠️ Request taking too long
This might be due to slow connection.
[Retry] [Use Offline Mode]"

Data Not Found:
"🔍 No results found
Try adjusting your search or filters.
[Clear Filters]"
```

---

## 13. Security & Privacy

### 13.1 Data Privacy

**Data Collection Policy:**
```
Information We Collect:

Essential (Required):
• Phone number (authentication)
• Device location (GPS)
• Device ID (notifications)
• App usage statistics

Optional:
• Name and email
• Photos (uploaded content)
• Reviews and ratings
• Saved preferences

NOT Collected:
• Contacts list
• Other apps installed
• Microphone recordings
• Personal messages

[Read Full Privacy Policy →]
```

**User Consent:**
```
First Launch:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Privacy & Terms

By using this app, you agree to:

☑ Collection of location data
  (Required for maps and emergency)

☑ Collection of usage statistics
  (Helps improve the app)

☐ Marketing communications
  (Optional promotional emails)

[Read Privacy Policy]
[Read Terms of Service]

[I Agree & Continue]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 13.2 Authentication & Security

**Phone Number Verification:**
```
Login Flow:

1. Enter Phone: +977-9841234567
2. Send OTP
3. Enter 6-digit code
4. Verify
5. Logged in

Security Features:
• OTP expires in 5 minutes
• Max 3 attempts
• Rate limiting (prevent spam)
• Secure token storage
```

**Session Management:**
```
• JWT tokens for API calls
• Refresh token for extended sessions
• Secure storage (encrypted)
• Auto-logout after 30 days inactive
• Multi-device support (view active sessions)
```

**App Security:**
```
Optional Security Features:

[🔒 App Lock]
   Require PIN/Biometric to open app

[👆 Biometric Login]
   Use fingerprint or face recognition

[🔐 Sensitive Data]
   Hide saved business info in multitasking
```

### 13.3 Data Storage

**Local Data:**
```
Stored Securely:
• Authentication tokens (encrypted)
• User profile (encrypted)
• Saved favorites
• Downloaded content
• App preferences
• Search history

Can Be Cleared:
• Cache (images, maps)
• Search history
• Downloaded content
• All data (account deletion)
```

**Data Deletion:**
```
Settings → Privacy → Delete My Data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delete Account

⚠️ Warning: This action is permanent

What will be deleted:
• Your account and profile
• Saved places and favorites
• Reviews and ratings
• Business listings (if any)
• All personal data

What will NOT be deleted:
• Public reviews (anonymized)
• SOS history (for safety records)

To confirm, enter your phone number:
+977-[__________]

[Cancel] [Delete My Account]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 14. Technical Requirements

### 14.1 Minimum Requirements

**Android:**
```
Minimum: Android 6.0 (API 23)
Recommended: Android 8.0+ (API 26+)

Device Specs:
• RAM: 2GB minimum, 4GB recommended
• Storage: 500MB free space
• Screen: 5" minimum, supports all sizes
• Camera: For QR scanning (optional)
• GPS: Required for core features
```

**iOS:**
```
Minimum: iOS 12.0
Recommended: iOS 14.0+

Device Support:
• iPhone 6s and newer
• All iPad models from 2017+
• iPod touch 7th generation
```

### 14.2 Development Stack Summary

**Recommended Technology:**
```
Framework: Flutter 3.x
Language: Dart
State Management: Riverpod
```

**Key Dependencies:**
```
UI & Navigation:
• flutter_bloc or riverpod
• go_router
• flutter_hooks

Maps & Location:
• google_maps_flutter
• geolocator
• geocoding

WebView:
• flutter_inappwebview

Networking:
• dio (HTTP client)
• connectivity_plus

Storage:
• sqflite (SQLite)
• hive (key-value)
• shared_preferences
• flutter_secure_storage

Notifications:
• firebase_messaging
• flutter_local_notifications

Media:
• cached_network_image
• photo_view
• video_player

QR Code:
• mobile_scanner

Authentication:
• firebase_auth (optional)

Analytics:
• firebase_analytics
• firebase_crashlytics

Utils:
• intl (i18n)
• url_launcher
• share_plus
• permission_handler
```

### 14.3 API Integration

**Backend Communication:**
```
Base URL: https://api.palika.gov.np/v1

Endpoints Needed:

Auth:
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh-token

Content:
GET /palikas/{id}
GET /heritage-sites
GET /heritage-sites/{id}
GET /events
GET /events/{id}
GET /businesses
GET /businesses/{id}

Emergency:
POST /sos/create
GET /sos/{id}/status
PUT /sos/{id}/update

User:
GET /user/profile
PUT /user/profile
GET /user/favorites
POST /user/favorites
DELETE /user/favorites/{id}

Notifications:
POST /notifications/register-device
GET /notifications/history
PUT /notifications/preferences

Business:
POST /businesses/register
PUT /businesses/{id}
GET /businesses/my-business

Search:
GET /search?q={query}&type={type}

Analytics:
POST /analytics/event
POST /analytics/track-inquiry
```

**API Response Format:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2025-10-15T10:30:00Z"
}

Error Response:
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Phone number is required"
  },
  "timestamp": "2025-10-15T10:30:00Z"
}
```

### 14.4 Build & Deployment

**Build Variants:**
```
Development:
• Base URL: https://dev-api.palika.gov.np
• Debug mode
• Verbose logging
• Test notifications

Staging:
• Base URL: https://staging-api.palika.gov.np
• Release mode
• Limited logging
• Real backend

Production:
• Base URL: https://api.palika.gov.np
• Release mode
• Error logging only
• Live data
```

**Release Process:**
```
1. Version bump (semantic versioning)
2. Update changelog
3. Build signed APK/AAB (Android)
4. Build IPA (iOS)
5. Internal testing (TestFlight/Internal Testing)
6. Beta testing (selected users)
7. Production release (staged rollout)
8. Monitor crash reports
9. Hot fixes if needed
```

---

## 15. Future Enhancements (Phase 2+)

### 15.1 Advanced Features

**Voice Commands:**
```
"Hey Palika, find temples near me"
"Show me upcoming festivals"
"Navigate to Phewa Lake"
"Call emergency services"
```

**AR (Augmented Reality):**
```
• Point camera at heritage site
• Overlay historical information
• Virtual reconstruction of ruins
• Interactive heritage tours
```

**Social Features:**
```
• User-to-user messaging
• Travel groups
• Share itineraries
• Friend recommendations
• Social reviews
```

**Gamification:**
```
• Heritage site badges
• Visit challenges
• Leaderboards
• Rewards program
• Cultural quiz
```

### 15.2 Integration Opportunities

**Payment Integration:**
```
• eSewa integration
• Khalti payment
• IME Pay
• For optional services
• Not for core features
```

**Government Services:**
```
• Digital citizenship card
• Nagarikta verification
• PAN integration
• License verification
```

**Transportation:**
```
• Public bus routes
• Taxi booking
• Rental vehicles
• Trekking permits
```

---

## Conclusion

This mobile app specification provides a **comprehensive, citizen-first design** for Nepal's Digital Tourism Infrastructure. 

**Key Design Principles:**
1. **Hybrid Architecture** - Native performance where needed, web flexibility for content
2. **Offline-First** - Core features work without internet
3. **Emergency-Ready** - SOS system always accessible
4. **Business-Friendly** - Easy registration and management
5. **Privacy-Conscious** - Minimal data collection, user control
6. **Performance-Optimized** - Fast load times, smooth experience
7. **Accessible** - Works on budget Android phones
8. **Future-Proof** - Extensible architecture

**Next Steps:**
1. Review and refine this specification
2. Create detailed UI/UX designs (Figma)
3. Plan development sprints
4. Build MVP (Minimum Viable Product)
5. Beta testing with selected users
6. Iterate based on feedback
7. Production launch

---

**Related Documents:**
- README.md - Package overview
- EXECUTIVE_SUMMARY.md - Strategic vision
- PROJECT_PROPOSAL.md - Technical infrastructure
- BUSINESS_MODEL.md - Subscription framework
- SYSTEM_OPERATIONS.md - Admin workflows
- IMPLEMENTATION_ROADMAP.md - Deployment plan

---

*This specification defines the mobile experience that brings Nepal's digital tourism infrastructure to life in the hands of every citizen and visitor.*
