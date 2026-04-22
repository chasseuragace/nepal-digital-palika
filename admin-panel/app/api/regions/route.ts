import { NextResponse, NextRequest } from 'next/server'
import { getRegionsDatasource } from '@/lib/regions-config'

export async function GET(request: NextRequest) {
  try {
    const datasource = getRegionsDatasource()
    const hierarchyData = await datasource.getRegionHierarchy()

    return NextResponse.json({
      data: hierarchyData
    })
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
