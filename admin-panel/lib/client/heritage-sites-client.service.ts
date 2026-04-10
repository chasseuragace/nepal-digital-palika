/**
 * Heritage Sites Client Service
 * Abstracts API calls for heritage sites from UI components
 */

export interface HeritageSite {
  id: string
  name_en: string
  name_ne: string
  category_id: number
  category_name?: string
  site_type: string
  heritage_status: string
  status: string
  palika_name?: string
  created_at: string
}

export interface HeritageSitesResponse {
  data: HeritageSite[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

class HeritageSitesClientService {
  private baseUrl = '/api/heritage-sites'

  /**
   * Fetch all heritage sites with optional filters
   */
  async getAll(
    filters?: {
      status?: string
      palika_id?: number
      category_id?: number
      heritage_status?: string
      search?: string
    },
    pagination?: {
      page?: number
      limit?: number
    }
  ): Promise<HeritageSitesResponse> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.palika_id) params.append('palika_id', filters.palika_id.toString())
    if (filters?.category_id) params.append('category_id', filters.category_id.toString())
    if (filters?.heritage_status) params.append('heritage_status', filters.heritage_status)
    if (filters?.search) params.append('search', filters.search)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.limit) params.append('limit', pagination.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch heritage sites')
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
   * Fetch a single heritage site by ID
   */
  async getById(id: string): Promise<HeritageSite> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch heritage site')
    }

    return response.json()
  }

  /**
   * Create a new heritage site
   */
  async create(site: Partial<HeritageSite>): Promise<HeritageSite> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    })

    if (!response.ok) {
      throw new Error('Failed to create heritage site')
    }

    return response.json()
  }

  /**
   * Update a heritage site
   */
  async update(id: string, updates: Partial<HeritageSite>): Promise<HeritageSite> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })

    if (!response.ok) {
      throw new Error('Failed to update heritage site')
    }

    return response.json()
  }

  /**
   * Delete a heritage site
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (!response.ok) {
      throw new Error('Failed to delete heritage site')
    }
  }
}

export const heritageSitesService = new HeritageSitesClientService()
