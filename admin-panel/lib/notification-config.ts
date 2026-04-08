/**
 * Notification Configuration & DI Setup
 * Allows switching between Fake and Supabase datasources
 * Set via USE_FAKE_NOTIFICATION_DATASOURCE environment variable
 */

import { INotificationDatasource } from './notification-datasource'
import { FakeNotificationDatasource } from './fake-notification-datasource'
import { SupabaseNotificationDatasource } from './supabase-notification-datasource'

// Factory function for datasource
export function createNotificationDatasource(): INotificationDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  console.log(
    `[Notification] Using ${useFake ? 'FAKE' : 'SUPABASE'} datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=${useFake})`
  )

  if (useFake) {
    return new FakeNotificationDatasource()
  }

  return new SupabaseNotificationDatasource()
}

// Global singleton (lazy-initialized)
let notificationDatasource: INotificationDatasource | null = null

export function getNotificationDatasource(): INotificationDatasource {
  if (!notificationDatasource) {
    notificationDatasource = createNotificationDatasource()
  }
  return notificationDatasource
}

// For testing: allow manual override
export function setNotificationDatasource(ds: INotificationDatasource) {
  notificationDatasource = ds
}
