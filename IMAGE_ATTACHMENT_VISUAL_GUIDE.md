# Image Attachment - Visual Guide

**Last Updated**: March 22, 2026

---

## Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Palika Profile Management                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Descriptions                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Description (English)                                   │ │
│ │ [textarea]                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Description (Nepali)                                    │ │
│ │ [textarea]                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Featured Image                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Featured Image URL                                      │ │
│ │ [input field] [📷 Select from Gallery]                 │ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Highlights                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Highlight 1 Title                                       │ │
│ │ [input field]                                           │ │
│ │                                                         │ │
│ │ Highlight 1 Description                                 │ │
│ │ [textarea]                                              │ │
│ │                                                         │ │
│ │ Highlight 1 Image                                       │ │
│ │ [input field] [📷 Select]                              │ │
│ │ [Image Preview]                                         │ │
│ │                                                         │ │
│ │ [Remove Highlight]                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Highlight 2 Title                                       │ │
│ │ [input field]                                           │ │
│ │                                                         │ │
│ │ Highlight 2 Description                                 │ │
│ │ [textarea]                                              │ │
│ │                                                         │ │
│ │ Highlight 2 Image                                       │ │
│ │ [input field] [📷 Select]                              │ │
│ │ [Image Preview]                                         │ │
│ │                                                         │ │
│ │ [Remove Highlight]                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [Add Highlight]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Tourism Information                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Best Time to Visit                                      │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Accessibility Information                               │ │
│ │ [textarea]                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Languages (comma-separated)                             │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Currency                                                │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tourism Information Image                               │ │
│ │ [input field] [📷 Select from Gallery]                 │ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Demographics                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Population                                              │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Area (sq km)                                            │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Established Year                                        │ │
│ │ [input field]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

[Save Palika Profile]
```

---

## Gallery Modal Flow

### Step 1: Click Image Picker Button
```
Highlights Section
┌─────────────────────────────────────────┐
│ Highlight 1 Image                       │
│ [input field] [📷 Select] ← Click here  │
└─────────────────────────────────────────┘
```

### Step 2: Modal Opens
```
┌─────────────────────────────────────────────────────────────┐
│ Select Image from Gallery                        [Close]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Images] [Documents]                                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │  │          │   │
│  │ Image 1  │  │ Image 2  │  │ Image 3  │  │ Image 4  │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  image1.jpg    image2.jpg    image3.jpg    image4.jpg      │
│  102 KB        256 KB        512 KB        1.2 MB          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │  │          │   │
│  │ Image 5  │  │ Image 6  │  │ Image 7  │  │ Image 8  │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  image5.jpg    image6.jpg    image7.jpg    image8.jpg      │
│  789 KB        345 KB        567 KB        890 KB          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Click Image
```
┌─────────────────────────────────────────────────────────────┐
│ Select Image from Gallery                        [Close]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Images] [Documents]                                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │  │          │   │
│  │ Image 1  │  │ Image 2  │  │ Image 3  │  │ Image 4  │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │ ✓ Image  │  │          │   │
│  │ Image 5  │  │ Image 6  │  │ 7 (SEL)  │  │ Image 8  │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    ↓ Click Image 7
```

### Step 4: Modal Closes & URL Populates
```
Highlights Section
┌─────────────────────────────────────────────────────────────┐
│ Highlight 1 Image                                           │
│ [https://supabase.../image7.jpg] [📷 Select]              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              [Image Preview Displays]                  │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Image Attachment Points

### Featured Image
```
┌─────────────────────────────────────────────────────────────┐
│ Featured Image                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Featured Image URL                                      │ │
│ │ [input] [📷 Select from Gallery] ← Image Picker        │ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Highlights (Multiple)
```
┌─────────────────────────────────────────────────────────────┐
│ Highlights                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Highlight 1 Title: [input]                              │ │
│ │ Highlight 1 Description: [textarea]                     │ │
│ │ Highlight 1 Image: [input] [📷 Select] ← Image Picker  │ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Highlight 2 Title: [input]                              │ │
│ │ Highlight 2 Description: [textarea]                     │ │
│ │ Highlight 2 Image: [input] [📷 Select] ← Image Picker  │ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [Add Highlight]                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tourism Information
```
┌─────────────────────────────────────────────────────────────┐
│ Tourism Information                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Best Time to Visit: [input]                             │ │
│ │ Accessibility Information: [textarea]                   │ │
│ │ Languages: [input]                                      │ │
│ │ Currency: [input]                                       │ │
│ │ Tourism Information Image: [input] [📷 Select] ← Picker│ │
│ │ [Image Preview]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User Action
    ↓
