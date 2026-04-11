/**
 * Business Targeting Client Service
 * Abstracts API calls for business targeting and user lookups
 */

export interface BusinessUser {
  id: string
  name: string
  email?: string
  business_id?: string
}

class BusinessTargetingClientService {
  private baseUrl = '/api/business-targeting'

  /**
   * Fetch users for selected businesses
   */
  async getUsersByBusinessIds(businessIds: string[]): Promise<BusinessUser[]> {
    if (!businessIds.length) return []

    const params = new URLSearchParams()
    businessIds.forEach(id => params.append('business_ids', id))

    const response = await fetch(`${this.baseUrl}/users?${params}`)

    if (!response.ok) {
      throw new Error('Failed to fetch business users')
    }

    const result = await response.json()
    return result.data || []
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<BusinessUser[]> {
    if (!query.trim()) return []

    const params = new URLSearchParams({ search: query })
    const response = await fetch(`${this.baseUrl}/users?${params}`)

    if (!response.ok) {
      throw new Error('Failed to search users')
    }

    const result = await response.json()
    return result.data || []
  }
}

export const businessTargetingService = new BusinessTargetingClientService()
