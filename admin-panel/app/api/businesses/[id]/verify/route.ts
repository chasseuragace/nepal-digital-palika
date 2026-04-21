import { NextRequest, NextResponse } from 'next/server';
import { BusinessApprovalService } from '@/services/business-approval.service';

/**
 * PUT /api/businesses/:id/verify
 * Verify a business (change status to verified).
 * Requires: palika_id, admin_id.
 *
 * Historically this route also ran a tier-based access check
 * (validateBusinessApprovalAccess). That check has been removed along with
 * the rest of the tier-gating work — tiers are retained as metadata only and
 * should not alter functionality. Scope enforcement (business belongs to the
 * calling palika) still happens inside BusinessApprovalService.
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

    const palikaIdNum = parseInt(palikaId);

    const body = await request.json().catch(() => ({}));
    const notes = body.notes;

    const service = new BusinessApprovalService();
    const result = await service.verifyBusiness({
      businessId,
      palikaId: palikaIdNum,
      adminId,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying business:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to verify business' },
      { status: 500 }
    );
  }
}
