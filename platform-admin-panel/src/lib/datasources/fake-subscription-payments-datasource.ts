import {
  SubscriptionPaymentsDatasource,
  SubscriptionPayment,
  RecordPaymentInput,
} from './subscription-payments-datasource'

const now = new Date().toISOString()

interface FakePaymentRow extends SubscriptionPayment {}

const g = globalThis as any
const payments: FakePaymentRow[] = g.__fake_subscription_payments ?? (g.__fake_subscription_payments = seedPayments())

function seedPayments(): FakePaymentRow[] {
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'payment-1',
      palika_id: 5,
      tier_id: 'tier-tourism',
      amount: 50000,
      period_start: sixMonthsAgo,
      period_end: oneYearFromNow,
      paid_on: sixMonthsAgo,
      method: 'cash',
      reference: 'REC-001',
      recorded_by: 'admin-1',
      created_at: sixMonthsAgo,
    },
    {
      id: 'payment-2',
      palika_id: 8,
      tier_id: 'tier-basic',
      amount: 25000,
      period_start: oneYearAgo,
      period_end: sixMonthsAgo,
      paid_on: oneYearAgo,
      method: 'bank_transfer',
      reference: 'TXN-002',
      recorded_by: 'admin-1',
      created_at: oneYearAgo,
    },
    {
      id: 'payment-3',
      palika_id: 10,
      tier_id: 'tier-basic',
      amount: 30000,
      period_start: now,
      period_end: oneYearFromNow,
      paid_on: now,
      method: 'cheque',
      reference: 'CHQ-003',
      recorded_by: 'admin-1',
      created_at: now,
    },
    {
      id: 'payment-4',
      palika_id: 5,
      tier_id: 'tier-tourism',
      amount: 50000,
      period_start: sixMonthsAgo,
      period_end: oneYearFromNow,
      paid_on: sixMonthsAgo,
      method: 'cash',
      reference: null,
      recorded_by: 'admin-1',
      created_at: sixMonthsAgo,
    },
  ]
}

export class FakeSubscriptionPaymentsDatasource implements SubscriptionPaymentsDatasource {
  async listForPalika(palikaId: number): Promise<SubscriptionPayment[]> {
    return payments
      .filter((p) => p.palika_id === palikaId)
      .sort((a, b) => new Date(b.paid_on).getTime() - new Date(a.paid_on).getTime())
  }

  async recordPayment(input: RecordPaymentInput): Promise<SubscriptionPayment> {
    const newPayment: SubscriptionPayment = {
      id: `payment-${Date.now()}`,
      palika_id: input.palika_id,
      tier_id: input.tier_id,
      amount: input.amount,
      period_start: input.period_start,
      period_end: input.period_end,
      paid_on: new Date().toISOString(),
      method: input.method,
      reference: input.reference || null,
      recorded_by: input.recorded_by || null,
      created_at: new Date().toISOString(),
    }
    payments.push(newPayment)
    return newPayment
  }
}
