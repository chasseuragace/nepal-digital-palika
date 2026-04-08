/**
 * Fake Notification Datasource
 * Mock implementation for UI development without Supabase
 * Matches INotificationDatasource interface
 */

import {
  INotificationDatasource,
  NotificationRow,
  SentNotificationSummary,
  NotificationStats,
} from './notification-datasource'

// Mock users
const MOCK_USERS = [
  { id: 'user-1', name: 'Ramesh Kumar' },
  { id: 'user-2', name: 'Anita Sharma' },
  { id: 'user-3', name: 'Pradeep Poudel' },
  { id: 'user-4', name: 'Rita Tamang' },
  { id: 'user-5', name: 'Suman Rai' },
]

// Mock sent notifications
const MOCK_NOTIFICATIONS: NotificationRow[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    palika_id: 1,
    notification_type: 'general',
    category: 'announcement',
    title: 'Welcome to Palika',
    body: 'नेपाल डिजिटल पालिका प्ल्याटफर्मको स्वागत गर्दछौं',
    image_url: null,
    is_seen: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'user-2',
    palika_id: 1,
    notification_type: 'general',
    category: 'announcement',
    title: 'Welcome to Palika',
    body: 'नेपाल डिजिटल पालिका प्ल्याटफर्मको स्वागत गर्दछौं',
    image_url: null,
    is_seen: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: 'user-3',
    palika_id: 1,
    notification_type: 'personal',
    category: 'business_approval',
    title: 'Your Business is Approved',
    body: 'तपाइँको व्यवसाय अनुमोदित भएको छ',
    image_url: null,
    is_seen: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    user_id: 'user-4',
    palika_id: 1,
    notification_type: 'general',
    category: 'government_notice',
    title: 'Office Holiday Notice',
    body: 'कार्यालय बिदा हुनेछ। विवरणको लागि पढ्नुहोस्।',
    image_url: null,
    is_seen: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
]

export class FakeNotificationDatasource implements INotificationDatasource {
  async fetchPalikaUsers(palikaId: number) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return MOCK_USERS
  }

  async fetchUsersByIds(userIds: string[]) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return MOCK_USERS.filter(u => userIds.includes(u.id))
  }

  async searchPalikaUsers(palikaId: number, query: string) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const q = query.toLowerCase()
    return MOCK_USERS.filter(u => u.name.toLowerCase().includes(q))
  }

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
    await new Promise(resolve => setTimeout(resolve, 200))

    const notificationId = `notif-${Date.now()}`
    let recipientCount = 0

    if (notificationType === 'general') {
      recipientCount = MOCK_USERS.length
    } else if (targetUserIds) {
      recipientCount = targetUserIds.length
    }

    console.log(
      `[FAKE] Sent ${notificationType} notification: "${title}" to ${recipientCount} recipients`
    )

    return {
      notificationId,
      recipientCount,
    }
  }

  async listSentNotifications(
    palikaId: number,
    filters?: {
      type?: 'general' | 'personal'
      category?: string
      page?: number
      pageSize?: number
    }
  ) {
    await new Promise(resolve => setTimeout(resolve, 100))

    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 20

    let results = [...MOCK_NOTIFICATIONS]

    // Filter by type
    if (filters?.type) {
      results = results.filter(n => n.notification_type === filters.type)
    }

    // Filter by category
    if (filters?.category) {
      results = results.filter(n => n.category === filters.category)
    }

    // Group by (title, notification_type, created_at) to show one row per broadcast
    const grouped = new Map<string, SentNotificationSummary>()
    for (const notif of results) {
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

    const summaries = Array.from(grouped.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

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

  async getNotificationDetail(notificationId: string) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return MOCK_NOTIFICATIONS.find(n => n.id === notificationId) || null
  }

  async deleteBroadcast(notificationId: string) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const count = MOCK_NOTIFICATIONS.filter(n => n.id === notificationId).length
    return count
  }

  async getNotificationStats(palikaId: number) {
    await new Promise(resolve => setTimeout(resolve, 100))

    const stats: NotificationStats = {
      totalSent: MOCK_NOTIFICATIONS.length,
      generalCount: MOCK_NOTIFICATIONS.filter(n => n.notification_type === 'general').length,
      personalCount: MOCK_NOTIFICATIONS.filter(n => n.notification_type === 'personal').length,
      categoryBreakdown: {},
      recentCount: MOCK_NOTIFICATIONS.filter(
        n => Date.now() - new Date(n.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
    }

    // Build category breakdown
    for (const notif of MOCK_NOTIFICATIONS) {
      stats.categoryBreakdown[notif.category] = (stats.categoryBreakdown[notif.category] || 0) + 1
    }

    return stats
  }
}

// Export singleton
export const fakeNotificationDatasource = new FakeNotificationDatasource()
