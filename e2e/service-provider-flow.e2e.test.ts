/**
 * Cross-layer E2E — service providers.
 *
 * admin-panel creates a service provider (status=available, is_active=true);
 * m-place's real SOSRepository.getAvailableProviders / getServiceProviderById
 * (which wraps SupabaseSOSDatasource) must see it.
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

const runTag = `e2e-sp-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('Service provider cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let adminId: string | null = null;
let createdProviderId: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  adminId = user.id;
  mark('admin.login', '✓', user.email);
  expect(user.palika_id).toBe(PALIKA_ID);
});

afterAll(async () => {
  if (createdProviderId && fetchAdmin) {
    try {
      await fetchAdmin(`/api/service-providers/${createdProviderId}`, {
        method: 'DELETE',
      });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('admin-panel creates service provider', () => {
  it('POST /api/service-providers — ambulance for Kathmandu', async () => {
    // Route wraps longitude/latitude into POINT(lng lat) for the GEOGRAPHY
    // column; sets status='available', is_active=true server-side.
    // service_type CHECK: ambulance|fire_brigade|police|rescue|other
    const payload = {
      palika_id: PALIKA_ID,
      name_en: `E2E Ambulance ${runTag}`,
      name_ne: `ई२ई एम्बुलेन्स ${runTag}`,
      service_type: 'ambulance',
      phone: '+977-9800000001',
      email: `${runTag}@example.test`,
      longitude: 85.324,
      latitude: 27.7172,
      address: 'E2E test address, Kathmandu',
      ward_number: 1,
      vehicle_count: 2,
      is_24_7: true,
      admin_id: adminId,
    };
    const { status, json } = await fetchAdmin('/api/service-providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(status).toBe(201);
    expect(json?.id).toBeTruthy();
    expect(json?.status).toBe('available');
    expect(json?.is_active).toBe(true);
    createdProviderId = json.id;
    mark('admin.create', '✓', `id=${createdProviderId}`);
  });
});

describe('m-place SOSRepository sees the provider', () => {
  it('getAvailableProviders(palika, "ambulance") returns it', async () => {
    expect(createdProviderId).toBeTruthy();
    const list = await sosRepo.getAvailableProviders(PALIKA_ID, 'ambulance');
    expect(Array.isArray(list)).toBe(true);
    const found = list.some((p: any) => p.id === createdProviderId);
    expect(found).toBe(true);
    mark(
      'mplace.repo.getAvailableProviders',
      '✓',
      `${list.length} ambulance(s) available`
    );
  });

  it('getServiceProviders({palika_id}) includes it', async () => {
    const list = await sosRepo.getServiceProviders({ palika_id: PALIKA_ID });
    const found = list.some((p: any) => p.id === createdProviderId);
    expect(found).toBe(true);
    mark('mplace.repo.getServiceProviders', '✓', `${list.length} providers`);
  });

  it('getServiceProviderById returns full record with palika name', async () => {
    const one = await sosRepo.getServiceProviderById(createdProviderId!);
    expect(one.id).toBe(createdProviderId);
    expect(one.service_type).toBe('ambulance');
    expect(one.palika_id).toBe(PALIKA_ID);
    expect(one.palika_name).toBeTruthy(); // flattened from palikas join
    mark(
      'mplace.repo.getServiceProviderById',
      '✓',
      `${one.name_en} — palika=${one.palika_name}`
    );
  });
});

describe('cleanup', () => {
  it('admin deletes the provider; m-place no longer lists it', async () => {
    expect(createdProviderId).toBeTruthy();
    const { status } = await fetchAdmin(
      `/api/service-providers/${createdProviderId}`,
      { method: 'DELETE' }
    );
    expect(status).toBe(200);
    const deletedId = createdProviderId;
    createdProviderId = null;
    mark('admin.delete', '✓', `id=${deletedId}`);

    // getServiceProviderById throws on missing row (uses maybeSingle →
    // returns null → datasource throws explicit Error).
    await expect(sosRepo.getServiceProviderById(deletedId!)).rejects.toThrow();
    mark('mplace.repo.removed', '✓', 'getServiceProviderById throws');
  });
});
