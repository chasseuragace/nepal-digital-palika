/**
 * Categories Client Service
 * Abstracts categories API calls from UI components
 * Uses datasource pattern to support both fake and Supabase implementations
 */

import { getCategoriesDatasource } from '../categories-config'
import type { Category as DatasourceCategory } from '../categories-datasource'

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
    try {
      const datasource = getCategoriesDatasource()
      const categories = await datasource.getByEntityType(entityType)

      // Transform datasource Category to client Category (simplified interface)
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        entity_type: cat.entity_type
      }))
    } catch (error) {
      console.error('Error fetching categories from datasource:', error)
      // Fallback to API call if datasource fails
      return this.fetchFromApi(entityType)
    }
  }

  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    try {
      const datasource = getCategoriesDatasource()
      const categories = await datasource.getAll()

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        entity_type: cat.entity_type
      }))
    } catch (error) {
      console.error('Error fetching categories from datasource:', error)
      // Fallback to API call if datasource fails
      return this.fetchFromApi()
    }
  }

  /**
   * Create a new category
   */
  async create(category: {
    name: string
    entity_type: string
  }): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
      const datasource = getCategoriesDatasource()
      const newCategory = await datasource.create({
        ...category,
        name_ne: '', // Default empty for now
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        is_active: true
      })

      return {
        success: true,
        data: {
          id: newCategory.id,
          name: newCategory.name,
          entity_type: newCategory.entity_type
        }
      }
    } catch (error) {
      console.error('Error creating category:', error)
      // Fallback to API call if datasource fails
      return this.createViaApi(category)
    }
  }

  /**
   * Fallback: Fetch from API
   */
  private async fetchFromApi(entityType?: string): Promise<Category[]> {
    const url = entityType
      ? `${this.baseUrl}?entity_type=${entityType}`
      : this.baseUrl

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const result = await response.json()
    return Array.isArray(result) ? result : result.data || []
  }

  /**
   * Fallback: Create via API
   */
  private async createViaApi(category: {
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
