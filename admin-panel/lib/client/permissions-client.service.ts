/**
 * Permissions Client Service
 * Abstracts permission API calls from UI components
 */

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string
  created_at?: string
}

export interface PermissionsResponse {
  data: Permission[]
  total?: number
}

class PermissionsClientService {
  private baseUrl = '/api/permissions'

  /**
   * Fetch all permissions
   */
  async getAll(): Promise<PermissionsResponse> {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch permissions')
    }

    const result = await response.json()

    // Handle both paginated and direct array responses
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length
      }
    }

    return result
  }

  /**
   * Get a single permission by ID
   */
  async getById(id: number): Promise<Permission> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch permission')
    }

    return response.json()
  }

  /**
   * Create a new permission
   */
  async create(permission: {
    name: string
    resource: string
    action: string
    description: string
  }): Promise<Permission> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permission)
    })

    if (!response.ok) {
      throw new Error('Failed to create permission')
    }

    return response.json()
  }

  /**
   * Update a permission
   */
  async update(id: number, updates: Partial<Permission>): Promise<Permission> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update permission')
    }

    return response.json()
  }

  /**
   * Delete a permission
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete permission')
    }
  }

  /**
   * Get permissions by resource
   */
  async getByResource(resource: string): Promise<Permission[]> {
    const allPermissions = await this.getAll()
    return allPermissions.data.filter(p => p.resource === resource)
  }

  /**
   * Get permissions by action
   */
  async getByAction(action: string): Promise<Permission[]> {
    const allPermissions = await this.getAll()
    return allPermissions.data.filter(p => p.action === action)
  }
}

export const permissionsService = new PermissionsClientService()
