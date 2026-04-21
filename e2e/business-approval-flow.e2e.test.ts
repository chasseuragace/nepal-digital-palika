/**
 * Cross-layer E2E — business approval.
 *
 * Two citizen-registered businesses are walked through the full approval
 * lifecycle using the real service+datasource on every layer:
 *
 *   1. platform-admin POST /api/businesses/register creates each business
 *      with verification_status='pending_review' (citizen self-service).
 *   2. admin-panel GET /api/businesses?status=pending lists both under
 *      palika 275.
 *   3. admin-panel PUT /api/businesses/[id]/verify transitions the first
 *      to verification_status='verified'. PUT /api/businesses/[id]/reject
 *      (with reason) transitions the second to 'rejected'.
 *   4. admin-panel re-lists with status=verified / status=rejected and
 *      confirms each business appears under its new status.
 *
 * m-place has no SupabaseBusinessDatasource (marketplace path is deferred —
 * DIContainer throws when not in mock mode), so public-side verification is
 * covered by the admin-panel's listing endpoint, which runs through the
 * same BusinessApprovalService that the admin UI uses.
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
// One business is walked through verify, the other through reject.
let verifyBusinessId: string | null = null;
let rejectBusinessId: string | null = null;

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
  // admin-panel doesn't expose a businesses DELETE — the spec is "approve or
  // reject, no hard delete" for audit-trail reasons. Verified and rejected
  // test businesses therefore linger in the DB; they are re-runnable because
  // each gets a unique slug from the datasource.
  print();
});

async function registerBusiness(tag: string): Promise<string> {
  const { status, json } = await fetchPlatform('/api/businesses/register', {
    method: 'POST',
    body: JSON.stringify({
      palika_id: PALIKA_ID,
      business_name: `E2E Cafe ${tag}`,
      contact_phone: '+977-9822222222',
      address: 'E2E test address, Kathmandu',
      description: 'Cross-layer E2E test business.',
    }),
  });
  if (status !== 201) {
    throw new Error(`register failed ${status}: ${JSON.stringify(json)}`);
  }
  return json.data.business_id as string;
}

describe('phase 1 :: citizen registers two businesses via platform-admin', () => {
  it('first business (to be verified) registers with pending_review', async () => {
    verifyBusinessId = await registerBusiness(`${runTag}-v`);
    expect(verifyBusinessId).toBeTruthy();
    mark('platform.register.verify', '✓', `id=${verifyBusinessId}`);
  });

  it('second business (to be rejected) registers with pending_review', async () => {
    rejectBusinessId = await registerBusiness(`${runTag}-r`);
    expect(rejectBusinessId).toBeTruthy();
    mark('platform.register.reject', '✓', `id=${rejectBusinessId}`);
  });
});

describe('phase 2 :: admin-panel pending queue contains both', () => {
  it('status=pending list includes both businesses', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=pending&limit=200`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.some((b: any) => b.id === verifyBusinessId)).toBe(true);
    expect(rows.some((b: any) => b.id === rejectBusinessId)).toBe(true);
    mark(
      'admin.get.pending',
      '✓',
      `${rows.length} pending in palika ${PALIKA_ID}`
    );
  });
});

describe('phase 3 :: admin-panel verify + reject succeed end-to-end', () => {
  it('PUT /api/businesses/[id]/verify → 200, verification_status=verified', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses/${verifyBusinessId}/verify?palika_id=${PALIKA_ID}&admin_id=${adminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ notes: 'E2E verify' }),
      }
    );
    expect(status).toBe(200);
    expect(json?.success).toBe(true);
    mark('admin.verify', '✓', `id=${verifyBusinessId}`);
  });

  it('PUT /api/businesses/[id]/reject → 200 with reason', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses/${rejectBusinessId}/reject?palika_id=${PALIKA_ID}&admin_id=${adminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ reason: 'E2E reject — not a real business' }),
      }
    );
    expect(status).toBe(200);
    expect(json?.success).toBe(true);
    mark('admin.reject', '✓', `id=${rejectBusinessId}`);
  });

  it('reject without a reason still returns 400', async () => {
    // The datasource rejects empty reason at write time. Keep this guard
    // under test so future refactors don't drop the validation.
    const { status } = await fetchAdmin(
      `/api/businesses/${verifyBusinessId}/reject?palika_id=${PALIKA_ID}&admin_id=${adminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ reason: '' }),
      }
    );
    expect(status).toBe(400);
    mark('admin.reject.missing-reason', '✓', '400 (reason required)');
  });
});

describe('phase 4 :: status filters reflect the transitions', () => {
  it('status=verified list contains the verified business', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=verified&limit=200`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    expect(rows.some((b: any) => b.id === verifyBusinessId)).toBe(true);
    mark('admin.list.verified', '✓', `${rows.length} verified`);
  });

  it('status=rejected list contains the rejected business', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=rejected&limit=200`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    expect(rows.some((b: any) => b.id === rejectBusinessId)).toBe(true);
    mark('admin.list.rejected', '✓', `${rows.length} rejected`);
  });

  it('status=pending no longer contains either (they moved out)', async () => {
    const { status, json } = await fetchAdmin(
      `/api/businesses?palika_id=${PALIKA_ID}&status=pending&limit=200`
    );
    expect(status).toBe(200);
    const rows = json?.businesses ?? json?.data ?? [];
    expect(rows.some((b: any) => b.id === verifyBusinessId)).toBe(false);
    expect(rows.some((b: any) => b.id === rejectBusinessId)).toBe(false);
    mark('admin.list.pending-drained', '✓', `${rows.length} still pending`);
  });

  it('platform-admin approvals list endpoint reachable', async () => {
    const { status, json } = await fetchPlatform(
      `/api/businesses/approvals?palika_id=${PALIKA_ID}&limit=50`
    );
    expect(status).toBe(200);
    expect(json).toBeTruthy();
    mark('platform.approvals.list', '✓', 'reachable');
  });
});
