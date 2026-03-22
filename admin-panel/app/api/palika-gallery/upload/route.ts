import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const palikaId = formData.get('palika_id') as string
    const fileType = formData.get('file_type') as string // 'image' or 'document'
    const displayName = formData.get('display_name') as string

    // Validate inputs
    if (!file || !palikaId || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, palika_id, file_type' },
        { status: 400 }
      )
    }

    if (!['image', 'document'].includes(fileType)) {
      return NextResponse.json(
        { error: 'file_type must be either "image" or "document"' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = fileType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate storage path
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const storagePath = `palika_${palikaId}/${timestamp}_${randomStr}.${fileExtension}`

    // Upload to storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
      .from('palika-gallery')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('palika-gallery')
      .getPublicUrl(storagePath)

    // Create gallery record
    const { data: galleryItem, error: dbError } = await supabaseAdmin
      .from('palika_gallery')
      .insert({
        palika_id: parseInt(palikaId, 10),
        file_name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        display_name: displayName || file.name,
        description: '',
        is_featured: false,
        sort_order: 0
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating gallery record:', dbError)
      // Try to delete the uploaded file
      await supabaseAdmin.storage
        .from('palika-gallery')
        .remove([storagePath])
      
      return NextResponse.json(
        { error: 'Failed to create gallery record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      gallery_item: {
        ...galleryItem,
        public_url: publicUrlData.publicUrl
      }
    })
  } catch (error) {
    console.error('Error in POST /api/palika-gallery/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
