import { NextRequest, NextResponse } from 'next/server'
import { getPalikaProfileDatasource } from '@/lib/palika-profile-config'

const datasource = getPalikaProfileDatasource()

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

    // Fetch palika profile using datasource
    const profile = await datasource.getByPalikaId(palikaId)

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

    // Upsert profile using datasource (creates or updates)
    const profile = await datasource.upsert(palikaId, body)

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    console.error('Error in PUT /api/palika-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
