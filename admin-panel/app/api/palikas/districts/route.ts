import { NextRequest, NextResponse } from 'next/server'
import { getPalikasDatasource } from '@/lib/palikas-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const provinceIdParam = searchParams.get('province_id')

    if (!provinceIdParam) {
      return NextResponse.json({ error: 'province_id is required' }, { status: 400 })
    }

    const provinceId = Number(provinceIdParam)

    const datasource = getPalikasDatasource()
    const districts = await datasource.getDistricts(provinceId)

    return NextResponse.json({ data: districts })
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
