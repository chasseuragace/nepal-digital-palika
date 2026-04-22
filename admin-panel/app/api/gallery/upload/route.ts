import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerFromRequest } from '@/lib/server/session'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('file_type') as string
    const displayName = formData.get('display_name') as string

    if (!file || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, file_type' },
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

    // Get user and their assigned palika from session
    const caller = await getCallerFromRequest(request)

    if (!caller) {
      return NextResponse.json(
        { error: 'Unauthorized - user required' },
        { status: 401 }
      )
    }

    // Determine storage path based on palika assignment
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    let storagePath: string

    if (caller.palika_id) {
      // Palika-scoped upload: palika_palika_id/timestamp_random.ext
      storagePath = `palika_${caller.palika_id}/${timestamp}_${randomStr}.${fileExtension}`
    } else {
      // Generic gallery upload: generic_gallery/timestamp_random.ext
      storagePath = `generic_gallery/${timestamp}_${randomStr}.${fileExtension}`
    }

    // Upload to storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
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
    const assetData: any = {
      file_type: fileType,
      mime_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      display_name: displayName || file.name,
      created_by: caller.id
    }

    // Add palika_id if user has one
    if (caller.palika_id) {
      assetData.palika_id = caller.palika_id
    }

    const { data: asset, error: dbError } = await supabaseAdmin
      .from('assets')
      .insert(assetData)
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
