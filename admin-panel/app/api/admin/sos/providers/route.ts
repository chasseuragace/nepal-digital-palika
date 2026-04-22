/**
 * Service Providers API
 * GET /api/admin/sos/providers - List providers
 * POST /api/admin/sos/providers - Create provider
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSOSService } from '@/services/sos.service';

const service = getSOSService();

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const palikaId = parseInt(searchParams.get('palika_id') || '5');

    const filters: any = {};
    if (searchParams.get('service_type')) {
      filters.service_type = searchParams.get('service_type');
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }

    const result = await service.getServiceProviders(palikaId, filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[SOS API] GET /providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const palikaId = input.palika_id || 5;

    const result = await service.createServiceProvider(palikaId, input);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('[SOS API] POST /providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
