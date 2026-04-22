import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type EntityType = 'blog_post' | 'event' | 'heritage_site' | 'palika' | 'notification'
type FileType = 'image' | 'document'

export async function GET(request: NextRequest) {
  try {
    const entityTypeParam = request.nextUrl.searchParams.get('entity_type')
    const entityIdParam = request.nextUrl.searchParams.get('entity_id')
    const fileTypeParam = request.nextUrl.searchParams.get('file_type')

    if (!entityTypeParam || !entityIdParam) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      )
    }

    const entityId = parseInt(entityIdParam, 10)
    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'entity_id must be a valid integer' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('assets')
      .select('*')
      .eq('entity_type', entityTypeParam)
      .eq('entity_id', entityId)
      .order('sort_order', { ascending: true })

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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Asset id is required' },
        { status: 400 }
      )
    }

    const { data: updatedAsset, error: updateError } = await supabaseAdmin
      .from('assets')
      .update({
        ...updateData,
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
