import { DatabaseClient } from './database-client'

export interface ProductListItem {
  id: string
  title: string
  businessName: string
  category: string
  price: number
  image: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  viewCount: number
  createdAt: string
}

export interface ProductDetails {
  id: string
  title: string
  businessId: string
  businessName: string
  category: string
  price: number
  images: string[]
  description: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  viewCount: number
  createdAt: string
  verificationNotes?: string
  rejectionReason?: string
}

export interface ProductListResponse {
  data: ProductListItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ServiceResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface ProductFilters {
  verificationStatus?: 'pending' | 'verified' | 'rejected'
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'mostViewed' | 'leastViewed' | 'priceAsc' | 'priceDesc'
  page?: number
  limit?: number
}

export class MarketplaceProductsService {
  constructor(private db: DatabaseClient) {}

  async listProducts(
    palikaId: number,
    filters: ProductFilters = {}
  ): Promise<ServiceResponse<ProductListResponse>> {
    try {
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
          data: {
            data: [],
            meta: { page, limit, total: 0, totalPages: 0 }
          },
          status: 200
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

      const total = countData?.count || 0
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
        data: {
          data: items,
          meta: { page, limit, total, totalPages }
        },
        status: 200
      }
    } catch (error) {
      console.error('Error listing products:', error)
      return {
        error: 'Failed to list products',
        status: 500
      }
    }
  }

  async getProductDetails(
    productId: string,
    palikaId: number
  ): Promise<ServiceResponse<ProductDetails>> {
    try {
      // Get product
      const { data: product, error: productError } = await this.db
        .from('marketplace_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      if (!product) {
        return {
          error: 'Product not found',
          status: 404
        }
      }

      // Verify product belongs to this palika
      const { data: business, error: businessError } = await this.db
        .from('businesses')
        .select('id, business_name')
        .eq('id', product.business_id)
        .eq('palika_id', palikaId)
        .single()

      if (businessError || !business) {
        return {
          error: 'Product not found in this palika',
          status: 404
        }
      }

      return {
        data: {
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
        },
        status: 200
      }
    } catch (error) {
      console.error('Error fetching product details:', error)
      return {
        error: 'Failed to fetch product details',
        status: 500
      }
    }
  }

  async verifyProduct(
    productId: string,
    palikaId: number,
    adminId: string,
    notes?: string
  ): Promise<ServiceResponse<{ success: boolean }>> {
    try {
      // Verify product belongs to this palika
      const { data: product, error: productError } = await this.db
        .from('marketplace_products')
        .select('business_id')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return {
          error: 'Product not found',
          status: 404
        }
      }

      const { data: business, error: businessError } = await this.db
        .from('businesses')
        .select('id')
        .eq('id', product.business_id)
        .eq('palika_id', palikaId)
        .single()

      if (businessError || !business) {
        return {
          error: 'Product not found in this palika',
          status: 404
        }
      }

      // Update product with full approval workflow
      const { error: updateError } = await this.db
        .from('marketplace_products')
        .update({
          is_approved: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: null // Clear any previous rejection reason
        })
        .eq('id', productId)

      if (updateError) throw updateError

      return {
        data: { success: true },
        status: 200
      }
    } catch (error) {
      console.error('Error verifying product:', error)
      return {
        error: 'Failed to verify product',
        status: 500
      }
    }
  }

  async rejectProduct(
    productId: string,
    palikaId: number,
    adminId: string,
    reason: string
  ): Promise<ServiceResponse<{ success: boolean }>> {
    try {
      // Verify product belongs to this palika
      const { data: product, error: productError } = await this.db
        .from('marketplace_products')
        .select('business_id')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return {
          error: 'Product not found',
          status: 404
        }
      }

      const { data: business, error: businessError } = await this.db
        .from('businesses')
        .select('id')
        .eq('id', product.business_id)
        .eq('palika_id', palikaId)
        .single()

      if (businessError || !business) {
        return {
          error: 'Product not found in this palika',
          status: 404
        }
      }

      // Update product with full rejection workflow
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

      return {
        data: { success: true },
        status: 200
      }
    } catch (error) {
      console.error('Error rejecting product:', error)
      return {
        error: 'Failed to reject product',
        status: 500
      }
    }
  }

  private getSortField(sort?: string): string {
    switch (sort) {
      case 'oldest':
        return 'created_at'
      case 'mostViewed':
        return 'view_count'
      case 'leastViewed':
        return 'view_count'
      case 'priceAsc':
        return 'price'
      case 'priceDesc':
        return 'price'
      case 'newest':
      default:
        return 'created_at'
    }
  }

  private getSortAscending(sort?: string): boolean {
    switch (sort) {
      case 'oldest':
        return true
      case 'mostViewed':
        return false
      case 'leastViewed':
        return true
      case 'priceAsc':
        return true
      case 'priceDesc':
        return false
      case 'newest':
      default:
        return false
    }
  }
}
