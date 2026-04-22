export interface SubscriptionPayment {
  id: string
  palika_id: number
  tier_id: string
  amount: number
  period_start: string
  period_end: string
  paid_on: string
  method: 'cash' | 'bank_transfer' | 'cheque' | 'other'
  reference: string | null
  recorded_by: string | null
  created_at: string
}

export interface RecordPaymentInput {
  palika_id: number
  tier_id: string
  amount: number
  period_start: string // ISO
  period_end: string // ISO
  method: SubscriptionPayment['method']
  reference?: string
  recorded_by?: string
}

export interface SubscriptionPaymentsDatasource {
  listForPalika(palikaId: number): Promise<SubscriptionPayment[]>
  recordPayment(input: RecordPaymentInput): Promise<SubscriptionPayment>
}
