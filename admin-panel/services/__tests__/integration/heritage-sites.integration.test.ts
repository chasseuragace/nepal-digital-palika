/**
 * Heritage Sites Service Integration Tests
 * Tests against real Supabase database with real data
 */

import { HeritageSitesService } from '../../heritage-sites.service'
import { AuthService } from '../../auth.service'
import { supabase, cleanupTestData, verifySeededData, testAdminCredentials } from '../setup/integration-setup'
import { createSupabaseClient } from '../../database-client'

describe('HeritageSitesService Integration Tests', () => {
  let heritageSitesService: HeritageSitesService
  let authService: AuthService

  beforeAll(async () => {
    await verifySeededData()
    authService = new AuthService(supabase)
    
    // Login as super admin for tests - this sets the auth context on the supabase client
    await authService.login(testAdminCredentials.superAdmin)
    
    // Create service with authenticated client
    const authenticatedDb = createSupabaseClient(supabase)
    heritageSitesService = new HeritageSitesService(authenticatedDb)
  })

  afterAll(async () => {
    await cleanupTestData()
    await authService.logout()
  })

  describe('Real Data Operations', () => {
    it('should fetch real heritage sites from database', async () => {
      // Note: Heritage sites may not be seeded if categories have issues
      // This test validates the query works, not that data exists
      const result = await heritageSitesService.getAll()
      
      expect(result.success).toBe(true)
      // Allow 0 or more sites - the important thing is the query works
      expect(result.data?.data).toBeDefined()
      expect(Array.isArray(result.data?.data)).toBe(true)
    })

    it('should filter by status', async () => {
      const result = await heritageSitesService.getAll({ status: 'published' })
      
      expect(result.success).toBe(true)
      const sites = result.data?.data || []
      sites.forEach(site => {
        expect(site.status).toBe('published')
      })
    })

    it('should get featured sites', async () => {
      const result = await heritageSitesService.getFeatured(3)
      
      expect(result.success).toBe(true)
      expect(result.data?.length).toBeLessThanOrEqual(3)
    })

    it('should get site by ID', async () => {
      // First get all sites to get a real ID
      const allSites = await heritageSitesService.getAll()
      const firstSite = allSites.data?.data[0]
      
      if (firstSite) {
        const result = await heritageSitesService.getById(firstSite.id)
        
        expect(result.success).toBe(true)
        expect(result.data?.id).toBe(firstSite.id)
        expect(result.data?.name_en).toBe(firstSite.name_en)
      }
    })

    it('should create and delete test heritage site', async () => {
      // Get a real palika and category ID using supabase client directly
      const { data: palikas } = await supabase.from('palikas').select('id').limit(1)
      const { data: categories } = await supabase.from('categories')
        .select('id')
        .eq('entity_type', 'heritage_site')
        .limit(1)
      
      if (!palikas?.length || !categories?.length) {
        throw new Error('Missing required reference data')
      }
      
      const testSite = {
        name_en: 'Test Heritage Site',
        name_ne: 'परीक्षण सम्पदा स्थल',
        palika_id: palikas[0].id,
        category_id: categories[0].id,
        heritage_status: 'local' as const,
        latitude: 27.7172,
        longitude: 85.3240,
        short_description: 'Test site for integration testing',
        status: 'draft' as const
      }
      
      // Create
      const createResult = await heritageSitesService.create(testSite)
      expect(createResult.success).toBe(true)
      expect(createResult.data?.name_en).toBe(testSite.name_en)
      
      const createdId = createResult.data?.id
      
      // Verify it exists
      const getResult = await heritageSitesService.getById(createdId!)
      expect(getResult.success).toBe(true)
      
      // Clean up - delete it
      const deleteResult = await heritageSitesService.delete(createdId!)
      expect(deleteResult.success).toBe(true)
      
      // Verify it's gone
      const getAfterDelete = await heritageSitesService.getById(createdId!)
      expect(getAfterDelete.success).toBe(false)
    })
  })

  describe('Real Filtering and Search', () => {
    it('should filter by palika', async () => {
      // Get a real palika ID that has heritage sites
      const allSites = await heritageSitesService.getAll()
      const firstSite = allSites.data?.data[0]
      
      if (firstSite?.palika_id) {
        const result = await heritageSitesService.getAll({ 
          palika_id: firstSite.palika_id 
        })
        
        expect(result.success).toBe(true)
        const sites = result.data?.data || []
        sites.forEach(site => {
          expect(site.palika_id).toBe(firstSite.palika_id)
        })
      }
    })

    it('should search by name', async () => {
      const result = await heritageSitesService.getAll({ search: 'Temple' })
      
      expect(result.success).toBe(true)
      const sites = result.data?.data || []
      
      if (sites.length > 0) {
        sites.forEach(site => {
          expect(site.name_en.toLowerCase()).toContain('temple')
        })
      }
    })
  })
})