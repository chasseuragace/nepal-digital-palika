/**
 * Supabase Blog Posts Datasource
 * Real implementation using Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { BlogPost, BlogPostFilters, CreateBlogPostInput, PaginationParams } from '@/services/types'
import { IBlogPostsDatasource } from './blog-posts-datasource'

export class SupabaseBlogPostsDatasource implements IBlogPostsDatasource {
  constructor(private supabase: SupabaseClient) {}

  async getAll(filters?: BlogPostFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('blog_posts')
      .select(
        `*,
        palikas!inner(name_en)`,
        { count: 'exact' }
      )

    if (filters?.palika_id) {
      query = query.eq('palika_id', filters.palika_id)
    }
    if (filters?.author_id) {
      query = query.eq('author_id', filters.author_id)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.ilike('title_en', `%${filters.search}%`)
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: (data || []).map((d: any) => this.mapBlogPost(d)),
      total: count || 0,
      count
    }
  }

  async getById(id: string): Promise<BlogPost | null> {
    const { data, error } = await this.supabase
      .from('blog_posts')
      .select(
        `*,
        palikas!inner(name_en)`
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapBlogPost(data)
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await this.supabase
      .from('blog_posts')
      .select(
        `*,
        palikas!inner(name_en)`
      )
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapBlogPost(data)
  }

  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    const slug = this.generateSlug(input.title_en)

    const postData = {
      ...input,
      slug,
      status: input.status || 'draft',
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('blog_posts')
      .insert(postData)
      .select(
        `*,
        palikas!inner(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapBlogPost(data)
  }

  async update(id: string, input: Partial<CreateBlogPostInput>): Promise<BlogPost> {
    const existing = await this.getById(id)
    if (!existing) throw new Error('Blog post not found')

    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString()
    }

    if (input.title_en && input.title_en !== existing.title_en) {
      updateData.slug = this.generateSlug(input.title_en)
    }

    const { data, error } = await this.supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select(
        `*,
        palikas!inner(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapBlogPost(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('blog_posts').delete().eq('id', id)

    if (error) throw error
    return true
  }

  async getPublished(pagination?: PaginationParams) {
    return this.getAll({ status: 'published' }, pagination)
  }

  async getByAuthor(authorId: string, pagination?: PaginationParams) {
    return this.getAll({ author_id: authorId }, pagination)
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async getByCategory(category: string, pagination?: PaginationParams) {
    return this.getAll({ category }, pagination)
  }

  async getByTags(tags: string[], pagination?: PaginationParams) {
    return this.getAll({ tags }, pagination)
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async publish(id: string): Promise<BlogPost> {
    const post = await this.getById(id)
    if (!post) throw new Error('Blog post not found')

    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<BlogPost> {
    return this.update(id, { status: 'archived' } as any)
  }

  async incrementViewCount(id: string): Promise<void> {
    const post = await this.getById(id)
    if (!post) throw new Error('Blog post not found')

    await this.supabase
      .from('blog_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', id)
  }

  private mapBlogPost(data: any): BlogPost {
    return {
      id: data.id,
      palika_id: data.palika_id,
      author_id: data.author_id,
      display_author_name: data.display_author_name,
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
}
