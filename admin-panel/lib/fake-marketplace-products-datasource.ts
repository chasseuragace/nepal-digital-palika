/**
 * Fake Marketplace Products Datasource
 */

import { IMarketplaceProductsDatasource, ProductListItem, ProductDetails, ProductFilters } from './marketplace-products-datasource'

export class FakeMarketplaceProductsDatasource implements IMarketplaceProductsDatasource {
  private products: any[] = [
    { id: 'fake-prod-1', business_id: 'fake-biz-1', title: 'Handmade Crafts', category: 'Crafts', price: 500, image_url: '', verification_status: 'pending', view_count: 10, created_at: new Date().toISOString() },
    { id: 'fake-prod-2', business_id: 'fake-biz-1', title: 'Local Honey', category: 'Food', price: 300, image_url: '', verification_status: 'verified', view_count: 25, created_at: new Date().toISOString() },
  ]

  async listProducts(palikaId: number, filters: ProductFilters = {}): Promise<{
    data: ProductListItem[]
    meta: { page: number; limit: number; total: number; totalPages: number }
  }> {
    await this.delay(100)
    const page = filters.page || 1
    const limit = filters.limit || 25
    const offset = (page - 1) * limit

    let filtered = this.products

    if (filters.verificationStatus) {
      filtered = filtered.filter(p => p.verification_status === filters.verificationStatus)
    }

    const paginated = filtered.slice(offset, offset + limit)
    const items: ProductListItem[] = paginated.map(p => ({
      id: p.id,
      title: p.title,
      businessName: 'Local Business',
      category: p.category,
      price: p.price,
      image: p.image_url,
      verificationStatus: p.verification_status,
      viewCount: p.view_count,
      createdAt: p.created_at
    }))

    return {
      data: items,
      meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) }
    }
  }

  async getProductDetails(productId: string, palikaId: number): Promise<ProductDetails | null> {
    await this.delay(50)
    const product = this.products.find(p => p.id === productId)
    if (!product) return null
    return {
      id: product.id,
      title: product.title,
      businessId: product.business_id,
      businessName: 'Local Business',
      category: product.category,
      price: product.price,
      images: [product.image_url],
      description: 'Product description',
      verificationStatus: product.verification_status,
      viewCount: product.view_count,
      createdAt: product.created_at
    }
  }

  async verifyProduct(productId: string, palikaId: number, adminId: string, notes?: string): Promise<void> {
    await this.delay(100)
    const product = this.products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')
    product.verification_status = 'verified'
  }

  async rejectProduct(productId: string, palikaId: number, adminId: string, reason: string): Promise<void> {
    await this.delay(100)
    const product = this.products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')
    product.verification_status = 'rejected'
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
