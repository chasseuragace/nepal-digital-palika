/**
 * Business Targeting Service — Clean Architecture with DI
 *
 * SERVICE LAYER (Business Logic)
 * - Receives IBusinessTargetingDatasource via dependency injection
 * - Orchestrates domain operations (query, filter, get stats)
 * - Converts DTOs between API/UI and datasource layers
 * - No direct Supabase calls — all data operations go through datasource
 * - Supports mock/real datasource switching via environment variable
 */

import { IBusinessTargetingDatasource, FilterOptions, BusinessResult, BusinessTargetingStats } from '@/lib/business-targeting-datasource'
import { getBusinessTargetingDatasource } from '@/lib/business-targeting-config'

// ─── DTOs ───

export interface BusinessTargetFilter {
  ward_number?: number[]
  business_type_id?: number[]
  min_rating?: number
  min_view_count?: number
  min_product_count?: number
  search?: string
  page?: number
  pageSize?: number
}

export interface BusinessTargetingDTO {
  id: string
  business_name: string
  business_name_ne: string
  ward_number: number
  rating_average: number
  rating_count: number
  view_count: number
  product_count: number
  is_active: boolean
  is_published: boolean
}

export interface BusinessTargetingResponse {
  data: BusinessTargetingDTO[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Service ───

export class BusinessTargetingService {
  private datasource: IBusinessTargetingDatasource

  /**
   * Constructor with dependency injection.
   * If no datasource provided, uses config-based DI to get real/fake.
   */
  constructor(datasource?: IBusinessTargetingDatasource) {
    this.datasource = datasource || getBusinessTargetingDatasource()
  }

  /**
   * Query businesses for notification targeting.
   * Applies all domain filters and returns paginated results with product counts.
   */
  async queryBusinesses(
    palikaId: number,
    filters: BusinessTargetFilter
  ): Promise<BusinessTargetingResponse> {
    try {
      const result = await this.datasource.queryBusinesses(palikaId, {
        wards: filters.ward_number,
        business_type_id: filters.business_type_id,
        min_rating: filters.min_rating,
        min_view_count: filters.min_view_count,
        min_product_count: filters.min_product_count,
        search: filters.search,
        page: filters.page || 1,
        pageSize: filters.pageSize || 50,
      })

      return {
        data: result.data as BusinessTargetingDTO[],
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
      }
    } catch (error) {
      console.error('Business targeting query failed:', error)
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }
    }
  }

  /**
   * Get available filter options (wards, business types, rating range).
   */
  async getFilterOptions(palikaId: number): Promise<FilterOptions> {
    try {
      return await this.datasource.getFilterOptions(palikaId)
    } catch (error) {
      console.error('Failed to get filter options:', error)
      return {
        wards: [],
        businessTypes: [],
        ratingRange: { min: 0, max: 5 },
      }
    }
  }

  /**
   * Get targeting statistics for dashboard.
   */
  async getTargetingStats(palikaId: number): Promise<BusinessTargetingStats> {
    try {
      return await this.datasource.getTargetingStats(palikaId)
    } catch (error) {
      console.error('Failed to get targeting stats:', error)
      return {
        totalBusinesses: 0,
        activeBusinesses: 0,
        publishedBusinesses: 0,
        avgRating: 0,
        totalProducts: 0,
      }
    }
  }

  /**
   * Fetch users associated with selected businesses.
   * Used to send business-targeted notifications to business owners/staff.
   */
  async fetchUsersForBusinesses(businessIds: string[]): Promise<Array<{ id: string; name: string }>> {
    try {
      if (businessIds.length === 0) return []
      return await this.datasource.fetchUsersForBusinesses(businessIds)
    } catch (error) {
      console.error('Failed to fetch users for businesses:', error)
      return []
    }
  }
}

// Export singleton instance (uses config-based DI)
export const businessTargetingService = new BusinessTargetingService()
