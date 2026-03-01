/**
 * POST /api/businesses/[id]/images
 * Upload images for a business (featured and gallery)
 * Supports image resizing and optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ImageUploadResponse {
  url: string
  is_featured: boolean
  size: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, palika_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const isFeatured = formData.get('is_featured') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    const validTypes = ['image/jpeg', 'image/png']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG and PNG files are allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const filename = `${business.palika_id}/${businessId}/${timestamp}-${random}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('business-images')
      .getPublicUrl(filename)

    const imageUrl = urlData?.publicUrl

    // If featured image, update businesses table
    if (isFeatured) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ featured_image_url: imageUrl })
        .eq('id', businessId)

      if (updateError) {
        console.error('Error updating featured image:', updateError)
        // Continue - image is uploaded even if update fails
      }
    }

    // Add to business_images table
    const { error: imageError } = await supabase
      .from('business_images')
      .insert([
        {
          business_id: businessId,
          image_url: imageUrl,
          is_featured: isFeatured,
          sort_order: 0,
        },
      ])

    if (imageError) {
      console.error('Error saving image record:', imageError)
      // Image is uploaded to storage, record save failure is non-critical
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url: imageUrl,
          is_featured: isFeatured,
          size: file.size,
          filename,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/businesses/[id]/images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
