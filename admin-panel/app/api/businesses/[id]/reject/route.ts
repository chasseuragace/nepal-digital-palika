import { NextRequest, NextResponse } from 'next/server';
import { BusinessApprovalService } from '@/services/business-approval.service';
import { TierValidationService } from '@/services/tier-validation.service';

/**
 * PUT /api/businesses/:id/reject
 * Reject a business (change status to rejected with reason)
 * Requires: palika_id, admin_id, reason (in body)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const palikaId = searchParams.get('palika_id');
    const adminId = searchParams.get('admin_id');

    // Validate required parameters
    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'admin_id is required' },
        { status: 400 }
      );
    }

    // Get request body for rejection reason
    const body = await request.json();
    const reason = body.reason;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const palikaIdNum = parseInt(palikaId);

    // Validate tier eligibility for business approval
    const tierValidationService = new TierValidationService();
    const tierValidation = await tierValidationService.validateBusinessApprovalAccess(
      palikaIdNum,
      adminId
    );

    if (!tierValidation.canApprove) {
      return NextResponse.json(
        { error: tierValidation.message },
        { status: 403 }
      );
    }

    // Reject business
    const service = new BusinessApprovalService();
    const result = await service.rejectBusiness({
      businessId,
      palikaId: palikaIdNum,
      adminId,
      reason,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error rejecting business:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to reject business' },
      { status: 500 }
    );
  }
}
