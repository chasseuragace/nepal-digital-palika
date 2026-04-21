import { NextRequest, NextResponse } from 'next/server'
import { PalikasService } from '@/services/palikas.service'

const service = new PalikasService()

export async function GET(_request: NextRequest) {
  const result = await service.getAllBasicWithTier()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data }, { status: 200 })
}

export async function PATCH(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { palikaId, tierId } = body || {}
  if (!palikaId || !tierId) {
    return NextResponse.json(
      { error: 'Missing palikaId or tierId' },
      { status: 400 }
    )
  }

  const result = await service.updateTier(Number(palikaId), String(tierId))

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
