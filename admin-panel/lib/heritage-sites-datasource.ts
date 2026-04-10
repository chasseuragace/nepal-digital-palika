/**
 * Abstract Heritage Sites Datasource
 * Defines contract for querying/storing heritage sites
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

import { HeritageSite, HeritageSiteFilters, CreateHeritageSiteInput, PaginationParams, PaginatedResponse } from '@/services/types'

export interface IHeritageSitesDatasource {
  // Fetch all heritage sites with optional filtering and pagination
  getAll(filters?: HeritageSiteFilters, pagination?: PaginationParams): Promise<{ data: HeritageSite[]; total: number; count?: number }>

  // Fetch a single heritage site by ID
  getById(id: string): Promise<HeritageSite | null>

  // Fetch a heritage site by slug
  getBySlug(slug: string): Promise<HeritageSite | null>

  // Create a new heritage site
  create(input: CreateHeritageSiteInput): Promise<HeritageSite>

  // Update an existing heritage site
  update(id: string, input: Partial<CreateHeritageSiteInput>): Promise<HeritageSite>

  // Delete a heritage site
  delete(id: string): Promise<boolean>

  // Fetch featured heritage sites
  getFeatured(limit: number): Promise<HeritageSite[]>

  // Fetch heritage sites by palika
  getByPalika(palikaId: number, pagination?: PaginationParams): Promise<{ data: HeritageSite[]; total: number; count?: number }>

  // Search heritage sites
  search(query: string, pagination?: PaginationParams): Promise<{ data: HeritageSite[]; total: number; count?: number }>

  // Increment view count
  incrementViewCount(id: string): Promise<void>

  // Update featured status
  toggleFeatured(id: string): Promise<HeritageSite>

  // Publish a heritage site
  publish(id: string): Promise<HeritageSite>

  // Archive a heritage site
  archive(id: string): Promise<HeritageSite>
}
