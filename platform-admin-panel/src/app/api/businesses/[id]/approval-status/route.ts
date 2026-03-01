/**
 * PUT /api/businesses/[id]/approval-status
 * Update business approval status (approve/reject/request changes)
 * Admin only: Palika staff with manage_businesses permission
 * RLS: Staff can only approve businesses in their own palika
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ApprovalStatusRequest {
  status: 'approved' | 'rejected' | 'request_changes'
  reason?: string
  rule_compliance?: Record<string, boolean>
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id
    const body: ApprovalStatusRequest = await request.json()

    // Validate required fields
    if (!body.status || !['approved', 'rejected', 'request_changes'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or request_changes' },
        { status: 400 }
      )
    }

    // Get current business state
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, palika_id, status, verification_status, owner_user_id, business_name, contact_email')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Determine new verification status and whether to publish
    let newVerificationStatus = business.verification_status
    let isPublished = false
    let updatedStatus = business.status

    if (body.status === 'approved') {
      newVerificationStatus = 'approved'
      isPublished = true
      updatedStatus = 'approved'
    } else if (body.status === 'rejected') {
      newVerificationStatus = 'rejected'
      isPublished = false
      updatedStatus = 'rejected'
    } else if (body.status === 'request_changes') {
      newVerificationStatus = 'pending'
      isPublished = false
      updatedStatus = 'pending_review'
    }

    // Update business record
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        verification_status: newVerificationStatus,
        status: updatedStatus,
        is_published: isPublished,
        reviewer_feedback: body.reason || null,
        reviewer_id: (request.headers.get('x-user-id') as string) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Error updating business approval status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update approval status' },
        { status: 500 }
      )
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        admin_id: (request.headers.get('x-user-id') as string) || null,
        operation_type: 'UPDATE',
        table_name: 'businesses',
        record_id: businessId,
        new_values: {
          verification_status: newVerificationStatus,
          status: updatedStatus,
          is_published: isPublished,
          reviewer_feedback: body.reason,
        },
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    // TODO: Send notification email to business owner
    // - If approved: "Your business has been approved!"
    // - If rejected: "Your business registration was not approved. Reason: {reason}"
    // - If request_changes: "We need more information. Please update: {reason}"

    return NextResponse.json({
      success: true,
      data: {
        business_id: businessId,
        verification_status: newVerificationStatus,
        status: updatedStatus,
        is_published: isPublished,
        message: `Business ${body.status === 'approved' ? 'approved and published' : body.status === 'rejected' ? 'rejected' : 'marked for changes'}`,
      },
    })
  } catch (error) {
    console.error(
      `Error in PUT /api/businesses/[id]/approval-status:`,
      error
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
