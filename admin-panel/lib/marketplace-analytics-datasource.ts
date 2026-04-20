/**
 * Abstract Marketplace Analytics Datasource
 * Defines contract for palika-scoped marketplace analytics.
 * Allows switching between Supabase and fake implementations.
 */

export interface UserAnalytics {
  total: number
  newThisWeek: number
  newThisMonth: number
  trend: Array<{ date: string; count: number }>
}

export interface BusinessAnalytics {
  total: number
  byCategory: Array<{ category: string; count: number }>
  byVerificationStatus: {
    pending: number
    verified: number
    rejected: number
    suspended: number
  }
  newThisWeek: number
  newThisMonth: number
  trend: Array<{ date: string; count: number }>
}

export interface ProductAnalytics {
  total: number
  byCategory: Array<{ category: string; count: number }>
  byVerificationStatus: {
    pending: number
    verified: number
    rejected: number
  }
  mostViewed: Array<{ id: string; title: string; views: number }>
  recent: Array<{ id: string; title: string; createdAt: string }>
  trend: Array<{ date: string; count: number }>
}

export interface MarketplaceAnalyticsSummary {
  users: UserAnalytics
  businesses: BusinessAnalytics
  products: ProductAnalytics
}

export interface AnalyticsResult<T> {
  data?: T
  error?: string
  status: number
}

export interface IMarketplaceAnalyticsDatasource {
  getUserAnalytics(palikaId: number): Promise<AnalyticsResult<UserAnalytics>>
  getBusinessAnalytics(palikaId: number): Promise<AnalyticsResult<BusinessAnalytics>>
  getProductAnalytics(palikaId: number): Promise<AnalyticsResult<ProductAnalytics>>
  getMarketplaceSummary(palikaId: number): Promise<AnalyticsResult<MarketplaceAnalyticsSummary>>
}
