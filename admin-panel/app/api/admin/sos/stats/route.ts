/**
 * SOS Dashboard Stats API
 * GET /api/admin/sos/stats - Dashboard statistics
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSOSService } from '@/services/sos.service';

const service = getSOSService();

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const palikaId = parseInt(searchParams.get('palika_id') || '5');

    const result = await service.getSOSStats(palikaId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[SOS API] GET /stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
