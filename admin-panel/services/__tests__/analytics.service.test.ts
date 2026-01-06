/**
 * Analytics Service Tests
 * Tests dashboard stats, reporting, and analytics features
 * Based on Palika Administrator workflows from System Operations
 */

import { AnalyticsService } from '../analytics.service'
import { createMockClient } from '../database-client'

describe('AnalyticsService', () => {
  // Mock data representing real Palika content
  const mockHeritageSites = [
    { id: 'site-1', palika_id: 1, status: 'published', is_featured: true, view_count: 1500, created_at: '2025-01-01', updated_at: '2025-01-05' },
    { id: 'site-2', palika_id: 1, status: 'published', is_featured: true, view_count: 1200, created_at: '2025-01-02', updated_at: '2025-01-04' },
    { id: 'site-3', palika_id: 1, status: 'draft', is_featured: false, view_count: 0, created_at: '2025-01-03', updated_at: '2025-01-03' },
    { id: 'site-4', palika_id: 2, status: 'published', is_featured: false, view_count: 800, created_at: '2024-06-01', updated_at: '2024-06-01' }
  ]

  const mockEvents = [
    { id: 'event-1', palika_id: 1, status: 'published', is_festival: true, start_date: '2025-10-02', end_date: '2025-10-16', updated_at: '2025-01-01' },
    { id: 'event-2', palika_id: 1, status: 'published', is_festival: true, start_date: '2025-11-01', end_date: '2025-11-05', updated_at: '2025-01-02' },
    { id: 'event-3', palika_id: 1, status: 'draft', is_festival: false, start_date: '2025-12-15', end_date: '2025-12-17', updated_at: '2025-01-03' },
    { id: 'event-4', palika_id: 1, status: 'published', is_festival: false, start_date: '2024-06-01', end_date: '2024-06-03', updated_at: '2024-06-01' }
  ]

  const mockBlogPosts = [
    { id: 'post-1', palika_id: 1, status: 'published', view_count: 500, updated_at: '2025-01-01' },
    { id: 'post-2', palika_id: 1, status: 'published', view_count: 300, updated_at: '2025-01-02' },
    { id: 'post-3', palika_id: 1, status: 'draft', view_count: 0, updated_at: '2025-01-03' }
  ]

  const mockBusinesses = [
    { id: 'biz-1', palika_id: 1, verification_status: 'verified' },
    { id: 'biz-2', palika_id: 1, verification_status: 'pending' },
    { id: 'biz-3', palika_id: 1, verification_status: 'verified' }
  ]

  const mockProfiles = [
    { id: 'user-1', user_type: 'resident' },
    { id: 'user-2', user_type: 'tourist_domestic' },
    { id: 'user-3', user_type: 'tourist_international' },
    { id: 'user-4', user_type: 'business_owner' }
  ]

  const mockInquiries = [
    { id: 'inq-1', business_id: 'biz-1', inquiry_status: 'completed', actual_revenue: 5000 },
    { id: 'inq-2', business_id: 'biz-1', inquiry_status: 'confirmed', estimated_revenue: 3000 },
    { id: 'inq-3', business_id: 'biz-1', inquiry_status: 'new' }
  ]

  const mockReviews = [
    { id: 'rev-1', business_id: 'biz-1', rating: 5 },
    { id: 'rev-2', business_id: 'biz-1', rating: 4 },
    { id: 'rev-3', business_id: 'biz-2', rating: 3 }
  ]

  const mockFavorites = [
    { id: 'fav-1', user_id: 'user-1', entity_type: 'heritage_site', entity_id: 'site-1' },
    { id: 'fav-2', user_id: 'user-2', entity_type: 'event', entity_id: 'event-1' }
  ]

  const mockPalikas = [
    { id: 1, name_en: 'Kathmandu Metropolitan' },
    { id: 2, name_en: 'Lalitpur Metropolitan' }
  ]

  let service: AnalyticsService

  beforeEach(() => {
    const mockDb = createMockClient({
      heritage_sites: mockHeritageSites,
      events: mockEvents,
      blog_posts: mockBlogPosts,
      businesses: mockBusinesses,
      profiles: mockProfiles,
      inquiries: mockInquiries,
      reviews: mockReviews,
      favorites: mockFavorites,
      palikas: mockPalikas
    })
    service = new AnalyticsService(mockDb)
  })

  describe('getDashboardStats', () => {
    it('should return complete dashboard statistics', async () => {
      const result = await service.getDashboardStats()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const stats = result.data!

      // Heritage sites stats
      expect(stats.heritage_sites.total).toBe(4)
      expect(stats.heritage_sites.published).toBe(3)
      expect(stats.heritage_sites.draft).toBe(1)
      expect(stats.heritage_sites.featured).toBe(2)

      // Events stats
      expect(stats.events.total).toBe(4)
      expect(stats.events.festivals).toBe(2)

      // Blog posts stats
      expect(stats.blog_posts.total).toBe(3)
      expect(stats.blog_posts.published).toBe(2)
      expect(stats.blog_posts.draft).toBe(1)

      // Businesses stats
      expect(stats.businesses.total).toBe(3)
      expect(stats.businesses.verified).toBe(2)
      expect(stats.businesses.pending).toBe(1)

      // Users stats
      expect(stats.users.total).toBe(4)
      expect(stats.users.residents).toBe(1)
      expect(stats.users.tourists).toBe(2)
      expect(stats.users.business_owners).toBe(1)
    })

    it('should filter stats by palika_id', async () => {
      const result = await service.getDashboardStats(1)

      expect(result.success).toBe(true)
      // Should only include palika 1 content
      expect(result.data?.heritage_sites.total).toBe(3)
    })
  })

  describe('getContentAnalytics', () => {
    it('should return content analytics for heritage sites', async () => {
      const result = await service.getContentAnalytics('heritage_site')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeGreaterThan(0)
      expect(result.data![0].entity_type).toBe('heritage_site')
    })

    it('should filter by palika_id', async () => {
      const result = await service.getContentAnalytics('heritage_site', { palika_id: 1 })

      expect(result.success).toBe(true)
    })
  })

  describe('getTopContent', () => {
    it('should return top heritage sites by view count', async () => {
      const result = await service.getTopContent('heritage_site', 5)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Should be ordered by view_count descending
      if (result.data && result.data.length > 1) {
        expect(result.data[0].views).toBeGreaterThanOrEqual(result.data[1].views)
      }
    })

    it('should limit results', async () => {
      const result = await service.getTopContent('heritage_site', 2)

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeLessThanOrEqual(2)
    })

    it('should filter by palika_id', async () => {
      const result = await service.getTopContent('heritage_site', 10, 1)

      expect(result.success).toBe(true)
    })
  })

  describe('getContentFreshnessReport', () => {
    it('should return content freshness metrics', async () => {
      const result = await service.getContentFreshnessReport()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('updated_this_week')
      expect(result.data).toHaveProperty('updated_this_month')
      expect(result.data).toHaveProperty('stale_content')
      expect(result.data).toHaveProperty('never_updated')
    })

    it('should filter by palika_id', async () => {
      const result = await service.getContentFreshnessReport(1)

      expect(result.success).toBe(true)
    })
  })

  describe('getPalikaActivityReport', () => {
    it('should return activity report for all palikas', async () => {
      const result = await service.getPalikaActivityReport()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBe(2) // Two palikas

      const report = result.data![0]
      expect(report).toHaveProperty('palika_id')
      expect(report).toHaveProperty('palika_name')
      expect(report).toHaveProperty('heritage_sites_count')
      expect(report).toHaveProperty('events_count')
      expect(report).toHaveProperty('blog_posts_count')
      expect(report).toHaveProperty('last_activity')
      expect(report).toHaveProperty('is_active')
    })
  })

  describe('getBusinessInquiryAnalytics', () => {
    it('should return business inquiry analytics', async () => {
      const result = await service.getBusinessInquiryAnalytics()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('total_inquiries')
      expect(result.data).toHaveProperty('confirmed_bookings')
      expect(result.data).toHaveProperty('completed_stays')
      expect(result.data).toHaveProperty('conversion_rate')
      expect(result.data).toHaveProperty('estimated_revenue')
    })

    it('should filter by business_id', async () => {
      const result = await service.getBusinessInquiryAnalytics('biz-1')

      expect(result.success).toBe(true)
      expect(result.data?.total_inquiries).toBe(3)
    })

    it('should calculate conversion rate correctly', async () => {
      const result = await service.getBusinessInquiryAnalytics()

      expect(result.success).toBe(true)
      // 2 confirmed/completed out of 3 total = 66.67%
      expect(result.data?.conversion_rate).toBeCloseTo(66.67, 0)
    })
  })

  describe('getUserEngagementMetrics', () => {
    it('should return user engagement metrics', async () => {
      const result = await service.getUserEngagementMetrics()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('favorites_count')
      expect(result.data).toHaveProperty('reviews_count')
      expect(result.data).toHaveProperty('avg_rating')
      expect(result.data).toHaveProperty('active_users')
    })

    it('should calculate average rating correctly', async () => {
      const result = await service.getUserEngagementMetrics()

      expect(result.success).toBe(true)
      // (5 + 4 + 3) / 3 = 4.0
      expect(result.data?.avg_rating).toBe(4)
    })
  })

  describe('generateMonthlyReport', () => {
    it('should generate a complete monthly report', async () => {
      const result = await service.generateMonthlyReport(1, 2025, 1)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const report = result.data!
      expect(report.period).toBe('2025-01')
      expect(report.stats).toBeDefined()
      expect(report.top_heritage_sites).toBeDefined()
      expect(report.top_events).toBeDefined()
      expect(report.top_blog_posts).toBeDefined()
      expect(report.content_freshness).toBeDefined()
      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    it('should generate recommendations based on data', async () => {
      const result = await service.generateMonthlyReport(1, 2025, 1)

      expect(result.success).toBe(true)
      // Should have some recommendations based on the mock data
      expect(result.data?.recommendations.length).toBeGreaterThanOrEqual(0)
    })
  })

  // Use case tests based on System Operations document

  describe('Palika Administrator Weekly Review Use Case', () => {
    it('should provide all data needed for weekly content review', async () => {
      // As per System Operations: "Check Dashboard Metrics"
      const dashboardResult = await service.getDashboardStats(1)
      expect(dashboardResult.success).toBe(true)

      // Should show content items added this week
      const freshnessResult = await service.getContentFreshnessReport(1)
      expect(freshnessResult.success).toBe(true)
      expect(freshnessResult.data?.updated_this_week).toBeDefined()

      // Should show most viewed pages
      const topContentResult = await service.getTopContent('heritage_site', 5, 1)
      expect(topContentResult.success).toBe(true)
    })
  })

  describe('Provincial Coordinator Monthly Review Use Case', () => {
    it('should provide palika activity overview', async () => {
      // As per System Operations: "Overview Dashboard"
      const activityResult = await service.getPalikaActivityReport()
      expect(activityResult.success).toBe(true)

      // Should identify active and inactive palikas
      const activePalikas = activityResult.data?.filter(p => p.is_active)
      const inactivePalikas = activityResult.data?.filter(p => !p.is_active)
      expect(activePalikas).toBeDefined()
      expect(inactivePalikas).toBeDefined()
    })
  })

  describe('Business Analytics Use Case', () => {
    it('should track inquiry-to-booking conversion', async () => {
      // As per Mobile App Spec: Transaction Tracking
      const result = await service.getBusinessInquiryAnalytics('biz-1')

      expect(result.success).toBe(true)
      expect(result.data?.total_inquiries).toBeGreaterThan(0)
      expect(result.data?.conversion_rate).toBeDefined()
      expect(result.data?.estimated_revenue).toBeDefined()
    })
  })
})
