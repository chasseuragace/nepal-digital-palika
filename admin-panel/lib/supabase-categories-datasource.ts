/**
 * Supabase Categories Datasource
 * Real implementation using Supabase client
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Category, CategoriesFilter, ICategoriesDatasource } from './categories-datasource'

export class SupabaseCategoriesDatasource implements ICategoriesDatasource {
  constructor(private supabase: SupabaseClient) {}

  async getAll(filter?: CategoriesFilter): Promise<Category[]> {
    let query = this.supabase.from('categories').select('*')

    if (filter?.entity_type) {
      query = query.eq('entity_type', filter.entity_type)
    }

    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active)
    }

    const { data, error } = await query.order('display_order', { nullsFirst: false }).order('name')

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    return data || []
  }

  async getByEntityType(entityType: string): Promise<Category[]> {
    return this.getAll({ entity_type: entityType })
  }

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to fetch category: ${error.message}`)
    }

    return data
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to fetch category: ${error.message}`)
    }

    return data
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`)
    }

    return data
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`)
    }

    return data
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`)
    }

    return true
  }
}
