/**
 * Blog Posts Service
 * Framework-agnostic CRUD operations for blog posts
 */

import { DatabaseClient } from './database-client'
import {
  BlogPost,
  BlogPostFilters,
  CreateBlogPostInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'
import { IBlogPostsDatasource } from '@/lib/blog-posts-datasource'
import { getBlogPostsDatasource } from '@/lib/blog-posts-config'

export class BlogPostsService {
  private db: DatabaseClient
  private datasource: IBlogPostsDatasource

  constructor(db?: DatabaseClient | IBlogPostsDatasource) {
    // Support both old DatabaseClient and new IBlogPostsDatasource
    if (db && 'from' in db) {
      // It's a DatabaseClient
      this.db = db as DatabaseClient
      this.datasource = getBlogPostsDatasource()
    } else if (db) {
      // It's a datasource
      this.datasource = db as IBlogPostsDatasource
      this.db = null as any
    } else {
      // No argument, use default
      this.datasource = getBlogPostsDatasource()
      this.db = null as any
    }
  }

  /**
   * Get all blog posts with optional filtering and pagination
   */
  async getAll(
    filters: BlogPostFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<BlogPost>>> {
    try {
      const { page = 1, limit = 20 } = pagination
      const result = await this.datasource.getAll(filters, { page, limit })

      return {
        success: true,
        data: {
          data: result.data,
          total: result.total,
          page,
          limit,
          hasMore: result.data.length === limit
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch blog posts' }
    }
  }

  /**
   * Get a single blog post by ID
   */
  async getById(id: string): Promise<ServiceResponse<BlogPost>> {
    try {
      const data = await this.datasource.getById(id)

      if (!data) {
        return { success: false, error: 'Blog post not found' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch blog post' }
    }
  }

  /**
   * Get a blog post by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<BlogPost>> {
    try {
      const data = await this.datasource.getBySlug(slug)

      if (!data) {
        return { success: false, error: 'Blog post not found' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch blog post' }
    }
  }

  /**
   * Create a new blog post
   */
  async create(input: CreateBlogPostInput): Promise<ServiceResponse<BlogPost>> {
    try {
      // Validate required fields
      const validation = this.validateInput(input)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const data = await this.datasource.create(input)

      return {
        success: true,
        data,
        message: 'Blog post created successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create blog post' }
    }
  }

  /**
   * Update an existing blog post
   */
  async update(id: string, input: Partial<CreateBlogPostInput>): Promise<ServiceResponse<BlogPost>> {
    try {
      const data = await this.datasource.update(id, input)

      return {
        success: true,
        data,
        message: 'Blog post updated successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to update blog post' }
    }
  }

  /**
   * Delete a blog post
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.delete(id)

      return { success: true, message: 'Blog post deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete blog post' }
    }
  }

  /**
   * Publish a blog post
   */
  async publish(id: string): Promise<ServiceResponse<BlogPost>> {
    try {
      const data = await this.datasource.publish(id)
      return { success: true, data, message: 'Blog post published successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to publish blog post' }
    }
  }

  /**
   * Archive a blog post
   */
  async archive(id: string): Promise<ServiceResponse<BlogPost>> {
    try {
      const data = await this.datasource.archive(id)
      return { success: true, data, message: 'Blog post archived successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to archive blog post' }
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.incrementViewCount(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to increment view count' }
    }
  }

  /**
   * Get recent blog posts
   */
  async getRecent(limit: number = 5): Promise<ServiceResponse<BlogPost[]>> {
    try {
      const result = await this.datasource.getPublished({ limit })
      return { success: true, data: result.data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch recent posts' }
    }
  }

  /**
   * Get popular blog posts (by view count)
   */
  async getPopular(limit: number = 5): Promise<ServiceResponse<BlogPost[]>> {
    try {
      const result = await this.datasource.getPublished({ limit })
      // Sort by view count (fake and real both support this)
      const sorted = result.data.sort((a, b) => b.view_count - a.view_count).slice(0, limit)
      return { success: true, data: sorted }
    } catch (error) {
      return { success: false, error: 'Failed to fetch popular posts' }
    }
  }

  /**
   * Get blog posts by category
   */
  async getByCategory(category: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<BlogPost>>> {
    return this.getAll({ category }, pagination)
  }

  /**
   * Get blog posts by author
   */
  async getByAuthor(authorId: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<BlogPost>>> {
    return this.getAll({ author_id: authorId }, pagination)
  }

  /**
   * Get blog posts by tag
   */
  async getByTag(tag: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<BlogPost>>> {
    return this.getAll({ tags: [tag] }, pagination)
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<ServiceResponse<string[]>> {
    try {
      const result = await this.datasource.getPublished({ limit: 1000 })
      const categories = [...new Set(result.data.map(p => p.category).filter(Boolean))]
      return { success: true, data: categories }
    } catch (error) {
      return { success: false, error: 'Failed to fetch categories' }
    }
  }

  /**
   * Get all unique tags
   */
  async getTags(): Promise<ServiceResponse<string[]>> {
    try {
      const result = await this.datasource.getPublished({ limit: 1000 })
      const allTags = result.data.flatMap(p => p.tags || [])
      const uniqueTags = [...new Set(allTags)]
      return { success: true, data: uniqueTags }
    } catch (error) {
      return { success: false, error: 'Failed to fetch tags' }
    }
  }

  /**
   * Search blog posts
   */
  async search(query: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<BlogPost>>> {
    return this.getAll({ search: query }, pagination)
  }

  // Private helper methods

  private validateInput(input: CreateBlogPostInput): { valid: boolean; error?: string } {
    if (!input.title_en?.trim()) {
      return { valid: false, error: 'English title is required' }
    }
    if (!input.title_ne?.trim()) {
      return { valid: false, error: 'Nepali title is required' }
    }
    if (!input.palika_id) {
      return { valid: false, error: 'Palika is required' }
    }
    if (!input.author_id) {
      return { valid: false, error: 'Author is required' }
    }
    if (!input.content?.trim()) {
      return { valid: false, error: 'Content is required' }
    }
    return { valid: true }
  }
}
