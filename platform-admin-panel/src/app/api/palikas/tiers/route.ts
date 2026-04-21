import { NextRequest, NextResponse } from 'next/server'
import { PalikasService } from '@/services/palikas.service'

const service = new PalikasService()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tier = searchParams.get('tier') || undefined
  const provinceIdRaw = searchParams.get('province_id')
  const provinceId = provinceIdRaw ? parseInt(provinceIdRaw, 10) : undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const result = await service.getAllWithTiers(
    { tier, provinceId, search },
    { page, limit }
  )

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const { data, count } = result.data
  return NextResponse.json({
    success: true,
    data,
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  })
}
