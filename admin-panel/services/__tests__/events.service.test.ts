/**
 * Events Service Tests
 * Tests CRUD operations, calendar features, and filtering
 */

import { EventsService } from '../events.service'
import { createMockClient } from '../database-client'

describe('EventsService', () => {
  // Mock data
  const mockEvents = [
    {
      id: 'event-1',
      palika_id: 1,
      name_en: 'Dashain Festival',
      name_ne: 'दशैं पर्व',
      slug: 'dashain-festival-2025',
      category_id: 1,
      event_type: 'Cultural',
      is_festival: true,
      start_date: '2025-10-02',
      end_date: '2025-10-16',
      status: 'published',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      palikas: { name_en: 'Kathmandu Metropolitan' },
      categories: { name_en: 'Festival' }
    },
    {
      id: 'event-2',
      palika_id: 1,
      name_en: 'Tihar Festival',
      name_ne: 'तिहार पर्व',
      slug: 'tihar-festival-2025',
      category_id: 1,
      event_type: 'Cultural',
      is_festival: true,
      start_date: '2025-11-01',
      end_date: '2025-11-05',
      status: 'published',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      palikas: { name_en: 'Kathmandu Metropolitan' },
      categories: { name_en: 'Festival' }
    },
    {
      id: 'event-3',
      palika_id: 2,
      name_en: 'Pokhara Street Festival',
      name_ne: 'पोखरा सडक महोत्सव',
      slug: 'pokhara-street-festival-2025',
      category_id: 2,
      event_type: 'Cultural',
      is_festival: false,
      start_date: '2025-12-15',
      end_date: '2025-12-17',
      status: 'draft',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
      palikas: { name_en: 'Pokhara Metropolitan' },
      categories: { name_en: 'Cultural' }
    },
    {
      id: 'event-4',
      palika_id: 1,
      name_en: 'Past Event',
      name_ne: 'पुरानो कार्यक्रम',
      slug: 'past-event-2024',
      category_id: 1,
      event_type: 'Cultural',
      is_festival: false,
      start_date: '2024-06-01',
      end_date: '2024-06-03',
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      palikas: { name_en: 'Kathmandu Metropolitan' },
      categories: { name_en: 'Cultural' }
    }
  ]

  let service: EventsService

  beforeEach(() => {
    const mockDb = createMockClient({
      events: mockEvents
    })
    service = new EventsService(mockDb)
  })

  describe('getAll', () => {
    it('should return all events', async () => {
      const result = await service.getAll()

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(4)
    })

    it('should filter by palika_id', async () => {
      const result = await service.getAll({ palika_id: 1 })

      expect(result.success).toBe(true)
      expect(result.data?.data.every(e => e.palika_id === 1)).toBe(true)
    })

    it('should filter by is_festival', async () => {
      const result = await service.getAll({ is_festival: true })

      expect(result.success).toBe(true)
      expect(result.data?.data.every(e => e.is_festival)).toBe(true)
      expect(result.data?.data.length).toBe(2)
    })

    it('should filter by status', async () => {
      const result = await service.getAll({ status: 'published' })

      expect(result.success).toBe(true)
      expect(result.data?.data.every(e => e.status === 'published')).toBe(true)
    })

    it('should filter by date range', async () => {
      const result = await service.getAll({
        start_date_from: '2025-10-01',
        start_date_to: '2025-11-30'
      })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(2) // Dashain and Tihar
    })

    it('should search by name', async () => {
      const result = await service.getAll({ search: 'Dashain' })

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(1)
      expect(result.data?.data[0].name_en).toBe('Dashain Festival')
    })
  })

  describe('getById', () => {
    it('should return an event by ID', async () => {
      const result = await service.getById('event-1')

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('event-1')
      expect(result.data?.name_en).toBe('Dashain Festival')
    })

    it('should return error for non-existent ID', async () => {
      const result = await service.getById('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Event not found')
    })
  })

  describe('getBySlug', () => {
    it('should return an event by slug', async () => {
      const result = await service.getBySlug('tihar-festival-2025')

      expect(result.success).toBe(true)
      expect(result.data?.slug).toBe('tihar-festival-2025')
    })
  })

  describe('create', () => {
    it('should create a new event', async () => {
      const input = {
        name_en: 'Buddha Jayanti',
        name_ne: 'बुद्ध जयन्ती',
        palika_id: 1,
        category_id: 1,
        event_type: 'Religious',
        is_festival: true,
        start_date: '2025-05-12',
        end_date: '2025-05-12'
      }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data?.name_en).toBe('Buddha Jayanti')
      expect(result.data?.slug).toBe('buddha-jayanti-2025')
      expect(result.data?.status).toBe('draft')
    })

    it('should fail without required fields', async () => {
      const result = await service.create({
        name_en: '',
        name_ne: 'Test',
        palika_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-02'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('English name is required')
    })

    it('should fail if end_date is before start_date', async () => {
      const result = await service.create({
        name_en: 'Invalid Event',
        name_ne: 'Invalid',
        palika_id: 1,
        start_date: '2025-01-10',
        end_date: '2025-01-05'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('End date must be after start date')
    })
  })

  describe('update', () => {
    it('should update an existing event', async () => {
      const result = await service.update('event-1', {
        name_en: 'Updated Dashain Festival'
      })

      expect(result.success).toBe(true)
      expect(result.data?.name_en).toBe('Updated Dashain Festival')
    })

    it('should fail for non-existent event', async () => {
      const result = await service.update('non-existent', {
        name_en: 'Updated Name'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Event not found')
    })
  })

  describe('delete', () => {
    it('should delete an event', async () => {
      const result = await service.delete('event-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Event deleted successfully')
    })
  })

  describe('publish', () => {
    it('should publish a draft event', async () => {
      const result = await service.publish('event-3')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('published')
    })
  })

  describe('archive', () => {
    it('should archive an event', async () => {
      const result = await service.archive('event-1')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('archived')
    })
  })

  describe('getUpcoming', () => {
    it('should return upcoming events', async () => {
      const result = await service.getUpcoming()

      expect(result.success).toBe(true)
      // All events with start_date >= today
      expect(result.data?.every(e => new Date(e.start_date) >= new Date())).toBe(true)
    })

    it('should limit results', async () => {
      const result = await service.getUpcoming(2)

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getPast', () => {
    it('should return past events', async () => {
      const result = await service.getPast()

      expect(result.success).toBe(true)
      // Should include the past event
      expect(result.data?.some(e => e.name_en === 'Past Event')).toBe(true)
    })
  })

  describe('getFestivals', () => {
    it('should return only festivals', async () => {
      const result = await service.getFestivals()

      expect(result.success).toBe(true)
      expect(result.data?.data.every(e => e.is_festival)).toBe(true)
    })
  })

  describe('getByDateRange', () => {
    it('should return events within date range', async () => {
      const result = await service.getByDateRange('2025-10-01', '2025-10-31')

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBe(1) // Only Dashain
      expect(result.data?.data[0].name_en).toBe('Dashain Festival')
    })
  })

  describe('getByPalika', () => {
    it('should return events for a specific palika', async () => {
      const result = await service.getByPalika(2)

      expect(result.success).toBe(true)
      expect(result.data?.data.every(e => e.palika_id === 2)).toBe(true)
    })
  })

  describe('getCalendarEvents', () => {
    it('should return events grouped by date for a year', async () => {
      const result = await service.getCalendarEvents(2025)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Should have events grouped by their start dates
    })

    it('should return events for a specific month', async () => {
      const result = await service.getCalendarEvents(2025, 10)

      expect(result.success).toBe(true)
      // October 2025 should have Dashain
    })
  })

  describe('search', () => {
    it('should search events by name', async () => {
      const result = await service.search('Festival')

      expect(result.success).toBe(true)
      expect(result.data?.data.length).toBeGreaterThan(0)
    })
  })
})
