import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Fetch provinces with their districts and palikas
    const { data: provinces, error: provError } = await supabaseAdmin
      .from('provinces')
      .select('id, name, name_ne, code')
      .order('name')

    if (provError) {
      console.error('Error fetching provinces:', provError)
      return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
    }

    // Fetch districts
    const { data: districts, error: distError } = await supabaseAdmin
      .from('districts')
      .select('id, province_id, name, name_ne, code')
      .order('name')

    if (distError) {
      console.error('Error fetching districts:', distError)
      return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 })
    }

    // Fetch palikas
    const { data: palikas, error: palError } = await supabaseAdmin
      .from('palikas')
      .select('id, district_id, name, name_ne, code, type')
      .order('name')

    if (palError) {
      console.error('Error fetching palikas:', palError)
      return NextResponse.json({ error: 'Failed to fetch palikas' }, { status: 500 })
    }

    // Fetch admin assignments
    const { data: adminRegions, error: adminError } = await supabaseAdmin
      .from('admin_regions')
      .select('id, admin_id, region_type, region_id, assigned_at, admin_users(id, full_name, role)')

    if (adminError) {
      console.error('Error fetching admin regions:', adminError)
      return NextResponse.json({ error: 'Failed to fetch admin assignments' }, { status: 500 })
    }

    // Build hierarchical structure
    const hierarchyData = (provinces || []).map(province => ({
      ...province,
      type: 'province',
      admins: (adminRegions || []).filter(ar => ar.region_type === 'province' && ar.region_id === province.id),
      districts: (districts || [])
        .filter(d => d.province_id === province.id)
        .map(district => ({
          ...district,
          type: 'district',
          admins: (adminRegions || []).filter(ar => ar.region_type === 'district' && ar.region_id === district.id),
          palikas: (palikas || [])
            .filter(p => p.district_id === district.id)
            .map(palika => ({
              ...palika,
              type: 'palika',
              admins: (adminRegions || []).filter(ar => ar.region_type === 'palika' && ar.region_id === palika.id)
            }))
        }))
    }))

    return NextResponse.json({
      data: hierarchyData
    })
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
