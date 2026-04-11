/**
 * Notifications Client Service
 * Abstracts notification API calls from UI components
 */

export type NotificationType = 'general' | 'personal'
export type AttachmentType = 'file' | 'web_url' | 'app_link'

export interface AttachmentInput {
  attachment_name: string
  attachment_url: string
  attachment_type: AttachmentType
  file_type?: string
  display_label?: string
}

export interface NotificationPayload {
  compose: {
    notification_type: NotificationType
    category: string
    title: string
    body: string
    body_full?: string
    image_url?: string
    palika_id: number
    target_user_ids?: string[]
    target_business_ids?: string[]
    priority?: string
  }
  attachments?: AttachmentInput[]
}

export interface NotificationResponse {
  success: boolean
  message: string
  notification_id?: string
  error?: string
}

class NotificationsClientService {
  private baseUrl = '/api/notifications'

  /**
   * Send a notification
   */
  async send(payload: NotificationPayload): Promise<NotificationResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send notification')
    }

    return result
  }
}

export const notificationsService = new NotificationsClientService()
