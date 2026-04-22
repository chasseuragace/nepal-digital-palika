import { NextResponse, NextRequest } from 'next/server'
import { getAuditLogDatasource } from '@/lib/audit-log-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const actionFilter = searchParams.get('action_filter') || ''
    const entityTypeFilter = searchParams.get('entity_type_filter') || ''
    const adminIdFilter = searchParams.get('admin_id_filter') || ''
    const dateFrom = searchParams.get('date_from') || ''
    const dateTo = searchParams.get('date_to') || ''

    const datasource = getAuditLogDatasource()
    const result = await datasource.getAuditLogs({
      page,
      limit,
      search,
      action_filter: actionFilter,
      entity_type_filter: entityTypeFilter,
      admin_id_filter: adminIdFilter,
      date_from: dateFrom,
      date_to: dateTo
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
