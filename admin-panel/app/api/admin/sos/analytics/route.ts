/**
 * SOS Analytics API
 * GET /api/admin/sos/analytics - Analytics data
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSOSService } from '@/services/sos.service';

const service = getSOSService();

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const palikaId = parseInt(searchParams.get('palika_id') || '5');
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const result = await service.getAnalytics(palikaId, dateFrom || undefined, dateTo || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[SOS API] GET /analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
