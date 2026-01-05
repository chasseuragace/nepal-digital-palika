/**
 * Nepal Tourism Platform - Services Layer
 * 
 * Framework-agnostic services that can be used in any React/TypeScript project.
 * These services encapsulate all business logic and database operations.
 * 
 * Usage:
 * 1. Create a database client (Supabase, mock, or custom)
 * 2. Initialize services with the client
 * 3. Use services in your components/hooks
 * 
 * Example:
 * ```typescript
 * import { createSupabaseClient } from './database-client'
 * import { HeritageSitesService, EventsService } from './services'
 * import { createClient } from '@supabase/supabase-js'
 * 
 * const supabase = createClient(url, key)
 * const db = createSupabaseClient(supabase)
 * 
 * const heritageSitesService = new HeritageSitesService(db)
 * const eventsService = new EventsService(db)
 * 
 * // Use in components
 * const { data } = await heritageSitesService.getAll()
 * ```
 */

// Types
export * from './types'

// Database Client
export { 
  DatabaseClient, 
  QueryBuilder, 
  DatabaseResult,
  createSupabaseClient, 
  createMockClient 
} from './database-client'

// Services
export { AuthService, AuthServiceConfig } from './auth.service'
export { HeritageSitesService } from './heritage-sites.service'
export { EventsService } from './events.service'
export { BlogPostsService } from './blog-posts.service'
export { AnalyticsService, AnalyticsFilters } from './analytics.service'

/**
 * Service Factory - Creates all services with a single database client
 */
import { DatabaseClient } from './database-client'
import { AuthService, AuthServiceConfig } from './auth.service'
import { HeritageSitesService } from './heritage-sites.service'
import { EventsService } from './events.service'
import { BlogPostsService } from './blog-posts.service'
import { AnalyticsService } from './analytics.service'

export interface ServiceContainer {
  auth: AuthService
  heritageSites: HeritageSitesService
  events: EventsService
  blogPosts: BlogPostsService
  analytics: AnalyticsService
}

export function createServices(
  db: DatabaseClient, 
  authConfig?: AuthServiceConfig
): ServiceContainer {
  return {
    auth: new AuthService(db, authConfig),
    heritageSites: new HeritageSitesService(db),
    events: new EventsService(db),
    blogPosts: new BlogPostsService(db),
    analytics: new AnalyticsService(db)
  }
}
