/**
 * Events Client Service
 * Abstracts API calls for events from UI components
 */

export interface Event {
  id: string
  name_en: string
  name_ne: string
  event_type: string
  start_date: string
  end_date: string
  status: string
  palika_name?: string
  created_at: string
}

export interface EventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

class EventsClientService {
  private baseUrl = '/api/events'

  /**
   * Fetch all events with optional filters
   */
  async getAll(
    filters?: {
      status?: string
      palika_id?: number
      is_festival?: boolean
      search?: string
    },
    pagination?: {
      page?: number
      limit?: number
    }
  ): Promise<EventsResponse> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.palika_id) params.append('palika_id', filters.palika_id.toString())
    if (filters?.is_festival !== undefined) params.append('is_festival', filters.is_festival.toString())
    if (filters?.search) params.append('search', filters.search)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.limit) params.append('limit', pagination.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch events')
    }

    const result = await response.json()
    // Handle both direct array and paginated response
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length,
        hasMore: false
      }
    }

    return result
  }

  /**
   * Fetch a single event by ID
   */
  async getById(id: string): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch event')
    }

    return response.json()
  }

  /**
   * Create a new event
   */
  async create(event: Partial<Event>): Promise<Event> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      throw new Error('Failed to create event')
    }

    return response.json()
  }

  /**
   * Update an event
   */
  async update(id: string, updates: Partial<Event>): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update event')
    }

    return response.json()
  }

  /**
   * Delete an event
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete event')
    }
  }
}

export const eventsService = new EventsClientService()
