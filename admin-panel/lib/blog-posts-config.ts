/**
 * Blog Posts DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { IBlogPostsDatasource } from './blog-posts-datasource'
import { SupabaseBlogPostsDatasource } from './supabase-blog-posts-datasource'
import { FakeBlogPostsDatasource } from './fake-blog-posts-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IBlogPostsDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createBlogPostsDatasource(): IBlogPostsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[BlogPosts] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeBlogPostsDatasource()
  }

  console.log('[BlogPosts] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseBlogPostsDatasource(supabaseClient)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getBlogPostsDatasource(): IBlogPostsDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createBlogPostsDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setBlogPostsDatasource(new FakeBlogPostsDatasource())
 */
export function setBlogPostsDatasource(datasource: IBlogPostsDatasource) {
  datasourceInstance = datasource
}
