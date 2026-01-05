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

export class BlogPostsService {
  private db: DatabaseClient

  constructor(db: DatabaseClient) {
    this.db = db
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
      const offset = (page - 1) * limit

      let query = this.db
        .from('blog_posts')
        .select(`
          *,
          palikas!inner(name_en),
          temp_admin_users!inner(full_name)
        `)

      // Apply filters
      if (filters.palika_id) {
        query = query.eq('palika_id', filters.palika_id)
      }
      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.ilike('title_en', `%${filters.search}%`)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch blog posts' }
      }

      const posts = (data || []).map(this.mapBlogPost)

      return {
        success: true,
        data: {
          data: posts,
          total: count || posts.length,
          page,
          limit,
          hasMore: posts.length === limit
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
      const { data, error } = await this.db
        .from('blog_posts')
        .select(`
          *,
          palikas!inner(name_en),
          temp_admin_users!inner(full_name)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        return { success: false, error: 'Blog post not found' }
      }

      return { success: true, data: this.mapBlogPost(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch blog post' }
    }
  }

  /**
   * Get a blog post by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<BlogPost>> {
    try {
      const { data, error } = await this.db
        .from('blog_posts')
        .select(`
          *,
          palikas!inner(name_en),
          temp_admin_users!inner(full_name)
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return { success: false, error: 'Blog post not found' }
      }

      return { success: true, data: this.mapBlogPost(data) }
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

      // Generate slug
      const slug = this.generateSlug(input.title_en)

      // Prepare data
      const postData = {
        ...input,
        slug,
        status: input.status || 'draft',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.db
        .from('blog_posts')
        .insert(postData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to create blog post' }
      }

      return {
        success: true,
        data: this.mapBlogPost(data),
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
      // Check if post exists
      const existing = await this.getById(id)
      if (!existing.success) {
        return { success: false, error: 'Blog post not found' }
      }

      // Prepare update data
      const updateData: any = {
        ...input,
        updated_at: new Date().toISOString()
      }

      // Update slug if title changed
      if (input.title_en && input.title_en !== existing.data?.title_en) {
        updateData.slug = this.generateSlug(input.title_en)
      }

      const { data, error } = await this.db
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update blog post' }
      }

      return {
        success: true,
        data: this.mapBlogPost(data),
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
      const { error } = await this.db
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message || 'Failed to delete blog post' }
      }

      return { success: true, message: 'Blog post deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete blog post' }
    }
  }

  /**
   * Publish a blog post
   */
  async publish(id: string): Promise<ServiceResponse<BlogPost>> {
    return this.update(id, {
      status: 'published'
    } as any)
  }

  /**
   * Archive a blog post
   */
  async archive(id: string): Promise<ServiceResponse<BlogPost>> {
    return this.update(id, {
      status: 'archived'
    } as any)
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ServiceResponse<void>> {
    try {
      const existing = await this.getById(id)
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Blog post not found' }
      }

      await this.db
        .from('blog_posts')
        .update({ view_count: existing.data.view_count + 1 })
        .eq('id', id)

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
      const { data, error } = await this.db
        .from('blog_posts')
        .select(`
          *,
          palikas!inner(name_en),
          temp_admin_users!inner(full_name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch recent posts' }
      }

      return { success: true, data: (data || []).map(this.mapBlogPost) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch recent posts' }
    }
  }

  /**
   * Get popular blog posts (by view count)
   */
  async getPopular(limit: number = 5): Promise<ServiceResponse<BlogPost[]>> {
    try {
      const { data, error } = await this.db
        .from('blog_posts')
        .select(`
          *,
          palikas!inner(name_en),
          temp_admin_users!inner(full_name)
        `)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch popular posts' }
      }

      return { success: true, data: (data || []).map(this.mapBlogPost) }
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
      const { data, error } = await this.db
        .from('blog_posts')
        .select('category')
        .eq('status', 'published')

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch categories' }
      }

      const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))]
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
      const { data, error } = await this.db
        .from('blog_posts')
        .select('tags')
        .eq('status', 'published')

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch tags' }
      }

      const allTags = (data || []).flatMap(d => d.tags || [])
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

  private mapBlogPost(data: any): BlogPost {
    return {
      id: data.id,
      palika_id: data.palika_id,
      author_id: data.author_id,
      title_en: data.title_en,
      title_ne: data.title_ne,
      slug: data.slug,
      excerpt: data.excerpt,
      excerpt_ne: data.excerpt_ne,
      content: data.content,
      content_ne: data.content_ne,
      featured_image: data.featured_image,
      category: data.category,
      tags: data.tags,
      status: data.status,
      published_at: data.published_at,
      view_count: data.view_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author_name: data.temp_admin_users?.full_name,
      palika_name: data.palikas?.name_en
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

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
