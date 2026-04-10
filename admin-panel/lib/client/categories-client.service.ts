/**
 * Categories Client Service
 * Abstracts categories API calls from UI components
 */

export interface Category {
  id: string
  name: string
  entity_type: string
}

export interface CategoriesResponse {
  data: Category[]
  total?: number
}

class CategoriesClientService {
  private baseUrl = '/api/categories'

  /**
   * Get categories by entity type
   */
  async getByEntityType(entityType: string): Promise<Category[]> {
    const response = await fetch(`${this.baseUrl}?entity_type=${entityType}`)

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const result = await response.json()
    return Array.isArray(result) ? result : result.data || []
  }

  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const result = await response.json()
    return Array.isArray(result) ? result : result.data || []
  }

  /**
   * Create a new category
   */
  async create(category: {
    name: string
    entity_type: string
  }): Promise<{ success: boolean; data?: Category; error?: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create category')
    }

    return response.json()
  }
}

export const categoriesService = new CategoriesClientService()
