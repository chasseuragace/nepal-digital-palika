/**
 * Fake Gallery Datasource
 * Mock implementation for development and testing
 * Handles GET (query) and PUT (update) operations for assets
 */

import { IGalleryDatasource, Asset, GalleryFilters } from './gallery-datasource'

export class FakeGalleryDatasource implements IGalleryDatasource {
  private assets: Asset[] = [
    {
      id: 1,
      file_type: 'image',
      mime_type: 'image/jpeg',
      file_size: 1024000,
      storage_path: 'palika_1/123456_abc123.jpg',
      public_url: 'https://example.com/image1.jpg',
      display_name: 'Heritage Site Image',
      palika_id: 1,
      is_featured: true,
      sort_order: 1,
      created_by: 'fake-admin-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      file_type: 'image',
      mime_type: 'image/png',
      file_size: 512000,
      storage_path: 'palika_1/123457_def456.png',
      public_url: 'https://example.com/image2.png',
      display_name: 'Event Photo',
      palika_id: 1,
      is_featured: false,
      sort_order: 2,
      created_by: 'fake-admin-1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: 3,
      file_type: 'document',
      mime_type: 'application/pdf',
      file_size: 2048000,
      storage_path: 'generic_gallery/123458_ghi789.pdf',
      public_url: 'https://example.com/document1.pdf',
      display_name: 'Policy Document',
      palika_id: null,
      is_featured: false,
      sort_order: 1,
      created_by: 'fake-admin-1',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ]

  async getAssets(filters: GalleryFilters): Promise<Asset[]> {
    await this.delay(100)

    let filteredAssets = [...this.assets]

    // Apply filters based on query mode
    if (filters.palika_id !== undefined) {
      // Palika-scoped query
      filteredAssets = filteredAssets.filter(a => a.palika_id === filters.palika_id)
    } else if (filters.generic_gallery) {
      // Generic gallery query (no palika)
      filteredAssets = filteredAssets.filter(a => a.palika_id === null)
    } else {
      // No valid query mode specified
      throw new Error('Either palika_id or generic_gallery=true is required')
    }

    // Apply file type filter if specified
    if (filters.file_type) {
      filteredAssets = filteredAssets.filter(a => a.file_type === filters.file_type)
    }

    // Sort by featured, then sort_order, then created_at
    filteredAssets.sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return b.is_featured ? 1 : -1
      }
      if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filteredAssets
  }

  async updateAsset(id: number, updateData: Partial<Asset>, is_featured?: boolean): Promise<Asset> {
    await this.delay(50)

    const assetIndex = this.assets.findIndex(a => a.id === id)
    if (assetIndex === -1) {
      throw new Error('Asset not found')
    }

    const asset = this.assets[assetIndex]

    // Handle is_featured logic
    if (is_featured && asset.palika_id) {
      // Unset featured for all other assets of the same palika
      this.assets = this.assets.map(a =>
        a.palika_id === asset.palika_id && a.id !== id && a.file_type === 'image'
          ? { ...a, is_featured: false }
          : a
      )
    }

    // Update the asset
    const updatedAsset = {
      ...asset,
      ...updateData,
      is_featured: is_featured || asset.is_featured,
      updated_at: new Date().toISOString()
    }

    this.assets[assetIndex] = updatedAsset
    return updatedAsset
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
