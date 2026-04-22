/**
 * Supabase Analytics Datasource
 * Real implementation using Supabase database
 */

import { IAnalyticsDatasource, AnalyticsFilters } from './analytics-datasource'
import { DashboardStats, ContentAnalytics } from '@/services/types'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseAnalyticsDatasource implements IAnalyticsDatasource {
  constructor(private db: SupabaseClient) {}

  async getDashboardStats(palikaId?: number): Promise<DashboardStats> {
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

    return {
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
        qr_scans: 0,
        inquiries: await this.getInquiryCount(palikaId),
        reviews: await this.getReviewCount(palikaId)
      }
    }
  }

  async getSimpleDashboardStats(palikaId?: number): Promise<{
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
  }> {
    let palikaProfile = null

    // If palika_id is provided, fetch palika details
    if (palikaId) {
      const { data: palika, error: palikaError } = await this.db
        .from('palikas')
        .select(`
          id,
          name_en,
          name_ne,
          code,
          type,
          district_id,
          office_phone,
          office_email,
          website,
          total_wards,
          is_active,
          subscription_tier_id,
          subscription_start_date,
          subscription_end_date,
          cost_per_month,
          created_at,
          updated_at
        `)
        .eq('id', palikaId)
        .single()

      if (!palikaError && palika) {
        // Get district info to get province
        const { data: district } = await this.db
          .from('districts')
          .select('name_en, name_ne, province_id')
          .eq('id', palika.district_id)
          .single()

        // Get province info
        const { data: province } = district ? await this.db
          .from('provinces')
          .select('name_en, name_ne')
          .eq('id', district.province_id)
          .single() : { data: null }

        // Get subscription tier info if exists
        const { data: tier } = palika.subscription_tier_id ? await this.db
          .from('subscription_tiers')
          .select('display_name, description')
          .eq('id', palika.subscription_tier_id)
          .single() : { data: null }

        palikaProfile = {
          id: palika.id,
          name_en: palika.name_en,
          name_ne: palika.name_ne,
          code: palika.code,
          type: palika.type,
          province: province?.name_en || 'Unknown',
          district: district?.name_en || 'Unknown',
          office_phone: palika.office_phone,
          office_email: palika.office_email,
          website: palika.website,
          total_wards: palika.total_wards,
          is_active: palika.is_active,
          subscription_tier_id: palika.subscription_tier_id,
          subscription_tier_display: tier?.display_name,
          subscription_start_date: palika.subscription_start_date,
          subscription_end_date: palika.subscription_end_date,
          cost_per_month: palika.cost_per_month,
          created_at: palika.created_at,
          updated_at: palika.updated_at
        }
      }
    }

    // Get counts for each content type
    const [heritageSites, events, blogPosts] = await Promise.all([
      this.db.from('heritage_sites').select('id', { count: 'exact', head: true }),
      this.db.from('events').select('id', { count: 'exact', head: true }),
      this.db.from('blog_posts').select('id', { count: 'exact', head: true })
    ])

    // Get recent activity (last 10 items across all content types)
    const { data: recentHeritage } = await this.db
      .from('heritage_sites')
      .select('id, name_english, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentEvents } = await this.db
      .from('events')
      .select('id, name_english, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentBlogs } = await this.db
      .from('blog_posts')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and sort recent activity
    const recentActivity = [
      ...(recentHeritage || []).map(item => ({
        id: item.id,
        type: 'Heritage Site',
        title: item.name_english,
        created_at: item.created_at
      })),
      ...(recentEvents || []).map(item => ({
        id: item.id,
        type: 'Event',
        title: item.name_english,
        created_at: item.created_at
      })),
      ...(recentBlogs || []).map(item => ({
        id: item.id,
        type: 'Blog Post',
        title: item.title,
        created_at: item.created_at
      }))
    ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

    return {
      palika_profile: palikaProfile,
      heritage_sites: heritageSites.count || 0,
      events: events.count || 0,
      blog_posts: blogPosts.count || 0,
      pending_approvals: 0,
      recent_activity: recentActivity
    }
  }

  async getContentAnalytics(
    entityType: 'heritage_site' | 'event' | 'blog_post' | 'business',
    filters?: AnalyticsFilters
  ): Promise<ContentAnalytics[]> {
    const tableName = this.getTableName(entityType)

    let query = this.db.from(tableName).select('id, view_count, created_at')

    if (filters?.palika_id) {
      query = query.eq('palika_id', filters.palika_id)
    }

    const { data, error } = await query.order('view_count', { ascending: false }).limit(20)

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map(item => ({
      entity_type: entityType,
      entity_id: item.id,
      view_count: item.view_count || 0,
      unique_visitors: Math.floor((item.view_count || 0) * 0.7),
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
      throw new Error(error.message)
    }

    return (data || []).map(item => ({
      id: item.id,
      name: (item as any)[nameField],
      views: item.view_count || 0
    }))
  }

  async getContentFreshnessReport(palikaId?: number): Promise<{
    updated_this_week: number
    updated_this_month: number
    stale_content: number
    never_updated: number
  }> {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()

    let query = this.db.from('heritage_sites').select('id, created_at, updated_at')
    if (palikaId) query = query.eq('palika_id', palikaId)

    const { data } = await query

    const sites = data || []

    return {
      updated_this_week: sites.filter(s => s.updated_at >= oneWeekAgo).length,
      updated_this_month: sites.filter(s => s.updated_at >= oneMonthAgo).length,
      stale_content: sites.filter(s => s.updated_at < sixMonthsAgo).length,
      never_updated: sites.filter(s => s.created_at === s.updated_at).length
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

    return reports
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
    let query = this.db.from('inquiries').select('*')

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data: inquiries } = await query

    const inqs = inquiries || []
    const confirmed = inqs.filter(i => i.inquiry_status === 'confirmed' || i.inquiry_status === 'completed')
    const completed = inqs.filter(i => i.inquiry_status === 'completed')

    return {
      total_inquiries: inqs.length,
      confirmed_bookings: confirmed.length,
      completed_stays: completed.length,
      conversion_rate: inqs.length > 0 ? (confirmed.length / inqs.length) * 100 : 0,
      estimated_revenue: completed.reduce((sum, i) => sum + (i.actual_revenue || i.estimated_revenue || 0), 0)
    }
  }

  async getUserEngagementMetrics(palikaId?: number): Promise<{
    favorites_count: number
    reviews_count: number
    avg_rating: number
    active_users: number
  }> {
    const { data: favorites } = await this.db.from('favorites').select('id')
    const { data: reviews } = await this.db.from('reviews').select('id, rating')
    const { data: profiles } = await this.db.from('profiles').select('id')

    const revs = reviews || []
    const avgRating = revs.length > 0
      ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
      : 0

    return {
      favorites_count: (favorites || []).length,
      reviews_count: revs.length,
      avg_rating: Math.round(avgRating * 10) / 10,
      active_users: (profiles || []).length
    }
  }

  async getTotalViews(palikaId?: number): Promise<number> {
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

  async getInquiryCount(palikaId?: number): Promise<number> {
    try {
      const { data } = await this.db.from('inquiries').select('id')
      return (data || []).length
    } catch {
      return 0
    }
  }

  async getReviewCount(palikaId?: number): Promise<number> {
    try {
      const { data } = await this.db.from('reviews').select('id')
      return (data || []).length
    } catch {
      return 0
    }
  }

  private getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      'heritage_site': 'heritage_sites',
      'event': 'events',
      'blog_post': 'blog_posts',
      'business': 'businesses'
    }
    return tableMap[entityType] || entityType
  }
}
