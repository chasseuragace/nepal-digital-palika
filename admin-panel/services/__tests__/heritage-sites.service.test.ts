/**
 * Heritage Sites Service Tests
 * Tests CRUD operations, filtering, and business logic
 */

import { HeritageSitesService } from '../heritage-sites.service'
import { createMockClient } from '../database-client'
import { HeritageSite } from '../types'

describe('HeritageSitesService', () => {
  // Mock data
  const mockHeritageSites = [
    {
      id: 'site-1',
      palika_id: 1,
      name_en: 'Pashupatinath Temple',
      name_ne: 'पशुपतिनाथ मन्दिर',
      slug: 'pashupatinath-temple',
      category_id: 1,
      site_type: 'Temple',
      heritage_status: 'world_heritage',
      status: 'published',
      is_featured: true,
      view_count: 1500,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      palikas: { name_en: 'Kathmandu Metropolitan' },
      categories: { name_en: 'Temple' }
    },
    {
      id: 'site-2',
      palika_id: 1,
      name_en: 'Boudhanath Stupa',
      name_ne: 'बौद्धनाथ स्तुप',
      slug: 'boudhanath-stupa',
      category_id: 2,
      site_type: 'Monastery',
      heritage_status: 'world_heritage',
      status: 'published',
      is_featured: true,
      view_count: 1200,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      palikas: { name_en: 'Kathmandu Metropolitan' },
      categories: { name_en: 'Monastery' }
    },
    {
      id: 'site-3',
      palika_id: 2,
      name_en: 'Patan Durbar Square',
      name_ne: 'पाटन दरबार स्क्वायर',
      slug: 'patan-durbar-square',
      category_id: 3,
      site_type: 'Palace',
      heritage_status: 'world_heritage',
      status: 'draft',
      is_featured: false,
      view_count: 800,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
      palikas: { name_en: 'Lalitpur Metropolitan' },
      categories: { name_en: 'Palace' }
    }
  ]

  let service: HeritageSitesService

  beforeEach(() => {
    const mockDb = createMockClient({
      heritage_sites: mockHeritageSites
    })
    service = new HeritageSitesService(mockDb)
  })

  describe('getAll', () => {
    it('should return all heritage sites', async () => {
      const result = await service.getAll()

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(3)
    })

    it('should filter by palika_id', async () => {
      const result = await service.getAll({ palika_id: 1 })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(2)
      expect(result.data?.data.every(s => s.palika_id === 1)).toBe(true)
    })

    it('should filter by status', async () => {
      const result = await service.getAll({ status: 'published' })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(2)
      expect(result.data?.data.every(s => s.status === 'published')).toBe(true)
    })

    it('should filter by heritage_status', async () => {
      const result = await service.getAll({ heritage_status: 'world_heritage' })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(3)
    })

    it('should filter by is_featured', async () => {
      const result = await service.getAll({ is_featured: true })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(2)
      expect(result.data?.data.every(s => s.is_featured)).toBe(true)
    })

    it('should search by name', async () => {
      const result = await service.getAll({ search: 'Patan' })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(1)
      expect(result.data?.data[0].name_en).toBe('Patan Durbar Square')
    })

    it('should paginate results', async () => {
      const result = await service.getAll({}, { page: 1, limit: 2 })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(2)
      expect(result.data?.page).toBe(1)
      expect(result.data?.limit).toBe(2)
      expect(result.data?.hasMore).toBe(true)
    })
  })

  describe('getById', () => {
    it('should return a heritage site by ID', async () => {
      const result = await service.getById('site-1')

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('site-1')
      expect(result.data?.name_en).toBe('Pashupatinath Temple')
    })

    it('should return error for non-existent ID', async () => {
      const result = await service.getById('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Heritage site not found')
    })
  })

  describe('getBySlug', () => {
    it('should return a heritage site by slug', async () => {
      const result = await service.getBySlug('boudhanath-stupa')

      expect(result.success).toBe(true)
      expect(result.data?.slug).toBe('boudhanath-stupa')
      expect(result.data?.name_en).toBe('Boudhanath Stupa')
    })

    it('should return error for non-existent slug', async () => {
      const result = await service.getBySlug('non-existent-slug')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Heritage site not found')
    })
  })

  describe('create', () => {
    it('should create a new heritage site', async () => {
      const input = {
        name_en: 'Swayambhunath',
        name_ne: 'स्वयम्भूनाथ',
        palika_id: 1,
        category_id: 1,
        site_type: 'Temple',
        heritage_status: 'world_heritage',
        short_description: 'Ancient Buddhist temple'
      }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data?.name_en).toBe('Swayambhunath')
      expect(result.data?.slug).toBe('swayambhunath')
      expect(result.data?.status).toBe('draft')
    })

    it('should fail without required fields', async () => {
      const result = await service.create({
        name_en: '',
        name_ne: 'Test',
        palika_id: 1,
        category_id: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('English name is required')
    })

    it('should fail without palika_id', async () => {
      const result = await service.create({
        name_en: 'Test Site',
        name_ne: 'Test',
        palika_id: 0,
        category_id: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Palika is required')
    })

    it('should generate slug from name', async () => {
      const input = {
        name_en: 'Test Heritage Site With Spaces',
        name_ne: 'टेस्ट',
        palika_id: 1,
        category_id: 1
      }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data?.slug).toBe('test-heritage-site-with-spaces')
    })
  })

  describe('update', () => {
    it('should update an existing heritage site', async () => {
      const result = await service.update('site-1', {
        name_en: 'Updated Pashupatinath Temple'
      })

      expect(result.success).toBe(true)
      expect(result.data?.name_en).toBe('Updated Pashupatinath Temple')
    })

    it('should fail for non-existent site', async () => {
      const result = await service.update('non-existent', {
        name_en: 'Updated Name'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Heritage site not found')
    })
  })

  describe('delete', () => {
    it('should delete a heritage site', async () => {
      const result = await service.delete('site-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Heritage site deleted successfully')
    })
  })

  describe('publish', () => {
    it('should publish a draft heritage site', async () => {
      const result = await service.publish('site-3')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('published')
    })
  })

  describe('archive', () => {
    it('should archive a heritage site', async () => {
      const result = await service.archive('site-1')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('archived')
    })
  })

  describe('toggleFeatured', () => {
    it('should toggle featured status from true to false', async () => {
      const result = await service.toggleFeatured('site-1')

      expect(result.success).toBe(true)
      expect(result.data?.is_featured).toBe(false)
    })

    it('should toggle featured status from false to true', async () => {
      const result = await service.toggleFeatured('site-3')

      expect(result.success).toBe(true)
      expect(result.data?.is_featured).toBe(true)
    })
  })

  describe('getFeatured', () => {
    it('should return featured heritage sites', async () => {
      const result = await service.getFeatured()

      expect(result.success).toBe(true)
      expect(result.data?.every(s => s.is_featured)).toBe(true)
    })

    it('should limit results', async () => {
      const result = await service.getFeatured(1)

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getByPalika', () => {
    it('should return heritage sites for a specific palika', async () => {
      const result = await service.getByPalika(1)

      expect(result.success).toBe(true)
      expect(result.data?.data.every(s => s.palika_id === 1)).toBe(true)
    })
  })

  describe('search', () => {
    it('should search heritage sites by name', async () => {
      const result = await service.search('Temple')

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBeGreaterThan(0)
    })

    it('should return empty results for no matches', async () => {
      const result = await service.search('NonExistentSite')

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(0)
    })
  })

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      const before = await service.getById('site-1')
      const initialCount = before.data?.view_count || 0

      await service.incrementViewCount('site-1')

      const after = await service.getById('site-1')
      expect(after.data?.view_count).toBe(initialCount + 1)
    })

    it('should fail for non-existent site', async () => {
      const result = await service.incrementViewCount('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Heritage site not found')
    })
  })
})
