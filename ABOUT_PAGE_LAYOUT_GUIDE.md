# About Page - Layout & UI Guide

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVBAR                               │
│  Logo  Search  Home  Browse  About  Sell  Favorites  Login  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  About Kathmandu Metropolitan City                           │
│  काठमाडौं महानगरपालिका                                      │
│                                                              │
│  ⚠️ Using cached information. Some details may not be...    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    MAIN CONTENT GRID                         │
│                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────┐  │
│  │                                 │  │                  │  │
│  │  OVERVIEW CARD (2/3 width)      │  │ LOCATION CARD    │  │
│  │                                 │  │ (1/3 width)      │  │
│  │  Description text...            │  │                  │  │
│  │                                 │  │ 📍 Location      │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐    │  │                  │  │
│  │  │Wards │ │Est.  │ │Pop.  │    │  │ District:        │  │
│  │  │ 32   │ │2017  │ │1.5M  │    │  │ Kathmandu        │  │
│  │  └──────┘ └──────┘ └──────┘    │  │                  │  │
│  │                                 │  │ Province:        │  │
│  └─────────────────────────────────┘  │ Bagmati          │  │
│                                        └──────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   CONTACT INFORMATION                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Email        │  │ Phone        │  │ Website      │      │
│  │              │  │              │  │              │      │
│  │ info@...     │  │ +977-1-...   │  │ Visit Website│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   INFO SECTION                               │
│                                                              │
│  👥 Supporting Local Commerce                               │
│                                                              │
│  This marketplace is dedicated to supporting local          │
│  businesses and artisans in Kathmandu Metropolitan City.    │
│  Browse our collection of locally-sourced products and     │
│  support your community.                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        FOOTER                               │
└─────────────────────────────────────────────────────────────┘
```

## Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  About Kathmandu Metropolitan City                           │
│  काठमाडौं महानगरपालिका                                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ Using cached information...                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────┐  ┌────────────────┐  │
│  │                                  │  │                │  │
│  │  OVERVIEW (2/3)                  │  │ LOCATION (1/3) │  │
│  │                                  │  │                │  │
│  │  Description...                  │  │ 📍 District    │  │
│  │                                  │  │    Kathmandu   │  │
│  │  ┌────┐ ┌────┐ ┌────┐           │  │                │  │
│  │  │ 32 │ │2017│ │1.5M│           │  │ Province       │  │
│  │  └────┘ └────┘ └────┘           │  │ Bagmati        │  │
│  │                                  │  │                │  │
│  └──────────────────────────────────┘  └────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CONTACT INFORMATION                                 │  │
│  │                                                      │  │
│  │ Email: info@...    Phone: +977-1-...  Website: ... │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👥 Supporting Local Commerce                         │  │
│  │ This marketplace is dedicated to supporting local... │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout (<768px)

```
┌──────────────────────────────┐
│                              │
│ About Kathmandu...           │
│ काठमाडौं महानगरपालिका        │
│                              │
│ ⚠️ Using cached info...      │
│                              │
│ ┌──────────────────────────┐ │
│ │ OVERVIEW                 │ │
│ │                          │ │
│ │ Description...           │ │
│ │                          │ │
│ │ ┌────┐ ┌────┐ ┌────┐   │ │
│ │ │ 32 │ │2017│ │1.5M│   │ │
│ │ └────┘ └────┘ └────┘   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ LOCATION                 │ │
│ │                          │ │
│ │ 📍 District: Kathmandu   │ │
│ │ Province: Bagmati        │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ CONTACT                  │ │
│ │                          │ │
│ │ Email: info@...          │ │
│ │ Phone: +977-1-...        │ │
│ │ Website: Visit Website   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 👥 Supporting Local...   │ │
│ │ This marketplace is...   │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

## Component Breakdown

### 1. Header Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  About Kathmandu Metropolitan City                           │
│  काठमाडौं महानगरपालिका                                      │
│                                                              │
│  ⚠️ Using cached information. Some details may not be...    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Elements**:
- Main heading (h1): Palika name in English
- Subheading: Palika name in Nepali
- Error banner (if applicable): Warning about cached data

**Styling**:
- Background: Gradient (green-50 → emerald-50 → teal-50)
- Text: Large, bold heading
- Spacing: Generous padding

### 2. Overview Card

