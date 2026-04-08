/**
 * Abstract Business Targeting Datasource
 * Defines contract for querying/filtering businesses
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface FilterOptions {
  wards: number[]
  businessTypes: { id: number; name: string; name_ne: string }[]
  ratingRange: { min: number; max: number }
}

export interface BusinessResult {
  id: string
  business_name: string
  business_name_ne: string
  ward_number: number
  rating_average: number
  rating_count: number
  product_count: number
  view_count: number
}

export interface BusinessTargetingStats {
  totalBusinesses: number
  activeBusinesses: number
  publishedBusinesses: number
  avgRating: number
  totalProducts: number
}

export interface IBusinessTargetingDatasource {
  // Get available filter options (wards, categories, rating range)
  getFilterOptions(palikaId: number): Promise<FilterOptions>

  // Query businesses with filters
  queryBusinesses(
    palikaId: number,
    filters: {
      wards?: number[]
      business_type_id?: number[]
      min_rating?: number
      min_view_count?: number
      min_product_count?: number
      search?: string
      page?: number
      pageSize?: number
    }
  ): Promise<{
    data: BusinessResult[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }>

  // Get targeting statistics
  getTargetingStats(palikaId: number): Promise<BusinessTargetingStats>

  // Fetch users associated with businesses
  fetchUsersForBusinesses(businessIds: string[]): Promise<Array<{ id: string; name: string }>>
}
