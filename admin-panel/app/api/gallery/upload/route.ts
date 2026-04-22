import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

type EntityType = 'blog_post' | 'event' | 'heritage_site' | 'palika' | 'notification'
type FileType = 'image' | 'document'

const VALID_ENTITY_TYPES: EntityType[] = ['blog_post', 'event', 'heritage_site', 'palika', 'notification']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entity_type') as string
    const entityIdStr = formData.get('entity_id') as string
    const fileType = formData.get('file_type') as string
    const displayName = formData.get('display_name') as string

    if (!file || !entityType || !entityIdStr || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, entity_type, entity_id, file_type' },
        { status: 400 }
      )
    }

    const entityId = parseInt(entityIdStr, 10)
    if (isNaN(entityId) || entityId <= 0) {
      return NextResponse.json(
        { error: 'entity_id must be a valid positive integer' },
        { status: 400 }
      )
    }

    if (!VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: `entity_type must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!['image', 'document'].includes(fileType)) {
      return NextResponse.json(
        { error: 'file_type must be either "image" or "document"' },
        { status: 400 }
      )
    }

    const allowedTypes = fileType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate storage path with entity context
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const storagePath = `${entityType}_${entityId}/${timestamp}_${randomStr}.${fileExtension}`

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

    // Create asset record
    const { data: asset, error: dbError } = await supabaseAdmin
      .from('assets')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
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
      console.error('Error creating asset record:', dbError)
      // Try to delete the uploaded file
      await supabaseAdmin.storage
        .from('palika-gallery')
        .remove([storagePath])

      return NextResponse.json(
        { error: 'Failed to create asset record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      asset: {
        ...asset,
        public_url: publicUrlData.publicUrl
      }
    })
  } catch (error) {
    console.error('Error in POST /api/gallery/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
