import { NextRequest, NextResponse } from 'next/server'
import { StatsService } from '@/services/stats.service'

const service = new StatsService()

export async function GET(_request: NextRequest) {
  const result = await service.getDashboardStats()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data }, { status: 200 })
}
