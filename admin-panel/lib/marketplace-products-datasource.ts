/**
 * Abstract Marketplace Products Datasource
 * Defines contract for marketplace product operations
 */

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

export interface IMarketplaceProductsDatasource {
  listProducts(palikaId: number, filters?: ProductFilters): Promise<{
    data: ProductListItem[]
    meta: { page: number; limit: number; total: number; totalPages: number }
  }>

  getProductDetails(productId: string, palikaId: number): Promise<ProductDetails | null>

  verifyProduct(productId: string, palikaId: number, adminId: string, notes?: string): Promise<void>

  rejectProduct(productId: string, palikaId: number, adminId: string, reason: string): Promise<void>
}
