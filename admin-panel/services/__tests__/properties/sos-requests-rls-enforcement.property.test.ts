import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase, createAuthenticatedClient } from '../setup/integration-setup'
import { requestCode } from '../setup/test-generators'

/**
 * Property 23: SOS Requests RLS Enforcement
 * Validates: Requirements 6.5
 * 
 * An admin should only see SOS requests in palikas they have access to.
 * An admin should NOT see SOS requests in palikas they don't have access to.
 * Super admin should see all SOS requests.
 * Access should be enforced at database level.
 */
describe('Property 23: SOS Requests RLS Enforcement', () => {
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
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-sos-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test SOS requests
    const { data: testRequests } = await supabase.from('sos_requests').select('id').like('request_code', 'TEST-SOS-%')
    if (testRequests && testRequests.length > 0) {
      for (const request of testRequests) {
        await supabase.from('sos_requests').delete().eq('id', request.id)
      }
    }
  })

  describe('Palika admin access control', () => {
    it('should only see SOS requests in their assigned palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestCode(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin (using service role for admin operations)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-sos-rls-${uniqueId}`,
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

            // Create SOS requests in different palikas (using service role for admin operations)
            // Use shorter request codes to stay within varchar(40) limit
            const shortCode1 = `TEST-A-${Math.random().toString(36).substring(2, 8)}`
            const shortCode2 = `TEST-B-${Math.random().toString(36).substring(2, 8)}`

            const request1Data = {
              palika_id: testPalikas[0],
              request_code: shortCode1,
              emergency_type: 'medical',
              location: 'POINT(85.3 27.7)',
              user_phone: '9841234567',
              status: 'received'
            }

            const request2Data = {
              palika_id: testPalikas[1],
              request_code: shortCode2,
              emergency_type: 'medical',
              location: 'POINT(85.3 27.7)',
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request1, error: request1Error } = await supabase.from('sos_requests').insert(request1Data).select().single()
            if (request1Error) throw new Error(`Request 1 error: ${request1Error.message}`)

            const { data: request2, error: request2Error } = await supabase.from('sos_requests').insert(request2Data).select().single()
            if (request2Error) throw new Error(`Request 2 error: ${request2Error.message}`)

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query SOS requests as the admin (RLS will filter results)
            const { data: visibleRequests, error: visibleError } = await adminClient
              .from('sos_requests')
              .select('id, palika_id, request_code')

            if (visibleError) throw new Error(`Query error: ${visibleError.message}`)

            // Verify admin can see request in their palika
            const canSeeRequest1 = visibleRequests?.some(r => r.id === request1.id)
            expect(canSeeRequest1).toBe(true)

            // Verify admin cannot see request in other palika
            const canSeeRequest2 = visibleRequests?.some(r => r.id === request2.id)
            expect(canSeeRequest2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should not see SOS requests in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          requestCode(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`
            const password = 'TestPassword123!'

            // Create test admin with access to first palika only (using service role)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
              id: authUser.user.id,
              full_name: `test-sos-rls-${uniqueId}`,
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

            // Create SOS requests in different palikas (using service role)
            // Use shorter request codes to stay within varchar(40) limit
            const shortCode1 = `TEST-OK-${Math.random().toString(36).substring(2, 8)}`
            const shortCode2 = `TEST-NO-${Math.random().toString(36).substring(2, 8)}`

            const request1Data = {
              palika_id: testPalikas[0],
              request_code: shortCode1,
              emergency_type: 'medical',
              location: 'POINT(85.3 27.7)',
              user_phone: '9841234567',
              status: 'received'
            }

            const request2Data = {
              palika_id: testPalikas[1],
              request_code: shortCode2,
              emergency_type: 'medical',
              location: 'POINT(85.3 27.7)',
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request1, error: request1Error } = await supabase.from('sos_requests').insert(request1Data).select().single()
            if (request1Error) throw new Error(`Request 1 error: ${request1Error.message}`)
            if (!request1) throw new Error('Request 1 was not created')

            const { data: request2, error: request2Error } = await supabase.from('sos_requests').insert(request2Data).select().single()
            if (request2Error) throw new Error(`Request 2 error: ${request2Error.message}`)
            if (!request2) throw new Error('Request 2 was not created')

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the restricted admin (RLS will filter results)
            const { data: visibleRequests } = await adminClient
              .from('sos_requests')
              .select('id, palika_id')

            // Verify admin can see request in their palika
            const canSeeRequest1 = visibleRequests?.some(r => r.id === request1.id)
            expect(canSeeRequest1).toBe(true)

            // Verify admin cannot see request in restricted palika
            const canSeeRequest2 = visibleRequests?.some(r => r.id === request2.id)
            expect(canSeeRequest2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all SOS requests in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestCode(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`
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
              full_name: `test-sos-rls-${uniqueId}`,
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
              admin_id: authUser.user.id,
              region_type: 'district',
              region_id: testDistricts[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create SOS request in palika within the district (using service role)
            // Use shorter request code to stay within varchar(40) limit
            const shortCode = `TEST-DIS-${Math.random().toString(36).substring(2, 8)}`

            const requestData = {
              palika_id: testPalikas[0],
              request_code: shortCode,
              emergency_type: 'medical',
              location: 'POINT(85.3 27.7)',
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request, error: requestError } = await supabase.from('sos_requests').insert(requestData).select().single()
            if (requestError) throw new Error(`Request error: ${requestError.message}`)
            if (!request) throw new Error('Request was not created')

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the district admin (RLS will filter results)
            const { data: visibleRequests } = await adminClient
              .from('sos_requests')
              .select('id, palika_id')

            // Verify admin can see request in their district
            const canSeeRequest = visibleRequests?.some(r => r.id === request.id)
            expect(canSeeRequest).toBe(true)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all SOS requests regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestCode(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`
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
              full_name: `test-sos-rls-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create SOS requests in multiple palikas (using service role)
            // Use shorter request codes to stay within varchar(40) limit
            const requests = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const shortCode = `TEST-SA-${Math.random().toString(36).substring(2, 8)}`
              const requestData = {
                palika_id: testPalikas[i],
                request_code: shortCode,
                emergency_type: 'medical',
                location: 'POINT(85.3 27.7)',
                user_phone: '9841234567',
                status: 'received'
              }

              const { data: request } = await supabase.from('sos_requests').insert(requestData).select().single()
              if (request) requests.push(request)
            }

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the super admin (RLS will allow all)
            const { data: visibleRequests } = await adminClient
              .from('sos_requests')
              .select('id, palika_id')

            // Verify super admin can see all requests
            for (const request of requests) {
              const canSeeRequest = visibleRequests?.some(r => r.id === request.id)
              expect(canSeeRequest).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
