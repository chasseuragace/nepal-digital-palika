/**
 * Abstract Blog Posts Datasource
 * Defines contract for querying/storing blog posts
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

import { BlogPost, BlogPostFilters, CreateBlogPostInput, PaginationParams } from '@/services/types'

export interface IBlogPostsDatasource {
  // Fetch all blog posts with optional filtering and pagination
  getAll(filters?: BlogPostFilters, pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Fetch a single blog post by ID
  getById(id: string): Promise<BlogPost | null>

  // Fetch a blog post by slug
  getBySlug(slug: string): Promise<BlogPost | null>

  // Create a new blog post
  create(input: CreateBlogPostInput): Promise<BlogPost>

  // Update an existing blog post
  update(id: string, input: Partial<CreateBlogPostInput>): Promise<BlogPost>

  // Delete a blog post
  delete(id: string): Promise<boolean>

  // Fetch published blog posts
  getPublished(pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Fetch blog posts by author
  getByAuthor(authorId: string, pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Fetch blog posts by palika
  getByPalika(palikaId: number, pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Fetch blog posts by category
  getByCategory(category: string, pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Fetch blog posts by tags
  getByTags(tags: string[], pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Search blog posts
  search(query: string, pagination?: PaginationParams): Promise<{ data: BlogPost[]; total: number; count?: number }>

  // Publish a blog post
  publish(id: string): Promise<BlogPost>

  // Archive a blog post
  archive(id: string): Promise<BlogPost>

  // Increment view count
  incrementViewCount(id: string): Promise<void>
}
