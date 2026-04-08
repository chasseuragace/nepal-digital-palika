/**
 * Abstract Notification Datasource
 * Defines contract for querying/storing notifications
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface NotificationRow {
  id: string
  user_id: string
  palika_id: number
  notification_type: 'general' | 'personal'
  category: string
  title: string
  body: string
  body_full?: string | null
  image_url?: string | null
  is_seen: boolean
  created_at: string
  updated_at: string
}

export interface SentNotificationSummary {
  title: string
  body: string
  notification_type: 'general' | 'personal'
  category: string
  image_url?: string | null
  created_at: string
  recipient_count: number
  target_user_id?: string
  sample_notification_id: string
}

export interface NotificationStats {
  totalSent: number
  generalCount: number
  personalCount: number
  categoryBreakdown: Record<string, number>
  recentCount: number
}

export interface INotificationDatasource {
  // Fetch all users in a palika for broadcast targeting
  fetchPalikaUsers(palikaId: number): Promise<Array<{ id: string; name: string }>>

  // Fetch specific users by IDs
  fetchUsersByIds(userIds: string[]): Promise<Array<{ id: string; name: string }>>

  // Search users by name/email
  searchPalikaUsers(palikaId: number, query: string): Promise<Array<{ id: string; name: string }>>

  // Send notification (broadcast or personal)
  sendNotification(
    palikaId: number,
    notificationType: 'general' | 'personal',
    category: string,
    title: string,
    body: string,
    bodyFull?: string,
    imageUrl?: string,
    targetUserIds?: string[]
  ): Promise<{ notificationId: string; recipientCount: number }>

  // List sent notifications with optional filters
  listSentNotifications(
    palikaId: number,
    filters?: {
      type?: 'general' | 'personal'
      category?: string
      page?: number
      pageSize?: number
    }
  ): Promise<{
    data: SentNotificationSummary[]
    total: number
    page: number
    pageSize: number
  }>

  // Get single notification detail
  getNotificationDetail(notificationId: string): Promise<NotificationRow | null>

  // Delete broadcast (all recipient rows)
  deleteBroadcast(notificationId: string): Promise<number>

  // Get statistics
  getNotificationStats(palikaId: number): Promise<NotificationStats>
}
