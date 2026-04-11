/**
 * Supabase Events Datasource
 * Real implementation using Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Event, EventFilters, CreateEventInput, PaginationParams } from '@/services/types'
import { IEventsDatasource } from './events-datasource'

export class SupabaseEventsDatasource implements IEventsDatasource {
  constructor(private supabase: SupabaseClient) {}

  async getAll(filters?: EventFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('events')
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
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type)
    }
    if (filters?.is_festival !== undefined) {
      query = query.eq('is_festival', filters.is_festival)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }
    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }
    if (filters?.search) {
      query = query.ilike('name_en', `%${filters.search}%`)
    }

    const { data, error, count } = await query
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: (data || []).map((d: any) => this.mapEvent(d)),
      total: count || 0,
      count
    }
  }

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapEvent(data)
  }

  async getBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
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

    return this.mapEvent(data)
  }

  async create(input: CreateEventInput): Promise<Event> {
    // Validate required fields
    if (!input.start_date || !input.end_date) {
      throw new Error('Start date and end date are required for events')
    }

    const slug = this.generateSlug(input.name_en)

    const eventData = {
      ...input,
      slug,
      location:
        input.latitude && input.longitude
          ? `POINT(${input.longitude} ${input.latitude})`
          : null,
      status: input.status || 'draft',
      is_festival: input.is_festival || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    delete (eventData as any).latitude
    delete (eventData as any).longitude

    const { data, error } = await this.supabase
      .from('events')
      .insert(eventData)
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapEvent(data)
  }

  async update(id: string, input: Partial<CreateEventInput>): Promise<Event> {
    const existing = await this.getById(id)
    if (!existing) throw new Error('Event not found')

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
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .single()

    if (error) throw error

    return this.mapEvent(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('events').delete().eq('id', id)

    if (error) throw error
    return true
  }

  async getUpcoming(limit: number = 10): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('events')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .gte('start_date', today)
      .eq('status', 'published')
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data || []).map((d: any) => this.mapEvent(d))
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async getFestivals(palikaId?: number): Promise<Event[]> {
    let query = this.supabase
      .from('events')
      .select(
        `*,
        palikas!inner(name_en),
        categories(name_en)`
      )
      .eq('is_festival', true)
      .eq('status', 'published')

    if (palikaId) {
      query = query.eq('palika_id', palikaId)
    }

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) throw error

    return (data || []).map((d: any) => this.mapEvent(d))
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async publish(id: string): Promise<Event> {
    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<Event> {
    return this.update(id, { status: 'archived' } as any)
  }

  private mapEvent(data: any): Event {
    return {
      id: data.id,
      palika_id: data.palika_id,
      name_en: data.name_en,
      name_ne: data.name_ne,
      slug: data.slug,
      category_id: data.category_id,
      event_type: data.event_type,
      is_festival: data.is_festival || false,
      nepali_calendar_date: data.nepali_calendar_date,
      recurrence_pattern: data.recurrence_pattern,
      start_date: data.start_date,
      end_date: data.end_date,
      location: data.location ? this.parseLocation(data.location) : undefined,
      venue_name: data.venue_name,
      short_description: data.short_description,
      short_description_ne: data.short_description_ne,
      full_description: data.full_description,
      full_description_ne: data.full_description_ne,
      featured_image: data.featured_image,
      images: data.images,
      status: data.status,
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
