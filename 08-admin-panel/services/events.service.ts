/**
 * Events Service
 * Framework-agnostic CRUD operations for events and festivals
 */

import { DatabaseClient } from './database-client'
import {
  Event,
  EventFilters,
  CreateEventInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'

export class EventsService {
  private db: DatabaseClient

  constructor(db: DatabaseClient) {
    this.db = db
  }

  /**
   * Get all events with optional filtering and pagination
   */
  async getAll(
    filters: EventFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    try {
      const { page = 1, limit = 20 } = pagination
      const offset = (page - 1) * limit

      let query = this.db
        .from('events')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)

      // Apply filters
      if (filters.palika_id) {
        query = query.eq('palika_id', filters.palika_id)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }
      if (filters.is_festival !== undefined) {
        query = query.eq('is_festival', filters.is_festival)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.start_date_from) {
        query = query.gte('start_date', filters.start_date_from)
      }
      if (filters.start_date_to) {
        query = query.lte('start_date', filters.start_date_to)
      }
      if (filters.search) {
        query = query.ilike('name_en', `%${filters.search}%`)
      }

      // Apply pagination
      query = query
        .order('start_date', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch events' }
      }

      const events = (data || []).map(this.mapEvent)

      return {
        success: true,
        data: {
          data: events,
          total: count || events.length,
          page,
          limit,
          hasMore: events.length === limit
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch events' }
    }
  }

  /**
   * Get a single event by ID
   */
  async getById(id: string): Promise<ServiceResponse<Event>> {
    try {
      const { data, error } = await this.db
        .from('events')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        return { success: false, error: 'Event not found' }
      }

      return { success: true, data: this.mapEvent(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch event' }
    }
  }

  /**
   * Get an event by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Event>> {
    try {
      const { data, error } = await this.db
        .from('events')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return { success: false, error: 'Event not found' }
      }

      return { success: true, data: this.mapEvent(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch event' }
    }
  }

  /**
   * Create a new event
   */
  async create(input: CreateEventInput): Promise<ServiceResponse<Event>> {
    try {
      // Validate required fields
      const validation = this.validateInput(input)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate slug
      const slug = this.generateSlug(input.name_en, input.start_date)

      // Prepare data
      const eventData = {
        ...input,
        slug,
        status: input.status || 'draft',
        is_festival: input.is_festival || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.db
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to create event' }
      }

      return {
        success: true,
        data: this.mapEvent(data),
        message: 'Event created successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create event' }
    }
  }

  /**
   * Update an existing event
   */
  async update(id: string, input: Partial<CreateEventInput>): Promise<ServiceResponse<Event>> {
    try {
      // Check if event exists
      const existing = await this.getById(id)
      if (!existing.success) {
        return { success: false, error: 'Event not found' }
      }

      // Prepare update data
      const updateData: any = {
        ...input,
        updated_at: new Date().toISOString()
      }

      // Update slug if name or date changed
      if (input.name_en || input.start_date) {
        const name = input.name_en || existing.data?.name_en || ''
        const date = input.start_date || existing.data?.start_date || ''
        updateData.slug = this.generateSlug(name, date)
      }

      const { data, error } = await this.db
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update event' }
      }

      return {
        success: true,
        data: this.mapEvent(data),
        message: 'Event updated successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to update event' }
    }
  }

  /**
   * Delete an event
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.db
        .from('events')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message || 'Failed to delete event' }
      }

      return { success: true, message: 'Event deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete event' }
    }
  }

  /**
   * Publish an event
   */
  async publish(id: string): Promise<ServiceResponse<Event>> {
    return this.update(id, { status: 'published' } as any)
  }

  /**
   * Archive an event
   */
  async archive(id: string): Promise<ServiceResponse<Event>> {
    return this.update(id, { status: 'archived' } as any)
  }

  /**
   * Get upcoming events
   */
  async getUpcoming(limit: number = 10): Promise<ServiceResponse<Event[]>> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await this.db
        .from('events')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .gte('start_date', today)
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch upcoming events' }
      }

      return { success: true, data: (data || []).map(this.mapEvent) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch upcoming events' }
    }
  }

  /**
   * Get past events
   */
  async getPast(limit: number = 10): Promise<ServiceResponse<Event[]>> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await this.db
        .from('events')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .lt('end_date', today)
        .eq('status', 'published')
        .order('end_date', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch past events' }
      }

      return { success: true, data: (data || []).map(this.mapEvent) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch past events' }
    }
  }

  /**
   * Get festivals only
   */
  async getFestivals(pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    return this.getAll({ is_festival: true }, pagination)
  }

  /**
   * Get events by date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    return this.getAll(
      { start_date_from: startDate, start_date_to: endDate },
      pagination
    )
  }

  /**
   * Get events by palika
   */
  async getByPalika(palikaId: number, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  /**
   * Get events for calendar view (grouped by month)
   */
  async getCalendarEvents(year: number, month?: number): Promise<ServiceResponse<Record<string, Event[]>>> {
    try {
      let startDate: string
      let endDate: string

      if (month !== undefined) {
        // Specific month
        startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
      } else {
        // Entire year
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
      }

      const result = await this.getByDateRange(startDate, endDate, { limit: 100 })
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error }
      }

      // Group by date
      const grouped: Record<string, Event[]> = {}
      for (const event of result.data.data) {
        const date = event.start_date.split('T')[0]
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(event)
      }

      return { success: true, data: grouped }
    } catch (error) {
      return { success: false, error: 'Failed to fetch calendar events' }
    }
  }

  /**
   * Search events
   */
  async search(query: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<Event>>> {
    return this.getAll({ search: query }, pagination)
  }

  // Private helper methods

  private mapEvent(data: any): Event {
    return {
      id: data.id,
      palika_id: data.palika_id,
      name_en: data.name_en,
      name_ne: data.name_ne,
      slug: data.slug,
      category_id: data.category_id,
      event_type: data.event_type,
      is_festival: data.is_festival || false,
      nepali_calendar_date: data.nepali_calendar_date,
      recurrence_pattern: data.recurrence_pattern,
      start_date: data.start_date,
      end_date: data.end_date,
      location: data.location ? this.parseLocation(data.location) : undefined,
      venue_name: data.venue_name,
      short_description: data.short_description,
      short_description_ne: data.short_description_ne,
      full_description: data.full_description,
      full_description_ne: data.full_description_ne,
      featured_image: data.featured_image,
      images: data.images,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      palika_name: data.palikas?.name_en,
      category_name: data.categories?.name_en
    }
  }

  private parseLocation(location: any): { lat: number; lng: number } | undefined {
    if (!location) return undefined
    
    if (typeof location === 'string' && location.startsWith('POINT')) {
      const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) }
      }
    }
    
    if (location.coordinates) {
      return { lng: location.coordinates[0], lat: location.coordinates[1] }
    }
    
    return undefined
  }

  private generateSlug(name: string, date: string): string {
    const year = date.split('-')[0]
    return `${name}-${year}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private validateInput(input: CreateEventInput): { valid: boolean; error?: string } {
    if (!input.name_en?.trim()) {
      return { valid: false, error: 'English name is required' }
    }
    if (!input.name_ne?.trim()) {
      return { valid: false, error: 'Nepali name is required' }
    }
    if (!input.palika_id) {
      return { valid: false, error: 'Palika is required' }
    }
    if (!input.start_date) {
      return { valid: false, error: 'Start date is required' }
    }
    if (!input.end_date) {
      return { valid: false, error: 'End date is required' }
    }
    if (new Date(input.end_date) < new Date(input.start_date)) {
      return { valid: false, error: 'End date must be after start date' }
    }
    return { valid: true }
  }
}
