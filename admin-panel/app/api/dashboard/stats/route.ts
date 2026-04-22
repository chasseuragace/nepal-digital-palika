import { NextResponse, NextRequest } from 'next/server'
import { getAnalyticsDatasource } from '@/lib/analytics-config'

export async function GET(request: NextRequest) {
  try {
    // Get palika_id from query param
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : undefined

    const datasource = getAnalyticsDatasource()
    const stats = await datasource.getSimpleDashboardStats(palikaId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}