/**
 * Notification API Routes (Clean Architecture Version)
 * Uses NotificationService with injected INotificationDatasource
 *
 * Routes:
 * - GET /api/notifications-v2?palika_id=1&type=general&category=announcement
 * - POST /api/notifications-v2 (send notification)
 * - GET /api/notifications-v2?stats=true (statistics)
 */

import { NextRequest, NextResponse } from 'next/server'
import { notificationService, type NotificationCompose } from '@/services/notification.service'

/**
 * GET /api/notifications-v2
 * Query sent notifications or get statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const palikaId = parseInt(searchParams.get('palika_id') || '1', 10)

    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await notificationService.getNotificationStats(palikaId)
      return NextResponse.json(stats)
    }

    // Otherwise list notifications
    const filters = {
      type: searchParams.get('type') as any,
      category: searchParams.get('category') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
    }

    const result = await notificationService.listSentNotifications(palikaId, filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Notification GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

/**
 * POST /api/notifications-v2
 * Send a notification (broadcast or personal)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { compose, attachments } = body

    // Validate
    if (!compose) {
      return NextResponse.json({ error: 'Missing compose data' }, { status: 400 })
    }

    // Send notification via service
    const result = await notificationService.sendNotification(compose as NotificationCompose)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      notificationId: result.notificationId,
      recipientCount: result.recipientCount,
    })
  } catch (error) {
    console.error('Notification POST failed:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
