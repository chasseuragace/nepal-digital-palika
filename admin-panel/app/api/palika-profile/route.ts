import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Fetch palika profile
    const { data: profile, error } = await supabaseAdmin
      .from('palika_profiles')
      .select('*')
      .eq('palika_id', palikaId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Error fetching palika profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch palika profile' },
        { status: 500 }
      )
    }

    // If no profile exists, return empty profile structure
    if (!profile) {
      return NextResponse.json({
        profile: {
          id: null,
          palika_id: palikaId,
          description_en: '',
          description_ne: '',
          featured_image: '',
          gallery_images: [],
          highlights: [],
          tourism_info: {
            best_time_to_visit: '',
            accessibility: '',
            languages: [],
            currency: 'NPR'
          },
          demographics: {
            population: 0,
            area_sq_km: 0,
            established_year: 0
          },
          videos: []
        }
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/palika-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    if (!body.description_en && !body.description_ne) {
      return NextResponse.json(
        { error: 'At least one description is required' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('palika_profiles')
      .select('id')
      .eq('palika_id', palikaId)
      .single()

    let result

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('palika_profiles')
        .update({
          description_en: body.description_en || '',
          description_ne: body.description_ne || '',
          featured_image: body.featured_image || '',
          gallery_images: body.gallery_images || [],
          highlights: body.highlights || [],
          tourism_info: body.tourism_info || {},
          demographics: body.demographics || {},
          videos: body.videos || [],
          updated_at: new Date().toISOString()
        })
        .eq('palika_id', palikaId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating palika profile:', updateError)
        return NextResponse.json(
          { error: 'Failed to update palika profile' },
          { status: 500 }
        )
      }

      result = updatedProfile
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('palika_profiles')
        .insert({
          palika_id: palikaId,
          description_en: body.description_en || '',
          description_ne: body.description_ne || '',
          featured_image: body.featured_image || '',
          gallery_images: body.gallery_images || [],
          highlights: body.highlights || [],
          tourism_info: body.tourism_info || {},
          demographics: body.demographics || {},
          videos: body.videos || []
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating palika profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create palika profile' },
          { status: 500 }
        )
      }

      result = newProfile
    }

    return NextResponse.json({
      success: true,
      profile: result
    })
  } catch (error) {
    console.error('Error in PUT /api/palika-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
