/**
 * Supabase Notification Datasource
 * Real implementation using Supabase queries
 * Matches INotificationDatasource interface
 */

import { supabaseAdmin } from './supabase'
import {
  INotificationDatasource,
  NotificationRow,
  SentNotificationSummary,
  NotificationStats,
} from './notification-datasource'

export class SupabaseNotificationDatasource implements INotificationDatasource {
  /**
   * Fetch all users in a palika for broadcast targeting.
   * Users are stored in the `profiles` table (not `user_profiles`).
   */
  async fetchPalikaUsers(palikaId: number) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('default_palika_id', palikaId)

    if (error) throw error
    return data || []
  }

  /**
   * Fetch specific users by IDs.
   */
  async fetchUsersByIds(userIds: string[]) {
    const { data, error } = await supabaseAdmin.from('profiles').select('id, name').in('id', userIds)

    if (error) throw error
    return data || []
  }

  /**
   * Search users by name.
   */
  async searchPalikaUsers(palikaId: number, query: string) {
    const searchTerm = `%${query}%`
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('default_palika_id', palikaId)
      .ilike('name', searchTerm)

    if (error) throw error
    return data || []
  }

  /**
   * Send notification (general broadcast or personal).
   * For general: insert 1 row per user in palika.
   * For personal: insert 1 row per target user.
   */
  async sendNotification(
    palikaId: number,
    notificationType: 'general' | 'personal',
    category: string,
    title: string,
    body: string,
    bodyFull?: string,
    imageUrl?: string,
    targetUserIds?: string[]
  ) {
    let users: Array<{ id: string }>

    if (notificationType === 'general') {
      // Fetch all users in palika
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('default_palika_id', palikaId)

      if (error) throw error
      users = data || []
    } else {
      // Use target user IDs
      users = (targetUserIds || []).map(id => ({ id }))
    }

    if (users.length === 0) {
      return { notificationId: '', recipientCount: 0 }
    }

    // Build notification rows
    const rows = users.map(user => ({
      user_id: user.id,
      palika_id: palikaId,
      notification_type: notificationType,
      category,
      title,
      body,
      body_full: bodyFull,
      image_url: imageUrl,
      is_seen: notificationType === 'general' ? false : false,
    }))

    // Batch insert in chunks of 1000
    let recipientCount = 0
    let firstNotificationId = ''

    for (let i = 0; i < rows.length; i += 1000) {
      const chunk = rows.slice(i, i + 1000)
      const { data, error } = await supabaseAdmin.from('notifications').insert(chunk).select('id')

      if (error) throw error
      if (data && data.length > 0) {
        if (!firstNotificationId) {
          firstNotificationId = data[0].id
        }
        recipientCount += data.length
      }
    }

    return { notificationId: firstNotificationId, recipientCount }
  }

  /**
   * List sent notifications with grouping.
   * Groups by (title, notification_type) to show one row per broadcast.
   */
  async listSentNotifications(
    palikaId: number,
    filters?: {
      type?: 'general' | 'personal'
      category?: string
      page?: number
      pageSize?: number
    }
  ) {
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 20

    // Fetch notifications
    let query = supabaseAdmin.from('notifications').select('*').eq('palika_id', palikaId)

    if (filters?.type) {
      query = query.eq('notification_type', filters.type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data: notifications, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) throw error
    if (!notifications || notifications.length === 0) {
      return { data: [], total: 0, page, pageSize }
    }

    // Group by (title, notification_type)
    const grouped = new Map<string, SentNotificationSummary>()

    for (const notif of notifications) {
      const key = `${notif.title}|${notif.notification_type}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          title: notif.title,
          body: notif.body,
          notification_type: notif.notification_type,
          category: notif.category,
          image_url: notif.image_url,
          created_at: notif.created_at,
          recipient_count: 1,
          target_user_id: notif.notification_type === 'personal' ? notif.user_id : undefined,
          sample_notification_id: notif.id,
        })
      } else {
        grouped.get(key)!.recipient_count += 1
      }
    }

    const summaries = Array.from(grouped.values())

    // Paginate
    const offset = (page - 1) * pageSize
    const paginated = summaries.slice(offset, offset + pageSize)

    return {
      data: paginated,
      total: summaries.length,
      page,
      pageSize,
    }
  }

  /**
   * Get notification detail.
   */
  async getNotificationDetail(notificationId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  /**
   * Delete broadcast (all rows with same title/type).
   */
  async deleteBroadcast(notificationId: string) {
    // First get the notification to find title/type
    const notif = await this.getNotificationDetail(notificationId)
    if (!notif) return 0

    // Delete all with same title and type
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('title', notif.title)
      .eq('notification_type', notif.notification_type)

    if (error) throw error
    return count || 0
  }

  /**
   * Get notification statistics.
   */
  async getNotificationStats(palikaId: number) {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('palika_id', palikaId)

    if (error) throw error
    if (!notifications) {
      return {
        totalSent: 0,
        generalCount: 0,
        personalCount: 0,
        categoryBreakdown: {},
        recentCount: 0,
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const stats: NotificationStats = {
      totalSent: notifications.length,
      generalCount: notifications.filter(n => n.notification_type === 'general').length,
      personalCount: notifications.filter(n => n.notification_type === 'personal').length,
      categoryBreakdown: {},
      recentCount: notifications.filter(n => new Date(n.created_at) > sevenDaysAgo).length,
    }

    // Build category breakdown
    for (const notif of notifications) {
      stats.categoryBreakdown[notif.category] = (stats.categoryBreakdown[notif.category] || 0) + 1
    }

    return stats
  }
}

// Export singleton
export const supabaseNotificationDatasource = new SupabaseNotificationDatasource()
