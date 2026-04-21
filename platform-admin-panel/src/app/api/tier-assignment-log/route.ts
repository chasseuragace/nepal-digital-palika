/**
 * GET /api/tier-assignment-log
 * Paginated audit log of tier assignment changes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { TierAssignmentLogService } from '@/services/tier-assignment-log.service'

const service = new TierAssignmentLogService()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const palika_id = searchParams.get('palika_id') || undefined
  const start_date = searchParams.get('start_date') || undefined
  const end_date = searchParams.get('end_date') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '25', 10)

  const result = await service.getAll(
    { palika_id, start_date, end_date },
    { page, limit }
  )

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const { data, total, page: p, limit: l, pages } = result.data
  return NextResponse.json({
    success: true,
    data,
    total,
    page: p,
    limit: l,
    pages,
  })
}
