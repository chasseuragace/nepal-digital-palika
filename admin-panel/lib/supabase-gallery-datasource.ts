/**
 * Supabase Gallery Datasource
 * Handles GET (query) and PUT (update) operations for assets
 * Upload and Delete operations involve file storage and are kept in API routes
 */

import { IGalleryDatasource, Asset, GalleryFilters } from './gallery-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseGalleryDatasource implements IGalleryDatasource {
  constructor(private db: SupabaseClient) {}

  async getAssets(filters: GalleryFilters): Promise<Asset[]> {
    let query = this.db
      .from('assets')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    // Apply filters based on query mode
    if (filters.palika_id !== undefined) {
      // Palika-scoped query
      query = query.eq('palika_id', filters.palika_id)
    } else if (filters.generic_gallery) {
      // Generic gallery query (no palika)
      query = query.is('palika_id', null)
    } else {
      // No valid query mode specified
      throw new Error('Either palika_id or generic_gallery=true is required')
    }

    // Apply file type filter if specified
    if (filters.file_type) {
      query = query.eq('file_type', filters.file_type)
    }

    const { data: assets, error } = await query

    if (error) {
      console.error('Error fetching assets:', error)
      throw new Error('Failed to fetch assets')
    }

    return assets || []
  }

  async updateAsset(id: number, updateData: Partial<Asset>, is_featured?: boolean): Promise<Asset> {
    // Handle is_featured logic: if setting this asset as featured,
    // unset featured for all other assets in the same palika/context
    if (is_featured) {
      // Get the current asset to find its palika_id
      const { data: asset } = await this.db
        .from('assets')
        .select('palika_id')
        .eq('id', id)
        .single()

      if (asset?.palika_id) {
        // Unset featured for all other assets of the same palika
        await this.db
          .from('assets')
          .update({ is_featured: false })
          .eq('palika_id', asset.palika_id)
          .eq('file_type', 'image')
      }
    }

    const { data: updatedAsset, error: updateError } = await this.db
      .from('assets')
      .update({
        ...updateData,
        is_featured: is_featured || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating asset:', updateError)
      throw new Error('Failed to update asset')
    }

    return updatedAsset
  }
}
