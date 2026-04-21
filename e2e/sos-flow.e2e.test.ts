/**
 * Cross-layer E2E — SOS (reversed direction).
 *
 * Citizen flow: m-place's real `SOSRepository.createSOSRequest` submits an
 * emergency; admin-panel sees it in the pending queue, reviews it, and
 * assigns a service provider; the citizen-side `getSOSRequestByCode` then
 * reflects the status progression.
 *
 * This is the only flow where the write originates in m-place and the read
 * verification happens in admin-panel (and then back in m-place).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabaseSOSDatasource } from '@/data/datasources/supabase/supabase-sos.datasource';
import { SOSRepository } from '@/data/repositories/sos.repository';
import {
  PALIKA_ID,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const sosDatasource = new SupabaseSOSDatasource();
const sosRepo = new SOSRepository(sosDatasource);

const runTag = `e2e-sos-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('SOS cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let adminId: string | null = null;
let providerId: string | null = null;
let sosId: string | null = null;
let sosCode: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  adminId = user.id;
  mark('admin.login', '✓', user.email);
  expect(user.palika_id).toBe(PALIKA_ID);

  // Seed a service provider the assign step will use. We do this through the
  // admin-panel route — same path the admin UI uses — so the assignment step
  // later exercises the real provider_id FK constraint.
  const { status, json } = await fetchAdmin('/api/service-providers', {
    method: 'POST',
    body: JSON.stringify({
      palika_id: PALIKA_ID,
      name_en: `E2E SOS Provider ${runTag}`,
      name_ne: `ई२ई प्रदायक ${runTag}`,
      service_type: 'ambulance',
      phone: '+977-9800000099',
      longitude: 85.324,
      latitude: 27.7172,
      address: 'E2E SOS test',
      ward_number: 1,
      admin_id: adminId,
    }),
  });
  if (status !== 201) {
    throw new Error(
      `Failed to seed service provider for SOS test: ${status} ${JSON.stringify(json)}`
    );
  }
  providerId = json.id;
  mark('setup.provider', '✓', `id=${providerId}`);
});

afterAll(async () => {
  // Cleanup order matters: assignments → SOS → provider.
  if (sosId && fetchAdmin) {
    try {
      // There is no DELETE route for sos_requests (audit trail). Best-effort:
      // mark it cancelled so the pending queue is clean.
      await fetchAdmin(`/api/sos-requests/${sosId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', admin_id: adminId }),
      });
    } catch {
      /* best effort */
    }
  }
  if (providerId && fetchAdmin) {
    try {
      await fetchAdmin(`/api/service-providers/${providerId}`, {
        method: 'DELETE',
      });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('phase 1 :: m-place citizen files an SOS', () => {
  it('createSOSRequest (m-place repo) → pending status + request_code', async () => {
    // Payload mirrors what the citizen-facing form would send. emergency_type,
    // service_type, priority all have CHECK constraints — use a valid combo.
    const created = await sosRepo.createSOSRequest({
      palika_id: PALIKA_ID,
      emergency_type: 'medical',
      service_type: 'ambulance',
      latitude: 27.7172,
      longitude: 85.324,
      location_description: 'Near E2E test marker',
      ward_number: 1,
      user_name: `E2E Citizen ${runTag}`,
      user_phone: '+977-9811111111',
      details: `Cross-layer E2E ${runTag} — safe to cancel.`,
      is_anonymous: false,
    } as any);

    expect(created.id).toBeTruthy();
    expect(created.request_code).toMatch(/^SOS-/);
    expect(created.status).toBe('pending');
    expect(created.palika_id).toBe(PALIKA_ID);
    sosId = created.id;
    sosCode = created.request_code;
    mark('mplace.repo.createSOSRequest', '✓', `${sosCode} (status=pending)`);
  });
});

describe('phase 2 :: admin-panel sees it + drives the workflow', () => {
  it('GET /api/sos-requests lists the new request in pending', async () => {
    expect(sosId).toBeTruthy();
    const { status, json } = await fetchAdmin(
      `/api/sos-requests?palika_id=${PALIKA_ID}&status=pending`
    );
    expect(status).toBe(200);
    const rows = json?.data ?? json;
    expect(Array.isArray(rows)).toBe(true);
    const found = rows.some((r: any) => r.id === sosId);
    expect(found).toBe(true);
    mark(
      'admin.get.pending',
      '✓',
      `${rows.length} pending in palika ${PALIKA_ID}`
    );
  });

  it('PATCH /api/sos-requests/[id] → status=reviewing', async () => {
    const { status, json } = await fetchAdmin(`/api/sos-requests/${sosId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'reviewing', admin_id: adminId }),
    });
    expect(status).toBe(200);
    expect(json?.status).toBe('reviewing');
    mark('admin.patch.reviewing', '✓', 'status=reviewing');
  });

  it('POST /api/sos-requests/[id]/assign attaches the provider', async () => {
    expect(providerId).toBeTruthy();
    const { status, json } = await fetchAdmin(
      `/api/sos-requests/${sosId}/assign`,
      {
        method: 'POST',
        body: JSON.stringify({
          provider_id: providerId,
          admin_id: adminId,
          estimated_arrival_minutes: 8,
          distance_km: 2.1,
          assignment_notes: 'E2E assign',
        }),
      }
    );
    expect(status).toBe(201);
    expect(json?.provider_id).toBe(providerId);
    mark('admin.assign', '✓', `provider=${providerId}`);
  });
});

describe('phase 3 :: m-place reflects the updated SOS', () => {
  it('getSOSRequestByCode returns status=assigned', async () => {
    expect(sosCode).toBeTruthy();
    const fetched = await sosRepo.getSOSRequestByCode(sosCode!);
    expect(fetched.id).toBe(sosId);
    expect(fetched.status).toBe('assigned');
    mark('mplace.repo.getByCode', '✓', `status=${fetched.status}`);
  });

  it('getSOSRequestById returns the same record', async () => {
    const one = await sosRepo.getSOSRequestById(sosId!);
    expect(one.id).toBe(sosId);
    expect(one.palika_id).toBe(PALIKA_ID);
    mark('mplace.repo.getById', '✓', one.request_code);
  });

  it('getRequestAssignments returns the admin-assigned provider', async () => {
    const assignments = await sosRepo.getRequestAssignments(sosId!);
    expect(Array.isArray(assignments)).toBe(true);
    expect(assignments.length).toBeGreaterThan(0);
    expect(assignments[0].provider_id).toBe(providerId);
    mark(
      'mplace.repo.getAssignments',
      '✓',
      `${assignments.length} assignment(s), provider=${providerId}`
    );
  });

  it('getActiveAlerts(palika) still includes the assigned request', async () => {
    // "Active" = pending | reviewing | assigned | in_progress. An assigned
    // request is still active until resolved.
    const active = await sosRepo.getActiveAlerts(PALIKA_ID);
    const found = active.some((r: any) => r.id === sosId);
    expect(found).toBe(true);
    mark('mplace.repo.getActiveAlerts', '✓', `${active.length} active`);
  });
});

describe('phase 4 :: resolution visible end-to-end', () => {
  it('admin resolves the SOS', async () => {
    const { status, json } = await fetchAdmin(`/api/sos-requests/${sosId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'resolved',
        admin_id: adminId,
        resolution_notes: 'E2E resolution',
      }),
    });
    expect(status).toBe(200);
    expect(json?.status).toBe('resolved');
    mark('admin.resolve', '✓', 'status=resolved');
  });

  it('m-place repo: resolved request no longer in getActiveAlerts', async () => {
    const active = await sosRepo.getActiveAlerts(PALIKA_ID);
    const stillActive = active.some((r: any) => r.id === sosId);
    expect(stillActive).toBe(false);
    mark('mplace.repo.notActive', '✓', 'resolved → excluded from active');
  });

  it('m-place anon correctly hides resolved requests (RLS privacy policy)', async () => {
    // sos_requests_public_read policy (migration 20250331000061) only
    // exposes status IN ('pending','reviewing','assigned','in_progress') to
    // anon readers. Resolved/cancelled requests are DB-level hidden from the
    // citizen-facing surface by design (privacy). This assertion documents
    // that behavior end-to-end: after resolution, m-place's anon query
    // rejects. Authenticated citizens would go through a different path.
    await expect(sosRepo.getSOSRequestByCode(sosCode!)).rejects.toThrow(
      /not found/i
    );
    mark(
      'mplace.repo.privacy',
      '✓',
      'resolved hidden from anon (RLS by design)'
    );
  });

  it('admin-panel GET /api/sos-requests/[id] still sees resolution_notes', async () => {
    // The admin-panel route uses the service-role client (no RLS), so
    // admins still have full visibility after resolution. This verifies the
    // resolution_notes round-trip we mutated in admin.resolve above.
    const { status, json } = await fetchAdmin(`/api/sos-requests/${sosId}`);
    expect(status).toBe(200);
    expect(json?.status).toBe('resolved');
    expect(json?.resolution_notes).toContain('E2E');
    mark(
      'admin.get.resolved',
      '✓',
      `resolution_notes=${json.resolution_notes}`
    );
  });
});
