/**
 * Fake Analytics Datasource
 * Mock implementation for development and testing
 * Returns hardcoded data without database calls
 */

import { IAnalyticsDatasource, AnalyticsFilters } from './analytics-datasource'
import { DashboardStats, ContentAnalytics } from '@/services/types'

export class FakeAnalyticsDatasource implements IAnalyticsDatasource {
  async getDashboardStats(palikaId?: number): Promise<DashboardStats> {
    // Simulate network delay
    await this.delay(100)

    return {
      heritage_sites: {
        total: 15,
        published: 12,
        draft: 3,
        featured: 5
      },
      events: {
        total: 20,
        upcoming: 8,
        past: 12,
        festivals: 4
      },
      blog_posts: {
        total: 25,
        published: 20,
        draft: 5
      },
      businesses: {
        total: 30,
        verified: 25,
        pending: 5
      },
      users: {
        total: 150,
        residents: 80,
        tourists: 50,
        business_owners: 20
      },
      engagement: {
        total_views: 5000,
        qr_scans: 0,
        inquiries: 45,
        reviews: 32
      }
    }
  }

  async getContentAnalytics(
    entityType: 'heritage_site' | 'event' | 'blog_post' | 'business',
    filters?: AnalyticsFilters
  ): Promise<ContentAnalytics[]> {
    await this.delay(100)

    // Return fake analytics data
    return Array.from({ length: 5 }, (_, i) => ({
      entity_type: entityType,
      entity_id: `fake-${entityType}-${i + 1}`,
      view_count: Math.floor(Math.random() * 1000) + 100,
      unique_visitors: Math.floor(Math.random() * 700) + 70,
      avg_time_spent: 180,
      bounce_rate: 0.42,
      period: filters?.period || 'month'
    }))
  }

  async getTopContent(
    entityType: 'heritage_site' | 'event' | 'blog_post',
    limit: number = 10,
    palikaId?: number
  ): Promise<Array<{ id: string; name: string; views: number }>> {
    await this.delay(100)

    const names = {
      heritage_site: ['Swayambhu Temple', 'Boudhanath Stupa', 'Pashupatinath', 'Bhaktapur Durbar', 'Patan Durbar'],
      event: ['Teej Festival', 'Dashain Celebration', 'Tihar Festival', 'Holi Festival', 'New Year'],
      blog_post: ['Top 10 Places to Visit', 'Local Food Guide', 'Cultural Heritage', 'Travel Tips', 'Festival Calendar']
    }

    const entityNames = names[entityType] || names.heritage_site

    return Array.from({ length: Math.min(limit, entityNames.length) }, (_, i) => ({
      id: `fake-${entityType}-${i + 1}`,
      name: entityNames[i],
      views: Math.floor(Math.random() * 1000) + 500
    }))
  }

  async getContentFreshnessReport(palikaId?: number): Promise<{
    updated_this_week: number
    updated_this_month: number
    stale_content: number
    never_updated: number
  }> {
    await this.delay(100)

    return {
      updated_this_week: 3,
      updated_this_month: 8,
      stale_content: 4,
      never_updated: 2
    }
  }

  async getPalikaActivityReport(): Promise<Array<{
    palika_id: number
    palika_name: string
    heritage_sites_count: number
    events_count: number
    blog_posts_count: number
    last_activity: string
    is_active: boolean
  }>> {
    await this.delay(200)

    return [
      {
        palika_id: 1,
        palika_name: 'Kathmandu',
        heritage_sites_count: 15,
        events_count: 20,
        blog_posts_count: 25,
        last_activity: new Date().toISOString(),
        is_active: true
      },
      {
        palika_id: 2,
        palika_name: 'Bhaktapur',
        heritage_sites_count: 10,
        events_count: 15,
        blog_posts_count: 18,
        last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      },
      {
        palika_id: 3,
        palika_name: 'Lalitpur',
        heritage_sites_count: 12,
        events_count: 18,
        blog_posts_count: 22,
        last_activity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      }
    ]
  }

  async getBusinessInquiryAnalytics(
    businessId?: string,
    palikaId?: number
  ): Promise<{
    total_inquiries: number
    confirmed_bookings: number
    completed_stays: number
    conversion_rate: number
    estimated_revenue: number
  }> {
    await this.delay(100)

    return {
      total_inquiries: 45,
      confirmed_bookings: 30,
      completed_stays: 25,
      conversion_rate: 66.7,
      estimated_revenue: 25000
    }
  }

  async getUserEngagementMetrics(palikaId?: number): Promise<{
    favorites_count: number
    reviews_count: number
    avg_rating: number
    active_users: number
  }> {
    await this.delay(100)

    return {
      favorites_count: 120,
      reviews_count: 32,
      avg_rating: 4.5,
      active_users: 150
    }
  }

  async getTotalViews(palikaId?: number): Promise<number> {
    await this.delay(50)
    return 5000
  }

  async getInquiryCount(palikaId?: number): Promise<number> {
    await this.delay(50)
    return 45
  }

  async getReviewCount(palikaId?: number): Promise<number> {
    await this.delay(50)
    return 32
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
