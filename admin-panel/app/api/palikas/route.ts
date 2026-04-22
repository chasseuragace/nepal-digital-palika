import { NextRequest, NextResponse } from 'next/server'
import { getPalikasDatasource } from '@/lib/palikas-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const districtIdParam = searchParams.get('district_id')
    const districtId = districtIdParam ? Number(districtIdParam) : undefined

    const datasource = getPalikasDatasource()
    const palikas = await datasource.getPalikas(districtId)

    return NextResponse.json({ data: palikas })
  } catch (error) {
    console.error('Error fetching palikas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
