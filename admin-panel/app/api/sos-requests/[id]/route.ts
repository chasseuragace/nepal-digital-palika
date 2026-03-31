import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch the request
    const { data: sosRequest, error } = await supabaseAdmin
      .from('sos_requests')
      .select('*, palikas!inner(name_en)')
      .eq('id', params.id)
      .single()

    if (error || !sosRequest) {
      return NextResponse.json({ error: 'SOS request not found' }, { status: 404 })
    }

    // Fetch assignments with provider details
    const { data: assignments } = await supabaseAdmin
      .from('sos_request_assignments')
      .select('*, service_providers!inner(name_en, service_type, phone, status)')
      .eq('sos_request_id', params.id)
      .order('assigned_at', { ascending: false })

    return NextResponse.json({
      ...sosRequest,
      assignments: assignments || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Status transition
    if (body.status) {
      updateData.status = body.status
      updateData.status_updated_at = new Date().toISOString()

      if (body.status === 'reviewing' && body.admin_id) {
        updateData.reviewed_at = new Date().toISOString()
        updateData.reviewed_by = body.admin_id
      }
      if (body.status === 'assigned' && body.admin_id) {
        updateData.assigned_to = body.admin_id
      }
      if (body.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        if (body.resolution_notes) updateData.resolution_notes = body.resolution_notes
      }
    }

    // Optional field updates
    if (body.priority) updateData.priority = body.priority
    if (body.urgency_score !== undefined) updateData.urgency_score = body.urgency_score
    if (body.service_type) updateData.service_type = body.service_type

    const { data, error } = await supabaseAdmin
      .from('sos_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
