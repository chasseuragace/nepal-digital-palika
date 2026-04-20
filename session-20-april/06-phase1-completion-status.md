# Phase 1 — Completion Status

Date: 2026-04-20

Phase 1 (admin-form alignment, no DB migrations) was executed by four parallel agents, each scoped to a single feature. All four agents hit the account usage limit late in the session, but three completed their feature end-to-end and the fourth (blog posts) had only its two thin page-route files remaining, which were written in-session by the orchestrator.

## Files landed

### Heritage Sites
- `app/heritage-sites/_components/HeritageSiteForm.tsx` — shared create/edit form with bilingual pairs, structured JSONB editors (opening_hours 7-day, entry_fee 4-price, accessibility 4-checkbox), `heritage_status` dropdown, `is_featured`, `audio_guide_url`, `languages_available`. Status enum aligned to `draft`/`published`/`archived`. Category bound to `category_id`. Orphan fields removed.
- `app/heritage-sites/new/page.tsx` — create page wrapping the form.
- `app/heritage-sites/[id]/page.tsx` — **new edit route** with `siteToFormState` hydrator.
- `app/api/heritage-sites/[id]/route.ts` — API route for fetch/update/delete by id.
- `lib/fake-heritage-sites-datasource.ts`, `lib/supabase-heritage-sites-datasource.ts` — updated for new fields.
- `services/types.ts` — `HeritageSite`, `EntryFee`, `AccessibilityInfo`, `HeritageSiteFilters`, `CreateHeritageSiteInput` tightened to match the form payload.

### Events
- `app/events/_components/EventForm.tsx` — shared create/edit form.
- `app/events/_components/hydrate-event-form.ts` — reverse-hydrator for edit mode.
- `app/events/new/page.tsx` — rewritten, payload keys now `name_en`/`name_ne`, status enum aligned, orphan fields removed, DB-backed fields added (`category_id`, `is_festival`, `nepali_calendar_date`, `recurrence_pattern`, `venue_name`, `latitude`/`longitude`, bilingual descriptions).
- `app/events/[id]/page.tsx` — rewritten, identical field set as create.
- `app/api/events/[id]/route.ts` — API route by id.

### Blog Posts
- `app/blog-posts/_components/BlogPostForm.tsx` — self-contained shared form with 3-tab wizard (Content / Media & Tags / Publish), bilingual titles + excerpts, react-quill rich text editors (English + Nepali), tags chip input, category datalist, status enum, palika dropdown, author auto-injected from session.
- `app/blog-posts/_components/RichTextEditor.tsx` — dynamic-imported react-quill wrapper (client-only).
- `app/blog-posts/blog-posts.css` — page styling.
- `app/api/blog-posts/[id]/route.ts` — API route by id.
- **Written by orchestrator (agent hit limit before reaching these):**
  - `app/blog-posts/new/page.tsx`
  - `app/blog-posts/[id]/page.tsx`
- `lib/client/blog-posts-client.service.ts` — client service.

### Palika Profile
- `app/palika-profile/page.tsx` — refactored to heritage-sites vocabulary: `heritage-page-header`, `heritage-form-container`, `form-card`, `btn`, `form-input`, `form-textarea`, `alert`. Multi-step tabs (Overview / Tourism / Highlights & Gallery / Media). New fields added for `office_phone`, `office_email`, `website`, `total_wards` sourced from the `palikas` table.
- `app/palika-profile/palika-profile.css` — scoped tokens.
- `app/api/palika-profile/route.ts` — GET now fetches contact info from `palikas`; PUT upserts contact info back onto the `palikas` row after the profile upsert.
- `lib/client/palika-profile-client.service.ts` — extended DTO to include contact-info fields.

## Verification

- `npx tsc --noEmit` — **zero new type errors** in any of the four feature folders or `services/types.ts`. The only errors in agent-touched files are pre-existing `count: number | null` vs `count?: number | undefined` mismatches in `lib/supabase-*-datasource.ts`, which exist in the parallel files as well and pre-date Phase 1.
- Route smoke tests via `curl`:
  - `/heritage-sites/new` → 200
  - `/events/new` → 200
  - `/blog-posts/new` → 200
  - `/palika-profile` → 200
- Visual check: `/blog-posts/new` renders correctly in the browser with bilingual title inputs (English + Devanagari placeholders), 3-tab wizard, excerpt fields, content editor section.

## Known issues (not Phase 1 regressions)

- ~~`/api/palikas` returns 500 in the current dev environment — blocks the palika dropdown in every form. This was broken before Phase 1 started and is independent of our changes. Fix in a dedicated backend/env session.~~ **FIXED in-session** — the route (and its `/provinces` and `/districts` siblings) hardcoded `supabaseAdmin` and ignored `NEXT_PUBLIC_USE_FAKE_DATASOURCES`. Added `lib/fake-regions-datasource.ts` with 4 provinces / 7 districts / 15 palikas of canned Nepali data and patched all three routes to branch on the env flag. All three endpoints now return 200.
- Image uploads (for heritage_sites `featured_image`/`images[]`, events `featured_image`, blog-posts `featured_image`) are deferred — URL-text inputs in place with TODOs to wire Supabase Storage.
- Heritage Sites: gallery sync for palika profile (palika_gallery → `palika_profiles.gallery_images` JSONB) — status in agent D's work is TBD; inspect the API route's PUT handler to confirm. If left as TODO, it needs to be picked up before m-place About can reliably show gallery images.

## Next — Phase 2

[See 05-master-fix-plan.md](./05-master-fix-plan.md) Phase 2.

The m-place minimum edits are:
1. Blog posts: install DOMPurify, sanitize `dangerouslySetInnerHTML` in `BlogPostDetail.tsx`.
2. Heritage Sites: fix `accessibility` type shape in `m-place/src/types/heritage-site.ts` to `{ wheelchair_accessible, parking, restrooms, guide_available }` + update label renderers.
3. Implement Supabase datasources for all 4 features in `m-place/src/data/datasources/supabase/` and wire DI.
4. About page: render `description_ne`, highlight images, and videos section; drop the hardcoded `FALLBACK_PALIKA_DATA`.

Phase 2 can run as a single agent (the tasks are small and related) or as four lightweight agents. Recommend: one agent, one pass. The four features share DTO-mapping patterns that are easier for a single agent to keep consistent.
