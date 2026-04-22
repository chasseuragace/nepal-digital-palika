import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionPaymentsService } from '@/services/subscription-payments.service'

const service = new SubscriptionPaymentsService()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ palikaId: string }> }
) {
  const { palikaId: palikaIdParam } = await params
  const palikaId = Number(palikaIdParam)

  if (isNaN(palikaId)) {
    return NextResponse.json({ error: 'Invalid palikaId' }, { status: 400 })
  }

  const result = await service.listForPalika(palikaId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data }, { status: 200 })
}
