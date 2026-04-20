# Blog Posts — 3-Layer Alignment

## Source of truth: Supabase `blog_posts` schema

Bilingual pairs:
- `title_en` / `title_ne` (NOT NULL)
- `excerpt` / `excerpt_ne`
- `content` / `content_ne` (HTML TEXT)

Enum-constrained:
- `status` CHECK IN (`draft`, `published`, `archived`)

Other notable columns: `palika_id` (FK, required), `author_id` (UUID FK → admin_users, required), `slug` (UNIQUE), `featured_image`, `category` (VARCHAR free text — not an FK), `tags` (TEXT[]), `published_at`, `scheduled_at`, `view_count`.

## Critical contradictions

| # | Issue | Admin form | Supabase | m-place | Severity |
|---|---|---|---|---|---|
| 1 | **No create/edit form exists at all** | `/blog-posts/new` and `/blog-posts/[id]` pages are linked but not implemented | schema ready | display ready | 🔴 cannot author content from admin |
| 2 | **XSS vulnerability in m-place detail page** | — | — | `dangerouslySetInnerHTML={{ __html: post.content }}` with **no sanitization** in `BlogPostDetail.tsx:166` | 🔴 security |
| 3 | Bilingual fields stored but not displayed | — | both pairs present | only `titleEn`, `excerpt`, `content` rendered — `_ne` values ignored | 🔴 |

## Secondary

- `SupabaseBlogPostDatasource` not implemented in m-place (mock-only).
- `category` is free-text VARCHAR, which allows inconsistent casing/variants. Consider migrating to `category_id` FK to the `categories` table (consistent with heritage sites / events). **Decision this session: keep free text for now; revisit in a follow-up.**
- Rich text editor dependency (`react-quill`) is installed but never imported anywhere — it will ship in the bundle when we build the form; fine.

## Fix plan (in order)

### A. Admin form — build from scratch
1. Create `/admin-panel/app/blog-posts/new/page.tsx`:
   - Inputs: `title_en` (required), `title_ne` (required), `excerpt`, `excerpt_ne`, `content` (react-quill, HTML output, required), `content_ne` (react-quill, HTML output), `featured_image` upload, `category` (free text with datalist of existing categories as suggestions), `tags` (chip input → TEXT[]), `status` dropdown (`draft` / `published` / `archived`), `palika_id` (dropdown), `author_id` (auto from logged-in admin session).
   - Slug auto-generated from `title_en` with manual override.
   - Validation: title_en, title_ne, content, palika_id required.
2. Create `/admin-panel/app/blog-posts/[id]/page.tsx` (edit) — same fields, prefilled. Shares a component with `new`.
3. Apply the same UI conventions as heritage-sites and events pages: `.heritage-page-header`, `.heritage-form-container`, `.form-card`, `.btn`, `.form-input`, `.form-textarea`, multi-step tabs (3 tabs is enough: **Content**, **Media & Tags**, **Publish**).

### B. M-place minimal fixes (security + datasource are non-negotiable)
4. **Sanitize HTML before rendering** in `BlogPostDetail.tsx`:
   - Install `dompurify` + `@types/dompurify`.
   - Replace `dangerouslySetInnerHTML={{ __html: post.content }}` with `DOMPurify.sanitize(post.content, { USE_PROFILES: { html: true } })`.
   - Do the same for `content_ne`.
5. Implement `SupabaseBlogPostDatasource` in m-place and wire DI. Keep mock as dev fallback.
6. (Optional, low priority for this session) Add a minimal per-page language toggle that swaps `titleEn`/`contentNe`/`excerpt`/etc. — we can defer this to a broader i18n initiative.

### C. Verification
7. Playwright flow: create a blog post with bilingual content + HTML formatting + an image upload → confirm row → visit m-place blog listing + detail → confirm rendering and **verify DOMPurify strips a `<script>` tag** we deliberately inject.

## What's already correct (keep)
- Schema design is solid: bilingual triple (title/excerpt/content), proper FKs, tags array, status enum, view_count.
- M-place card / listing / detail UI is already well-structured for the English path.
