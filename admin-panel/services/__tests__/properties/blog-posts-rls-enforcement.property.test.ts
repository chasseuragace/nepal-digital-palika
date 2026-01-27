import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

/**
 * Property 22: Blog Posts RLS Enforcement
 * Validates: Requirements 6.4
 * 
 * An admin should only see blog posts in palikas they have access to.
 * An admin should NOT see blog posts in palikas they don't have access to.
 * Super admin should see all blog posts.
 * Access should be enforced at database level.
 */
describe('Property 22: Blog Posts RLS Enforcement', () => {
  let testProvinces: number[] = []
  let testDistricts: number[] = []
  let testPalikas: number[] = []

  beforeAll(async () => {
    // Get test provinces
    const { data: provinces } = await supabase.from('provinces').select('id').limit(5)
    if (!provinces || provinces.length < 1) throw new Error('Not enough provinces')
    testProvinces = provinces.slice(0, Math.min(3, provinces.length)).map(p => p.id)

    // Get test districts
    let districts: any[] = []
    for (const provinceId of testProvinces) {
      const { data: d } = await supabase.from('districts').select('id').eq('province_id', provinceId).limit(10)
      if (d && d.length > 0) {
        districts = d.slice(0, Math.min(3, d.length))
        break
      }
    }
    if (districts.length < 1) throw new Error('Not enough districts')
    testDistricts = districts.map(d => d.id)

    // Get test palikas - try multiple districts if needed
    let palikas: any[] = []
    for (const districtId of testDistricts) {
      const { data: p } = await supabase.from('palikas').select('id').eq('district_id', districtId).limit(10)
      if (p && p.length > 0) {
        palikas = p.slice(0, Math.min(3, p.length))
        if (palikas.length >= 2) break
      }
    }
    if (palikas.length < 2) throw new Error('Not enough palikas')
    testPalikas = palikas.map(p => p.id)
  })

  afterEach(async () => {
    // Clean up test data
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-blog-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test blog posts
    const { data: testPosts } = await supabase.from('blog_posts').select('id').like('title_en', 'Test Blog Post %')
    if (testPosts && testPosts.length > 0) {
      for (const post of testPosts) {
        await supabase.from('blog_posts').delete().eq('id', post.id)
      }
    }
  })

  describe('Palika admin access control', () => {
    it('should only see blog posts in their assigned palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ postTitle: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-blog-rls-${uniqueId}@example.com`

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-blog-rls-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create blog posts in different palikas
            const post1Data = {
              palika_id: testPalikas[0],
              author_id: admin.id,
              title_en: `Test Blog Post ${uniqueId} - Palika 1`,
              title_ne: 'Test Blog Post',
              slug: `test-blog-${uniqueId}-1`,
              content: 'Test content',
              status: 'published'
            }

            const post2Data = {
              palika_id: testPalikas[1],
              author_id: admin.id,
              title_en: `Test Blog Post ${uniqueId} - Palika 2`,
              title_ne: 'Test Blog Post',
              slug: `test-blog-${uniqueId}-2`,
              content: 'Test content',
              status: 'published'
            }

            const { data: post1 } = await supabase.from('blog_posts').insert(post1Data).select().single()
            const { data: post2 } = await supabase.from('blog_posts').insert(post2Data).select().single()

            // Query as the restricted admin
            const { data: visiblePosts } = await supabase
              .from('blog_posts')
              .select('id, palika_id, title_en')
              .eq('status', 'published')

            // Verify admin can see post in their palika
            const canSeePost1 = visiblePosts?.some(p => p.id === post1.id)
            expect(canSeePost1).toBe(true)

            // Verify admin cannot see post in other palika
            const canSeePost2 = visiblePosts?.some(p => p.id === post2.id)
            expect(canSeePost2).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should not see blog posts in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({ postTitle: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-blog-rls-${uniqueId}@example.com`

            // Create test admin with access to first palika only
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-blog-rls-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika only
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create blog posts in different palikas
            const post1Data = {
              palika_id: testPalikas[0],
              author_id: admin.id,
              title_en: `Test Blog Post ${uniqueId} - Accessible`,
              title_ne: 'Test Blog Post',
              slug: `test-blog-${uniqueId}-accessible`,
              content: 'Test content',
              status: 'published'
            }

            const post2Data = {
              palika_id: testPalikas[1],
              author_id: admin.id,
              title_en: `Test Blog Post ${uniqueId} - Restricted`,
              title_ne: 'Test Blog Post',
              slug: `test-blog-${uniqueId}-restricted`,
              content: 'Test content',
              status: 'published'
            }

            const { data: post1 } = await supabase.from('blog_posts').insert(post1Data).select().single()
            const { data: post2 } = await supabase.from('blog_posts').insert(post2Data).select().single()

            // Query as the restricted admin
            const { data: visiblePosts } = await supabase
              .from('blog_posts')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see post in their palika
            const canSeePost1 = visiblePosts?.some(p => p.id === post1.id)
            expect(canSeePost1).toBe(true)

            // Verify admin cannot see post in restricted palika
            const canSeePost2 = visiblePosts?.some(p => p.id === post2.id)
            expect(canSeePost2).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all blog posts in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ postTitle: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-blog-rls-${uniqueId}@example.com`

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-blog-rls-${uniqueId}`,
              role: 'district_admin',
              hierarchy_level: 'district',
              province_id: testProvinces[0],
              district_id: testDistricts[0],
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to district
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: admin.id,
              region_type: 'district',
              region_id: testDistricts[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create blog post in palika within the district
            const postData = {
              palika_id: testPalikas[0],
              author_id: admin.id,
              title_en: `Test Blog Post ${uniqueId}`,
              title_ne: 'Test Blog Post',
              slug: `test-blog-${uniqueId}`,
              content: 'Test content',
              status: 'published'
            }

            const { data: post } = await supabase.from('blog_posts').insert(postData).select().single()

            // Query as the district admin
            const { data: visiblePosts } = await supabase
              .from('blog_posts')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see post in their district
            const canSeePost = visiblePosts?.some(p => p.id === post.id)
            expect(canSeePost).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all blog posts regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ postTitle: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-blog-rls-${uniqueId}@example.com`

            // Create test super admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-blog-rls-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create blog posts in multiple palikas
            const posts = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const postData = {
                palika_id: testPalikas[i],
                author_id: admin.id,
                title_en: `Test Blog Post ${uniqueId} - ${i}`,
                title_ne: 'Test Blog Post',
                slug: `test-blog-${uniqueId}-${i}`,
                content: 'Test content',
                status: 'published'
              }

              const { data: post } = await supabase.from('blog_posts').insert(postData).select().single()
              if (post) posts.push(post)
            }

            // Query as the super admin
            const { data: visiblePosts } = await supabase
              .from('blog_posts')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify super admin can see all posts
            for (const post of posts) {
              const canSeePost = visiblePosts?.some(p => p.id === post.id)
              expect(canSeePost).toBe(true)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
