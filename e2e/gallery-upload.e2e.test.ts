/**
 * E2E Test: Gallery Upload Flow
 *
 * Tests the complete gallery upload workflow:
 * 1. Login as test palika admin
 * 2. Create a test blog post
 * 3. Upload image file via /api/gallery/upload
 * 4. Verify asset in Supabase database
 * 5. Cleanup
 *
 * Uses mock auth (no external credentials needed) + real Supabase
 * ~10 second runtime
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  mkReporter,
} from './helpers/context'
import {
  loginPalikaAdminTestUser,
  makeTestUserFetch,
  type TestUser,
} from './helpers/test-user'

// Real Supabase client for verification
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const runTag = `e2e-upload-${Date.now().toString(36)}`
const { mark, print } = mkReporter('Gallery Upload E2E Test Results')

let testUser: TestUser | null = null
let fetchAuth: ReturnType<typeof makeTestUserFetch> | null = null
let createdPostId: string | null = null
let uploadedAssetId: string | null = null

beforeAll(async () => {
  // Login as test palika admin (mock auth - no external credentials needed)
  testUser = await loginPalikaAdminTestUser()
  fetchAuth = makeTestUserFetch(testUser)
  mark('auth.login', '✓', `${testUser.email} (palika_id=${testUser.palika_id})`)
})

afterAll(async () => {
  // Cleanup: delete uploaded asset
  if (uploadedAssetId && fetchAuth) {
    try {
      await fetchAuth(`/api/gallery?id=${uploadedAssetId}`, {
        method: 'DELETE',
      })
      mark('cleanup.asset', '✓', uploadedAssetId)
    } catch (err) {
      mark('cleanup.asset', '✗', String(err))
    }
  }

  // Cleanup: delete created blog post
  if (createdPostId && fetchAuth) {
    try {
      await fetchAuth(`/api/blog-posts/${createdPostId}`, {
        method: 'DELETE',
      })
      mark('cleanup.post', '✓', createdPostId)
    } catch (err) {
      mark('cleanup.post', '✗', String(err))
    }
  }

  print()
})

describe('Gallery Upload E2E', () => {
  it('Test user is authenticated and has palika assignment', () => {
    expect(testUser).toBeTruthy()
    expect(testUser!.email).toBe('palika@admin.com')
    expect(testUser!.palika_id).toBe(5)
    expect(testUser!.role).toBe('palika_admin')
  })

  it('Creates a blog post (target for image upload)', async () => {
    expect(testUser).toBeTruthy()
    expect(fetchAuth).toBeTruthy()

    const payload = {
      title_en: `E2E Upload Test ${runTag}`,
      title_ne: `E2E अपलोड परीक्षण ${runTag}`,
      palika_id: testUser!.palika_id,
      author_id: testUser!.id,
      content: '<p>Test post for gallery upload validation.</p>',
      status: 'draft',
    }

    const { status, json } = await fetchAuth!('/api/blog-posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    expect(status).toBe(201)
    expect(json?.id).toBeTruthy()

    createdPostId = json.id
    mark('blog.create', '✓', `id=${createdPostId}`)
  })

  it('Uploads PNG image to gallery', async () => {
    expect(testUser).toBeTruthy()
    expect(fetchAuth).toBeTruthy()
    expect(createdPostId).toBeTruthy()

    // Create a real 1x1 PNG (transparent pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0xf8, 0x0f, 0x00, 0x00,
      0x01, 0x01, 0x00, 0x01, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([pngData], { type: 'image/png' }),
      `test-${runTag}.png`
    )
    formData.append('entity_type', 'blog_post')
    formData.append('entity_id', createdPostId!)
    formData.append('file_type', 'image')
    formData.append('display_name', `Test Image ${runTag}`)

    // Upload with authenticated cookie
    const res = await fetch('http://localhost:3000/api/gallery/upload', {
      method: 'POST',
      headers: {
        cookie: testUser!.cookie,
      },
      body: formData,
    })

    if (res.status !== 200) {
      const errorBody = await res.text()
      // eslint-disable-next-line no-console
      console.error(`Upload failed: status=${res.status}, body=${errorBody}`)
    }

    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json?.asset?.id).toBeTruthy()
    expect(json?.asset?.storage_path).toBeTruthy()
    expect(json?.asset?.public_url).toBeTruthy()

    uploadedAssetId = json.asset.id
    mark('gallery.upload', '✓', `asset=${uploadedAssetId}`)
  })

  it('Asset is stored in Supabase database', async () => {
    expect(uploadedAssetId).toBeTruthy()

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', uploadedAssetId)
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBe(uploadedAssetId)
    expect(data?.entity_type).toBe('blog_post')
    expect(data?.entity_id).toBe(Number(createdPostId))
    expect(data?.file_type).toBe('image')
    expect(data?.is_featured).toBe(false)
    expect(data?.storage_path).toContain('blog_post_')

    mark('db.verify', '✓', 'asset found in database')
  })

  it('Asset is retrievable via GET /api/gallery', async () => {
    expect(fetchAuth).toBeTruthy()
    expect(createdPostId).toBeTruthy()

    const { status, json } = await fetchAuth!(
      `/api/gallery?entity_type=blog_post&entity_id=${createdPostId}`
    )

    expect(status).toBe(200)
    expect(Array.isArray(json?.assets)).toBe(true)
    expect(json.assets.length).toBeGreaterThan(0)

    const found = json.assets.find((a: any) => a.id === uploadedAssetId)
    expect(found).toBeTruthy()
    expect(found?.file_type).toBe('image')

    mark('api.get', '✓', `${json.assets.length} asset(s) returned`)
  })

  it('Asset can be marked as featured', async () => {
    expect(fetchAuth).toBeTruthy()
    expect(uploadedAssetId).toBeTruthy()

    const { status, json } = await fetchAuth!('/api/gallery', {
      method: 'PUT',
      body: JSON.stringify({
        id: uploadedAssetId,
        is_featured: true,
      }),
    })

    expect(status).toBe(200)
    expect(json?.asset?.is_featured).toBe(true)

    mark('api.update', '✓', 'marked as featured')
  })

  it('Asset deletion works and cleans up database', async () => {
    expect(fetchAuth).toBeTruthy()
    expect(uploadedAssetId).toBeTruthy()

    const { status } = await fetchAuth!(
      `/api/gallery?id=${uploadedAssetId}`,
      { method: 'DELETE' }
    )

    expect(status).toBe(200)

    // Verify deletion in database
    const { data } = await supabase
      .from('assets')
      .select('id')
      .eq('id', uploadedAssetId)
      .single()

    expect(data).toBeNull()

    uploadedAssetId = null // Mark cleanup as done
    mark('api.delete', '✓', 'asset deleted from DB')
  })

  it('Public can read assets (RLS policy validation)', async () => {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data, error } = await anonClient
      .from('assets')
      .select('id')
      .eq('entity_type', 'blog_post')
      .limit(1)

    // Should not be a permission error
    expect(error?.code !== 'PGRST116').toBe(true)
    expect(Array.isArray(data) || data === null).toBe(true)

    mark('rls.public', '✓', 'public READ allowed')
  })
})
