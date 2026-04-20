import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFakePalikas } from '@/lib/fake-regions-datasource'

const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const districtIdParam = searchParams.get('district_id')
    const districtId = districtIdParam ? Number(districtIdParam) : undefined

    if (useFake) {
      return NextResponse.json({ data: getFakePalikas(districtId) })
    }

    let query = supabaseAdmin
      .from('palikas')
      .select(`
        id,
        name_en,
        name_ne,
        code,
        district_id,
        center_point
      `)

    if (districtId !== undefined) {
      query = query.eq('district_id', districtId)
    }

    const { data: palikas, error } = await query.order('name_en')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch palikas' }, { status: 500 })
    }

    // Convert PostGIS center_point to lat/lng format
    const formattedPalikas = palikas?.map(palika => ({
      ...palika,
      center_point: palika.center_point
        ? {
            latitude: (palika.center_point as any).coordinates[1], // PostGIS returns [lng, lat]
            longitude: (palika.center_point as any).coordinates[0]
          }
        : null
    })) || []

    return NextResponse.json({ data: formattedPalikas })
  } catch (error) {
    console.error('Error fetching palikas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
