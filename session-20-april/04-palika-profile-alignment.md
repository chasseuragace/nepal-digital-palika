# Palika Profile — 3-Layer Alignment + UI Consistency

The palika profile admin page feeds the **m-place About page**. Two problems to solve: (1) UI of the admin page is wildly inconsistent with the other admin pages; (2) several captured fields are not displayed in m-place, and one displayed field is not captured.

## Source of truth

Two tables feed the About page:

### `palika_profiles` (per-palika content)
- `palika_id` (FK UNIQUE)
- `description_en` / `description_ne` (bilingual)
- `featured_image` (URL)
- `gallery_images` JSONB (array of URL strings)
- `highlights` JSONB — array of `{ title, description, image_url? }`
- `tourism_info` JSONB — `{ best_time_to_visit, accessibility, languages: [], currency, image_url? }`
- `demographics` JSONB — `{ population, area_sq_km, established_year }`
- `videos` TEXT[] — array of YouTube URLs

### `palikas` (base palika)
- `name_en` / `name_ne`, `total_wards`, `office_phone`, `office_email`, `website`, `district_id` (→ `districts.name_en`, → `provinces.name_en`)

### `palika_gallery` (storage-backed image uploads)
Separate table used by the admin gallery picker. **Note:** there is no code that syncs `palika_gallery` rows into `palika_profiles.gallery_images` — m-place reads from the JSONB field, so uploads through the gallery table never reach m-place. See Fix #2 below.

## Field alignment matrix

| Field | Captured in admin | Stored in DB | Displayed in m-place About | Verdict |
|---|---|---|---|---|
| `description_en` | ✅ | ✅ | ✅ | OK |
| `description_ne` | ✅ | ✅ | ❌ only English rendered | 🔴 |
| `featured_image` | ✅ | ✅ | ✅ | OK |
| `gallery_images` | ⚠️ (via separate `palika_gallery` table, not synced into JSONB) | ✅ | ✅ | 🔴 sync missing |
| `highlights[].title` | ✅ | ✅ | ✅ | OK |
| `highlights[].description` | ✅ | ✅ | ✅ | OK |
| `highlights[].image_url` | ✅ | ✅ | ❌ never displayed | 🟠 |
| `tourism_info.best_time_to_visit` | ✅ | ✅ | ✅ | OK |
| `tourism_info.accessibility` | ✅ | ✅ | ✅ | OK |
| `tourism_info.languages` | ✅ | ✅ | ✅ | OK |
| `tourism_info.currency` | ✅ | ✅ | ❌ never displayed | 🟡 |
| `tourism_info.image_url` | ✅ | ✅ | ❌ never displayed | 🟡 |
| `demographics.population` / `area_sq_km` / `established_year` | ✅ | ✅ | ✅ | OK |
| `videos` | ✅ (YouTube URLs) | ✅ | ❌ never displayed | 🟠 |
| `total_wards`, `office_phone`, `office_email`, `website` | ❌ not editable in profile form | ✅ (on `palikas` table) | ✅ | 🟠 fragmented — contact info lives elsewhere |
| `district_name`, `province_name` | derived | derived | ✅ | OK |

## UI consistency — admin page vs heritage-sites/events pages

The palika-profile page (`/admin-panel/app/palika-profile/page.tsx`) is the outlier:

| Dimension | palika-profile | heritage-sites / events | Fix |
|---|---|---|---|
| Page header | plain `<h1>` | `.heritage-page-header` (gradient, icon box, subtitle, back button) | adopt the same component/markup |
| Form container | none | `.heritage-form-container` (white card, shadow, fade-in) | wrap in same container |
| Form cards | generic `.card` (4px radius, 1px border) | `.form-card` (16px radius, 2px border, hover lift, gradient icon chip) | swap class |
| Multi-step tabs | none — everything on one page | 4-step wizard with progress bar | refactor into tabs: **Overview / Tourism / Highlights & Gallery / Media (videos)** |
| Inputs | inline styles, 10px padding, 4px radius | `.form-input` / `.form-textarea` / `.form-select` classes, focus ring, 10px radius | swap to classes |
| Buttons | 7 distinct inline color codes | `.btn` + `.btn-primary` / `.btn-secondary` | swap to classes |
| Alerts | inline styles, no icon | `.alert` + `.alert-success` / `.alert-error`, gradient, icon, slide-in | swap to classes |
| Grid layouts | single column | `.grid-2` / `.grid-3` | use grid for demographics, tourism info |
| Animations | none | fadeIn, slideInUp | inherit from shared CSS |
| Required markers | none | `<span className="required">*</span>` | add for required fields |
| Border radius / spacing | tight (4px / 10–20px) | modern (10–16px / 20–32px) | follow the same tokens |

**Overall:** adopt the same CSS file pattern used by heritage-sites/events (shared base styles). No new design system is needed — the design already exists on sibling pages; palika-profile just predates it.

## Critical issues (priority-ordered)

**🔴 P0 — data loss / wrong display**
1. `gallery_images` JSONB not synced from `palika_gallery` uploads.
2. `description_ne` captured, stored, but m-place renders only `description_en`.
3. Contact info (`office_phone`, `office_email`, `website`) must be editable here — right now the admin has to go to a different screen.

**🟠 P1 — captured but invisible**
4. Highlight images uploaded but m-place doesn't render them.
5. Videos captured but m-place has no video section.

**🟠 P1 — UI consistency**
6. Refactor the admin page to match heritage-sites/events UI (see table above).

**🟡 P2 — polish**
7. Remove / document unused `currency` and `tourism_info.image_url` fields (decide in next session).
8. Add Nepali variants for `highlights[].title_ne` and `highlights[].description_ne` in both DB and form (requires migration — defer).
9. Add JSONB shape validation (Zod) in the API route.

## Fix plan

### A. Admin
1. Refactor `/admin-panel/app/palika-profile/page.tsx`:
   - Adopt `.heritage-page-header`, `.heritage-form-container`, `.form-card`, `.btn`, `.form-input`, `.form-label`, `.alert` classes.
   - Split into 4 tabs: **Overview** (descriptions + featured image + contact info) / **Tourism** (best time, accessibility, languages) / **Highlights & Gallery** (highlights array + gallery) / **Media** (videos).
   - Add fields for `office_phone`, `office_email`, `website`, `total_wards` (from `palikas`). Extend the API route to upsert these onto `palikas` as part of the same save.
2. Sync `palika_gallery` → `palika_profiles.gallery_images`:
   - On save, fetch all gallery rows for this palika, build URL list, write to `gallery_images` JSONB.
3. Add client + server validation for JSONB shapes (`highlights`, `tourism_info`, `demographics`) using Zod.

### B. M-place (modifications approved — About is the one page the audit mandates)
4. Render `description_ne` below or in a toggle with `description_en` in `About.tsx`.
5. Render `highlights[].image_url` inside each highlight card.
6. Add a "Featured Videos" section that embeds each `videos[i]` URL as a YouTube iframe.
7. Remove the hardcoded `FALLBACK_PALIKA_DATA` in favor of an empty-state + retry UI (don't mislead users with dummy data).

### C. Verification
8. Playwright: open palika-profile admin, fill every tab, save → refresh m-place About → confirm every field surfaces, including Nepali description, highlight images, and video embeds.

## What's already correct (keep)
- Schema is well-designed. Bilingual description pair exists; demographics and tourism_info JSONB shapes are reasonable.
- The admin page is functionally wired — only the UI and a few field gaps need fixing.
