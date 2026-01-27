import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../setup/integration-setup'

/**
 * Property 19: Heritage Sites RLS Enforcement
 * Validates: Requirements 6.1
 * 
 * An admin should only see heritage sites in palikas they have access to.
 * An admin should NOT see heritage sites in palikas they don't have access to.
 * Super admin should see all heritage sites.
 * Access should be enforced at database level.
 */
describe('Property 19: Heritage Sites RLS Enforcement', () => {
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
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-heritage-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test heritage sites
    const { data: testSites } = await supabase.from('heritage_sites').select('id').like('name_en', 'Test Heritage Site %')
    if (testSites && testSites.length > 0) {
      for (const site of testSites) {
        await supabase.from('heritage_sites').delete().eq('id', site.id)
      }
    }
  })

  describe('Palika admin access control', () => {
    it('should only see heritage sites in their assigned palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-heritage-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-heritage-rls-${uniqueId}`,
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

            // Create heritage sites in different palikas
            const site1Data = {
              palika_id: testPalikas[0],
              name_en: `Test Heritage Site ${uniqueId} - Palika 1`,
              name_ne: 'Test Heritage Site',
              slug: `test-heritage-${uniqueId}-1`,
              category_id: 1,
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              status: 'published'
            }

            const site2Data = {
              palika_id: testPalikas[testPalikas.length > 1 ? 1 : 0],
              name_en: `Test Heritage Site ${uniqueId} - Palika 2`,
              name_ne: 'Test Heritage Site',
              slug: `test-heritage-${uniqueId}-2`,
              category_id: 1,
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              status: 'published'
            }

            const { data: site1, error: site1Error } = await supabase.from('heritage_sites').insert(site1Data).select().single()
            if (site1Error) throw new Error(`Site 1 error: ${site1Error.message}`)

            const { data: site2, error: site2Error } = await supabase.from('heritage_sites').insert(site2Data).select().single()
            if (site2Error) throw new Error(`Site 2 error: ${site2Error.message}`)

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Query heritage sites as the admin
            const { data: visibleSites, error: visibleError } = await adminClient
              .from('heritage_sites')
              .select('id, palika_id, name_en')
              .eq('status', 'published')

            if (visibleError) throw new Error(`Query error: ${visibleError.message}`)

            // Verify admin can see site in their palika
            const canSeeSite1 = visibleSites?.some(s => s.id === site1.id)
            expect(canSeeSite1).toBe(true)

            // Verify admin cannot see site in other palika (only if we have different palikas)
            if (testPalikas.length > 1) {
              const canSeeSite2 = visibleSites?.some(s => s.id === site2.id)
              expect(canSeeSite2).toBe(false)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should not see heritage sites in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-heritage-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin with access to first palika only
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-heritage-rls-${uniqueId}`,
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

            // Create heritage sites in different palikas
            const site1Data = {
              palika_id: testPalikas[0],
              name_en: `Test Heritage Site ${uniqueId} - Accessible`,
              name_ne: 'Test Heritage Site',
              slug: `test-heritage-${uniqueId}-accessible`,
              category_id: 1,
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              status: 'published'
            }

            const site2Data = {
              palika_id: testPalikas[1],
              name_en: `Test Heritage Site ${uniqueId} - Restricted`,
              name_ne: 'Test Heritage Site',
              slug: `test-heritage-${uniqueId}-restricted`,
              category_id: 1,
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              status: 'published'
            }

            const { data: site1 } = await supabase.from('heritage_sites').insert(site1Data).select().single()
            const { data: site2 } = await supabase.from('heritage_sites').insert(site2Data).select().single()

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Query as the restricted admin
            const { data: visibleSites } = await adminClient
              .from('heritage_sites')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see site in their palika
            const canSeeSite1 = visibleSites?.some(s => s.id === site1.id)
            expect(canSeeSite1).toBe(true)

            // Verify admin cannot see site in restricted palika
            const canSeeSite2 = visibleSites?.some(s => s.id === site2.id)
            expect(canSeeSite2).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all heritage sites in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-heritage-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-heritage-rls-${uniqueId}`,
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

            // Create heritage site in palika within the district
            const siteData = {
              palika_id: testPalikas[0],
              name_en: `Test Heritage Site ${uniqueId}`,
              name_ne: 'Test Heritage Site',
              slug: `test-heritage-${uniqueId}`,
              category_id: 1,
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              status: 'published'
            }

            const { data: site } = await supabase.from('heritage_sites').insert(siteData).select().single()

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Query as the district admin
            const { data: visibleSites } = await adminClient
              .from('heritage_sites')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see site in their district
            const canSeeSite = visibleSites?.some(s => s.id === site.id)
            expect(canSeeSite).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all heritage sites regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ siteName: fc.string({ minLength: 5, maxLength: 50 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-heritage-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test super admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-heritage-rls-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create heritage sites in multiple palikas
            const sites = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const siteData = {
                palika_id: testPalikas[i],
                name_en: `Test Heritage Site ${uniqueId} - ${i}`,
                name_ne: 'Test Heritage Site',
                slug: `test-heritage-${uniqueId}-${i}`,
                category_id: 1,
                location: { type: 'Point', coordinates: [85.3, 27.7] },
                status: 'published'
              }

              const { data: site } = await supabase.from('heritage_sites').insert(siteData).select().single()
              if (site) sites.push(site)
            }

            // Create a client authenticated as the admin user
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })

            // Sign in as the admin
            const { error: signInError } = await adminClient.auth.signInWithPassword({
              email,
              password
            })
            if (signInError) throw new Error(`Sign in error: ${signInError.message}`)

            // Query as the super admin
            const { data: visibleSites } = await adminClient
              .from('heritage_sites')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify super admin can see all sites
            for (const site of sites) {
              const canSeeSite = visibleSites?.some(s => s.id === site.id)
              expect(canSeeSite).toBe(true)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