Click "📷 Select" Button
    ↓
openGalleryModal(field) called
    ↓
showGalleryModal = true
selectedImageField = 'highlight_0' (or 'tourism_info', etc.)
    ↓
Gallery Modal Renders
    ↓
User Clicks Image
    ↓
handleImageSelect(item) called
    ↓
Construct Public URL from storage_path
    ↓
Update formData[field] with URL
    ↓
Modal Closes
    ↓
Image Preview Displays
    ↓
User Clicks "Save Palika Profile"
    ↓
PUT /api/palika-profile with formData
    ↓
Profile Saved to Database
    ↓
Success Message Displays
```

---

## Keyboard Navigation

```
Tab through form fields:
  Description (English)
  ↓
  Description (Nepali)
  ↓
  Featured Image URL
  ↓
  Featured Image Gallery Button
  ↓
  Highlight 1 Title
  ↓
  Highlight 1 Description
  ↓
  Highlight 1 Image URL
  ↓
  Highlight 1 Gallery Button
  ↓
  Remove Highlight Button
  ↓
  Add Highlight Button
  ↓
  ... (more highlights)
  ↓
  Best Time to Visit
  ↓
  Accessibility Information
  ↓
  Languages
  ↓
  Currency
  ↓
  Tourism Information Image URL
  ↓
  Tourism Information Gallery Button
  ↓
  Population
  ↓
  Area (sq km)
  ↓
  Established Year
  ↓
  Save Palika Profile Button

In Modal:
  Gallery Images (click to select)
  ↓
  Close Button

Escape Key: Close Modal
```

---

## Mobile View

```
┌──────────────────────────────┐
│ Palika Profile Management    │
├──────────────────────────────┤
│                              │
│ Featured Image               │
│ ┌──────────────────────────┐ │
│ │ [input field]            │ │
│ │ [📷 Select from Gallery] │ │
│ │ [Image Preview]          │ │
│ └──────────────────────────┘ │
│                              │
│ Highlights                   │
│ ┌──────────────────────────┐ │
│ │ Highlight 1 Title        │ │
│ │ [input]                  │ │
│ │                          │ │
│ │ Highlight 1 Description  │ │
│ │ [textarea]               │ │
│ │                          │
│ │ Highlight 1 Image        │ │
│ │ [input]                  │ │
│ │ [📷 Select]              │ │
│ │ [Image Preview]          │ │
│ └──────────────────────────┘ │
│                              │
│ Tourism Information          │
│ ┌──────────────────────────┐ │
│ │ Best Time to Visit       │ │
│ │ [input]                  │ │
│ │                          │
│ │ Accessibility            │ │
│ │ [textarea]               │ │
│ │                          │
│ │ Languages                │ │
│ │ [input]                  │ │
│ │                          │
│ │ Currency                 │ │
│ │ [input]                  │ │
│ │                          │
│ │ Tourism Image            │ │
│ │ [input]                  │ │
│ │ [📷 Select from Gallery] │ │
│ │ [Image Preview]          │ │
│ └──────────────────────────┘ │
│                              │
│ [Save Palika Profile]        │
└──────────────────────────────┘
```

---

## Summary

✅ **3 Image Attachment Points**:
1. Featured Image (single)
2. Highlights (multiple, one per highlight)
3. Tourism Information (single)

✅ **Same Gallery Modal** for all image pickers

✅ **Image Preview** displays below each field

✅ **Manual URL Entry** available as fallback

✅ **Fully Responsive** on all devices

✅ **Keyboard Accessible** with Tab and Escape keys

