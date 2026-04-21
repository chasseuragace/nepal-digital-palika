/**
 * Cross-layer E2E: heritage site publishes from admin-panel and becomes
 * visible in m-place.
 *
 * Three layers, three entry points:
 *   1. platform-admin-panel  (service-role, :3002)
 *        → verifies prereqs (palika 275 has a tier; at least one palika_admin
 *          exists for Kathmandu).
 *   2. admin-panel           (cookie session, :3000)
 *        → palika_admin logs in, creates a heritage site (draft), publishes
 *          it, reads it back, then deletes it.
 *   3. m-place's real repository  (SupabaseHeritageSiteDatasource + HeritageSiteRepository)
 *        → the exact classes the m-place UI imports and uses. No parallel
 *          re-impl of the query; if the datasource has a bug, this test
 *          catches it. The site must appear once published and disappear
 *          after deletion.
 *
 * Re-runnable: each run creates a uniquely-slugged site so parallel or
 * repeated runs do not collide. Cleanup runs in afterAll even on failure.
 *
 * Prereqs (see e2e/README.md for full setup):
 *   - Supabase local up            : `supabase status`
 *   - admin-panel dev server       : `(cd admin-panel && npm run dev)` on :3000
 *   - platform-admin-panel dev     : `(cd platform-admin-panel && npm run dev)` on :3002
 *   - Infrastructure + admin seeds applied (palikas, categories, kathmandu admin)
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// Phase 3 must exercise m-place's REAL code — not a parallel reimpl of the
// same query — otherwise we're testing vitest, not m-place. We import the
// actual datasource + repository classes the Vite UI uses. The `@/` alias is
// pointed at m-place/src by vitest.config.ts so these imports resolve cleanly.
import { SupabaseHeritageSiteDatasource } from '@/data/datasources/supabase/supabase-heritage-site.datasource';
import { HeritageSiteRepository } from '@/data/repositories/heritage-site.repository';

// -------------------------------- Config -----------------------------------

const ADMIN_PANEL = process.env.ADMIN_PANEL_URL ?? 'http://localhost:3000';
const PLATFORM_ADMIN = process.env.PLATFORM_ADMIN_URL ?? 'http://localhost:3002';
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// m-place's real datasource + repository (same instances the UI uses).
const mplaceHeritageDatasource = new SupabaseHeritageSiteDatasource();
const mplaceHeritageRepo = new HeritageSiteRepository(mplaceHeritageDatasource);

const PALIKA_ID = Number(process.env.E2E_PALIKA_ID ?? 275); // Kathmandu Metropolitan
const ADMIN_EMAIL =
  process.env.ADMIN_PANEL_TEST_EMAIL ?? 'palika.admin@kathmandu.gov.np';
const ADMIN_PASSWORD =
  process.env.ADMIN_PANEL_TEST_PASSWORD ?? 'KathmanduAdmin456!';

// ------------------------------ Shared state ------------------------------

let sessionCookie = '';
let categoryId: number | null = null;
let createdSiteId: string | null = null;
const runTag = `e2e-${Date.now().toString(36)}`;
const steps: { step: string; status: '✓' | '✗'; detail: string }[] = [];
const mark = (step: string, status: '✓' | '✗', detail: string) =>
  steps.push({ step, status, detail });

// -------------------------------- Helpers ---------------------------------

async function fetchAdmin(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ADMIN_PANEL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { cookie: sessionCookie } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, text, raw: res };
}

async function fetchPlatform(path: string, init: RequestInit = {}) {
  const res = await fetch(`${PLATFORM_ADMIN}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, text };
}

// -------------------------------- Lifecycle -------------------------------

beforeAll(async () => {
  // Fail loud + fast if any server is down — the summary table at the end is
  // useless if the suite fires before all three layers are reachable.
  const checks = await Promise.all([
    fetch(`${ADMIN_PANEL}/api/auth/me`).then((r) => r.status).catch(() => 0),
    fetch(`${PLATFORM_ADMIN}/api/stats`).then((r) => r.status).catch(() => 0),
    fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((r) => r.status)
      .catch(() => 0),
  ]);
  if (checks[0] === 0)
    throw new Error(`admin-panel not reachable at ${ADMIN_PANEL}`);
  if (checks[1] === 0)
    throw new Error(`platform-admin-panel not reachable at ${PLATFORM_ADMIN}`);
  if (checks[2] === 0)
    throw new Error(`supabase not reachable at ${SUPABASE_URL}`);
});

afterAll(async () => {
  // Belt-and-braces cleanup — only runs if a test left a site behind
  // (e.g., mid-suite failure). Uses the service-role-equivalent delete path.
  if (createdSiteId && sessionCookie) {
    try {
      await fetchAdmin(`/api/heritage-sites/${createdSiteId}`, {
        method: 'DELETE',
      });
    } catch {
      /* best-effort */
    }
  }
  // eslint-disable-next-line no-console
  console.log('\n──────── Cross-layer E2E summary ────────');
  for (const s of steps) {
    // eslint-disable-next-line no-console
    console.log(`  ${s.status}  ${s.step.padEnd(42)}  ${s.detail}`);
  }
});

