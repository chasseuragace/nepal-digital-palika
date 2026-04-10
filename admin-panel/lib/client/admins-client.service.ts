/**
 * Admins Client Service
 * Abstracts admin API calls from UI components
 */

export interface Admin {
  id: string
  email: string
  full_name: string
  role: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id?: number
  district_id?: number
  palika_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminsResponse {
  data: Admin[]
  total: number
  page: number
  limit: number
}

class AdminsClientService {
  private baseUrl = '/api/admins'

  /**
   * Fetch all admins with optional filters
   */
  async getAll(
    pagination?: {
      page?: number
      limit?: number
    }
  ): Promise<AdminsResponse> {
    const params = new URLSearchParams()

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.limit) params.append('limit', pagination.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch admins')
    }

    return response.json()
  }

  /**
   * Get a single admin by ID
   */
  async getById(id: string): Promise<Admin> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch admin')
    }

    return response.json()
  }

  /**
   * Create a new admin
   */
  async create(admin: {
    email: string
    full_name: string
    role: string
    hierarchy_level: string
    province_id?: number
    district_id?: number
    palika_id?: number
    regions?: Array<{ region_type: string; region_id: number }>
  }): Promise<{ success: boolean; data?: Admin; error?: string }> {
    const response = await fetch('/api/admins/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create admin')
    }

    return response.json()
  }

  /**
   * Update an admin
   */
  async update(id: string, updates: Partial<Admin>): Promise<Admin> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update admin')
    }

    return response.json()
  }

  /**
   * Delete an admin
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete admin')
    }
  }

  /**
   * Deactivate an admin (set is_active to false)
   */
  async deactivate(id: string): Promise<Admin> {
    return this.update(id, { is_active: false } as any)
  }

  /**
   * Activate an admin (set is_active to true)
   */
  async activate(id: string): Promise<Admin> {
    return this.update(id, { is_active: true } as any)
  }
}

export const adminsService = new AdminsClientService()
