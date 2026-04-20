/**
 * Marketplace Analytics Service
 * Thin orchestrator that delegates IO to IMarketplaceAnalyticsDatasource.
 * Swappable between Supabase and fake implementations via
 * lib/marketplace-analytics-config.ts (NEXT_PUBLIC_USE_FAKE_DATASOURCES).
 */

import {
  AnalyticsResult,
  BusinessAnalytics,
  IMarketplaceAnalyticsDatasource,
  MarketplaceAnalyticsSummary,
  ProductAnalytics,
  UserAnalytics,
} from '@/lib/marketplace-analytics-datasource'

// Re-exports keep existing imports (`import { UserAnalytics } from '../services/...'`) working.
export type {
  UserAnalytics,
  BusinessAnalytics,
  ProductAnalytics,
  MarketplaceAnalyticsSummary,
}

// Back-compat alias for the pre-refactor type name.
export type ServiceResponse<T> = AnalyticsResult<T>

export class MarketplaceAnalyticsService {
  constructor(private datasource: IMarketplaceAnalyticsDatasource) {}

  getUserAnalytics(palikaId: number) {
    return this.datasource.getUserAnalytics(palikaId)
  }

  getBusinessAnalytics(palikaId: number) {
    return this.datasource.getBusinessAnalytics(palikaId)
  }

  getProductAnalytics(palikaId: number) {
    return this.datasource.getProductAnalytics(palikaId)
  }

  getMarketplaceSummary(palikaId: number) {
    return this.datasource.getMarketplaceSummary(palikaId)
  }
}
