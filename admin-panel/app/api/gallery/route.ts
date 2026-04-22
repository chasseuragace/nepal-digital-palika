import { NextRequest, NextResponse } from 'next/server'
import { getGalleryDatasource } from '@/lib/gallery-config'
import { supabaseAdmin } from '@/lib/supabase'

type FileType = 'image' | 'document'

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const fileTypeParam = request.nextUrl.searchParams.get('file_type')
    const genericGalleryParam = request.nextUrl.searchParams.get('generic_gallery')

    // Determine query mode
    const hasPalikaId = palikaIdParam !== null
    const isGenericGallery = genericGalleryParam === 'true'

    // Validate inputs
    if (hasPalikaId) {
      const palikaId = parseInt(palikaIdParam!, 10)
      if (isNaN(palikaId)) {
        return NextResponse.json(
          { error: 'palika_id must be a valid integer' },
          { status: 400 }
        )
      }
    }

    // Build filters object
    const filters: any = {}
    if (hasPalikaId) {
      filters.palika_id = parseInt(palikaIdParam!, 10)
    } else if (isGenericGallery) {
      filters.generic_gallery = true
    } else {
      // No valid query mode specified
      return NextResponse.json(
        { error: 'Either palika_id or generic_gallery=true is required' },
        { status: 400 }
      )
    }

    // Apply file type filter if specified
    if (fileTypeParam) {
      filters.file_type = fileTypeParam as FileType
    }

    const datasource = getGalleryDatasource()
    const assets = await datasource.getAssets(filters)

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error in GET /api/gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, is_featured, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Asset id is required' },
        { status: 400 }
      )
    }

    const datasource = getGalleryDatasource()
    const updatedAsset = await datasource.updateAsset(id, updateData, is_featured)

    return NextResponse.json({
      success: true,
      asset: updatedAsset
    })
  } catch (error) {
    console.error('Error in PUT /api/gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Asset id is required' },
        { status: 400 }
      )
    }

    const { data: asset, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from('palika-gallery')
      .remove([asset.storage_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
    }

    const { error: deleteError } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting asset:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete asset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
