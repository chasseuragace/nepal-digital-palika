/**
 * Analytics Service
 * Framework-agnostic analytics and reporting operations
 * Supports Palika administrator workflows for monitoring and reporting
 */

import {
  DashboardStats,
  ContentAnalytics,
  TrafficAnalytics,
  ServiceResponse
} from './types'
import { IAnalyticsDatasource, AnalyticsFilters } from '@/lib/analytics-datasource'
import { getAnalyticsDatasource } from '@/lib/analytics-config'

export class AnalyticsService {
  private datasource: IAnalyticsDatasource

  constructor(datasource?: IAnalyticsDatasource) {
    this.datasource = datasource || getAnalyticsDatasource()
  }

  /**
   * Get dashboard statistics for admin overview
   * Used by: Palika Administrator Weekly Review, National Administrator Quarterly Review
   */
  async getDashboardStats(palikaId?: number): Promise<ServiceResponse<DashboardStats>> {
    try {
      const stats = await this.datasource.getDashboardStats(palikaId)
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
      const analytics = await this.datasource.getContentAnalytics(entityType, filters)
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
      const topContent = await this.datasource.getTopContent(entityType, limit, palikaId)
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
      const report = await this.datasource.getContentFreshnessReport(palikaId)
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
      const report = await this.datasource.getPalikaActivityReport()
      return { success: true, data: report }
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
      const analytics = await this.datasource.getBusinessInquiryAnalytics(businessId, palikaId)
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
      const metrics = await this.datasource.getUserEngagementMetrics(palikaId)
      return { success: true, data: metrics }
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

      if (freshnessResult.data && freshnessResult.data.stale_content > 0) {
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

  // Private helper methods removed - logic moved to datasource
}
