/**
 * SOS Requests API Routes
 * GET /api/admin/sos/requests - List requests with filters
 * POST /api/admin/sos/requests - Create request (if needed)
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSOSService } from '@/services/sos.service';

const service = getSOSService();

export async function GET(req: NextRequest) {
  try {
    // Get palika_id from auth context or query params
    // In a real app, get from NextAuth session
    const searchParams = new URL(req.url).searchParams;
    const palikaId = parseInt(searchParams.get('palika_id') || '5');

    const filters: any = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('emergency_type')) {
      filters.emergency_type = searchParams.get('emergency_type');
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority');
    }
    if (searchParams.get('ward_number')) {
      filters.ward_number = parseInt(searchParams.get('ward_number')!);
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    const result = await service.getSOSRequests(palikaId, filters, { page, pageSize });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[SOS API] GET /requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
