/**
 * Abstract Analytics Datasource
 * Defines contract for analytics and reporting operations
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

import { DashboardStats, ContentAnalytics } from '@/services/types'

export interface AnalyticsFilters {
  palika_id?: number
  start_date?: string
  end_date?: string
  period?: 'day' | 'week' | 'month' | 'year'
}

export interface IAnalyticsDatasource {
  // Get dashboard statistics for admin overview
  getDashboardStats(palikaId?: number): Promise<DashboardStats>

  // Get simple dashboard stats matching current API format
  getSimpleDashboardStats(palikaId?: number): Promise<{
    palika_profile: any
    heritage_sites: number
    events: number
    blog_posts: number
    pending_approvals: number
    recent_activity: Array<{
      id: number
      type: string
      title: string
      created_at: string
    }>
  }>

  // Get content performance analytics
  getContentAnalytics(
    entityType: 'heritage_site' | 'event' | 'blog_post' | 'business',
    filters?: AnalyticsFilters
  ): Promise<ContentAnalytics[]>

  // Get top performing content
  getTopContent(
    entityType: 'heritage_site' | 'event' | 'blog_post',
    limit?: number,
    palikaId?: number
  ): Promise<Array<{ id: string; name: string; views: number }>>

  // Get content freshness report
  getContentFreshnessReport(palikaId?: number): Promise<{
    updated_this_week: number
    updated_this_month: number
    stale_content: number
    never_updated: number
  }>

  // Get palika activity report
  getPalikaActivityReport(): Promise<Array<{
    palika_id: number
    palika_name: string
    heritage_sites_count: number
    events_count: number
    blog_posts_count: number
    last_activity: string
    is_active: boolean
  }>>

  // Get business inquiry analytics
  getBusinessInquiryAnalytics(
    businessId?: string,
    palikaId?: number
  ): Promise<{
    total_inquiries: number
    confirmed_bookings: number
    completed_stays: number
    conversion_rate: number
    estimated_revenue: number
  }>

  // Get user engagement metrics
  getUserEngagementMetrics(palikaId?: number): Promise<{
    favorites_count: number
    reviews_count: number
    avg_rating: number
    active_users: number
  }>

  // Get total views across all content
  getTotalViews(palikaId?: number): Promise<number>

  // Get inquiry count
  getInquiryCount(palikaId?: number): Promise<number>

  // Get review count
  getReviewCount(palikaId?: number): Promise<number>
}
