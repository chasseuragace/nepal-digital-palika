import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const fileTypeParam = request.nextUrl.searchParams.get('file_type') // 'image' or 'document'
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('palika_gallery')
      .select('*')
      .eq('palika_id', palikaId)
      .order('sort_order', { ascending: true })

    if (fileTypeParam) {
      query = query.eq('file_type', fileTypeParam)
    }

    const { data: gallery, error } = await query

    if (error) {
      console.error('Error fetching palika gallery:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gallery' },
        { status: 500 }
      )
    }

    return NextResponse.json({ gallery: gallery || [] })
  } catch (error) {
    console.error('Error in GET /api/palika-gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const palikaIdHeader = request.headers.get('X-Palika-ID')
    const palikaId = palikaIdHeader ? parseInt(palikaIdHeader, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'X-Palika-ID header is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.file_name || !body.file_type || !body.mime_type || !body.storage_path) {
      return NextResponse.json(
        { error: 'Missing required fields: file_name, file_type, mime_type, storage_path' },
        { status: 400 }
      )
    }

    if (!['image', 'document'].includes(body.file_type)) {
      return NextResponse.json(
        { error: 'file_type must be either "image" or "document"' },
        { status: 400 }
      )
    }

    // Get current admin user
    const adminSession = request.headers.get('X-Admin-ID')
    const uploadedBy = adminSession || null

    // Insert gallery item
    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('palika_gallery')
      .insert({
        palika_id: palikaId,
        file_name: body.file_name,
        file_type: body.file_type,
        mime_type: body.mime_type,
        file_size: body.file_size || 0,
        storage_path: body.storage_path,
        display_name: body.display_name || body.file_name,
        description: body.description || '',
        is_featured: body.is_featured || false,
        sort_order: body.sort_order || 0,
        uploaded_by: uploadedBy
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating gallery item:', insertError)
      return NextResponse.json(
        { error: 'Failed to create gallery item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      gallery_item: galleryItem
    })
  } catch (error) {
    console.error('Error in POST /api/palika-gallery:', error)
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
        { error: 'Gallery item id is required' },
        { status: 400 }
      )
    }

    // Update gallery item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('palika_gallery')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating gallery item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update gallery item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      gallery_item: updatedItem
    })
  } catch (error) {
    console.error('Error in PUT /api/palika-gallery:', error)
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
        { error: 'Gallery item id is required' },
        { status: 400 }
      )
    }

    // Get the gallery item to get storage path
    const { data: galleryItem, error: fetchError } = await supabaseAdmin
      .from('palika_gallery')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !galleryItem) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('palika-gallery')
      .remove([galleryItem.storage_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue anyway - delete from database
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('palika_gallery')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting gallery item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete gallery item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery item deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/palika-gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
