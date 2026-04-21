import { NextRequest, NextResponse } from 'next/server'
import { TiersService } from '@/services/tiers.service'

const service = new TiersService()

export async function GET(_request: NextRequest) {
  const result = await service.getAllActive()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    count: result.data?.length ?? 0,
  })
}
