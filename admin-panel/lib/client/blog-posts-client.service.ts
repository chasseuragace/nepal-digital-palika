/**
 * Blog Posts Client Service
 * Abstracts API calls for blog posts from UI components
 * Provides a clean interface for pages to fetch/manage blog posts
 */

export interface BlogPost {
  id: string
  title_en: string
  title_ne: string
  slug: string
  status: string
  author_name?: string
  created_at: string
  published_at?: string
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
  async create(post: Partial<BlogPost>): Promise<BlogPost> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })

    if (!response.ok) {
      throw new Error('Failed to create blog post')
    }

    return response.json()
  }

  /**
   * Update a blog post
   */
  async update(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update blog post')
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
