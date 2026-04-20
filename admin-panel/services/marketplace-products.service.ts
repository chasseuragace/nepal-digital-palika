import { IMarketplaceProductsDatasource, ProductListItem, ProductDetails, ProductFilters } from '@/lib/marketplace-products-datasource'
import { getMarketplaceProductsDatasource } from '@/lib/marketplace-products-config'

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

export class MarketplaceProductsService {
  private datasource: IMarketplaceProductsDatasource

  constructor(datasource?: IMarketplaceProductsDatasource) {
    this.datasource = datasource || getMarketplaceProductsDatasource()
  }

  async listProducts(
    palikaId: number,
    filters: ProductFilters = {}
  ): Promise<ServiceResponse<ProductListResponse>> {
    try {
      const result = await this.datasource.listProducts(palikaId, filters)
      return {
        data: result,
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
      const product = await this.datasource.getProductDetails(productId, palikaId)
      if (!product) {
        return {
          error: 'Product not found',
          status: 404
        }
      }
      return {
        data: product,
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
      await this.datasource.verifyProduct(productId, palikaId, adminId, notes)
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
      await this.datasource.rejectProduct(productId, palikaId, adminId, reason)
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

  // Private helper methods removed - logic moved to datasource
}
