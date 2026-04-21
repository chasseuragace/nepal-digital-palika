/**
 * Shared E2E helpers
 *
 * Every *.e2e.test.ts file in this folder uses the same three endpoints:
 *   - admin-panel (:3000)      — cookie-signed session
 *   - platform-admin (:3002)   — service-role, no auth
 *   - m-place real datasources — imported via `@/*` alias (→ ../m-place/src/*)
 *
 * This module exposes the minimum shared primitives — login, fetch wrappers,
 * summary collector — so each entity flow stays focused on its own use case.
 */

export const ADMIN_PANEL =
  process.env.ADMIN_PANEL_URL ?? 'http://localhost:3000';
export const PLATFORM_ADMIN =
  process.env.PLATFORM_ADMIN_URL ?? 'http://localhost:3002';
export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const PALIKA_ID = Number(process.env.E2E_PALIKA_ID ?? 275);
export const ADMIN_EMAIL =
  process.env.ADMIN_PANEL_TEST_EMAIL ?? 'palika.admin@kathmandu.gov.np';
export const ADMIN_PASSWORD =
  process.env.ADMIN_PANEL_TEST_PASSWORD ?? 'KathmanduAdmin456!';

export type Step = { step: string; status: '✓' | '✗' | '~'; detail: string };

export function mkReporter(title: string) {
  const steps: Step[] = [];
  const mark = (step: string, status: Step['status'], detail: string) =>
    steps.push({ step, status, detail });
  const print = () => {
    // eslint-disable-next-line no-console
    console.log(`\n──────── ${title} ────────`);
    for (const s of steps) {
      // eslint-disable-next-line no-console
      console.log(`  ${s.status}  ${s.step.padEnd(44)}  ${s.detail}`);
    }
  };
  return { steps, mark, print };
}

/**
 * Log in as the palika admin and return the `admin_session=...` cookie string.
 * Throws a loud error if the dev server is down or credentials are wrong —
 * the E2E cannot proceed without a valid session, so fail fast.
 */
export async function loginPalikaAdmin(): Promise<{
  cookie: string;
  user: any;
}> {
  let reachable = false;
  try {
    const r = await fetch(`${ADMIN_PANEL}/api/auth/me`);
    reachable = r.status !== undefined;
  } catch {
    /* handled below */
  }
  if (!reachable) {
    throw new Error(
      `admin-panel not reachable at ${ADMIN_PANEL}. Start it: ` +
        `(cd admin-panel && npm run dev)`
    );
  }

  const res = await fetch(`${ADMIN_PANEL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/admin_session=[^;]+/);
  if (!match) throw new Error(`No admin_session cookie: ${setCookie}`);
  const body = await res.json();
  return { cookie: match[0], user: body.user };
}

/**
 * HTTP helper for admin-panel requests. Automatically threads the session
 * cookie; callers just pass the path + optional body/method.
 */
export function makeAdminFetch(cookie: string) {
  return async function fetchAdmin(
    path: string,
    init: RequestInit = {}
  ): Promise<{ status: number; json: any; text: string }> {
    const res = await fetch(`${ADMIN_PANEL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        cookie,
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
    return { status: res.status, json, text };
  };
}

/** HTTP helper for platform-admin-panel — no auth required (service-role). */
export async function fetchPlatform(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; json: any; text: string }> {
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
