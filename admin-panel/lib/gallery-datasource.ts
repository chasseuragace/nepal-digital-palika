/**
 * Abstract Gallery Datasource
 * Note: Upload and Delete operations involve file storage and are kept in API routes
 * This datasource handles GET (query) and PUT (update) operations for assets
 */

export interface Asset {
  id: number
  file_type: 'image' | 'document'
  mime_type: string
  file_size: number
  storage_path: string
  public_url: string
  display_name: string
  palika_id?: number
  is_featured: boolean
  sort_order?: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface GalleryFilters {
  palika_id?: number | null
  file_type?: 'image' | 'document'
  generic_gallery?: boolean
}

export interface IGalleryDatasource {
  getAssets(filters: GalleryFilters): Promise<Asset[]>
  updateAsset(id: number, updateData: Partial<Asset>, is_featured?: boolean): Promise<Asset>
}
