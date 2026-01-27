import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fc from 'fast-check'
import { supabase, createAuthenticatedClient } from '../setup/integration-setup'
import { eventName } from '../setup/test-generators'

/**
 * Property 20: Events RLS Enforcement
 * Validates: Requirements 6.2
 * 
 * An admin should only see events in palikas they have access to.
 * An admin should NOT see events in palikas they don't have access to.
 * Super admin should see all events.
 * Access should be enforced at database level.
 */
describe('Property 20: Events RLS Enforcement', () => {
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
    const { data: testAdmins } = await supabase.from('admin_users').select('id').like('full_name', 'test-events-rls-%')
    if (testAdmins && testAdmins.length > 0) {
      for (const admin of testAdmins) {
        await supabase.auth.admin.deleteUser(admin.id)
      }
    }

    // Clean up test events
    const { data: testEvents } = await supabase.from('events').select('id').like('name_en', 'Test Event %')
    if (testEvents && testEvents.length > 0) {
      for (const event of testEvents) {
        await supabase.from('events').delete().eq('id', event.id)
      }
    }
  })

  describe('Palika admin access control', () => {
    it('should only see events in their assigned palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-events-rls-${uniqueId}@example.com`
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
              full_name: `test-events-rls-${uniqueId}`,
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

            // Create events in different palikas
            const event1Data = {
              palika_id: testPalikas[0],
              name_en: `Test Event ${uniqueId} - Palika 1`,
              name_ne: 'Test Event',
              short_description: 'Test description',
              slug: `test-event-${uniqueId}-1`,
              start_date: '2025-01-15',
              end_date: '2025-01-15',
              status: 'published'
            }

            const event2Data = {
              palika_id: testPalikas[1],
              name_en: `Test Event ${uniqueId} - Palika 2`,
              name_ne: 'Test Event',
              short_description: 'Test description',
              slug: `test-event-${uniqueId}-2`,
              start_date: '2025-01-15',
              end_date: '2025-01-15',
              status: 'published'
            }

            const { data: event1 } = await supabase.from('events').insert(event1Data).select().single()
            const { data: event2 } = await supabase.from('events').insert(event2Data).select().single()

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the restricted admin (RLS will filter results)
            const { data: visibleEvents } = await adminClient
              .from('events')
              .select('id, palika_id, name_en')
              .eq('status', 'published')

            // Verify admin can see event in their palika
            const canSeeEvent1 = visibleEvents?.some(e => e.id === event1.id)
            expect(canSeeEvent1).toBe(true)

            // Verify admin cannot see event in other palika
            const canSeeEvent2 = visibleEvents?.some(e => e.id === event2.id)
            expect(canSeeEvent2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should not see events in palikas they do not have access to', async () => {
      // Skip this test if we don't have multiple palikas
      if (testPalikas.length < 2) {
        return
      }

      await fc.assert(
        fc.asyncProperty(
          eventName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-events-rls-${uniqueId}@example.com`
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
              full_name: `test-events-rls-${uniqueId}`,
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

            // Create events in different palikas (using service role)
            const event1Data = {
              palika_id: testPalikas[0],
              name_en: `Test Event ${uniqueId} - Accessible`,
              name_ne: 'Test Event',
              short_description: 'Test description',
              slug: `test-event-${uniqueId}-accessible`,
              start_date: '2025-01-15',
              end_date: '2025-01-15',
              status: 'published'
            }

            const event2Data = {
              palika_id: testPalikas[1],
              name_en: `Test Event ${uniqueId} - Restricted`,
              name_ne: 'Test Event',
              short_description: 'Test description',
              slug: `test-event-${uniqueId}-restricted`,
              start_date: '2025-01-15',
              end_date: '2025-01-15',
              status: 'published'
            }

            const { data: event1 } = await supabase.from('events').insert(event1Data).select().single()
            const { data: event2 } = await supabase.from('events').insert(event2Data).select().single()

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the restricted admin (RLS will filter results)
            const { data: visibleEvents } = await adminClient
              .from('events')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see event in their palika
            const canSeeEvent1 = visibleEvents?.some(e => e.id === event1.id)
            expect(canSeeEvent1).toBe(true)

            // Verify admin cannot see event in restricted palika
            const canSeeEvent2 = visibleEvents?.some(e => e.id === event2.id)
            expect(canSeeEvent2).toBe(false)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('District admin access control', () => {
    it('should see all events in their assigned district', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-events-rls-${uniqueId}@example.com`
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
              full_name: `test-events-rls-${uniqueId}`,
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

            // Create event in palika within the district (using service role)
            const eventData = {
              palika_id: testPalikas[0],
              name_en: `Test Event ${uniqueId}`,
              name_ne: 'Test Event',
              short_description: 'Test description',
              slug: `test-event-${uniqueId}`,
              start_date: '2025-01-15',
              end_date: '2025-01-15',
              status: 'published'
            }

            const { data: event } = await supabase.from('events').insert(eventData).select().single()

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the district admin (RLS will filter results)
            const { data: visibleEvents } = await adminClient
              .from('events')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify admin can see event in their district
            const canSeeEvent = visibleEvents?.some(e => e.id === event.id)
            expect(canSeeEvent).toBe(true)
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('Super admin access control', () => {
    it('should see all events regardless of palika', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventName(),
          async () => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
            const email = `test-events-rls-${uniqueId}@example.com`
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
              full_name: `test-events-rls-${uniqueId}`,
              role: 'super_admin',
              hierarchy_level: 'national',
              province_id: null,
              district_id: null,
              palika_id: null,
              is_active: true
            }).select().single()
            if (adminError) throw new Error(`Admin error: ${adminError.message}`)

            // Create events in multiple palikas (using service role)
            const events = []
            for (let i = 0; i < Math.min(2, testPalikas.length); i++) {
              const eventData = {
                palika_id: testPalikas[i],
                name_en: `Test Event ${uniqueId} - ${i}`,
                name_ne: 'Test Event',
                short_description: 'Test description',
                slug: `test-event-${uniqueId}-${i}`,
                start_date: '2025-01-15',
                end_date: '2025-01-15',
                status: 'published'
              }

              const { data: event } = await supabase.from('events').insert(eventData).select().single()
              if (event) events.push(event)
            }

            // Create authenticated client for the admin user (respects RLS)
            const adminClient = await createAuthenticatedClient(email, password)

            // Query as the super admin (RLS will allow all)
            const { data: visibleEvents } = await adminClient
              .from('events')
              .select('id, palika_id')
              .eq('status', 'published')

            // Verify super admin can see all events
            for (const event of events) {
              const canSeeEvent = visibleEvents?.some(e => e.id === event.id)
              expect(canSeeEvent).toBe(true)
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })
})
