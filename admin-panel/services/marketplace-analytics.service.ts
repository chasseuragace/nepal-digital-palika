import { DatabaseClient } from './database-client'

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

export interface ServiceResponse<T> {
  data?: T
  error?: string
  status: number
}

export class MarketplaceAnalyticsService {
  constructor(private db: DatabaseClient) {}

  async getUserAnalytics(palikaId: number): Promise<ServiceResponse<UserAnalytics>> {
    try {
      // Total users in palika
      const { data: totalData, error: totalError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('default_palika_id', palikaId)

      if (totalError) throw totalError

      // New users this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekData, error: weekError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('default_palika_id', palikaId)
        .gte('created_at', weekAgo.toISOString())

      if (weekError) throw weekError

      // New users this month
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { data: monthData, error: monthError } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('default_palika_id', palikaId)
        .gte('created_at', monthAgo.toISOString())

      if (monthError) throw monthError

      // Trend data (last 30 days)
      const trend = await this.getUserTrend(palikaId)

      return {
        data: {
          total: totalData?.count || 0,
          newThisWeek: weekData?.count || 0,
          newThisMonth: monthData?.count || 0,
          trend
        },
        status: 200
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error)
      return {
        error: 'Failed to fetch user analytics',
        status: 500
      }
    }
  }

  async getBusinessAnalytics(palikaId: number): Promise<ServiceResponse<BusinessAnalytics>> {
    try {
      // Total businesses in palika
      const { data: totalData, error: totalError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('palika_id', palikaId)

      if (totalError) throw totalError

      // Businesses by category
      const { data: categoryData, error: categoryError } = await this.db
        .from('businesses')
        .select('category')
        .eq('palika_id', palikaId)

      if (categoryError) throw categoryError

      const byCategory = this.groupByCategory(categoryData || [])

      // Businesses by verification status
      const { data: statusData, error: statusError } = await this.db
        .from('businesses')
        .select('verification_status')
        .eq('palika_id', palikaId)

      if (statusError) throw statusError

      const byVerificationStatus = {
        pending: statusData?.filter((b) => b.verification_status === 'pending').length || 0,
        verified: statusData?.filter((b) => b.verification_status === 'verified').length || 0,
        rejected: statusData?.filter((b) => b.verification_status === 'rejected').length || 0,
        suspended: statusData?.filter((b) => b.verification_status === 'suspended').length || 0,
      }

      // New businesses this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekData, error: weekError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('palika_id', palikaId)
        .gte('created_at', weekAgo.toISOString())

      if (weekError) throw weekError

      // New businesses this month
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { data: monthData, error: monthError } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('palika_id', palikaId)
        .gte('created_at', monthAgo.toISOString())

      if (monthError) throw monthError

      // Trend data
      const trend = await this.getBusinessTrend(palikaId)

      return {
        data: {
          total: totalData?.count || 0,
          byCategory,
          byVerificationStatus,
          newThisWeek: weekData?.count || 0,
          newThisMonth: monthData?.count || 0,
          trend
        },
        status: 200
      }
    } catch (error) {
      console.error('Error fetching business analytics:', error)
      return {
        error: 'Failed to fetch business analytics',
        status: 500
      }
    }
  }

  async getProductAnalytics(palikaId: number): Promise<ServiceResponse<ProductAnalytics>> {
    try {
      // Get all business IDs for this palika
      const { data: businesses, error: businessError } = await this.db
        .from('businesses')
        .select('id')
        .eq('palika_id', palikaId)

      if (businessError) throw businessError

      const businessIds = (businesses || []).map(b => b.id)

      if (businessIds.length === 0) {
        return {
          data: {
            total: 0,
            byCategory: [],
            byVerificationStatus: { pending: 0, verified: 0, rejected: 0 },
            mostViewed: [],
            recent: [],
            trend: []
          },
          status: 200
        }
      }

      // Total products
      const { data: totalData, error: totalError } = await this.db
        .from('marketplace_products')
        .select('id', { count: 'exact', head: true })
        .in('business_id', businessIds)

      if (totalError) throw totalError

      // Products by category
      const { data: categoryData, error: categoryError } = await this.db
        .from('marketplace_products')
        .select('category')
        .in('business_id', businessIds)

      if (categoryError) throw categoryError

      const byCategory = this.groupByCategory(categoryData || [])

      // Products by verification status
      const { data: statusData, error: statusError } = await this.db
        .from('marketplace_products')
        .select('verification_status')
        .in('business_id', businessIds)

      if (statusError) throw statusError

      const byVerificationStatus = this.groupByVerificationStatus(statusData || [])

      // Most viewed products
      const { data: mostViewed, error: viewError } = await this.db
        .from('marketplace_products')
        .select('id, title, view_count')
        .in('business_id', businessIds)
        .order('view_count', { ascending: false })
        .limit(5)

      if (viewError) throw viewError

      // Recent products
      const { data: recent, error: recentError } = await this.db
        .from('marketplace_products')
        .select('id, title, created_at')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Trend data
      const trend = await this.getProductTrend(businessIds)

      return {
        data: {
          total: totalData?.count || 0,
          byCategory,
          byVerificationStatus,
          mostViewed: (mostViewed || []).map(p => ({
            id: p.id,
            title: p.title,
            views: p.view_count || 0
          })),
          recent: (recent || []).map(p => ({
            id: p.id,
            title: p.title,
            createdAt: p.created_at
          })),
          trend
        },
        status: 200
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
      return {
        error: 'Failed to fetch product analytics',
        status: 500
      }
    }
  }

  async getMarketplaceSummary(palikaId: number): Promise<ServiceResponse<MarketplaceAnalyticsSummary>> {
    try {
      const [usersRes, businessesRes, productsRes] = await Promise.all([
        this.getUserAnalytics(palikaId),
        this.getBusinessAnalytics(palikaId),
        this.getProductAnalytics(palikaId)
      ])

      if (usersRes.error || businessesRes.error || productsRes.error) {
        throw new Error('Failed to fetch analytics')
      }

      return {
        data: {
          users: usersRes.data!,
          businesses: businessesRes.data!,
          products: productsRes.data!
        },
        status: 200
      }
    } catch (error) {
      console.error('Error fetching marketplace summary:', error)
      return {
        error: 'Failed to fetch marketplace summary',
        status: 500
      }
    }
  }

  private async getUserTrend(palikaId: number): Promise<Array<{ date: string; count: number }>> {
    const trend: Array<{ date: string; count: number }> = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { data, error } = await this.db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('default_palika_id', palikaId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      if (!error) {
        trend.push({
          date: date.toISOString().split('T')[0],
          count: data?.count || 0
        })
      }
    }

    return trend
  }

  private async getBusinessTrend(palikaId: number): Promise<Array<{ date: string; count: number }>> {
    const trend: Array<{ date: string; count: number }> = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { data, error } = await this.db
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('palika_id', palikaId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      if (!error) {
        trend.push({
          date: date.toISOString().split('T')[0],
          count: data?.count || 0
        })
      }
    }

    return trend
  }

  private async getProductTrend(businessIds: string[]): Promise<Array<{ date: string; count: number }>> {
    const trend: Array<{ date: string; count: number }> = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { data, error } = await this.db
        .from('marketplace_products')
        .select('id', { count: 'exact', head: true })
        .in('business_id', businessIds)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      if (!error) {
        trend.push({
          date: date.toISOString().split('T')[0],
          count: data?.count || 0
        })
      }
    }

    return trend
  }

  private groupByCategory(items: Array<{ category?: string }>): Array<{ category: string; count: number }> {
    const grouped: Record<string, number> = {}

    items.forEach(item => {
      const category = item.category || 'Uncategorized'
      grouped[category] = (grouped[category] || 0) + 1
    })

    return Object.entries(grouped).map(([category, count]) => ({
      category,
      count
    }))
  }

  private groupByVerificationStatus(items: Array<{ verification_status?: string }>): {
    pending: number
    verified: number
    rejected: number
  } {
    let pending = 0
    let verified = 0
    let rejected = 0

    items.forEach(item => {
      const status = item.verification_status || 'pending'
      if (status === 'pending') pending++
      else if (status === 'verified') verified++
      else if (status === 'rejected') rejected++
    })

    return { pending, verified, rejected }
  }
}
