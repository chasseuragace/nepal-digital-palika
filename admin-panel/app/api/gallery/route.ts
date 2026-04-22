import { NextRequest, NextResponse } from 'next/server'
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

    // Build query based on parameters
    let query = supabaseAdmin
      .from('assets')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    // Apply filters based on query mode
    if (hasPalikaId) {
      // Palika-scoped query
      const palikaId = parseInt(palikaIdParam!, 10)
      query = query.eq('palika_id', palikaId)
    } else if (isGenericGallery) {
      // Generic gallery query (no palika)
      query = query.is('palika_id', null)
    } else {
      // No valid query mode specified
      return NextResponse.json(
        { error: 'Either palika_id or generic_gallery=true is required' },
        { status: 400 }
      )
    }

    // Apply file type filter if specified
    if (fileTypeParam) {
      query = query.eq('file_type', fileTypeParam)
    }

    const { data: assets, error } = await query

    if (error) {
      console.error('Error fetching assets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assets: assets || [] })
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

    // Handle is_featured logic: if setting this asset as featured, 
    // unset featured for all other assets in the same palika/context
    if (is_featured) {
      // Get the current asset to find its palika_id
      const { data: asset } = await supabaseAdmin
        .from('assets')
        .select('palika_id')
        .eq('id', id)
        .single()

      if (asset?.palika_id) {
        // Unset featured for all other assets of the same palika
        await supabaseAdmin
          .from('assets')
          .update({ is_featured: false })
          .eq('palika_id', asset.palika_id)
          .eq('file_type', 'image')
      }
    }

    const { data: updatedAsset, error: updateError } = await supabaseAdmin
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
      return NextResponse.json(
        { error: 'Failed to update asset' },
        { status: 500 }
      )
    }

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
