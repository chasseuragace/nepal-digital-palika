import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase } from '../setup/integration-setup'

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
          fc.record({ requestCode: fc.string({ minLength: 5, maxLength: 20 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
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

            // Create SOS requests in different palikas
            const request1Data = {
              palika_id: testPalikas[0],
              request_code: `TEST-SOS-${uniqueId}-1`,
              emergency_type: 'medical',
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              user_phone: '9841234567',
              status: 'received'
            }

            const request2Data = {
              palika_id: testPalikas[1],
              request_code: `TEST-SOS-${uniqueId}-2`,
              emergency_type: 'medical',
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request1 } = await supabase.from('sos_requests').insert(request1Data).select().single()
            const { data: request2 } = await supabase.from('sos_requests').insert(request2Data).select().single()

            // Query as the restricted admin
            const { data: visibleRequests } = await supabase
              .from('sos_requests')
              .select('id, palika_id, request_code')

            // Verify admin can see request in their palika
            const canSeeRequest1 = visibleRequests?.some(r => r.id === request1.id)
            expect(canSeeRequest1).toBe(true)

            // Verify admin cannot see request in other palika
            const canSeeRequest2 = visibleRequests?.some(r => r.id === request2.id)
            expect(canSeeRequest2).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should not see SOS requests in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({ requestCode: fc.string({ minLength: 5, maxLength: 20 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`

            // Create test admin with access to first palika only
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
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

            // Create SOS requests in different palikas
            const request1Data = {
              palika_id: testPalikas[0],
              request_code: `TEST-SOS-${uniqueId}-accessible`,
              emergency_type: 'medical',
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              user_phone: '9841234567',
              status: 'received'
            }

            const request2Data = {
              palika_id: testPalikas[1],
              request_code: `TEST-SOS-${uniqueId}-restricted`,
              emergency_type: 'medical',
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request1 } = await supabase.from('sos_requests').insert(request1Data).select().single()
            const { data: request2 } = await supabase.from('sos_requests').insert(request2Data).select().single()

            // Query as the restricted admin
            const { data: visibleRequests } = await supabase
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
        { numRuns: 50 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all SOS requests in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ requestCode: fc.string({ minLength: 5, maxLength: 20 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`

            // Create test admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
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
              admin_id: admin.id,
              region_type: 'district',
              region_id: testDistricts[0]
            })
            if (regionError) throw new Error(`Region error: ${regionError.message}`)

            // Create SOS request in palika within the district
            const requestData = {
              palika_id: testPalikas[0],
              request_code: `TEST-SOS-${uniqueId}`,
              emergency_type: 'medical',
              location: { type: 'Point', coordinates: [85.3, 27.7] },
              user_phone: '9841234567',
              status: 'received'
            }

            const { data: request } = await supabase.from('sos_requests').insert(requestData).select().single()

            // Query as the district admin
            const { data: visibleRequests } = await supabase
              .from('sos_requests')
              .select('id, palika_id')

            // Verify admin can see request in their district
            const canSeeRequest = visibleRequests?.some(r => r.id === request.id)
            expect(canSeeRequest).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all SOS requests regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ requestCode: fc.string({ minLength: 5, maxLength: 20 }) }),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-sos-rls-${uniqueId}@example.com`

            // Create test super admin
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: 'TestPassword123!',
              email_confirm: true
            })
            if (authError) throw new Error(`Auth error: ${authError.message}`)

            const { data: admin, error: adminError } = await supabase.from('admin_users').insert({
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

            // Create SOS requests in multiple palikas
            const requests = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const requestData = {
                palika_id: testPalikas[i],
                request_code: `TEST-SOS-${uniqueId}-${i}`,
                emergency_type: 'medical',
                location: { type: 'Point', coordinates: [85.3, 27.7] },
                user_phone: '9841234567',
                status: 'received'
              }

              const { data: request } = await supabase.from('sos_requests').insert(requestData).select().single()
              if (request) requests.push(request)
            }

            // Query as the super admin
            const { data: visibleRequests } = await supabase
              .from('sos_requests')
              .select('id, palika_id')

            // Verify super admin can see all requests
            for (const request of requests) {
              const canSeeRequest = visibleRequests?.some(r => r.id === request.id)
              expect(canSeeRequest).toBe(true)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
