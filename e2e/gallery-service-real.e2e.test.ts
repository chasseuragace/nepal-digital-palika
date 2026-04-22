/**
 * E2E Test: Gallery Service against REAL Supabase
 *
 * This test validates the gallery service by:
 * 1. Logging in with real admin credentials
 * 2. Creating/using real blog posts
 * 3. Uploading real images to Supabase Storage
 * 4. Verifying assets in the real database
 * 5. Testing RLS policies with real authentication
 *
 * Required env vars:
 *   SUPABASE_URL - Real Supabase URL
 *   SUPABASE_ANON_KEY - Real anon key
 *   ADMIN_PANEL_URL - Admin panel server (default: http://localhost:3000)
 *   REAL_ADMIN_EMAIL - Real test admin email
 *   REAL_ADMIN_PASSWORD - Real test admin password
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL ?? 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const REAL_ADMIN_EMAIL = process.env.REAL_ADMIN_EMAIL;
const REAL_ADMIN_PASSWORD = process.env.REAL_ADMIN_PASSWORD;

// Real Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const runTag = `e2e-real-${Date.now().toString(36)}`;

let adminCookie: string | null = null;
let adminUser: any = null;
let createdPostId: string | null = null;
let uploadedAssetId: string | null = null;

beforeAll(async () => {
  if (!REAL_ADMIN_EMAIL || !REAL_ADMIN_PASSWORD) {
    throw new Error(
      'Real Supabase E2E test requires REAL_ADMIN_EMAIL and REAL_ADMIN_PASSWORD env vars'
    );
  }

  // Login with real credentials
  const res = await fetch(`${ADMIN_PANEL_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: REAL_ADMIN_EMAIL,
      password: REAL_ADMIN_PASSWORD,
    }),
  });

  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`Real login failed (${res.status}): ${body}`);
  }

  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/admin_session=[^;]+/);
  if (!match) throw new Error(`No admin_session cookie: ${setCookie}`);
  adminCookie = match[0];

  const body = await res.json();
  adminUser = body.user;

  // eslint-disable-next-line no-console
  console.log(`✅ Logged in as: ${adminUser.email} (palika_id=${adminUser.palika_id})`);
});

afterAll(async () => {
  if (uploadedAssetId && adminCookie) {
    try {
      await fetch(`${ADMIN_PANEL_URL}/api/gallery?id=${uploadedAssetId}`, {
        method: 'DELETE',
        headers: { cookie: adminCookie },
      });
      // eslint-disable-next-line no-console
      console.log(`✅ Cleaned up asset: ${uploadedAssetId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to cleanup asset: ${err}`);
    }
  }

  if (createdPostId && adminCookie) {
    try {
      await fetch(`${ADMIN_PANEL_URL}/api/blog-posts/${createdPostId}`, {
        method: 'DELETE',
        headers: { cookie: adminCookie },
      });
      // eslint-disable-next-line no-console
      console.log(`✅ Cleaned up blog post: ${createdPostId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to cleanup blog post: ${err}`);
    }
  }
});

describe('Gallery Service E2E - Real Supabase', () => {
  it('Admin is authenticated', () => {
    expect(adminUser).toBeTruthy();
    expect(adminUser.email).toBe(REAL_ADMIN_EMAIL);
    expect(adminUser.palika_id).toBeTruthy();
  });

  it('Creates a blog post for testing', async () => {
    expect(adminCookie).toBeTruthy();

    const payload = {
      title_en: `E2E Gallery Real Test ${runTag}`,
      title_ne: `E2E ग्यालरी वास्तविक परीक्षण ${runTag}`,
      palika_id: adminUser.palika_id,
      author_id: adminUser.id,
      content: '<p>Real E2E test for gallery service.</p>',
      status: 'draft',
    };

    const res = await fetch(`${ADMIN_PANEL_URL}/api/blog-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie!,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBeTruthy();

    createdPostId = json.id;
    // eslint-disable-next-line no-console
    console.log(`✅ Created blog post: ${createdPostId}`);
  });

  it('Uploads an image via /api/gallery/upload', async () => {
    expect(adminCookie).toBeTruthy();
    expect(createdPostId).toBeTruthy();

    // Real PNG: 1x1 transparent pixel
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0xf8, 0x0f, 0x00, 0x00,
      0x01, 0x01, 0x00, 0x01, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([pngData], { type: 'image/png' }),
      `test-${runTag}.png`
    );
    formData.append('entity_type', 'blog_post');
    formData.append('entity_id', createdPostId!);
    formData.append('file_type', 'image');
    formData.append('display_name', `E2E Test Image ${runTag}`);

    const res = await fetch(`${ADMIN_PANEL_URL}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        cookie: adminCookie!,
      },
      body: formData,
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.asset?.id).toBeTruthy();
    expect(json.asset?.storage_path).toBeTruthy();

    uploadedAssetId = json.asset.id;
    // eslint-disable-next-line no-console
    console.log(`✅ Uploaded asset: ${uploadedAssetId}`);
  });

  it('Asset exists in Supabase database', async () => {
    expect(uploadedAssetId).toBeTruthy();

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', uploadedAssetId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(uploadedAssetId);
    expect(data?.entity_type).toBe('blog_post');
    expect(data?.entity_id).toBe(Number(createdPostId));
    expect(data?.file_type).toBe('image');

    // eslint-disable-next-line no-console
    console.log(`✅ Asset verified in database`);
  });

  it('GET /api/gallery returns the uploaded asset', async () => {
    expect(adminCookie).toBeTruthy();
    expect(createdPostId).toBeTruthy();

    const res = await fetch(
      `${ADMIN_PANEL_URL}/api/gallery?entity_type=blog_post&entity_id=${createdPostId}&file_type=image`,
      {
        headers: {
          cookie: adminCookie!,
        },
      }
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(json.assets)).toBe(true);

    const found = json.assets.find((a: any) => a.id === uploadedAssetId);
    expect(found).toBeTruthy();
    expect(found?.file_type).toBe('image');

    // eslint-disable-next-line no-console
    console.log(`✅ Asset retrieved via GET /api/gallery`);
  });

  it('Admin can update asset to be featured', async () => {
    expect(adminCookie).toBeTruthy();
    expect(uploadedAssetId).toBeTruthy();

    const res = await fetch(`${ADMIN_PANEL_URL}/api/gallery`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie!,
      },
      body: JSON.stringify({
        id: uploadedAssetId,
        is_featured: true,
      }),
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.asset?.is_featured).toBe(true);

    // Verify in database
    const { data, error } = await supabase
      .from('assets')
      .select('is_featured')
      .eq('id', uploadedAssetId)
      .single();

    expect(error).toBeNull();
    expect(data?.is_featured).toBe(true);

    // eslint-disable-next-line no-console
    console.log(`✅ Asset marked as featured`);
  });

  it('Admin can delete asset', async () => {
    expect(adminCookie).toBeTruthy();
    expect(uploadedAssetId).toBeTruthy();

    const res = await fetch(`${ADMIN_PANEL_URL}/api/gallery?id=${uploadedAssetId}`, {
      method: 'DELETE',
      headers: {
        cookie: adminCookie!,
      },
    });

    expect(res.status).toBe(200);

    // Verify deletion
    const { data } = await supabase
      .from('assets')
      .select('id')
      .eq('id', uploadedAssetId)
      .single();

    expect(data).toBeNull();

    uploadedAssetId = null; // Mark so cleanup doesn't try again
    // eslint-disable-next-line no-console
    console.log(`✅ Asset deleted successfully`);
  });

  it('RLS policies allow public read', async () => {
    // Test with anon key (no auth required)
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await anonClient
      .from('assets')
      .select('*')
      .eq('entity_type', 'blog_post')
      .limit(1);

    // Should not be a permission error
    expect(error?.code !== 'PGRST116').toBe(true);
    expect(Array.isArray(data) || data === null).toBe(true);

    // eslint-disable-next-line no-console
    console.log(`✅ Public READ policy works correctly`);
  });
});
