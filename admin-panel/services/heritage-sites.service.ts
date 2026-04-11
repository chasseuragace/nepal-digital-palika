/**
 * Heritage Sites Service
 * Framework-agnostic CRUD operations for heritage sites
 */

import { DatabaseClient } from './database-client'
import {
  HeritageSite,
  HeritageSiteFilters,
  CreateHeritageSiteInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'
import { IHeritageSitesDatasource } from '@/lib/heritage-sites-datasource'
import { getHeritageSitesDatasource } from '@/lib/heritage-sites-config'

export class HeritageSitesService {
  private db: DatabaseClient
  private datasource: IHeritageSitesDatasource

  constructor(db?: DatabaseClient | IHeritageSitesDatasource) {
    // Support both old DatabaseClient and new IHeritageSitesDatasource
    if (db && 'from' in db) {
      // It's a DatabaseClient
      this.db = db as DatabaseClient
      this.datasource = getHeritageSitesDatasource()
    } else if (db) {
      // It's a datasource
      this.datasource = db as IHeritageSitesDatasource
      this.db = null as any
    } else {
      // No argument, use default
      this.datasource = getHeritageSitesDatasource()
      this.db = null as any
    }
  }

  /**
   * Get all heritage sites with optional filtering and pagination
   */
  async getAll(
    filters: HeritageSiteFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
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
      return { success: false, error: 'Failed to fetch heritage sites' }
    }
  }

  /**
   * Get a single heritage site by ID
   */
  async getById(id: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.getById(id)

      if (!data) {
        return { success: false, error: 'Heritage site not found' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch heritage site' }
    }
  }

  /**
   * Get a heritage site by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.getBySlug(slug)

      if (!data) {
        return { success: false, error: 'Heritage site not found' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch heritage site' }
    }
  }

  /**
   * Create a new heritage site
   */
  async create(input: CreateHeritageSiteInput): Promise<ServiceResponse<HeritageSite>> {
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
        message: 'Heritage site created successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create heritage site' }
    }
  }

  /**
   * Update an existing heritage site
   */
  async update(id: string, input: Partial<CreateHeritageSiteInput>): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.update(id, input)

      return {
        success: true,
        data,
        message: 'Heritage site updated successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to update heritage site' }
    }
  }

  /**
   * Delete a heritage site
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.delete(id)

      return { success: true, message: 'Heritage site deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete heritage site' }
    }
  }

  /**
   * Publish a heritage site
   */
  async publish(id: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.publish(id)
      return { success: true, data, message: 'Heritage site published successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to publish heritage site' }
    }
  }

  /**
   * Archive a heritage site
   */
  async archive(id: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.archive(id)
      return { success: true, data, message: 'Heritage site archived successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to archive heritage site' }
    }
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const data = await this.datasource.toggleFeatured(id)
      return { success: true, data, message: 'Featured status toggled successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to toggle featured status' }
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.incrementViewCount(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to increment view count' }
    }
  }

  /**
   * Get featured heritage sites
   */
  async getFeatured(limit: number = 6): Promise<ServiceResponse<HeritageSite[]>> {
    try {
      const data = await this.datasource.getFeatured(limit)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch featured sites' }
    }
  }

  /**
   * Get heritage sites by palika
   */
  async getByPalika(palikaId: number, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
    try {
      const { page = 1, limit = 20 } = pagination
      const result = await this.datasource.getByPalika(palikaId, { page, limit })

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
      return { success: false, error: 'Failed to fetch heritage sites' }
    }
  }

  /**
   * Search heritage sites
   */
  async search(query: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
    try {
      const { page = 1, limit = 20 } = pagination
      const result = await this.datasource.search(query, { page, limit })

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
      return { success: false, error: 'Failed to search heritage sites' }
    }
  }

  // Private helper methods

  private validateInput(input: CreateHeritageSiteInput): { valid: boolean; error?: string } {
    if (!input.name_en?.trim()) {
      return { valid: false, error: 'English name is required' }
    }
    if (!input.name_ne?.trim()) {
      return { valid: false, error: 'Nepali name is required' }
    }
    if (!input.palika_id) {
      return { valid: false, error: 'Palika is required' }
    }
    if (!input.category_id) {
      return { valid: false, error: 'Category is required' }
    }
    return { valid: true }
  }
}
