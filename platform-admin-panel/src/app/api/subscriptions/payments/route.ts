import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionPaymentsService } from '@/services/subscription-payments.service'

const service = new SubscriptionPaymentsService()

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { palikaId, tierId, amount, periodMonths, method, reference } = body || {}

  if (!palikaId || !tierId || !amount || !periodMonths || !method) {
    return NextResponse.json(
      { error: 'Missing required fields: palikaId, tierId, amount, periodMonths, method' },
      { status: 400 }
    )
  }

  // TODO: Resolve recorded_by from authenticated admin if route helper provides it
  const recordedBy = null

  const result = await service.renew({
    palikaId: Number(palikaId),
    tierId: String(tierId),
    amount: Number(amount),
    periodMonths: Number(periodMonths),
    method: method,
    reference: reference,
    recordedBy: recordedBy,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data }, { status: 200 })
}
