/**
 * Analytics Service
 * Framework-agnostic analytics and reporting operations
 * Supports Palika administrator workflows for monitoring and reporting
 */

import { DatabaseClient } from './database-client'
import {
  DashboardStats,
  ContentAnalytics,
  TrafficAnalytics,
  ServiceResponse
} from './types'

export interface AnalyticsFilters {
  palika_id?: number
  start_date?: string
  end_date?: string
  period?: 'day' | 'week' | 'month' | 'year'
}

export class AnalyticsService {
  private db: DatabaseClient

  constructor(db: DatabaseClient) {
    this.db = db
  }

  /**
   * Get dashboard statistics for admin overview
   * Used by: Palika Administrator Weekly Review, National Administrator Quarterly Review
   */
  async getDashboardStats(palikaId?: number): Promise<ServiceResponse<DashboardStats>> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Heritage sites stats
      const heritageSitesQuery = this.db.from('heritage_sites').select('id, status, is_featured')
      if (palikaId) heritageSitesQuery.eq('palika_id', palikaId)
      const { data: heritageSites } = await heritageSitesQuery

      // Events stats
      const eventsQuery = this.db.from('events').select('id, status, is_festival, start_date, end_date')
      if (palikaId) eventsQuery.eq('palika_id', palikaId)
      const { data: events } = await eventsQuery

      // Blog posts stats
      const blogPostsQuery = this.db.from('blog_posts').select('id, status')
      if (palikaId) blogPostsQuery.eq('palika_id', palikaId)
      const { data: blogPosts } = await blogPostsQuery

      // Businesses stats
      const businessesQuery = this.db.from('businesses').select('id, verification_status')
      if (palikaId) businessesQuery.eq('palika_id', palikaId)
      const { data: businesses } = await businessesQuery

      // Users stats (profiles)
      const { data: profiles } = await this.db.from('profiles').select('id, user_type')

      // Calculate stats
      const sites = heritageSites || []
      const evts = events || []
      const posts = blogPosts || []
      const biz = businesses || []
      const users = profiles || []

