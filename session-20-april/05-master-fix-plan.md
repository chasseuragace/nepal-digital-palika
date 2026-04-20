# Master Fix Plan — Execution Order

Rules of engagement:
- **Supabase schema = contract.** Admin and m-place must conform.
- **Admin first.** The admin panel is the site of truth for data entry; fixing it closes most gaps without touching m-place.
- **M-place only where absolutely necessary** — enumerated items only.
- **Marketplace is not part of this session.** Skip.

## Phase 0 — Shared groundwork (once, benefits all features)

1. Extract the shared admin-page design system (header + container + form-card + btn + alert + tabs) into a single CSS module or reusable React components that every admin page imports. Right now heritage-sites and events each carry their own copy — consolidate.
2. Create a common `useLoggedInAdmin()` hook so every form knows the author/admin id + the palika scope without re-implementing it.

## Phase 1 — Admin form fixes (no DB migrations)

| Feature | Task | Why it's first |
|---|---|---|
| Heritage Sites | Add Nepali description pair, correct status enum, add `heritage_status`, fix category to FK id, structured JSONB editors, image uploads, remove orphan fields, add edit route | Immediate data-correctness win; nothing in DB changes |
| Events | Rename payload keys to `name_en/_ne`, remove orphan fields, add DB-backed fields (`category_id`, `is_festival`, `nepali_calendar_date`, `recurrence_pattern`, `venue_name`, lat/lng → PostGIS, bilingual descriptions, featured image), unify create/edit | Same |
| Blog Posts | Build create and edit forms from scratch with react-quill, bilingual title/excerpt/content, tags, category, status, featured image | Blocks content authoring — highest user impact |
| Palika Profile | Refactor UI to match heritage-sites/events; add contact-info fields; validate JSONB shapes | UI consistency + data-loss fix |

## Phase 2 — M-place changes (only the minimum)

Approved m-place modifications, limited to:

1. **Blog Posts:** add `DOMPurify` sanitization around `dangerouslySetInnerHTML` in `BlogPostDetail.tsx`. **Non-negotiable — this is an XSS hole.**
2. **Heritage Sites:** fix the `accessibility` type shape in `m-place/src/types/heritage-site.ts` to match DB (`wheelchair_accessible`, `parking`, `restrooms`, `guide_available`) and update the rendering labels in `HeritageSiteDetail.tsx`.
3. **All four features:** implement the Supabase datasources in `m-place/src/data/datasources/supabase/` for `heritage-sites`, `events`, `blog-posts`, `palika-profile`. Wire into the DI container. Keep mock as dev fallback gated by `VITE_USE_MOCK_DATA`.
4. **Palika Profile / About:** render `description_ne`, highlight images, videos section; drop hardcoded `FALLBACK_PALIKA_DATA`.

Everything else in m-place stays untouched.

## Phase 3 — Data-sync + integrity

1. Palika gallery sync: write `palika_gallery` rows into `palika_profiles.gallery_images` on save.
2. Add Zod validation on the admin API routes for all JSONB payloads.
3. Add RLS-aware smoke tests that create → read → delete for each entity, confirming no silent drop of fields between layers.

## Phase 4 — Verification (Playwright)

One end-to-end test per feature, all run with `NEXT_PUBLIC_USE_MOCK_AUTH=false` and a real Supabase instance:

- **Heritage Sites:** create site → row shape correct → m-place detail renders English + Nepali + gallery + structured opening hours.
- **Events:** create festival with `is_festival=true`, Nepali calendar date, bilingual descriptions → m-place listing + detail correct.
- **Blog Posts:** author bilingual post with HTML (inject `<script>`) → m-place detail sanitizes it; both languages visible if toggle implemented, otherwise English visible + DB has both.
- **Palika Profile:** fill every tab in admin → About page reflects everything + Nepali description + highlight images + videos.

## Deferred (out of scope this session)

- Marketplace section of the admin panel — dedicated session.
- Blog posts `category` → FK migration.
- Events: converting `start_date`/`end_date` to TIMESTAMPTZ if time-of-day becomes a requirement.
- Events: adding columns for the organizer / entry-fee / capacity / registration flags that the old form was capturing (DB migration).
- Palika Profile: adding `_ne` variants for highlight titles/descriptions and for `best_time_to_visit` / `accessibility`.
- Global m-place language switcher — will be part of a dedicated i18n session.

## Order of work for the next active session

1. Heritage Sites admin form (Phase 1) — end-to-end, including edit route.
2. Events admin form (Phase 1) — unify create/edit.
3. Blog Posts admin create + edit forms (Phase 1) — new work, biggest delta.
4. Palika Profile UI refactor + field additions (Phase 1) + m-place About display tweaks (Phase 2 #4).
5. M-place minimum edits batch: DOMPurify + accessibility type fix + four Supabase datasources.
6. Playwright verification.

After Phase 1 is green, pause, demo, then schedule Phase 3 data-integrity work + the deferred items.
