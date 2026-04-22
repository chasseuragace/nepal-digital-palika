import { NextRequest, NextResponse } from 'next/server'
import { getSOSService } from '@/services/sos.service'

const service = getSOSService()

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const palikaId = params.get('palika_id')
    const status = params.get('status')
    const emergencyType = params.get('emergency_type')
    const serviceType = params.get('service_type')
    const priority = params.get('priority')
    const search = params.get('search')
    const dateFrom = params.get('date_from')
    const dateTo = params.get('date_to')
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '25')

    const filters: any = {}
    if (status) filters.status = status
    if (emergencyType) filters.emergency_type = emergencyType
    if (serviceType) filters.service_type = serviceType
    if (priority) filters.priority = priority
    if (search) filters.search = search
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo

    // If no palika_id provided, we cannot use the service as it requires palika_id
    // In this case, return empty or error
    if (!palikaId) {
      return NextResponse.json({ error: 'palika_id is required' }, { status: 400 })
    }

    const result = await service.getSOSRequests(parseInt(palikaId), filters, { page, pageSize: limit })

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Failed to fetch SOS requests' }, { status: 500 })
    }

    return NextResponse.json({
      data: result.data.data,
      meta: { page: result.data.page, limit: result.data.limit, total: result.data.total, hasMore: result.data.hasMore }
    })
  } catch (error) {
    console.error('Error fetching SOS requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
