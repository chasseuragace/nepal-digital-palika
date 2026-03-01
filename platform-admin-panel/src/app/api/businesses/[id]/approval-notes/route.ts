/**
 * POST /api/businesses/[id]/approval-notes
 * Add internal review notes (not visible to business owner)
 * Admin only: Palika staff with manage_businesses permission
 * RLS: Staff can only add notes to businesses in their own palika
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ApprovalNoteRequest {
  content: string
  is_internal?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id
    const body: ApprovalNoteRequest = await request.json()

    // Validate required fields
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Note content cannot exceed 5000 characters' },
        { status: 400 }
      )
    }

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

    // Create approval note
    const { data: note, error: noteError } = await supabase
      .from('approval_notes')
      .insert({
        business_id: businessId,
        content: body.content.trim(),
        is_internal: body.is_internal !== false, // Default to true
        author_id: (request.headers.get('x-user-id') as string) || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (noteError) {
      console.error('Error creating approval note:', noteError)
      return NextResponse.json(
        { error: 'Failed to create approval note' },
        { status: 500 }
      )
    }

    // Get author details
    const { data: author } = await supabase
      .from('admin_users')
      .select('id, full_name')
      .eq('id', note.author_id)
      .single()

    return NextResponse.json(
      {
        success: true,
        data: {
          id: note.id,
          business_id: note.business_id,
          content: note.content,
          is_internal: note.is_internal,
          author_id: note.author_id,
          author_name: author?.full_name || 'Unknown',
          created_at: note.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      `Error in POST /api/businesses/[id]/approval-notes:`,
      error
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/businesses/[id]/approval-notes
 * Get all internal notes for a business (staff-only)
 */
export async function GET(
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

    // Get all internal notes with author details
    const { data: notes, error: notesError } = await supabase
      .from('approval_notes')
      .select(
        `
        id,
        business_id,
        content,
        is_internal,
        author_id,
        created_at,
        admin_users(full_name)
      `
      )
      .eq('business_id', businessId)
      .eq('is_internal', true) // Only return internal notes
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Error fetching approval notes:', notesError)
      return NextResponse.json(
        { error: 'Failed to fetch approval notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: (notes || []).map((note: any) => ({
        id: note.id,
        business_id: note.business_id,
        content: note.content,
        is_internal: note.is_internal,
        author_id: note.author_id,
        author_name: note.admin_users?.full_name || 'Unknown',
        created_at: note.created_at,
      })),
    })
  } catch (error) {
    console.error(
      `Error in GET /api/businesses/[id]/approval-notes:`,
      error
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