```
┌──────────────────────────────────────────────────────────┐
│ Overview                                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ The capital city of Nepal, known for its rich cultural  │
│ heritage and tourism.                                   │
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Total Wards  │ │ Established  │ │ Population   │    │
│ │              │ │              │ │              │    │
│ │      32      │ │     2017     │ │     1.5M     │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
- Card title: "Overview"
- Description text
- Statistics grid (3 columns)
  - Total Wards
  - Established Year
  - Population

**Styling**:
- Card: White background, shadow
- Stats: Colored backgrounds (emerald, blue, purple)
- Text: Responsive font sizes

### 3. Location Card

```
┌──────────────────────────────┐
│ 📍 Location                  │
├──────────────────────────────┤
│                              │
│ District                     │
│ Kathmandu                    │
│                              │
│ Province                     │
│ Bagmati                      │
│                              │
└──────────────────────────────┘
```

**Elements**:
- Card title with icon
- District name
- Province name

**Styling**:
- Card: White background
- Icon: Emerald color
- Text: Organized in sections

### 4. Contact Information Card

```
┌──────────────────────────────────────────────────────────┐
│ 🏆 Contact Information                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Email        │ │ Phone        │ │ Website      │    │
│ │              │ │              │ │              │    │
│ │ info@...     │ │ +977-1-...   │ │ Visit Website│    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
- Card title with icon
- Three columns:
  - Email (clickable link)
  - Phone (clickable link)
  - Website (clickable link)

**Styling**:
- Card: White background
- Links: Emerald color, hover effect
- Responsive: Stacks on mobile

### 5. Info Section

```
┌──────────────────────────────────────────────────────────┐
│ 👥 Supporting Local Commerce                             │
│                                                          │
│ This marketplace is dedicated to supporting local        │
│ businesses and artisans in Kathmandu Metropolitan City.  │
│ Browse our collection of locally-sourced products and   │
│ support your community.                                  │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
- Icon: Users icon
- Title: "Supporting Local Commerce"
- Description text

**Styling**:
- Background: Emerald-50
- Border: Emerald-200
- Text: Organized with icon

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Emerald | #10b981 |
| Secondary | Blue | #3b82f6 |
| Accent | Purple | #a855f7 |
| Background | Green-50 | #f0fdf4 |
| Card | White | #ffffff |
| Text | Gray-900 | #111827 |
| Muted | Gray-600 | #4b5563 |

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Main Heading | System | 2.25rem (36px) | Bold (700) |
| Subheading | System | 1.125rem (18px) | Regular (400) |
| Card Title | System | 1.25rem (20px) | Semibold (600) |
| Body Text | System | 1rem (16px) | Regular (400) |
| Small Text | System | 0.875rem (14px) | Regular (400) |
| Label | System | 0.875rem (14px) | Regular (400) |

## Spacing

| Element | Spacing |
|---------|---------|
| Container padding | 1rem (mobile), 1.5rem (desktop) |
| Section margin | 3rem (12px) |
| Card padding | 1.5rem (24px) |
| Grid gap | 1.5rem (24px) |
| Element spacing | 0.5rem - 1rem |

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768px | Single column |
| Tablet | 768px - 1024px | 2 columns |
| Desktop | > 1024px | 3 columns |

## Interactive Elements

### Links

```
Email: info@kathmandu.gov.np
       └─ Hover: Underline, darker color
       └─ Click: Opens email client

Phone: +977-1-4262000
       └─ Hover: Underline, darker color
       └─ Click: Opens phone dialer

Website: Visit Website
         └─ Hover: Underline, darker color
         └─ Click: Opens in new tab
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    ⟳ Loading...                             │
│                                                              │
│              Loading palika information...                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ⚠️ Unable to Load                                           │
│                                                              │
│  Could not load palika information. Please try again later. │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy (h1, h2, etc.)
- **Color Contrast**: WCAG AA compliant
- **Icons + Text**: Icons paired with text labels
- **Link Targets**: Clear, descriptive link text
- **Error Messages**: Clear, actionable error text
- **Loading States**: Visual feedback during data fetch

## Animation & Transitions

- **Page Load**: Fade-in animation
- **Hover States**: Smooth color transitions (300ms)
- **Loading Spinner**: Continuous rotation
- **Error Banner**: Slide-in animation

## Print Styles

When printed, the page:
- Removes navigation and footer
- Hides interactive elements
- Optimizes for black & white
- Maintains readability

---

**Last Updated**: March 25, 2026
**Version**: 1.0
