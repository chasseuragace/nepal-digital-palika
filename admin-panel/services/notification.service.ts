/**
 * Notification Service — Clean Architecture with DI
 *
 * SERVICE LAYER (Business Logic)
 * - Receives INotificationDatasource via dependency injection
 * - Orchestrates domain operations (send, list, delete)
 * - Converts DTOs between API/UI and datasource layers
 * - No direct Supabase calls — all data operations go through datasource
 *
 * DESIGN:
 * - Constructor accepts optional datasource (defaults to config-based DI)
 * - Service methods expose high-level operations
 * - DTOs are Supabase-grounded (match actual schema reality)
 * - Supports mock/real datasource switching via environment variable
 */

import { INotificationDatasource } from '@/lib/notification-datasource'
import { getNotificationDatasource } from '@/lib/notification-config'

// ─── DTOs (Supabase-grounded) ───

export type NotificationType = 'general' | 'personal'

export interface NotificationCompose {
  notification_type: NotificationType
  category: string
  title: string
  body: string
  body_full?: string
  image_url?: string
  palika_id: number
  target_user_ids?: string[]
  target_business_ids?: string[]
}

export interface SentNotificationSummary {
  title: string
  body: string
  notification_type: NotificationType
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

// ─── Service ───

export class NotificationService {
  private datasource: INotificationDatasource

  /**
   * Constructor with dependency injection.
   * If no datasource provided, uses config-based DI to get real/fake.
   */
  constructor(datasource?: INotificationDatasource) {
    this.datasource = datasource || getNotificationDatasource()
  }

  /**
   * Send a notification (general broadcast or personal).
   *
   * General: Sent to all opted-in users in the palika.
   * Personal: Sent to specific target_user_ids.
   * Business-targeted: For future use (send to business owners/staff).
   */
  async sendNotification(compose: NotificationCompose): Promise<{
    success: boolean
    notificationId?: string
    recipientCount?: number
    message?: string
  }> {
    try {
      // Validate required fields
      if (!compose.title.trim() || !compose.body.trim()) {
        return { success: false, message: 'Title and body are required.' }
      }

      if (compose.notification_type === 'personal' && !compose.target_user_ids?.length) {
        return {
          success: false,
          message: 'Personal notifications require at least one target user.',
        }
      }

      // Send via datasource
      const result = await this.datasource.sendNotification(
        compose.palika_id,
        compose.notification_type,
        compose.category,
        compose.title,
        compose.body,
        compose.body_full,
        compose.image_url,
        compose.target_user_ids
      )

      return {
        success: true,
        notificationId: result.notificationId,
        recipientCount: result.recipientCount,
        message: `Notification sent to ${result.recipientCount} recipient${result.recipientCount !== 1 ? 's' : ''}`,
      }
    } catch (error) {
      console.error('Send notification failed:', error)
      return { success: false, message: 'Failed to send notification.' }
    }
  }

  /**
   * List sent notifications for admin dashboard.
   */
  async listSentNotifications(
    palikaId: number,
    filters?: {
      type?: NotificationType
      category?: string
      page?: number
      pageSize?: number
    }
  ): Promise<{
    data: SentNotificationSummary[]
    total: number
    page: number
    pageSize: number
  }> {
    try {
      return await this.datasource.listSentNotifications(palikaId, filters)
    } catch (error) {
      console.error('List notifications failed:', error)
      return { data: [], total: 0, page: 1, pageSize: 20 }
    }
  }

  /**
   * Get single notification detail.
   */
  async getNotificationDetail(notificationId: string) {
    try {
      return await this.datasource.getNotificationDetail(notificationId)
    } catch (error) {
      console.error('Get notification detail failed:', error)
      return null
    }
  }

  /**
   * Delete a broadcast notification (all recipient rows).
   */
  async deleteBroadcast(notificationId: string): Promise<number> {
    try {
      return await this.datasource.deleteBroadcast(notificationId)
    } catch (error) {
      console.error('Delete broadcast failed:', error)
      return 0
    }
  }

  /**
   * Get notification statistics for dashboard.
   */
  async getNotificationStats(palikaId: number): Promise<NotificationStats> {
    try {
      return await this.datasource.getNotificationStats(palikaId)
    } catch (error) {
      console.error('Get stats failed:', error)
      return {
        totalSent: 0,
        generalCount: 0,
        personalCount: 0,
        categoryBreakdown: {},
        recentCount: 0,
      }
    }
  }
}

// Export singleton instance (uses config-based DI)
export const notificationService = new NotificationService()
