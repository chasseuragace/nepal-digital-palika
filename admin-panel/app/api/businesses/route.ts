import { NextRequest, NextResponse } from 'next/server';
import { BusinessApprovalService } from '@/services/business-approval.service';
import { TierValidationService } from '@/services/tier-validation.service';

/**
 * GET /api/businesses
 * List businesses for a palika with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const palikaId = searchParams.get('palika_id');
    const status = searchParams.get('status') as
      | 'pending'
      | 'verified'
      | 'rejected'
      | 'suspended'
      | null;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      );
    }

    const palikaIdNum = parseInt(palikaId);

    const filters = {
      status: status || undefined,
      category: category || undefined,
      search: search || undefined,
    };

    const result = await BusinessApprovalService.getBusinesses(
      palikaIdNum,
      filters,
      limit,
      offset
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing businesses:', error);
    return NextResponse.json(
      { error: 'Failed to list businesses' },
      { status: 500 }
    );
  }
}
