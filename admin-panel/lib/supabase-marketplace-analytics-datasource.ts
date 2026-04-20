/**
 * Supabase Marketplace Analytics Datasource
 * Computes palika-scoped analytics directly from Supabase tables:
 * - profiles.default_palika_id
 * - businesses.palika_id
 * - marketplace_products (via businesses.palika_id)
 */

import {
  AnalyticsResult,
  BusinessAnalytics,
  IMarketplaceAnalyticsDatasource,
  MarketplaceAnalyticsSummary,
  ProductAnalytics,
  UserAnalytics,
} from './marketplace-analytics-datasource'

// Minimal client contract — we only need `.from(table)`. Accepting this shape
// lets the factory pass either a real SupabaseClient or the project-local
// `supabaseAdmin` wrapper defined in lib/supabase.ts.
interface FromClient {
  from(table: string): any
}

export class SupabaseMarketplaceAnalyticsDatasource implements IMarketplaceAnalyticsDatasource {
  constructor(private db: FromClient) {}

  async getUserAnalytics(palikaId: number): Promise<AnalyticsResult<UserAnalytics>> {
    try {
      const { count: totalCount, error: totalError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true } as any)
        .eq('default_palika_id', palikaId)
      if (totalError) throw totalError

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: weekCount, error: weekError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true } as any)
        .eq('default_palika_id', palikaId)
        .gte('created_at', weekAgo.toISOString())
      if (weekError) throw weekError

      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: monthCount, error: monthError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true } as any)
        .eq('default_palika_id', palikaId)
        .gte('created_at', monthAgo.toISOString())
      if (monthError) throw monthError

      const trend = await this.getUserTrend(palikaId)

      return {
        data: {
          total: totalCount || 0,
          newThisWeek: weekCount || 0,
          newThisMonth: monthCount || 0,
          trend,
        },
        status: 200,
      }
    } catch (error) {
      console.error('[SupabaseMarketplaceAnalytics] user analytics failed:', error)
      return { error: 'Failed to fetch user analytics', status: 500 }
    }
  }

  async getBusinessAnalytics(palikaId: number): Promise<AnalyticsResult<BusinessAnalytics>> {
    try {
      const { count: totalCount, error: totalError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true } as any)
        .eq('palika_id', palikaId)
      if (totalError) throw totalError

      const { data: categoryData, error: categoryError } = await this.db
        .from('businesses')
        .select('business_type_id')
        .eq('palika_id', palikaId)
      if (categoryError) throw categoryError

      const byCategory = this.groupByCategory(
        (categoryData || []).map((b: { business_type_id?: number }) => ({
          category: b.business_type_id != null ? String(b.business_type_id) : 'Uncategorized',
        }))
      )

      const { data: statusData, error: statusError } = await this.db
        .from('businesses')
        .select('verification_status')
        .eq('palika_id', palikaId)
      if (statusError) throw statusError

      const byVerificationStatus = {
        pending: statusData?.filter((b: any) => b.verification_status === 'pending').length || 0,
        verified: statusData?.filter((b: any) => b.verification_status === 'verified').length || 0,
        rejected: statusData?.filter((b: any) => b.verification_status === 'rejected').length || 0,
        suspended: statusData?.filter((b: any) => b.verification_status === 'suspended').length || 0,
      }

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: weekCount, error: weekError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true } as any)
        .eq('palika_id', palikaId)
        .gte('created_at', weekAgo.toISOString())
      if (weekError) throw weekError

      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: monthCount, error: monthError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true } as any)
        .eq('palika_id', palikaId)
        .gte('created_at', monthAgo.toISOString())
      if (monthError) throw monthError

      const trend = await this.getBusinessTrend(palikaId)

      return {
        data: {
          total: totalCount || 0,
          byCategory,
          byVerificationStatus,
          newThisWeek: weekCount || 0,
          newThisMonth: monthCount || 0,
          trend,
        },
        status: 200,
      }
    } catch (error) {
      console.error('[SupabaseMarketplaceAnalytics] business analytics failed:', error)
      return { error: 'Failed to fetch business analytics', status: 500 }
    }
  }

  async getProductAnalytics(palikaId: number): Promise<AnalyticsResult<ProductAnalytics>> {
    try {
      const { data: businesses, error: businessError } = await this.db
        .from('businesses')
        .select('id')
        .eq('palika_id', palikaId)
      if (businessError) throw businessError

      const businessIds = (businesses || []).map((b: { id: string }) => b.id)

      if (businessIds.length === 0) {
        return {
          data: {
            total: 0,
            byCategory: [],
            byVerificationStatus: { pending: 0, verified: 0, rejected: 0 },
            mostViewed: [],
            recent: [],
            trend: [],
          },
          status: 200,
        }
      }

      const { count: totalCount, error: totalError } = await this.db
        .from('marketplace_products')
        .select('id', { count: 'exact', head: true } as any)
        .in('business_id', businessIds)
      if (totalError) throw totalError

      const { data: categoryData, error: categoryError } = await this.db
        .from('marketplace_products')
        .select('marketplace_category_id')
        .in('business_id', businessIds)
      if (categoryError) throw categoryError

      const byCategory = this.groupByCategory(
        (categoryData || []).map((p: { marketplace_category_id?: number }) => ({
          category:
            p.marketplace_category_id != null ? String(p.marketplace_category_id) : 'Uncategorized',
        }))
      )

      const { data: statusData, error: statusError } = await this.db
        .from('marketplace_products')
        .select('is_approved')
        .in('business_id', businessIds)
      if (statusError) throw statusError

      const byVerificationStatus = {
        pending: statusData?.filter((p: any) => p.is_approved === false).length || 0,
        verified: statusData?.filter((p: any) => p.is_approved === true).length || 0,
        rejected: 0,
      }

      const { data: mostViewed, error: viewError } = await this.db
        .from('marketplace_products')
        .select('id, name_en, view_count')
        .in('business_id', businessIds)
        .order('view_count', { ascending: false })
        .limit(5)
      if (viewError) throw viewError

      const { data: recent, error: recentError } = await this.db
        .from('marketplace_products')
        .select('id, name_en, created_at')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false })
        .limit(5)
      if (recentError) throw recentError

      const trend = await this.getProductTrend(businessIds)

      return {
        data: {
          total: totalCount || 0,
          byCategory,
          byVerificationStatus,
          mostViewed: (mostViewed || []).map((p: any) => ({
            id: p.id,
            title: p.name_en,
            views: p.view_count || 0,
          })),
          recent: (recent || []).map((p: any) => ({
            id: p.id,
            title: p.name_en,
            createdAt: p.created_at,
          })),
          trend,
        },
        status: 200,
      }
    } catch (error) {
      console.error('[SupabaseMarketplaceAnalytics] product analytics failed:', error)
      return { error: 'Failed to fetch product analytics', status: 500 }
    }
  }

  async getMarketplaceSummary(
    palikaId: number
  ): Promise<AnalyticsResult<MarketplaceAnalyticsSummary>> {
    try {
      const [usersRes, businessesRes, productsRes] = await Promise.all([
        this.getUserAnalytics(palikaId),
        this.getBusinessAnalytics(palikaId),
        this.getProductAnalytics(palikaId),
      ])

      if (usersRes.error || businessesRes.error || productsRes.error) {
        throw new Error('Failed to fetch analytics')
      }

      return {
        data: {
          users: usersRes.data!,
          businesses: businessesRes.data!,
          products: productsRes.data!,
        },
        status: 200,
      }
    } catch (error) {
      console.error('[SupabaseMarketplaceAnalytics] summary failed:', error)
      return { error: 'Failed to fetch marketplace summary', status: 500 }
    }
  }

  private async getUserTrend(palikaId: number): Promise<Array<{ date: string; count: number }>> {
    return this.buildTrend(async (fromIso, toIso) => {
      const { count } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true } as any)
        .eq('default_palika_id', palikaId)
        .gte('created_at', fromIso)
        .lt('created_at', toIso)
      return count || 0
    })
  }

  private async getBusinessTrend(
    palikaId: number
  ): Promise<Array<{ date: string; count: number }>> {
    return this.buildTrend(async (fromIso, toIso) => {
      const { count } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true } as any)
        .eq('palika_id', palikaId)
        .gte('created_at', fromIso)
        .lt('created_at', toIso)
      return count || 0
    })
  }

  private async getProductTrend(
    businessIds: string[]
  ): Promise<Array<{ date: string; count: number }>> {
    return this.buildTrend(async (fromIso, toIso) => {
      const { count } = await this.db
        .from('marketplace_products')
        .select('id', { count: 'exact', head: true } as any)
        .in('business_id', businessIds)
        .gte('created_at', fromIso)
        .lt('created_at', toIso)
      return count || 0
    })
  }

  private async buildTrend(
    counter: (fromIso: string, toIso: string) => Promise<number>
  ): Promise<Array<{ date: string; count: number }>> {
    const trend: Array<{ date: string; count: number }> = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      const count = await counter(date.toISOString(), nextDate.toISOString())
      trend.push({
        date: date.toISOString().split('T')[0],
        count,
      })
    }
    return trend
  }

  private groupByCategory(
    items: Array<{ category: string }>
  ): Array<{ category: string; count: number }> {
    const grouped: Record<string, number> = {}
    items.forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + 1
    })
    return Object.entries(grouped).map(([category, count]) => ({ category, count }))
  }
}
