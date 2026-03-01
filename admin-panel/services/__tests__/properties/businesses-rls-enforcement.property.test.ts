import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase, createAuthenticatedClient } from '../setup/integration-setup'
import { businessName } from '../setup/test-generators'

/**
 * Property 21: Businesses RLS Enforcement
 * Validates: Requirements 6.3
 * 
 * An admin should only see businesses in palikas they have access to.
 * An admin should NOT see businesses in palikas they don't have access to.
 * Super admin should see all businesses.
 * Access should be enforced at database level.
 */
describe('Property 21: Businesses RLS Enforcement', () => {
  let testProvinces: number[] = []
  let testDistricts: number[] = []
  let testPalikas: number[] = []
  let testUserId: string = ''
  let testBusinessTypeId: number | null = null

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

    // Get or create a business type category
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('entity_type', 'business')
      .limit(1)

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    if (categories && categories.length > 0) {
      testBusinessTypeId = categories[0].id
    } else {
      // Create a test business type category if none exists
      const uniqueSlug = `test-business-type-${Date.now()}`
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          entity_type: 'business',
          name_en: 'Test Business Category',
          name_ne: 'परीक्षण व्यवसाय श्रेणी',
          slug: uniqueSlug
        })
        .select()
        .single()
      if (createError) {
        console.error('Error creating business type category:', createError)
        throw new Error(`Failed to create category: ${createError.message}`)
      }
      if (newCategory) {
        testBusinessTypeId = newCategory.id
      }
    }
    if (!testBusinessTypeId) throw new Error('Could not get or create business type category')

    // Create a test user for business owner
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: `test-business-owner-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true
    })
    if (authUser?.user?.id) {
      testUserId = authUser.user.id
      // Create profile for the user
      await supabase.from('profiles').insert({
        id: testUserId,
        name: 'Test Business Owner',
        user_type: 'business_owner'
      })
    }
  })

  afterEach(async () => {
    // Clean up test data
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-businesses-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test businesses
    const { data: testBusinesses } = await supabase.from('businesses').select('id').like('business_name', 'Test Business %')
    if (testBusinesses && testBusinesses.length > 0) {
      for (const business of testBusinesses) {
        await supabase.from('businesses').delete().eq('id', business.id)
      }
    }
  })

  describe('Palika admin access control', () => {
    it('should only see businesses in their assigned palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          businessName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-businesses-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin (using service role for admin operations)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-businesses-rls-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            })
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika (use authUser.user.id directly, as RLS may block .select() on admin_users)
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create businesses in different palikas (using service role)
            const business1Data = {
              palika_id: testPalikas[0],
              owner_user_id: testUserId,
              business_name: `Test Business ${uniqueId} - Palika 1`,
              slug: `test-business-${uniqueId}-1`,
              business_type_id: testBusinessTypeId!,
              phone: '9841234567',
              ward_number: 1,
              address: 'Test Address',
              location: 'POINT(85.3 27.7)',
              description: 'Test business',
              verification_status: 'verified'
            }

            const business2Data = {
              palika_id: testPalikas[1],
              owner_user_id: testUserId,
              business_name: `Test Business ${uniqueId} - Palika 2`,
              slug: `test-business-${uniqueId}-2`,
              business_type_id: testBusinessTypeId!,
              phone: '9841234567',
              ward_number: 1,
              address: 'Test Address',
              location: 'POINT(85.3 27.7)',
              description: 'Test business',
              verification_status: 'verified'
            }

            const { data: business1, error: business1Error } = await supabase.from('businesses').insert(business1Data).select().single()
            if (business1Error) throw new Error(`Business 1 insert error: ${business1Error.message}`)
            if (!business1) throw new Error('Business 1 was not created (no data returned)')

            const { data: business2, error: business2Error } = await supabase.from('businesses').insert(business2Data).select().single()
            if (business2Error) throw new Error(`Business 2 insert error: ${business2Error.message}`)
            if (!business2) throw new Error('Business 2 was not created (no data returned)')

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // DEBUG: Call debug function to trace RLS evaluation
            const { data: debugResult, error: debugError } = await adminClient.rpc('debug_businesses_admin_read', {
              palika_id_param: testPalikas[0]
            })
            if (debugError) {
              console.error('DEBUG ERROR:', debugError)
            } else {
              console.log('DEBUG BUSINESS RLS (Palika Admin Test 1):', JSON.stringify(debugResult, null, 2))
            }

            // Query as the restricted admin (RLS will filter results)
            const { data: visibleBusinesses, error: queryError } = await adminClient
              .from('businesses')
              .select('id, palika_id, business_name')
              .eq('verification_status', 'verified')

            // Log query results and error
            if (queryError) {
              console.error('QUERY ERROR:', queryError)
            }
            console.log('VISIBLE BUSINESSES COUNT:', visibleBusinesses?.length || 0)
            console.log('VISIBLE BUSINESS IDS:', visibleBusinesses?.map(b => b.id) || [])
            console.log('EXPECTED BUSINESS ID:', business1?.id)
            console.log('EXPECTED BUSINESS PALIKA:', business1?.palika_id)

            // Verify admin can see business in their palika
            const canSeeBusiness1 = visibleBusinesses?.some(b => b.id === business1.id)
            expect(canSeeBusiness1).toBe(true)

            // Verify admin cannot see business in other palika
            const canSeeBusiness2 = visibleBusinesses?.some(b => b.id === business2.id)
            expect(canSeeBusiness2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should not see businesses in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          businessName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-businesses-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin with access to first palika only (using service role)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-businesses-rls-${uniqueId}`,
              role: 'palika_admin',
              hierarchy_level: 'palika',
              province_id: null,
              district_id: null,
              palika_id: testPalikas[0],
              is_active: true
            })
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to first palika only (use authUser.user.id directly, as RLS may block .select() on admin_users)
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'palika',
              region_id: testPalikas[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create businesses in different palikas (using service role)
            const business1Data = {
              palika_id: testPalikas[0],
              owner_user_id: testUserId,
              business_name: `Test Business ${uniqueId} - Accessible`,
              slug: `test-business-${uniqueId}-accessible`,
              business_type_id: testBusinessTypeId!,
              phone: '9841234567',
              ward_number: 1,
              address: 'Test Address',
              location: 'POINT(85.3 27.7)',
              description: 'Test business',
              verification_status: 'verified'
            }

            const business2Data = {
              palika_id: testPalikas[1],
              owner_user_id: testUserId,
              business_name: `Test Business ${uniqueId} - Restricted`,
              slug: `test-business-${uniqueId}-restricted`,
              business_type_id: testBusinessTypeId!,
              phone: '9841234567',
              ward_number: 1,
              address: 'Test Address',
              location: 'POINT(85.3 27.7)',
              description: 'Test business',
              verification_status: 'verified'
            }

            const { data: business1, error: business1Error } = await supabase.from('businesses').insert(business1Data).select().single()
            if (business1Error) throw new Error(`Business 1 insert error: ${business1Error.message}`)
            if (!business1) throw new Error('Business 1 was not created (no data returned)')

            const { data: business2, error: business2Error } = await supabase.from('businesses').insert(business2Data).select().single()
            if (business2Error) throw new Error(`Business 2 insert error: ${business2Error.message}`)
            if (!business2) throw new Error('Business 2 was not created (no data returned)')

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // DEBUG: Call debug function to trace RLS evaluation
            const { data: debugResult, error: debugError } = await adminClient.rpc('debug_businesses_admin_read', {
              palika_id_param: testPalikas[0]
            })
            if (debugError) {
              console.error('DEBUG ERROR:', debugError)
            } else {
              console.log('DEBUG BUSINESS RLS (Palika Admin Test 2):', JSON.stringify(debugResult, null, 2))
            }

            // Query as the restricted admin (RLS will filter results)
            const { data: visibleBusinesses } = await adminClient
              .from('businesses')
              .select('id, palika_id')
              .eq('verification_status', 'verified')

            // Verify admin can see business in their palika
            const canSeeBusiness1 = visibleBusinesses?.some(b => b.id === business1.id)
            expect(canSeeBusiness1).toBe(true)

            // Verify admin cannot see business in restricted palika
            const canSeeBusiness2 = visibleBusinesses?.some(b => b.id === business2.id)
            expect(canSeeBusiness2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all businesses in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          businessName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-businesses-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin (using service role)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-businesses-rls-${uniqueId}`,
              role: 'district_admin',
              hierarchy_level: 'district',
              province_id: testProvinces[0],
              district_id: testDistricts[0],
              palika_id: null,
              is_active: true
            })
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Assign admin to district (use authUser.user.id directly, as RLS may block .select() on admin_users)
            const { error: regionError } = await supabase.from('admin_regions').insert({
              admin_id: authUser.user.id,
              region_type: 'district',
              region_id: testDistricts[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create business in palika within the district (using service role)
            const businessData = {
              palika_id: testPalikas[0],
              owner_user_id: testUserId,
              business_name: `Test Business ${uniqueId}`,
              slug: `test-business-${uniqueId}`,
              business_type_id: testBusinessTypeId!,
              phone: '9841234567',
              ward_number: 1,
              address: 'Test Address',
              location: 'POINT(85.3 27.7)',
              description: 'Test business',
              verification_status: 'verified'
            }

            const { data: business, error: businessError } = await supabase.from('businesses').insert(businessData).select().single()
            if (businessError) throw new Error(`Business insert error: ${businessError.message}`)
            if (!business) throw new Error('Business was not created (no data returned)')

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // DEBUG: Call debug function to trace RLS evaluation
            const { data: debugResult, error: debugError } = await adminClient.rpc('debug_businesses_admin_read', {
              palika_id_param: testPalikas[0]
            })
            if (debugError) {
              console.error('DEBUG ERROR:', debugError)
            } else {
              console.log('DEBUG BUSINESS RLS (District Admin Test):', JSON.stringify(debugResult, null, 2))
            }

            // Query as the district admin (RLS will filter results)
            const { data: visibleBusinesses } = await adminClient
              .from('businesses')
              .select('id, palika_id')
              .eq('verification_status', 'verified')

            // Verify admin can see business in their district
            const canSeeBusiness = visibleBusinesses?.some(b => b.id === business.id)
            expect(canSeeBusiness).toBe(true)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all businesses regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          businessName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-businesses-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test super admin (using service role)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-businesses-rls-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create businesses in multiple palikas (using service role)
            const businesses = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const businessData = {
                palika_id: testPalikas[i],
                owner_user_id: testUserId,
                business_name: `Test Business ${uniqueId} - ${i}`,
                slug: `test-business-${uniqueId}-${i}`,
                business_type_id: testBusinessTypeId!,
                phone: '9841234567',
                ward_number: 1,
                address: 'Test Address',
                location: 'POINT(85.3 27.7)',
                description: 'Test business',
                verification_status: 'verified'
              }

              const { data: business } = await supabase.from('businesses').insert(businessData).select().single()
              if (business) businesses.push(business)
            }

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the super admin (RLS will allow all)
            const { data: visibleBusinesses } = await adminClient
              .from('businesses')
              .select('id, palika_id')
              .eq('verification_status', 'verified')

            // Verify super admin can see all businesses
            for (const business of businesses) {
              const canSeeBusiness = visibleBusinesses?.some(b => b.id === business.id)
              expect(canSeeBusiness).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
