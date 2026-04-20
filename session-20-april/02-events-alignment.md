# Events / Festivals — 3-Layer Alignment

## Source of truth: Supabase `events` schema

Bilingual pairs:
- `name_en` / `name_ne` (NOT NULL)
- `short_description` / `short_description_ne`
- `full_description` / `full_description_ne`

No `_ne` for: `venue_name`, `address` (and `address` doesn't even exist as a column — see below).

Enum-constrained:
- `status` CHECK IN (`draft`, `published`, `archived`) — **no `cancelled`.**

Other notable columns: `palika_id` (FK, required), `category_id` (FK, optional), `event_type` (free VARCHAR), `is_festival` (BOOL), `nepali_calendar_date`, `recurrence_pattern`, `start_date` / `end_date` (DATE, no time component), `location` (PostGIS geography), `venue_name`, `featured_image`, `images` (JSONB array), `slug` (UNIQUE), `scheduled_at`.

## Critical contradictions

| # | Issue | Admin form sends | Supabase expects | m-place displays | Severity |
|---|---|---|---|---|---|
| 1 | Field name mismatch | `name_english` / `name_nepali` | `name_en` / `name_ne` | reads `name_en` / `name_ne` | 🔴 payload keys wrong |
| 2 | Status enum wrong | includes `"cancelled"` | `draft` / `published` / `archived` only | filters `status='published'` | 🔴 insert fails |
| 3 | Orphan form fields (no DB column) | `ward_number`, `address`, `organizer`, `contact_info`, `entry_fee`, `capacity`, `registration_required`, `meta_title`, `meta_description`, `keywords`, `url_slug`, `start_time`, `end_time` | none of these columns exist | — | 🔴 silent data loss |
| 4 | DB fields missing from form | — | `category_id`, `is_festival`, `nepali_calendar_date`, `recurrence_pattern`, `venue_name`, `location`, `scheduled_at` | m-place renders `nepaliCalendarDate`, `recurrencePattern`, `venueName`, `location` map link | 🔴 |
| 5 | Missing Nepali descriptions in edit form | edit page has single `description` (no `_ne`, and no short/full split) | both pairs present | renders both | 🔴 |
| 6 | Create vs edit form disagree | different field sets, different `event_type` options, different organizer field names (`organizer` vs `organizer_name`) | one contract | one contract | 🔴 inconsistent UX |
| 7 | Time capture impossible in DB | edit form captures `start_time` / `end_time` | `start_date` / `end_date` are DATE only | — | 🔴 time data lost |

## Secondary

- No category selector in form (DB has `category_id` FK).
- `is_festival` inferred from `event_type` dropdown — brittle; should be a distinct BOOL toggle.
- `featured_image` upload missing (edit has a URL input, create doesn't).
- M-place lacks a SupabaseEventDatasource (mock-only).
- M-place `venue_name` displayed in English only — DB has no `venue_name_ne` yet; OK for this session but note as future work.

## Fix plan (in order)

### A. Admin form alignment (no DB change)
1. Rename form state keys `name_english` → `name_en`, `name_nepali` → `name_ne` (or map in submit handler).
2. Status dropdown = `draft` / `published` / `archived`. Remove `cancelled`.
3. **Delete** orphan fields that have no DB home: `ward_number`, `address`, `organizer`, `contact_info`, `entry_fee`, `capacity`, `registration_required`, SEO block, `url_slug` (auto-generated), `start_time`, `end_time`.
   - *Note:* some of these (organizer, entry_fee, capacity, registration_required) are genuinely valuable. If the team wants them, the **correct** path is a migration to add columns — escalate to next session; for now do not capture them.
4. **Add** DB-backed fields the form doesn't yet have:
   - `category_id` dropdown (from categories where `entity_type='event'`).
   - `is_festival` boolean toggle (distinct from `event_type`).
   - `nepali_calendar_date` text input.
   - `recurrence_pattern` select (`none`, `daily`, `weekly`, `monthly`, `yearly`).
   - `venue_name` text input.
   - `latitude` / `longitude` pair (create form is missing these; wire both create and edit to serialize into `location` PostGIS POINT).
   - `short_description_ne`, `full_description_ne` on **both** create and edit.
   - `featured_image` upload (both create and edit).
5. Unify create and edit forms — identical field set, identical component, identical `event_type` options. Drive both from the same component/schema.
6. Remove `start_time` / `end_time` inputs until the DB has a TIMESTAMPTZ column to store them. If the team needs time-of-day, raise a migration to change `start_date`/`end_date` to TIMESTAMPTZ (follow-up session).

### B. M-place minimal fixes
7. Implement `SupabaseEventDatasource` and wire DI. Keep mock as dev fallback.
8. No other m-place changes required — existing display already matches DB shape for the fields we care about.

### C. Verification
9. Playwright flow: create a festival with `is_festival=true`, bilingual descriptions, `nepali_calendar_date` set → verify DB row → verify m-place Events listing and detail page render correctly.

## What's already correct (keep)
- `start_date`, `end_date`, `event_type`, `status`, `palika_id`, `venue_name` flow end-to-end.
- `short_description_*` and `full_description_*` exist in DB and m-place types.
- M-place card, listing, detail are architecturally clean.