      const stats: DashboardStats = {
        heritage_sites: {
          total: sites.length,
          published: sites.filter(s => s.status === 'published').length,
          draft: sites.filter(s => s.status === 'draft').length,
          featured: sites.filter(s => s.is_featured).length
        },
        events: {
          total: evts.length,
          upcoming: evts.filter(e => e.start_date >= today).length,
          past: evts.filter(e => e.end_date < today).length,
          festivals: evts.filter(e => e.is_festival).length
        },
        blog_posts: {
          total: posts.length,
          published: posts.filter(p => p.status === 'published').length,
          draft: posts.filter(p => p.status === 'draft').length
        },
        businesses: {
          total: biz.length,
          verified: biz.filter(b => b.verification_status === 'verified').length,
          pending: biz.filter(b => b.verification_status === 'pending').length
        },
        users: {
          total: users.length,
          residents: users.filter(u => u.user_type === 'resident').length,
          tourists: users.filter(u => u.user_type?.includes('tourist')).length,
          business_owners: users.filter(u => u.user_type === 'business_owner').length
        },
        engagement: {
          total_views: await this.getTotalViews(palikaId),
          qr_scans: 0, // Would need QR scan tracking table
          inquiries: await this.getInquiryCount(palikaId),
          reviews: await this.getReviewCount(palikaId)
        }
      }

      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: 'Failed to fetch dashboard stats' }
    }
  }

  /**
   * Get content performance analytics
   * Used by: Monthly Performance Dashboard Review
   */
  async getContentAnalytics(
    entityType: 'heritage_site' | 'event' | 'blog_post' | 'business',
    filters: AnalyticsFilters = {}
  ): Promise<ServiceResponse<ContentAnalytics[]>> {
    try {
      const tableName = this.getTableName(entityType)
      
      let query = this.db.from(tableName).select('id, view_count, created_at')
      
      if (filters.palika_id) {
        query = query.eq('palika_id', filters.palika_id)
      }

      const { data, error } = await query.order('view_count', { ascending: false }).limit(20)

      if (error) {
        return { success: false, error: error.message }
      }

      const analytics: ContentAnalytics[] = (data || []).map(item => ({
        entity_type: entityType,
        entity_id: item.id,
        view_count: item.view_count || 0,
        unique_visitors: Math.floor((item.view_count || 0) * 0.7), // Estimate
        avg_time_spent: 180, // Would need actual tracking
        bounce_rate: 0.42, // Would need actual tracking
        period: filters.period || 'month'
      }))

      return { success: true, data: analytics }
    } catch (error) {
      return { success: false, error: 'Failed to fetch content analytics' }
    }
  }

  /**
   * Get top performing content
   * Used by: Weekly Content Review, Monthly Reporting
   */
  async getTopContent(
    entityType: 'heritage_site' | 'event' | 'blog_post',
    limit: number = 10,
    palikaId?: number
  ): Promise<ServiceResponse<Array<{ id: string; name: string; views: number }>>> {
    try {
      const tableName = this.getTableName(entityType)
      const nameField = entityType === 'blog_post' ? 'title_en' : 'name_en'

      let query = this.db.from(tableName).select(`id, ${nameField}, view_count`)
      
      if (palikaId) {
        query = query.eq('palika_id', palikaId)
      }

      const { data, error } = await query
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message }
      }

      const topContent = (data || []).map(item => ({
        id: item.id,
        name: item[nameField],
        views: item.view_count || 0
      }))

      return { success: true, data: topContent }
    } catch (error) {
      return { success: false, error: 'Failed to fetch top content' }
    }
  }

  /**
   * Get content freshness report
   * Used by: Provincial Coordinator Monthly Review
   */
  async getContentFreshnessReport(palikaId?: number): Promise<ServiceResponse<{
    updated_this_week: number
    updated_this_month: number
    stale_content: number
    never_updated: number
  }>> {
    try {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()

      let query = this.db.from('heritage_sites').select('id, created_at, updated_at')
      if (palikaId) query = query.eq('palika_id', palikaId)
      
      const { data } = await query

      const sites = data || []
      
      const report = {
        updated_this_week: sites.filter(s => s.updated_at >= oneWeekAgo).length,
        updated_this_month: sites.filter(s => s.updated_at >= oneMonthAgo).length,
        stale_content: sites.filter(s => s.updated_at < sixMonthsAgo).length,
        never_updated: sites.filter(s => s.created_at === s.updated_at).length
      }

      return { success: true, data: report }
    } catch (error) {
      return { success: false, error: 'Failed to fetch content freshness report' }
    }
  }

  /**
   * Get palika activity report
   * Used by: Provincial Coordinator, National Administrator
   */
  async getPalikaActivityReport(): Promise<ServiceResponse<Array<{
    palika_id: number
    palika_name: string
    heritage_sites_count: number
    events_count: number
    blog_posts_count: number
    last_activity: string
    is_active: boolean
  }>>> {
    try {
      const { data: palikas } = await this.db.from('palikas').select('id, name_en')
      
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const reports = await Promise.all((palikas || []).map(async (palika) => {
        const [sites, events, posts] = await Promise.all([
          this.db.from('heritage_sites').select('id, updated_at').eq('palika_id', palika.id),
          this.db.from('events').select('id, updated_at').eq('palika_id', palika.id),
          this.db.from('blog_posts').select('id, updated_at').eq('palika_id', palika.id)
        ])

        const allDates = [
          ...(sites.data || []).map(s => s.updated_at),
          ...(events.data || []).map(e => e.updated_at),
          ...(posts.data || []).map(p => p.updated_at)
        ].filter(Boolean).sort().reverse()

        const lastActivity = allDates[0] || 'Never'

        return {
          palika_id: palika.id,
          palika_name: palika.name_en,
          heritage_sites_count: (sites.data || []).length,
          events_count: (events.data || []).length,
          blog_posts_count: (posts.data || []).length,
          last_activity: lastActivity,
          is_active: lastActivity !== 'Never' && lastActivity >= oneMonthAgo
        }
      }))

      return { success: true, data: reports }
    } catch (error) {
      return { success: false, error: 'Failed to fetch palika activity report' }
    }
  }

  /**
   * Get business inquiry analytics
   * Used by: Business Analytics Dashboard
   */
  async getBusinessInquiryAnalytics(
    businessId?: string,
    palikaId?: number
  ): Promise<ServiceResponse<{
    total_inquiries: number
    confirmed_bookings: number
    completed_stays: number
    conversion_rate: number
    estimated_revenue: number
  }>> {
    try {
      let query = this.db.from('inquiries').select('*')
      
      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      const { data: inquiries } = await query

      const inqs = inquiries || []
      const confirmed = inqs.filter(i => i.inquiry_status === 'confirmed' || i.inquiry_status === 'completed')
      const completed = inqs.filter(i => i.inquiry_status === 'completed')

      const analytics = {
        total_inquiries: inqs.length,
        confirmed_bookings: confirmed.length,
        completed_stays: completed.length,
        conversion_rate: inqs.length > 0 ? (confirmed.length / inqs.length) * 100 : 0,
        estimated_revenue: completed.reduce((sum, i) => sum + (i.actual_revenue || i.estimated_revenue || 0), 0)
      }

      return { success: true, data: analytics }
    } catch (error) {
      return { success: false, error: 'Failed to fetch business inquiry analytics' }
    }
  }

  /**
   * Get user engagement metrics
   * Used by: Analytics User Workflows
   */
  async getUserEngagementMetrics(palikaId?: number): Promise<ServiceResponse<{
    favorites_count: number
    reviews_count: number
    avg_rating: number
    active_users: number
  }>> {
    try {
      const { data: favorites } = await this.db.from('favorites').select('id')
      const { data: reviews } = await this.db.from('reviews').select('id, rating')
      const { data: profiles } = await this.db.from('profiles').select('id')

      const revs = reviews || []
      const avgRating = revs.length > 0
        ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
        : 0

      return {
        success: true,
        data: {
          favorites_count: (favorites || []).length,
          reviews_count: revs.length,
          avg_rating: Math.round(avgRating * 10) / 10,
          active_users: (profiles || []).length
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch user engagement metrics' }
    }
  }

  /**
   * Generate monthly report data
   * Used by: Palika Administrator Monthly Reporting
   */
  async generateMonthlyReport(
    palikaId: number,
    year: number,
    month: number
  ): Promise<ServiceResponse<{
    period: string
    stats: DashboardStats
    top_heritage_sites: Array<{ name: string; views: number }>
    top_events: Array<{ name: string; views: number }>
    top_blog_posts: Array<{ name: string; views: number }>
    content_freshness: any
    recommendations: string[]
  }>> {
    try {
      const period = `${year}-${String(month).padStart(2, '0')}`
      
      // Get all stats
      const statsResult = await this.getDashboardStats(palikaId)
      const topSitesResult = await this.getTopContent('heritage_site', 5, palikaId)
      const topEventsResult = await this.getTopContent('event', 5, palikaId)
      const topPostsResult = await this.getTopContent('blog_post', 5, palikaId)
      const freshnessResult = await this.getContentFreshnessReport(palikaId)

      // Generate recommendations based on data
      const recommendations: string[] = []
      
      if (statsResult.data) {
        if (statsResult.data.heritage_sites.draft > statsResult.data.heritage_sites.published) {
          recommendations.push('Consider publishing draft heritage sites to increase visibility')
        }
        if (statsResult.data.events.upcoming === 0) {
          recommendations.push('Add upcoming events to keep the calendar active')
        }
        if (statsResult.data.blog_posts.total < 5) {
          recommendations.push('Create more blog posts to improve SEO and engagement')
        }
      }

      if (freshnessResult.data?.stale_content > 0) {
        recommendations.push(`Update ${freshnessResult.data.stale_content} stale content items`)
      }

      return {
        success: true,
        data: {
          period,
          stats: statsResult.data!,
          top_heritage_sites: (topSitesResult.data || []).map(s => ({ name: s.name, views: s.views })),
          top_events: (topEventsResult.data || []).map(e => ({ name: e.name, views: e.views })),
          top_blog_posts: (topPostsResult.data || []).map(p => ({ name: p.name, views: p.views })),
          content_freshness: freshnessResult.data,
          recommendations
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to generate monthly report' }
    }
  }

  // Private helper methods

  private getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      'heritage_site': 'heritage_sites',
      'event': 'events',
      'blog_post': 'blog_posts',
      'business': 'businesses'
    }
    return tableMap[entityType] || entityType
  }

  private async getTotalViews(palikaId?: number): Promise<number> {
    try {
      let total = 0

      for (const table of ['heritage_sites', 'events', 'blog_posts']) {
        let query = this.db.from(table).select('view_count')
        if (palikaId) query = query.eq('palika_id', palikaId)
        const { data } = await query
        total += (data || []).reduce((sum, item) => sum + (item.view_count || 0), 0)
      }

      return total
    } catch {
      return 0
    }
  }

  private async getInquiryCount(palikaId?: number): Promise<number> {
    try {
      const { data } = await this.db.from('inquiries').select('id')
      return (data || []).length
    } catch {
      return 0
    }
  }

  private async getReviewCount(palikaId?: number): Promise<number> {
    try {
      const { data } = await this.db.from('reviews').select('id')
      return (data || []).length
    } catch {
      return 0
    }
  }
}
