/**
 * Heritage Sites Service
 * Framework-agnostic CRUD operations for heritage sites
 */

import { DatabaseClient } from './database-client'
import {
  HeritageSite,
  HeritageSiteFilters,
  CreateHeritageSiteInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'

export class HeritageSitesService {
  private db: DatabaseClient

  constructor(db: DatabaseClient) {
    this.db = db
  }

  /**
   * Get all heritage sites with optional filtering and pagination
   */
  async getAll(
    filters: HeritageSiteFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
    try {
      const { page = 1, limit = 20 } = pagination
      const offset = (page - 1) * limit

      let query = this.db
        .from('heritage_sites')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)

      // Apply filters
      if (filters.palika_id) {
        query = query.eq('palika_id', filters.palika_id)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.heritage_status) {
        query = query.eq('heritage_status', filters.heritage_status)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured)
      }
      if (filters.search) {
        query = query.ilike('name_en', `%${filters.search}%`)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch heritage sites' }
      }

      const sites = (data || []).map(d => this.mapHeritageSite(d))

      return {
        success: true,
        data: {
          data: sites,
          total: count || sites.length,
          page,
          limit,
          hasMore: sites.length === limit
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch heritage sites' }
    }
  }

  /**
   * Get a single heritage site by ID
   */
  async getById(id: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const { data, error } = await this.db
        .from('heritage_sites')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        return { success: false, error: 'Heritage site not found' }
      }

      return { success: true, data: this.mapHeritageSite(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch heritage site' }
    }
  }

  /**
   * Get a heritage site by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<HeritageSite>> {
    try {
      const { data, error } = await this.db
        .from('heritage_sites')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return { success: false, error: 'Heritage site not found' }
      }

      return { success: true, data: this.mapHeritageSite(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch heritage site' }
    }
  }

  /**
   * Create a new heritage site
   */
  async create(input: CreateHeritageSiteInput): Promise<ServiceResponse<HeritageSite>> {
    try {
      // Validate required fields
      const validation = this.validateInput(input)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate slug
      const slug = this.generateSlug(input.name_en)

      // Prepare data
      const siteData = {
        ...input,
        slug,
        location: input.latitude && input.longitude
          ? `POINT(${input.longitude} ${input.latitude})`
          : null,
        status: input.status || 'draft',
        view_count: 0,
        is_featured: input.is_featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Remove lat/lng as they're now in location
      delete (siteData as any).latitude
      delete (siteData as any).longitude

      const { data, error } = await this.db
        .from('heritage_sites')
        .insert(siteData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to create heritage site' }
      }

      return {
        success: true,
        data: this.mapHeritageSite(data),
        message: 'Heritage site created successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create heritage site' }
    }
  }

  /**
   * Update an existing heritage site
   */
  async update(id: string, input: Partial<CreateHeritageSiteInput>): Promise<ServiceResponse<HeritageSite>> {
    try {
      // Check if site exists
      const existing = await this.getById(id)
      if (!existing.success) {
        return { success: false, error: 'Heritage site not found' }
      }

      // Prepare update data
      const updateData: any = {
        ...input,
        updated_at: new Date().toISOString()
      }

      // Update location if coordinates provided
      if (input.latitude !== undefined && input.longitude !== undefined) {
        updateData.location = `POINT(${input.longitude} ${input.latitude})`
        delete updateData.latitude
        delete updateData.longitude
      }

      // Update slug if name changed
      if (input.name_en && input.name_en !== existing.data?.name_en) {
        updateData.slug = this.generateSlug(input.name_en)
      }

      const { data, error } = await this.db
        .from('heritage_sites')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update heritage site' }
      }

      return {
        success: true,
        data: this.mapHeritageSite(data),
        message: 'Heritage site updated successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to update heritage site' }
    }
  }

  /**
   * Delete a heritage site
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.db
        .from('heritage_sites')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message || 'Failed to delete heritage site' }
      }

      return { success: true, message: 'Heritage site deleted successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to delete heritage site' }
    }
  }

  /**
   * Publish a heritage site
   */
  async publish(id: string): Promise<ServiceResponse<HeritageSite>> {
    return this.update(id, {
      status: 'published'
    } as any)
  }

  /**
   * Archive a heritage site
   */
  async archive(id: string): Promise<ServiceResponse<HeritageSite>> {
    return this.update(id, {
      status: 'archived'
    } as any)
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string): Promise<ServiceResponse<HeritageSite>> {
    const existing = await this.getById(id)
    if (!existing.success || !existing.data) {
      return { success: false, error: 'Heritage site not found' }
    }

    return this.update(id, {
      is_featured: !existing.data.is_featured
    } as any)
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ServiceResponse<void>> {
    try {
      const existing = await this.getById(id)
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Heritage site not found' }
      }

      await this.db
        .from('heritage_sites')
        .update({ view_count: existing.data.view_count + 1 })
        .eq('id', id)

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to increment view count' }
    }
  }

  /**
   * Get featured heritage sites
   */
  async getFeatured(limit: number = 6): Promise<ServiceResponse<HeritageSite[]>> {
    try {
      const { data, error } = await this.db
        .from('heritage_sites')
        .select(`
          *,
          palikas!inner(name_en),
          categories(name_en)
        `)
        .eq('is_featured', true)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch featured sites' }
      }

      return { success: true, data: (data || []).map(d => this.mapHeritageSite(d)) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch featured sites' }
    }
  }

  /**
   * Get heritage sites by palika
   */
  async getByPalika(palikaId: number, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  /**
   * Search heritage sites
   */
  async search(query: string, pagination: PaginationParams = {}): Promise<ServiceResponse<PaginatedResponse<HeritageSite>>> {
    return this.getAll({ search: query }, pagination)
  }

  // Private helper methods

  private mapHeritageSite(data: any): HeritageSite {
    return {
      id: data.id,
      palika_id: data.palika_id,
      name_en: data.name_en,
      name_ne: data.name_ne,
      slug: data.slug,
      category_id: data.category_id,
      site_type: data.site_type,
      heritage_status: data.heritage_status,
      ward_number: data.ward_number,
      address: data.address,
      location: data.location ? this.parseLocation(data.location) : undefined,
      short_description: data.short_description,
      short_description_ne: data.short_description_ne,
      full_description: data.full_description,
      full_description_ne: data.full_description_ne,
      opening_hours: data.opening_hours,
      entry_fee: data.entry_fee,
      featured_image: data.featured_image,
      images: data.images,
      audio_guide_url: data.audio_guide_url,
      accessibility_info: data.accessibility_info,
      best_time_to_visit: data.best_time_to_visit,
      average_visit_duration_minutes: data.average_visit_duration_minutes,
      qr_code_url: data.qr_code_url,
      view_count: data.view_count || 0,
      status: data.status,
      published_at: data.published_at,
      is_featured: data.is_featured || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      palika_name: data.palikas?.name_en,
      category_name: data.categories?.name_en
    }
  }

  private parseLocation(location: any): { lat: number; lng: number } | undefined {
    if (!location) return undefined
    
    // Handle PostGIS geography type
    if (typeof location === 'string' && location.startsWith('POINT')) {
      const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) }
      }
    }
    
    // Handle object format
    if (location.coordinates) {
      return { lng: location.coordinates[0], lat: location.coordinates[1] }
    }
    
    return undefined
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private validateInput(input: CreateHeritageSiteInput): { valid: boolean; error?: string } {
    if (!input.name_en?.trim()) {
      return { valid: false, error: 'English name is required' }
    }
    if (!input.name_ne?.trim()) {
      return { valid: false, error: 'Nepali name is required' }
    }
    if (!input.palika_id) {
      return { valid: false, error: 'Palika is required' }
    }
    if (!input.category_id) {
      return { valid: false, error: 'Category is required' }
    }
    return { valid: true }
  }
}
