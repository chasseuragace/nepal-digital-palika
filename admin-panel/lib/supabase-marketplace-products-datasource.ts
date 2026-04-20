/**
 * Supabase Marketplace Products Datasource
 */

import { IMarketplaceProductsDatasource, ProductListItem, ProductDetails, ProductFilters } from './marketplace-products-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseMarketplaceProductsDatasource implements IMarketplaceProductsDatasource {
  constructor(private db: SupabaseClient) {}

  async listProducts(palikaId: number, filters: ProductFilters = {}): Promise<{
    data: ProductListItem[]
    meta: { page: number; limit: number; total: number; totalPages: number }
  }> {
    const page = filters.page || 1
    const limit = filters.limit || 25
    const offset = (page - 1) * limit

    // Get business IDs for this palika
    const { data: businesses, error: businessError } = await this.db
      .from('businesses')
      .select('id')
      .eq('palika_id', palikaId)

    if (businessError) throw businessError

    const businessIds = (businesses || []).map(b => b.id)

    if (businessIds.length === 0) {
      return {
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 }
      }
    }

    // Build query
    let query = this.db
      .from('marketplace_products')
      .select('id, title, business_id, category, price, image_url, verification_status, view_count, created_at')
      .in('business_id', businessIds)

    // Apply filters
    if (filters.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    // Apply sorting
    const sortField = this.getSortField(filters.sort)
    const ascending = this.getSortAscending(filters.sort)
    query = query.order(sortField, { ascending })

    // Get total count
    const { data: countData, error: countError } = await this.db
      .from('marketplace_products')
      .select('id', { count: 'exact', head: true })
      .in('business_id', businessIds)

    if (countError) throw countError

    const total = (countData as any)?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get paginated results
    const { data: products, error: productsError } = await query
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (productsError) throw productsError

    // Get business names
    const { data: businessMap, error: mapError } = await this.db
      .from('businesses')
      .select('id, business_name')

    if (mapError) throw mapError

    const businessNameMap = new Map(
      (businessMap || []).map(b => [b.id, b.business_name])
    )

    const items: ProductListItem[] = (products || []).map(p => ({
      id: p.id,
      title: p.title,
      businessName: businessNameMap.get(p.business_id) || 'Unknown',
      category: p.category,
      price: p.price,
      image: p.image_url,
      verificationStatus: p.verification_status,
      viewCount: p.view_count || 0,
      createdAt: p.created_at
    }))

    return {
      data: items,
      meta: { page, limit, total, totalPages }
    }
  }

  async getProductDetails(productId: string, palikaId: number): Promise<ProductDetails | null> {
    // Get product
    const { data: product, error: productError } = await this.db
      .from('marketplace_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError) throw productError
    if (!product) return null

    // Verify product belongs to this palika
    const { data: business, error: businessError } = await this.db
      .from('businesses')
      .select('id, business_name')
      .eq('id', product.business_id)
      .eq('palika_id', palikaId)
      .single()

    if (businessError || !business) return null

    return {
      id: product.id,
      title: product.title,
      businessId: product.business_id,
      businessName: business.business_name,
      category: product.category,
      price: product.price,
      images: product.images || [product.image_url],
      description: product.description,
      verificationStatus: product.verification_status,
      viewCount: product.view_count || 0,
      createdAt: product.created_at,
      verificationNotes: product.verification_notes,
      rejectionReason: product.rejection_reason
    }
  }

  async verifyProduct(productId: string, palikaId: number, adminId: string, notes?: string): Promise<void> {
    // Verify product belongs to this palika
    const { data: product, error: productError } = await this.db
      .from('marketplace_products')
      .select('business_id')
      .eq('id', productId)
      .single()

    if (productError || !product) throw new Error('Product not found')

    const { data: business, error: businessError } = await this.db
      .from('businesses')
      .select('id')
      .eq('id', product.business_id)
      .eq('palika_id', palikaId)
      .single()

    if (businessError || !business) throw new Error('Product not found in this palika')

    // Update product
    const { error: updateError } = await this.db
      .from('marketplace_products')
      .update({
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: null
      })
      .eq('id', productId)

    if (updateError) throw updateError
  }

  async rejectProduct(productId: string, palikaId: number, adminId: string, reason: string): Promise<void> {
    // Verify product belongs to this palika
    const { data: product, error: productError } = await this.db
      .from('marketplace_products')
      .select('business_id')
      .eq('id', productId)
      .single()

    if (productError || !product) throw new Error('Product not found')

    const { data: business, error: businessError } = await this.db
      .from('businesses')
      .select('id')
      .eq('id', product.business_id)
      .eq('palika_id', palikaId)
      .single()

    if (businessError || !business) throw new Error('Product not found in this palika')

    // Update product
    const { error: updateError } = await this.db
      .from('marketplace_products')
      .update({
        is_approved: false,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', productId)

    if (updateError) throw updateError
  }

  private getSortField(sort?: string): string {
    switch (sort) {
      case 'oldest': return 'created_at'
      case 'mostViewed': return 'view_count'
      case 'leastViewed': return 'view_count'
      case 'priceAsc': return 'price'
      case 'priceDesc': return 'price'
      case 'newest':
      default: return 'created_at'
    }
  }

  private getSortAscending(sort?: string): boolean {
    switch (sort) {
      case 'oldest': return true
      case 'mostViewed': return false
      case 'leastViewed': return true
      case 'priceAsc': return true
      case 'priceDesc': return false
      case 'newest':
      default: return false
    }
  }
}
