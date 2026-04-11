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
import { IEventsDatasource } from '@/lib/events-datasource'
import { getEventsDatasource } from '@/lib/events-config'

export class EventsService {
  private db: DatabaseClient
  private datasource: IEventsDatasource

  constructor(db?: DatabaseClient | IEventsDatasource) {
    // Support both old DatabaseClient and new IEventsDatasource
    if (db && 'from' in db) {
      // It's a DatabaseClient
      this.db = db as DatabaseClient
      this.datasource = getEventsDatasource()
    } else if (db) {
      // It's a datasource
      this.datasource = db as IEventsDatasource
      this.db = null as any
    } else {
      // No argument, use default
      this.datasource = getEventsDatasource()
      this.db = null as any
    }
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
      const result = await this.datasource.getAll(filters, { page, limit })

      return {
        success: true,
        data: {
          data: result.data,
          total: result.total,
          page,
          limit,
          hasMore: result.data.length === limit
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
      const data = await this.datasource.getById(id)

      if (!data) {
        return { success: false, error: 'Event not found' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch event' }
    }
  }

  /**
   * Get an event by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Event>> {
    try {
      const data = await this.datasource.getBySlug(slug)

      if (!data) {
        return { success: false, error: 'Event not found' }
      }

      return { success: true, data }
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

      const data = await this.datasource.create(input)

      return {
        success: true,
        data,
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
      const data = await this.datasource.update(id, input)

      return {
        success: true,
        data,
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
      await this.datasource.delete(id)

      return { success: true, message: 'Event deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete event' }
    }
  }

  /**
   * Publish an event
   */
  async publish(id: string): Promise<ServiceResponse<Event>> {
    try {
      const data = await this.datasource.publish(id)
      return { success: true, data, message: 'Event published successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to publish event' }
    }
  }

  /**
   * Archive an event
   */
  async archive(id: string): Promise<ServiceResponse<Event>> {
    try {
      const data = await this.datasource.archive(id)
      return { success: true, data, message: 'Event archived successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to archive event' }
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcoming(limit: number = 10): Promise<ServiceResponse<Event[]>> {
    try {
      const data = await this.datasource.getUpcoming(limit)
      return { success: true, data }
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
      const result = await this.datasource.getAll(
        { start_date_to: today, status: 'published' },
        { limit }
      )
      return { success: true, data: result.data }
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
