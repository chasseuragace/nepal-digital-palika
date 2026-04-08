/**
 * Supabase Business Targeting Datasource
 * Real implementation using Supabase queries
 * Implements IBusinessTargetingDatasource interface
 */

import { supabaseAdmin } from './supabase'
import {
  IBusinessTargetingDatasource,
  FilterOptions,
  BusinessResult,
  BusinessTargetingStats,
} from './business-targeting-datasource'

export class SupabaseBusinessTargetingDatasource implements IBusinessTargetingDatasource {
  async getFilterOptions(palikaId: number): Promise<FilterOptions> {
    try {
      // Get distinct wards
      const { data: wardData } = await supabaseAdmin
        .from('businesses')
        .select('ward_number')
        .eq('palika_id', palikaId)
        .neq('ward_number', null)

      const wards = [...new Set(wardData?.map(d => d.ward_number))].sort((a, b) => a - b)

      // Get business types (categories)
      const { data: typeData } = await supabaseAdmin
        .from('categories')
        .select('id, name_en, name_ne')
        .eq('palika_id', palikaId)
        .eq('entity_type', 'business')
        .eq('is_active', true)
        .order('display_order')

      const businessTypes = (typeData || []).map(t => ({
        id: t.id,
        name: t.name_en,
        name_ne: t.name_ne,
      }))

      // Rating range
      const { data: ratingData } = await supabaseAdmin
        .from('businesses')
        .select('rating_average')
        .eq('palika_id', palikaId)

      const ratings = ratingData?.map(d => d.rating_average || 0) || []
      const ratingRange = {
        min: Math.min(...ratings, 0),
        max: Math.max(...ratings, 5),
      }

      return {
        wards: wards as number[],
        businessTypes,
        ratingRange,
      }
    } catch (error) {
      console.error('Failed to get filter options:', error)
      return {
        wards: [],
        businessTypes: [],
        ratingRange: { min: 0, max: 5 },
      }
    }
  }

  async queryBusinesses(
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
  ) {
    try {
      const page = filters.page || 1
      const pageSize = filters.pageSize || 50
      const offset = (page - 1) * pageSize

      // Build base query
      let query = supabaseAdmin
        .from('businesses')
        .select(
          `id, business_name, business_name_ne, ward_number, business_type_id,
           rating_average, rating_count, view_count,
           is_active, is_published, status, verification_status,
           is_24_7, created_at`,
          { count: 'exact' }
        )
        .eq('palika_id', palikaId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.wards && filters.wards.length > 0) {
        query = query.in('ward_number', filters.wards)
      }

      if (filters.business_type_id && filters.business_type_id.length > 0) {
        query = query.in('business_type_id', filters.business_type_id)
      }

      if (filters.min_rating && filters.min_rating > 0) {
        query = query.gte('rating_average', filters.min_rating)
      }

      if (filters.min_view_count && filters.min_view_count > 0) {
        query = query.gte('view_count', filters.min_view_count)
      }

      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(
          `business_name.ilike.${searchTerm},business_name_ne.ilike.${searchTerm}`
        )
      }

      const { data: rawBusinesses, count, error } = await query

      if (error) throw error
      if (!rawBusinesses) {
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          hasMore: false,
        }
      }

      // Apply post-query filtering (product count)
      let filtered = rawBusinesses
      if (filters.min_product_count && filters.min_product_count > 0) {
        filtered = await this.applyProductCountFilter(filtered, filters.min_product_count)
      }

      // Apply pagination
      const totalAfterFilters = filtered.length
      const paginated = filtered.slice(offset, offset + pageSize)

      // Enrich with product counts
      const enriched = await this.enrichWithProductCounts(paginated)

      return {
        data: enriched,
        total: totalAfterFilters,
        page,
        pageSize,
        hasMore: offset + pageSize < totalAfterFilters,
      }
    } catch (error) {
      console.error('Business query failed:', error)
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }
    }
  }

  private async applyProductCountFilter(
    businesses: any[],
    minProductCount: number
  ): Promise<any[]> {
    try {
      const businessIds = businesses.map(b => b.id)
      const { data: productCounts } = await supabaseAdmin
        .from('marketplace_products')
        .select('business_id')

      const countMap: Record<string, number> = {}
      productCounts?.forEach(pc => {
        countMap[pc.business_id] = (countMap[pc.business_id] || 0) + 1
      })

      return businesses.filter(b => (countMap[b.id] || 0) >= minProductCount)
    } catch (error) {
      console.error('Product count filter failed:', error)
      return businesses
    }
  }

  private async enrichWithProductCounts(businesses: any[]): Promise<BusinessResult[]> {
    try {
      if (businesses.length === 0) return []

      const businessIds = businesses.map(b => b.id)
      const { data: products } = await supabaseAdmin
        .from('marketplace_products')
        .select('business_id')
        .in('business_id', businessIds)

      const countMap: Record<string, number> = {}
      products?.forEach(p => {
        countMap[p.business_id] = (countMap[p.business_id] || 0) + 1
      })

      return businesses.map(b => ({
        id: b.id,
        business_name: b.business_name,
        business_name_ne: b.business_name_ne,
        ward_number: b.ward_number,
        rating_average: b.rating_average,
        rating_count: b.rating_count,
        view_count: b.view_count,
        product_count: countMap[b.id] || 0,
      }))
    } catch (error) {
      console.error('Enrich with product counts failed:', error)
      return businesses.map(b => ({
        id: b.id,
        business_name: b.business_name,
        business_name_ne: b.business_name_ne,
        ward_number: b.ward_number,
        rating_average: b.rating_average,
        rating_count: b.rating_count,
        view_count: b.view_count,
        product_count: 0,
      }))
    }
  }

  async getTargetingStats(palikaId: number): Promise<BusinessTargetingStats> {
    try {
      const { data: businesses } = await supabaseAdmin
        .from('businesses')
        .select('id, is_active, is_published, rating_average')
        .eq('palika_id', palikaId)

      const totalBusinesses = businesses?.length || 0
      const activeBusinesses = businesses?.filter(b => b.is_active).length || 0
      const publishedBusinesses = businesses?.filter(b => b.is_published).length || 0
      const avgRating =
        businesses && businesses.length > 0
          ? businesses.reduce((sum, b) => sum + (b.rating_average || 0), 0) / businesses.length
          : 0

      const { count: productCount } = await supabaseAdmin
        .from('marketplace_products')
        .select('id', { count: 'exact' })
        .in('business_id', businesses?.map(b => b.id) || [])

      return {
        totalBusinesses,
        activeBusinesses,
        publishedBusinesses,
        avgRating,
        totalProducts: productCount || 0,
      }
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

  async fetchUsersForBusinesses(businessIds: string[]): Promise<Array<{ id: string; name: string }>> {
    try {
      // Query users associated with businesses
      // This assumes there's a business_owners or business_staff table
      // For now, return empty array (to be implemented based on actual schema)
      const { data: businessOwners } = await supabaseAdmin
        .from('business_owners')
        .select('user_id, user:profiles(id, name)')
        .in('business_id', businessIds)

      if (!businessOwners) return []

      return businessOwners.map((bo: any) => ({
        id: bo.user.id,
        name: bo.user.name,
      }))
    } catch (error) {
      console.error('Failed to fetch users for businesses:', error)
      return []
    }
  }
}

// Export singleton
export const supabaseBusinessTargetingDatasource = new SupabaseBusinessTargetingDatasource()
