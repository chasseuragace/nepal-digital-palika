/**
 * Blog Posts Client Service
 * Abstracts API calls for blog posts from UI components
 * Provides a clean interface for pages to fetch/manage blog posts
 */

export interface BlogPost {
  id: string
  palika_id?: number
  author_id?: string
  display_author_name?: string
  title_en: string
  title_ne: string
  slug: string
  excerpt?: string
  excerpt_ne?: string
  content?: string
  content_ne?: string
  featured_image?: string
  category?: string
  tags?: string[]
  status: string
  palika_name?: string
  created_at: string
  updated_at?: string
  published_at?: string
  view_count?: number
}

export interface BlogPostPayload {
  title_en: string
  title_ne: string
  palika_id: number
  author_id: string
  display_author_name?: string
  slug?: string
  excerpt?: string
  excerpt_ne?: string
  content: string
  content_ne?: string
  featured_image?: string
  category?: string
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
}

export interface BlogPostsResponse {
  data: BlogPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

class BlogPostsClientService {
  private baseUrl = '/api/blog-posts'

  /**
   * Fetch all blog posts with optional filters
   */
  async getAll(
    filters?: {
      status?: string
      author_id?: string
      palika_id?: number
      search?: string
    },
    pagination?: {
      page?: number
      limit?: number
    }
  ): Promise<BlogPostsResponse> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.author_id) params.append('author_id', filters.author_id)
    if (filters?.palika_id) params.append('palika_id', filters.palika_id.toString())
    if (filters?.search) params.append('search', filters.search)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.limit) params.append('limit', pagination.limit.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch blog posts')
    }

    const result = await response.json()
    // Handle both direct array and paginated response
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length,
        hasMore: false
      }
    }

    return result
  }

  /**
   * Fetch a single blog post by ID
   */
  async getById(id: string): Promise<BlogPost> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch blog post')
    }

    return response.json()
  }

  /**
   * Create a new blog post
   */
  async create(post: BlogPostPayload): Promise<BlogPost> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to create blog post')
    }

    return response.json()
  }

  /**
   * Update a blog post
   */
  async update(id: string, updates: Partial<BlogPostPayload>): Promise<BlogPost> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to update blog post')
    }

    return response.json()
  }

  /**
   * Delete a blog post
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete blog post')
    }
  }
}

export const blogPostsService = new BlogPostsClientService()
