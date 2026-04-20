import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)

    if (useFake) {
      const { getFakePalikas } = await import('@/lib/fake-regions-datasource')
      const palikas = getFakePalikas()
      const palika = palikas.find(p => p.id === id)
      
      if (!palika) {
        return NextResponse.json({ error: 'Palika not found' }, { status: 404 })
      }
      
      return NextResponse.json(palika)
    }

    const { data: palika, error } = await supabaseAdmin
      .from('palikas')
      .select(`
        id,
        name_en,
        name_ne,
        code,
        district_id,
        center_point
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch palika' }, { status: 500 })
    }

    if (!palika) {
      return NextResponse.json({ error: 'Palika not found' }, { status: 404 })
    }

    // Convert PostGIS center_point to lat/lng format
    const formattedPalika = {
      ...palika,
      center_point: palika.center_point
        ? {
            latitude: (palika.center_point as any).coordinates[1], // PostGIS returns [lng, lat]
            longitude: (palika.center_point as any).coordinates[0]
          }
        : null
    }

    return NextResponse.json(formattedPalika)
  } catch (error) {
    console.error('Error fetching palika:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