// ---------------------------------------------------------------------------
// Phase 1 — Prereqs (platform-admin-panel)
// ---------------------------------------------------------------------------

describe('phase 1 :: platform-admin verifies prereqs', () => {
  it('palika 275 has a subscription tier assigned', async () => {
    const { status, json } = await fetchPlatform(
      '/api/subscriptions/palikas?limit=500'
    );
    expect(status).toBe(200);
    const target = (json?.data ?? []).find((p: any) => p.id === PALIKA_ID);
    expect(target, `palika ${PALIKA_ID} not in list`).toBeTruthy();
    expect(target.subscription_tier_id).toBeTruthy();
    expect(target.subscription_tiers?.name).toBeTruthy();
    mark(
      'platform.palika-has-tier',
      '✓',
      `${target.name_en} → ${target.subscription_tiers.name}`
    );
  });

  it('at least one palika_admin exists platform-wide', async () => {
    // The listing endpoint here is service-role (no palika_id filter enforced
    // on platform-admin). We just confirm the endpoint works and returns
    // admins that include at least one palika_admin — enough to know seeding
    // ran. Admin-panel login in phase 2 is the authoritative "Kathmandu admin
    // actually exists" check.
    const { status, json } = await fetchPlatform('/api/admins?limit=100');
    expect(status).toBe(200);
    const admins = json?.data ?? [];
    expect(admins.length).toBeGreaterThan(0);
    const palikaAdmins = admins.filter((a: any) => a.role === 'palika_admin');
    expect(palikaAdmins.length).toBeGreaterThan(0);
    mark(
      'platform.admins-seeded',
      '✓',
      `${admins.length} admins, ${palikaAdmins.length} palika_admins`
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — admin-panel content flow (as palika admin for Kathmandu)
// ---------------------------------------------------------------------------

describe('phase 2 :: admin-panel palika admin publishes a heritage site', () => {
  it('logs in and captures cookie', async () => {
    const res = await fetch(`${ADMIN_PANEL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    const match = setCookie.match(/admin_session=[^;]+/);
    expect(match, 'no admin_session cookie in login response').toBeTruthy();
    sessionCookie = match![0];

    const body = await res.json();
    expect(body?.user?.palika_id).toBe(PALIKA_ID);
    expect(body?.user?.role).toBe('palika_admin');
    mark('admin.login', '✓', `${body.user.email}`);
  });

  it('picks a heritage_site category from /api/categories', async () => {
    const { status, json } = await fetchAdmin(
      '/api/categories?entity_type=heritage_site'
    );
    expect(status).toBe(200);
    const cats = json?.data ?? json;
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
    categoryId = cats[0].id;
    mark('admin.pick-category', '✓', `${cats[0].name_en} (id=${categoryId})`);
  });

  it('creates a draft heritage site', async () => {
    expect(categoryId).toBeTruthy();
    // The datasource auto-generates `slug` from name_en, and requires
    // latitude/longitude (location is NOT NULL in the schema). We include
    // runTag in name_en so concurrent/repeat runs produce unique slugs.
    const payload = {
      name_en: `E2E Test Site ${runTag}`,
      name_ne: `ई२ई परीक्षण ${runTag}`,
      palika_id: PALIKA_ID,
      category_id: categoryId,
      // heritage_status enum: world_heritage|national|provincial|local|proposed
      heritage_status: 'local',
      short_description: 'Created by the cross-layer E2E test. Safe to delete.',
      latitude: 27.7172,
      longitude: 85.324,
      status: 'draft',
    };
    const { status, json } = await fetchAdmin('/api/heritage-sites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(status).toBe(201);
    expect(json?.id).toBeTruthy();
    expect(json?.status).toBe('draft');
    createdSiteId = json.id;
    mark('admin.create-draft', '✓', `id=${createdSiteId}`);
  });

  it('publishes the heritage site (status → published)', async () => {
    expect(createdSiteId).toBeTruthy();
    const { status, json } = await fetchAdmin(
      `/api/heritage-sites/${createdSiteId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'published' }),
      }
    );
    expect(status).toBe(200);
    expect(json?.status).toBe('published');
    mark('admin.publish', '✓', 'status=published');
  });

  it('reads the published site back through admin-panel', async () => {
    expect(createdSiteId).toBeTruthy();
    const { status, json } = await fetchAdmin(
      `/api/heritage-sites/${createdSiteId}`
    );
    expect(status).toBe(200);
    expect(json?.id).toBe(createdSiteId);
    expect(json?.status).toBe('published');
    mark('admin.read-back', '✓', json?.name_en);
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — m-place anon read (same path the tourist UI hits)
// ---------------------------------------------------------------------------

describe('phase 3 :: m-place repository sees the published site', () => {
  it('getHeritageSiteById (m-place repo) returns the new site', async () => {
    expect(createdSiteId).toBeTruthy();
    // This is literally what m-place's HeritagesDetails page calls.
    const site = await mplaceHeritageRepo.getHeritageSiteById(createdSiteId!);
    expect(site.id).toBe(createdSiteId);
    expect(site.status).toBe('published');
    expect(site.palika_id).toBe(PALIKA_ID);
    mark('mplace.repo.getById', '✓', site.name_en);
  });

  it('getPalikaHeritageSites (m-place repo) lists it under palika 275', async () => {
    // Same method the palika detail page invokes.
    const result = await mplaceHeritageRepo.getPalikaHeritageSites(
      PALIKA_ID,
      1,
      50
    );
    expect(result.data).toBeInstanceOf(Array);
    const found = result.data.some((r: any) => r.id === createdSiteId);
    expect(found).toBe(true);
    mark(
      'mplace.repo.getPalikaList',
      '✓',
      `${result.meta.total} total in palika ${PALIKA_ID}`
    );
  });

  it('getHeritageSites (m-place repo, default filters) includes it', async () => {
    // Public listing page — default filters (status=published implicit).
    const result = await mplaceHeritageRepo.getHeritageSites({
      palikaId: PALIKA_ID,
      page: 1,
      pageSize: 50,
    });
    const found = result.data.some((r: any) => r.id === createdSiteId);
    expect(found).toBe(true);
    mark(
      'mplace.repo.getHeritageSites',
      '✓',
      `${result.data.length} on page`
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 4 — cleanup + absence check
// ---------------------------------------------------------------------------

describe('phase 4 :: cleanup and verify removal', () => {
  it('admin-panel deletes the site', async () => {
    expect(createdSiteId).toBeTruthy();
    const { status } = await fetchAdmin(
      `/api/heritage-sites/${createdSiteId}`,
      { method: 'DELETE' }
    );
    expect(status).toBe(200);
    mark('admin.delete', '✓', `id=${createdSiteId}`);
    createdSiteId = null; // prevent afterAll double-delete
  });

  it('m-place repo no longer finds it (getHeritageSiteById throws)', async () => {
    // The admin.delete step nulled createdSiteId to prevent double-delete; we
    // recover the id from the summary table so the assertion still runs.
    const deletedId = steps
      .find((s) => s.step === 'admin.delete')
      ?.detail?.split('=')[1];
    expect(deletedId, 'admin.delete did not record id').toBeTruthy();

    await expect(
      mplaceHeritageRepo.getHeritageSiteById(deletedId!)
    ).rejects.toThrow();
    mark('mplace.repo.removed', '✓', 'getById throws after delete');
  });
});
