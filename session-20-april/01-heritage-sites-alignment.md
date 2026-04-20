# Heritage Sites — 3-Layer Alignment

## Source of truth: Supabase `heritage_sites` schema

Bilingual pairs (both `_en` + `_ne` exist in the table):
- `name_en` / `name_ne` (NOT NULL)
- `short_description` / `short_description_ne`
- `full_description` / `full_description_ne`

Structured JSONB columns with fixed shapes:
- `opening_hours` — `{ monday: "HH:MM-HH:MM", ..., sunday: "..." }`
- `entry_fee` — `{ local_adult, local_child, foreign_adult, foreign_child, currency }`
- `accessibility_info` — `{ wheelchair_accessible, parking, restrooms, guide_available }` (booleans)
- `images` — array of URL strings

Enum-constrained:
- `heritage_status` CHECK IN (`world_heritage`, `national`, `provincial`, `local`, `proposed`)
- `status` CHECK IN (`draft`, `published`, `archived`)

Other notable columns: `category_id` (FK INTEGER), `palika_id` (FK INTEGER, required), `ward_number` (1–35 CHECK), `location` (PostGIS geography), `featured_image` (URL), `audio_guide_url`, `languages_available` (TEXT[]), `average_visit_duration_minutes` (INT, >0), `is_featured` (BOOL), `view_count`, `slug` (UNIQUE).

## Critical contradictions

| # | Issue | Admin form sends | Supabase expects | m-place displays | Severity |
|---|---|---|---|---|---|
| 1 | Nepali descriptions missing | `short_description`, `full_description` only | both `_en` + `_ne` pairs | renders `shortDescriptionNe`, `fullDescriptionNe` (empty) | 🔴 |
| 2 | Status enum wrong | `"Active"` / `"Under Renovation"` / `"Restricted"` | `draft` / `published` / `archived` | filters by `status` | 🔴 insert fails |
| 3 | `heritage_status` unseen by form | not captured | one of 5 enum values | prominent badge on card + detail | 🔴 |
| 4 | Category sent as name string | `category: "Temple"` | `category_id` INTEGER FK | shows joined `categoryName` | 🔴 FK violation |
| 5 | JSONB fields sent as plain text | free text for `entry_fee`, `opening_hours`, `accessibility` | structured objects | renders strict shapes | 🔴 |
| 6 | No image upload in form | no `featured_image` / `images[]` inputs | `featured_image TEXT`, `images JSONB[]` | gallery carousel + hero | 🔴 |

## Secondary

**Admin form → Supabase gaps**
- Orphan form fields with **no DB column**: `facilities`, `restrictions`, `contact_info`, `meta_title`, `meta_description`, `keywords`.
- `time_needed` (text) vs `average_visit_duration_minutes` (integer).
- Missing form fields: `is_featured`, `languages_available`, `audio_guide_url`.
- No dynamic edit route (`/heritage-sites/[id]/page.tsx`).

**M-place ↔ Supabase shape mismatch**
- `accessibility` type in m-place expects `{ wheelchairAccessible, guideDogAllowed, audioGuideAvailable }` but the DB stores `{ wheelchair_accessible, parking, restrooms, guide_available }`. → `guideDogAllowed` / `audioGuideAvailable` always undefined; `parking` / `restrooms` never rendered.
- `SupabaseHeritageSiteDatasource` **not implemented** — DI container throws if mock is off.

## Fix plan (in order)

### A. Admin form alignment (no DB change)
1. Add `short_description_ne`, `full_description_ne` textareas next to the English ones.
2. Replace the status dropdown values with the DB enum: `draft` / `published` / `archived`.
3. Add a separate `heritage_status` dropdown (5 enum values).
4. Change category to send `category_id` (number) — bind the `<option value>` to the category id, not the name.
5. Replace plaintext visitor-info fields with structured editors:
   - `opening_hours`: 7-row day/time grid → serialize to `{ monday: "HH:MM-HH:MM", … }`.
   - `entry_fee`: 4 number inputs + currency → `{ local_adult, local_child, foreign_adult, foreign_child, currency }`.
   - `accessibility_info`: 4 checkboxes → `{ wheelchair_accessible, parking, restrooms, guide_available }`.
6. Add `featured_image` (single upload) and `images[]` (multi upload) to Supabase Storage; persist URLs.
7. Add `is_featured` toggle, `languages_available` multi-select, `audio_guide_url` text input.
8. Remove orphan fields (`facilities`, `restrictions`, `contact_info`, SEO group) OR escalate to add DB columns. **Decision this session: remove from form.** If SEO is needed, add columns in a follow-up migration.
9. Implement `/heritage-sites/[id]/page.tsx` edit route that mirrors the create form.

### B. M-place minimal fixes (modifications approved)
10. Fix `accessibility` type in `m-place/src/types/heritage-site.ts` to match DB: `{ wheelchair_accessible, parking, restrooms, guide_available }`. Update `HeritageSiteDetail.tsx` sidebar labels accordingly.
11. Implement `SupabaseHeritageSiteDatasource` in m-place and wire it into the DI container. Keep mock as dev fallback via env flag.

### C. Verification
12. Playwright flow: create a site in admin with full bilingual fields → confirm row shape in Supabase → visit `m-place/heritage-sites/:slug` → verify all fields render in both English and Nepali.

## What's already correct (keep)
- `name_en` / `name_ne` form capture ✔
- `palika_id` as integer FK ✔
- `ward_number`, `address`, `best_time_to_visit`, `slug` (auto) ✔
- M-place card, listing, detail are architecturally clean — only the type shape + datasource need fixing.
