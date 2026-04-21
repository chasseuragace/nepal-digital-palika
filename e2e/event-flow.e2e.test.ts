/**
 * Cross-layer E2E — events.
 *
 * admin-panel palika_admin creates + publishes an event; m-place's real
 * `EventRepository` + `SupabaseEventDatasource` must see it.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabaseEventDatasource } from '@/data/datasources/supabase/supabase-event.datasource';
import { EventRepository } from '@/data/repositories/event.repository';
import {
  PALIKA_ID,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const eventDatasource = new SupabaseEventDatasource();
const eventRepo = new EventRepository(eventDatasource);

const runTag = `e2e-ev-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('Event cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let categoryId: number | null = null;
let createdEventId: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  mark('admin.login', '✓', user.email);
  expect(user.palika_id).toBe(PALIKA_ID);
});

afterAll(async () => {
  if (createdEventId && fetchAdmin) {
    try {
      await fetchAdmin(`/api/events/${createdEventId}`, { method: 'DELETE' });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('admin-panel creates event', () => {
  it('picks an event category', async () => {
    const { status, json } = await fetchAdmin(
      '/api/categories?entity_type=event'
    );
    expect(status).toBe(200);
    const cats = json?.data ?? json;
    expect(Array.isArray(cats) && cats.length).toBeTruthy();
    categoryId = cats[0].id;
    mark('admin.pick-category', '✓', `${cats[0].name_en} (id=${categoryId})`);
  });

  it('creates a published event', async () => {
    expect(categoryId).toBeTruthy();
    // Service requires name_en/ne, palika_id, start_date, end_date with
    // end >= start. Datasource wraps location from lat/lng (optional).
    const payload = {
      name_en: `E2E Event ${runTag}`,
      name_ne: `ई२ई कार्यक्रम ${runTag}`,
      palika_id: PALIKA_ID,
      category_id: categoryId,
      start_date: '2027-01-01',
      end_date: '2027-01-03',
      short_description: 'Cross-layer E2E test event. Safe to delete.',
      status: 'published',
    };
    const { status, json } = await fetchAdmin('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(status).toBe(201);
    expect(json?.id).toBeTruthy();
    expect(json?.status).toBe('published');
    createdEventId = json.id;
    mark('admin.create', '✓', `id=${createdEventId}`);
  });
});

describe('m-place repo sees the event', () => {
  it('fetchEventById returns the new event', async () => {
    expect(createdEventId).toBeTruthy();
    const ev = await eventRepo.fetchEventById(createdEventId!);
    expect(ev?.id).toBe(createdEventId);
    expect(ev?.status).toBe('published');
    expect(ev?.palika_id).toBe(PALIKA_ID);
    mark('mplace.repo.fetchEventById', '✓', ev?.name_en ?? '');
  });

  it('fetchEvents({palikaId}) lists the new event', async () => {
    const result = await eventRepo.fetchEvents({
      palikaId: PALIKA_ID,
      page: 1,
      pageSize: 50,
    });
    expect(result.data).toBeInstanceOf(Array);
    const found = result.data.some((r: any) => r.id === createdEventId);
    expect(found).toBe(true);
    mark(
      'mplace.repo.fetchEvents',
      '✓',
      `${result.meta.total} events in palika ${PALIKA_ID}`
    );
  });

  it('fetchUpcomingEvents includes the future event', async () => {
    // The event's start_date is in 2027, so it's always "upcoming" relative
    // to today (2026). fetchUpcomingEvents filters by start_date >= now.
    const upcoming = await eventRepo.fetchUpcomingEvents(50);
    expect(Array.isArray(upcoming)).toBe(true);
    const found = upcoming.some((r: any) => r.id === createdEventId);
    expect(found).toBe(true);
    mark('mplace.repo.fetchUpcoming', '✓', `${upcoming.length} upcoming`);
  });
});

describe('cleanup', () => {
  it('admin deletes the event', async () => {
    expect(createdEventId).toBeTruthy();
    const { status } = await fetchAdmin(`/api/events/${createdEventId}`, {
      method: 'DELETE',
    });
    expect(status).toBe(200);
    mark('admin.delete', '✓', `id=${createdEventId}`);
    const deletedId = createdEventId;
    createdEventId = null;

    const after = await eventRepo.fetchEventById(deletedId!);
    // m-place's event datasource uses maybeSingle → returns null for missing.
    expect(after).toBeNull();
    mark('mplace.repo.removed', '✓', 'fetchEventById → null');
  });
});
