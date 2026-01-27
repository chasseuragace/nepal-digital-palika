import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, regionType, regionId } = body

    if (!adminId || !regionType || !regionId) {
      return NextResponse.json(
        { error: 'adminId, regionType, and regionId are required' },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('admin_regions')
      .select('*')
      .eq('admin_id', adminId)
      .eq('region_type', regionType)
      .eq('region_id', regionId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking assignment:', checkError)
      return NextResponse.json({ error: 'Failed to assign admin' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Admin is already assigned to this region' },
        { status: 409 }
      )
    }

    // Create assignment
    const { data: assignment, error } = await supabaseAdmin
      .from('admin_regions')
      .insert([
        {
          admin_id: adminId,
          region_type: regionType,
          region_id: regionId,
          assigned_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error assigning admin:', error)
      return NextResponse.json({ error: 'Failed to assign admin' }, { status: 500 })
    }

    return NextResponse.json({ data: assignment?.[0] }, { status: 201 })
  } catch (error) {
    console.error('Error assigning admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
