/**
 * Cross-layer E2E — business approval.
 *
 * Flow:
 *   1. Citizen (via platform-admin's public self-service registration route)
 *      submits a new business → verification_status='pending'.
 *   2. admin-panel's `/api/businesses?palika_id=&status=pending` (real
 *      BusinessApprovalService + datasource) sees it in the queue.
 *   3. admin-panel's verify route documents the current tier-gate state:
 *      TierValidationService.validateBusinessApprovalAccess checks
 *      tierLevel > 1 AND approvalRequired — but approvalRequired is
 *      hardcoded to `false` in `SupabaseTierValidationDatasource` (the
 *      palika_settings table was removed; the dynamic-policy layer hasn't
 *      shipped yet). So verify currently 403s regardless of tier. This
 *      test asserts that behaviour explicitly rather than masking it.
 *   4. Cleanup: delete the test business directly via the admin-panel
 *      DELETE route (admin listing reads via service, so writing a bespoke
 *      supabase delete would bypass our 'real code only' rule).
 *
 * m-place has no SupabaseBusinessDatasource — the marketplace path is
 * deferred (DIContainer throws when not in mock mode). So the verification
 * read path for this test is admin-panel's listing endpoint, not an m-place
 * repository call.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// m-place's real auth path creates the profile row the business datasource
// needs for owner_user_id. Using it here keeps the "real code only" contract.
import { SupabaseAuthDatasource } from '@/data/datasources/supabase/supabase-auth.datasource';
import {
  PALIKA_ID,
  fetchPlatform,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const runTag = `e2e-biz-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('Business approval cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let adminId: string | null = null;
let createdBusinessId: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  adminId = user.id;
  mark('admin.login', '✓', user.email);
  expect(user.palika_id).toBe(PALIKA_ID);

  // Ensure at least one profiles row exists so the business register
  // datasource's `resolveDefaultOwnerId` has something to pick. We seed via
  // m-place's real SupabaseAuthDatasource.register (same path a tourist
  // using the m-place app would take). Local Supabase auth may skip email
  // confirmation in default config; if it doesn't, the call still upserts
  // into `profiles` via the datasource's best-effort write.
  const { data: existing } = await (async () => {
    const r = await fetch(
      `${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}/rest/v1/profiles?select=id&limit=1`,
      {
        headers: {
          apikey:
            process.env.SUPABASE_ANON_KEY ??
            'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
        },
      }
    );
    return { data: await r.json() } as { data: any[] };
  })();

  if (!existing || existing.length === 0) {
    const authDs = new SupabaseAuthDatasource();
    try {
      await authDs.register({
        email: `e2e-biz-owner-${Date.now().toString(36)}@example.test`,
        password: 'E2EOwner123!pw',
        full_name: 'E2E Business Owner',
        phone: '+977-9899999999',
        role: 'business_owner',
      });
      mark('setup.owner-profile', '✓', 'seeded via SupabaseAuthDatasource');
    } catch (e: any) {
      mark(
        'setup.owner-profile',
        '~',
        `register threw: ${String(e?.message ?? e).slice(0, 60)}`
      );
    }
  } else {
    mark('setup.owner-profile', '✓', 'profiles row already present');
  }
});

afterAll(async () => {
  if (createdBusinessId && fetchAdmin) {
    try {
      // admin-panel doesn't expose a direct businesses DELETE — the spec is
      // "approve or reject, no hard delete". Leaving the rejected test
      // business in place is intentional. Commented out to document the
      // design; if a DELETE route is later added, uncomment.
      // await fetchAdmin(`/api/businesses/${createdBusinessId}`, { method: 'DELETE' });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('phase 1 :: citizen registers business via platform-admin', () => {
  it('POST /api/businesses/register (platform) returns pending_review', async () => {
    // Service only requires palika_id, business_name, contact_phone, address.
    // The datasource supplies defaults for owner_user_id, business_type_id,
    // ward_number, and a "SRID=4326;POINT(0 0)" location.
    const payload = {
      palika_id: PALIKA_ID,
      business_name: `E2E Cafe ${runTag}`,
      contact_phone: '+977-9822222222',
      address: 'E2E test address, Kathmandu',
      description: 'Cross-layer E2E test business. Rejects leave it stale.',
    };
    const { status, json } = await fetchPlatform('/api/businesses/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(status).toBe(201);
    expect(json?.success).toBe(true);
    expect(json?.data?.verification_status).toBe('pending_review');
    expect(json?.data?.business_id).toBeTruthy();
    createdBusinessId = json.data.business_id;
    mark('platform.register', '✓', `id=${createdBusinessId}`);
  });
});

describe('phase 2 :: admin-panel sees it in pending queue', () => {
  it('GET /api/businesses?palika_id=&status=pending includes the new business', async () => {
    expect(createdBusinessId).toBeTruthy();
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=pending&limit=100`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    expect(Array.isArray(rows)).toBe(true);
    const found = rows.some((b: any) => b.id === createdBusinessId);
    expect(found).toBe(true);
    mark(
      'admin.get.pending',
      '✓',
      `${rows.length} pending in palika ${PALIKA_ID}`
    );
  });
});

describe('phase 3 :: admin-panel verify documents current tier gate', () => {
  it('PUT /api/businesses/[id]/verify currently 403s (approvalRequired hardcoded false)', async () => {
    // This is not a bug in the E2E. It exposes an incomplete migration:
    // SupabaseTierValidationDatasource.getPalikaTierInfo returns
    // `approvalRequired: false` as a placeholder (the old palika_settings
    // table was dropped; dynamic policy layer hasn't landed). Until that
    // layer exists or the gate is removed, no palika can verify/reject.
    // When the gate is unblocked, flip this assertion to 200.
    const { status, json } = await fetchAdmin(
      `/api/businesses/${createdBusinessId}/verify?palika_id=${PALIKA_ID}&admin_id=${adminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ notes: 'E2E verify attempt' }),
      }
    );
    expect(status).toBe(403);
    expect(json?.error).toBeTruthy();
    mark('admin.verify.gated', '~', `403 (${String(json.error).slice(0, 40)}…)`);
  });

  it('PUT /api/businesses/[id]/reject currently 403s for the same reason', async () => {
    const { status } = await fetchAdmin(
      `/api/businesses/${createdBusinessId}/reject?palika_id=${PALIKA_ID}&admin_id=${adminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ reason: 'E2E reject attempt' }),
      }
    );
    expect(status).toBe(403);
    mark('admin.reject.gated', '~', '403 (same tier gate)');
  });

  it('direct platform-admin approval path is also present (registration only is exposed)', async () => {
    // Platform-admin exposes /api/businesses/approvals (list) and
    // /[id]/approval-details / -status / -notes, but no verify/reject
    // mutation route — the intent is that approvals happen in the
    // palika-facing admin-panel. So there's no alternate route to test
    // from platform-admin. We verify the approvals list endpoint is alive.
    const { status, json } = await fetchPlatform(
      `/api/businesses/approvals?palika_id=${PALIKA_ID}&limit=50`
    );
    expect(status).toBe(200);
    expect(json).toBeTruthy();
    mark('platform.approvals.list', '✓', 'endpoint reachable');
  });
});

describe('phase 4 :: verification status round-trips via admin-panel list', () => {
  it('status filter still returns the pending business (approval never happened)', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=pending&limit=100`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    const stillPending = rows.some((b: any) => b.id === createdBusinessId);
    expect(stillPending).toBe(true);
    mark('admin.still-pending', '✓', 'tier gate blocked the transition');
  });
});
