/**
 * Cross-layer E2E — tier assignment.
 *
 * platform-admin-panel (:3002, service-role) changes the subscription tier of
 * palika 275; admin-panel's `/api/tier-info` (which uses its real
 * `TierValidationService` + configured datasource) must reflect the change.
 *
 * This is the one flow that doesn't involve m-place — tiers are platform/
 * palika operational metadata, not citizen-facing content.
 *
 * Snapshot → mutate → verify → restore. The suite leaves palika 275 on
 * whatever tier it started with, so it is truly re-runnable against a fresh
 * `supabase db reset` without drift.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PALIKA_ID,
  fetchPlatform,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const { mark, print } = mkReporter('Tier cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let originalTierId: string | null = null;
let targetTierId: string | null = null;
let originalTierName: string | null = null;
let targetTierName: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  mark('admin.login', '✓', user.email);
});

afterAll(async () => {
  if (originalTierId) {
    try {
      await fetchPlatform('/api/subscriptions/palikas', {
        method: 'PATCH',
        body: JSON.stringify({ palikaId: PALIKA_ID, tierId: originalTierId }),
      });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('phase 1 :: snapshot + choose a different tier', () => {
  it('platform-admin returns palika 275 with its current tier', async () => {
    const { status, json } = await fetchPlatform(
      '/api/subscriptions/palikas?limit=500'
    );
    expect(status).toBe(200);
    const row = (json?.data ?? []).find((p: any) => p.id === PALIKA_ID);
    expect(row).toBeTruthy();
    expect(row.subscription_tier_id).toBeTruthy();
    originalTierId = row.subscription_tier_id;
    originalTierName = row.subscription_tiers?.name ?? null;
    mark('snapshot.current', '✓', `${originalTierName} (${originalTierId})`);
  });

  it('picks a different active tier to upgrade to', async () => {
    const { status, json } = await fetchPlatform('/api/subscriptions/tiers');
    expect(status).toBe(200);
    const tiers = json?.data ?? [];
    expect(tiers.length).toBeGreaterThan(1);
    const other = tiers.find((t: any) => t.id !== originalTierId);
    expect(other).toBeTruthy();
    targetTierId = other.id;
    targetTierName = other.name;
    mark('pick.target', '✓', `${targetTierName} (${targetTierId})`);
  });
});

describe('phase 2 :: platform-admin assigns the new tier', () => {
  it('PATCH /api/subscriptions/palikas changes the tier', async () => {
    expect(targetTierId).toBeTruthy();
    const { status, json } = await fetchPlatform('/api/subscriptions/palikas', {
      method: 'PATCH',
      body: JSON.stringify({ palikaId: PALIKA_ID, tierId: targetTierId }),
    });
    expect(status).toBe(200);
    expect(json?.success !== false).toBe(true);
    mark('platform.patch', '✓', `palika ${PALIKA_ID} → ${targetTierName}`);
  });

  it('platform-admin list reflects the new tier', async () => {
    const { json } = await fetchPlatform(
      '/api/subscriptions/palikas?limit=500'
    );
    const row = (json?.data ?? []).find((p: any) => p.id === PALIKA_ID);
    expect(row.subscription_tier_id).toBe(targetTierId);
    mark('platform.verify', '✓', `now on ${targetTierName}`);
  });
});

describe('phase 3 :: admin-panel /api/tier-info reflects the change', () => {
  it('GET /api/tier-info?palika_id=275 returns the new tier', async () => {
    // admin-panel's TierValidationService → getPalikaTierInfo reads the
    // palika.subscription_tier_id FK via Supabase; no caching.
    const { status, json } = await fetchAdmin(
      `/api/tier-info?palika_id=${PALIKA_ID}`
    );
    expect(status).toBe(200);
    expect(json?.palikaId).toBe(PALIKA_ID);
    expect(json?.tierId).toBe(targetTierId);
    expect(json?.tierName).toBe(targetTierName);
    mark(
      'admin.tier-info',
      '✓',
      `tierName=${json.tierName} (id=${json.tierId})`
    );
  });

  it('admin-panel /api/tiers?palika_id= still returns the catalog', async () => {
    // Sanity: the tier catalog is independent of the palika's current tier.
    const { status, json } = await fetchAdmin(
      `/api/tiers?palika_id=${PALIKA_ID}`
    );
    expect(status).toBe(200);
    expect(json).toBeTruthy();
    mark('admin.tiers-catalog', '✓', 'catalog reachable');
  });
});

describe('phase 4 :: restore', () => {
  it('platform-admin restores the original tier', async () => {
    expect(originalTierId).toBeTruthy();
    const { status } = await fetchPlatform('/api/subscriptions/palikas', {
      method: 'PATCH',
      body: JSON.stringify({ palikaId: PALIKA_ID, tierId: originalTierId }),
    });
    expect(status).toBe(200);
    originalTierId = null; // prevent afterAll double-restore
    mark('restore', '✓', `palika ${PALIKA_ID} → ${originalTierName}`);
  });

  it('admin-panel tier-info back to original', async () => {
    const { json } = await fetchAdmin(`/api/tier-info?palika_id=${PALIKA_ID}`);
    expect(json?.tierName).toBe(originalTierName);
    mark('restore.verify', '✓', `tierName=${json.tierName}`);
  });
});
