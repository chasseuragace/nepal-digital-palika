import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (!body.provider_id) {
      return NextResponse.json({ error: 'provider_id is required' }, { status: 400 })
    }
    if (!body.admin_id) {
      return NextResponse.json({ error: 'admin_id is required' }, { status: 400 })
    }

    // Verify the SOS request exists
    const { data: sosRequest, error: reqError } = await supabaseAdmin
      .from('sos_requests')
      .select('id, status, palika_id')
      .eq('id', params.id)
      .single()

    if (reqError || !sosRequest) {
      return NextResponse.json({ error: 'SOS request not found' }, { status: 404 })
    }

    // Verify the provider exists and belongs to same palika
    const { data: provider, error: provError } = await supabaseAdmin
      .from('service_providers')
      .select('id, palika_id, name_en, service_type')
      .eq('id', body.provider_id)
      .single()

    if (provError || !provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 })
    }

    // Create the assignment
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('sos_request_assignments')
      .insert({
        sos_request_id: params.id,
        provider_id: body.provider_id,
        assigned_by: body.admin_id,
        estimated_arrival_minutes: body.estimated_arrival_minutes,
        distance_km: body.distance_km,
        assignment_notes: body.assignment_notes,
      })
      .select('*, service_providers!inner(name_en, service_type, phone)')
      .single()

    if (assignError) {
      if (assignError.message?.includes('unique') || assignError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'This provider is already assigned to this request' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: assignError.message }, { status: 400 })
    }

    // Update SOS request status to 'assigned' if still pending/reviewing
    if (['pending', 'reviewing'].includes(sosRequest.status)) {
      await supabaseAdmin
        .from('sos_requests')
        .update({
          status: 'assigned',
          assigned_to: body.admin_id,
          status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
    }

    // Update provider status to busy
    await supabaseAdmin
      .from('service_providers')
      .update({ status: 'busy', updated_at: new Date().toISOString() })
      .eq('id', body.provider_id)

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sos_request_assignments')
      .select('*, service_providers!inner(name_en, service_type, phone, status)')
      .eq('sos_request_id', params.id)
      .order('assigned_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
