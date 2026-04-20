# Session 20 April 2026 — Three-Layer Alignment Audit

## Scope

Verify that the **admin-panel forms**, **Supabase SQL schema**, and **m-place display layer** are in sync across the four content features of the Nepal Digital Tourism platform, then fix every contradiction starting from the admin-panel.

## Policy Decisions (agreed this session)

1. **Supabase SQL migrations are the source of truth.** Admin-panel payloads and m-place types must converge on them.
2. **Admin panel = full content moderation + analytics site.** Every field the DB supports should be capturable. Every moderation/approval action belongs here.
3. **M-place is "done enough."** Prefer not to modify it. Modifications allowed only when absolutely necessary to honor DB reality (e.g., missing Supabase datasource, fundamentally wrong type shape, or required display of fields that have no alternative host).
4. **Marketplace deferred.** Not part of this session.
5. **Bilingual (en / ne) content is a first-class requirement.** Every field the schema has in `_en` + `_ne` pairs must be captured in the admin and surfaced to m-place.

## Files in this folder

| # | File | Purpose |
|---|---|---|
| 00 | [`00-README.md`](./00-README.md) | This index + policy decisions |
| 01 | [`01-heritage-sites-alignment.md`](./01-heritage-sites-alignment.md) | Heritage Sites: audit + fix plan |
| 02 | [`02-events-alignment.md`](./02-events-alignment.md) | Events/Festivals: audit + fix plan |
| 03 | [`03-blog-posts-alignment.md`](./03-blog-posts-alignment.md) | Blog Posts: audit + fix plan |
| 04 | [`04-palika-profile-alignment.md`](./04-palika-profile-alignment.md) | Palika Profile + m-place About + UI consistency |
| 05 | [`05-master-fix-plan.md`](./05-master-fix-plan.md) | Prioritized execution roadmap across all features |

## Summary of what was found

Every feature has contradictions. Rough counts of **critical** issues (enum/type mismatch, required field missing, data loss on submit, or broken user-facing display):

| Feature | Critical | High | Medium |
|---|---|---|---|
| Heritage Sites | 6 | 5 | 4 |
| Events / Festivals | 7 | 5 | 3 |
| Blog Posts | 3 (incl. XSS + no create form) | 4 | 3 |
| Palika Profile | 4 | 4 | 4 |

See each feature file for the details. See `05-master-fix-plan.md` for execution order.

## Marketplace

Deliberately skipped. Revisit in a dedicated session.
