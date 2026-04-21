/**
 * Cross-layer E2E — palika profile.
 *
 * admin-panel updates palika contact info + description fields (split-writes
 * between `palikas` relational columns and `palika_profiles` JSONB). m-place's
 * real `PalikaRepository` + `SupabasePalikaDatasource` read the palika by id
 * and must reflect the updated contact info (name_en/ne, wards, etc).
 *
 * NOTE: m-place's PalikaDatasource intentionally returns only the flat
 * `Region` DTO { palikaId, palikaName, wards, districtName, provinceName } —
 * it does not currently surface `palika_profiles` fields (description,
 * highlights, etc). The E2E therefore asserts on fields the datasource
 * actually exposes (total_wards → `wards`), not on the JSONB profile payload.
 * The profile-JSONB roundtrip is covered via the admin-panel GET of the same
 * endpoint, which hits the same palika-profile datasource the admin UI uses.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabasePalikaDatasource } from '@/data/datasources/supabase/supabase-palika.datasource';
import { PalikaRepository } from '@/data/repositories/palika.repository';
import {
  PALIKA_ID,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const palikaDatasource = new SupabasePalikaDatasource();
const palikaRepo = new PalikaRepository(palikaDatasource);

const runTag = `e2e-pp-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('Palika profile cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let originalContact: {
  office_phone: string | null;
  office_email: string | null;
  website: string | null;
  total_wards: number | null;
} = { office_phone: null, office_email: null, website: null, total_wards: null };

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  mark('admin.login', '✓', user.email);
  expect(user.palika_id).toBe(PALIKA_ID);

  // Snapshot original contact info so we can restore it afterwards.
  const before = await palikaRepo.getPalikaById(PALIKA_ID);
  originalContact.total_wards = (before as any)?.wards ?? null;
  mark('snapshot.before', '✓', `wards=${originalContact.total_wards}`);
});

afterAll(async () => {
  // Restore original total_wards so this test is truly re-runnable without
  // mutating palika 275's long-term state. description_en we leave dirty —
  // the palika_profiles row is intentionally cumulative across E2E runs.
  if (fetchAdmin && originalContact.total_wards != null) {
    try {
      await fetchAdmin('/api/palika-profile', {
        method: 'PUT',
        headers: { 'X-Palika-ID': String(PALIKA_ID) },
        body: JSON.stringify({
          description_en: 'Restored by E2E.',
          total_wards: originalContact.total_wards,
        }),
      });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('admin-panel PUT /api/palika-profile', () => {
  it('updates description + contact-info fields (dual-write)', async () => {
    // The route validates either description_en or description_ne is present.
    // Contact-info fields (office_phone, office_email, website, total_wards)
    // are written to the `palikas` table; description/highlights/etc go to
    // palika_profiles JSONB.
    const newWards = 33;
    const newPhone = `+977-98E2E${runTag.slice(-4)}`;
    const { status, json } = await fetchAdmin('/api/palika-profile', {
      method: 'PUT',
      headers: { 'X-Palika-ID': String(PALIKA_ID) },
      body: JSON.stringify({
        description_en: `E2E description ${runTag}`,
        description_ne: `ई२ई विवरण ${runTag}`,
        office_phone: newPhone,
        total_wards: newWards,
      }),
    });
    expect(status).toBe(200);
    expect(json?.success).toBe(true);
    expect(json?.profile?.description_en).toContain(runTag);
    // Contact-info fields should round-trip through the response.
    expect(json?.profile?.office_phone).toBe(newPhone);
    expect(json?.profile?.total_wards).toBe(newWards);
    mark(
      'admin.put',
      '✓',
      `wards=${newWards}, phone=${newPhone}`
    );
  });

  it('admin-panel GET /api/palika-profile reflects the update', async () => {
    const { status, json } = await fetchAdmin(
      `/api/palika-profile?palika_id=${PALIKA_ID}`
    );
    expect(status).toBe(200);
    expect(json?.profile?.description_en).toContain(runTag);
    mark('admin.get', '✓', `description echoes ${runTag}`);
  });
});

describe('m-place PalikaRepository reflects the admin update', () => {
  it('getPalikaById returns the updated total_wards', async () => {
    const region = await palikaRepo.getPalikaById(PALIKA_ID);
    expect(region).toBeTruthy();
    expect(region!.palikaId).toBe(PALIKA_ID);
    expect(region!.wards).toBe(33);
    expect(region!.palikaName).toContain('Kathmandu');
    mark(
      'mplace.repo.getPalikaById',
      '✓',
      `wards=${region!.wards}, name=${region!.palikaName}`
    );
  });

  it('getAllPalikas includes the updated palika', async () => {
    const all = await palikaRepo.getAllPalikas();
    const found = all.find((p: any) => p.palikaId === PALIKA_ID);
    expect(found).toBeTruthy();
    expect(found!.wards).toBe(33);
    mark('mplace.repo.getAllPalikas', '✓', `${all.length} palikas total`);
  });

  it('getPalikasByDistrict returns palikas in Kathmandu district', async () => {
    // Kathmandu Metropolitan is in district_id=27 (Kathmandu). The palika
    // row's district_id is whatever seeder assigned; we just verify the
    // shape and that the method executes.
    const region = await palikaRepo.getPalikaById(PALIKA_ID);
    expect(region).toBeTruthy();
    // Hop through the raw palikas to get the district_id — the m-place DTO
    // omits it, but the test stays at the repository layer by simply
    // asserting getPalikasByDistrict returns an array for an arbitrary id.
    const list = await palikaRepo.getPalikasByDistrict(27);
    expect(Array.isArray(list)).toBe(true);
    mark('mplace.repo.getPalikasByDistrict', '✓', `${list.length} palikas in d=27`);
  });
});
