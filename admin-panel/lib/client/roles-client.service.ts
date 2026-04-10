/**
 * Roles Client Service
 * Abstracts role API calls from UI components
 */

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string
}

export interface Role {
  id: number
  name: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  description: string
  description_ne: string
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export interface RolesResponse {
  data: Role[]
  total: number
  page: number
  limit: number
}

class RolesClientService {
  private baseUrl = '/api/roles'

  /**
   * Fetch all roles with optional filters and pagination
   */
  async getAll(
    pagination?: {
      page?: number
      limit?: number
    }
  ): Promise<RolesResponse> {
    const params = new URLSearchParams()

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.limit) params.append('limit', pagination.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch roles')
    }

    const result = await response.json()
    // Handle both paginated and direct array responses
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length
      }
    }

    return result
  }

  /**
   * Fetch a single role by ID
   */
  async getById(id: number): Promise<Role> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch role')
    }

    return response.json()
  }

  /**
   * Create a new role
   */
  async create(role: {
    name: string
    hierarchy_level: string
    description: string
    description_ne: string
    permissions?: number[]
  }): Promise<{ success: boolean; data?: Role; error?: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create role')
    }

    return response.json()
  }

  /**
   * Update a role
   */
  async update(id: number, updates: Partial<Role>): Promise<Role> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update role')
    }

    return response.json()
  }

  /**
   * Delete a role
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete role')
    }
  }

  /**
   * Assign permissions to a role (replaces all permissions)
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    const response = await fetch(`${this.baseUrl}/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to assign permissions')
    }

    return response.json()
  }
}

export const rolesService = new RolesClientService()
