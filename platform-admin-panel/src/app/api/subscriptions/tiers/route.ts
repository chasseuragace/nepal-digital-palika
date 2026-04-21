import { NextRequest, NextResponse } from 'next/server'
import { TiersService } from '@/services/tiers.service'

const service = new TiersService()

export async function GET(_request: NextRequest) {
  const result = await service.getAllWithFeatures()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data }, { status: 200 })
}
