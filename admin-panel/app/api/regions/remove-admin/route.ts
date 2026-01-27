import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminRegionId } = body

    if (!adminRegionId) {
      return NextResponse.json(
        { error: 'adminRegionId is required' },
        { status: 400 }
      )
    }

    // Delete assignment
    const { error } = await supabaseAdmin
      .from('admin_regions')
      .delete()
      .eq('id', adminRegionId)

    if (error) {
      console.error('Error removing admin:', error)
      return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
