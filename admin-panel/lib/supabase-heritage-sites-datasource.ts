/**
 * Supabase Heritage Sites Datasource
 * Real implementation using Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { HeritageSite, HeritageSiteFilters, CreateHeritageSiteInput, PaginationParams } from '@/services/types'
import { IHeritageSitesDatasource } from './heritage-sites-datasource'

export class SupabaseHeritageSitesDatasource implements IHeritageSitesDatasource {
  constructor(private supabase: SupabaseClient) {}

  async getAll(filters?: HeritageSiteFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('heritage_sites')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`,
        { count: 'exact' }
      )

    if (filters?.palika_id) {
      query = query.eq('palika_id', filters.palika_id)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.heritage_status) {
      query = query.eq('heritage_status', filters.heritage_status)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }
    if (filters?.search) {
      query = query.ilike('name_en', `%${filters.search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: (data || []).map((d: any) => this.mapHeritageSite(d)),
      total: count || 0,
      count
    }
  }

  async getById(id: string): Promise<HeritageSite | null> {
    const { data, error } = await this.supabase
      .from('heritage_sites')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return this.mapHeritageSite(data)
  }

  async getBySlug(slug: string): Promise<HeritageSite | null> {
    const { data, error } = await this.supabase
      .from('heritage_sites')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapHeritageSite(data)
  }

  async create(input: CreateHeritageSiteInput): Promise<HeritageSite> {
    // Validate required location field (NOT NULL in DB)
    if (!input.latitude || !input.longitude) {
      throw new Error('Location (latitude and longitude) is required for heritage sites')
    }

    const slug = this.generateSlug(input.name_en)

    const siteData = {
      ...input,
      slug,
      location: `POINT(${input.longitude} ${input.latitude})`,
      status: input.status || 'draft',
      view_count: 0,
      is_featured: input.is_featured || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    delete (siteData as any).latitude
    delete (siteData as any).longitude

    const { data, error } = await this.supabase
      .from('heritage_sites')
      .insert(siteData)
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapHeritageSite(data)
  }

  async update(id: string, input: Partial<CreateHeritageSiteInput>): Promise<HeritageSite> {
    const existing = await this.getById(id)
    if (!existing) throw new Error('Heritage site not found')

    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString()
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      updateData.location = `POINT(${input.longitude} ${input.latitude})`
      delete updateData.latitude
      delete updateData.longitude
    }

    if (input.name_en && input.name_en !== existing.name_en) {
      updateData.slug = this.generateSlug(input.name_en)
    }

    const { data, error } = await this.supabase
      .from('heritage_sites')
      .update(updateData)
      .eq('id', id)
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapHeritageSite(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('heritage_sites')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  async getFeatured(limit: number = 6): Promise<HeritageSite[]> {
    const { data, error } = await this.supabase
      .from('heritage_sites')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((d: any) => this.mapHeritageSite(d))
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async incrementViewCount(id: string): Promise<void> {
    const existing = await this.getById(id)
    if (!existing) throw new Error('Heritage site not found')

    await this.supabase
      .from('heritage_sites')
      .update({ view_count: existing.view_count + 1 })
      .eq('id', id)
  }

  async toggleFeatured(id: string): Promise<HeritageSite> {
    const existing = await this.getById(id)
    if (!existing) throw new Error('Heritage site not found')

    return this.update(id, { is_featured: !existing.is_featured } as any)
  }

  async publish(id: string): Promise<HeritageSite> {
    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<HeritageSite> {
    return this.update(id, { status: 'archived' } as any)
  }

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

    if (typeof location === 'string' && location.startsWith('POINT')) {
      const match = location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) }
      }
    }

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
}
