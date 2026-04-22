import { SupabaseClient } from '@supabase/supabase-js'
import {
  SubscriptionPaymentsDatasource,
  SubscriptionPayment,
  RecordPaymentInput,
} from './subscription-payments-datasource'

export class SupabaseSubscriptionPaymentsDatasource implements SubscriptionPaymentsDatasource {
  constructor(private client: SupabaseClient) {}

  async listForPalika(palikaId: number): Promise<SubscriptionPayment[]> {
    const { data, error } = await this.client
      .from('subscription_payments')
      .select('*')
      .eq('palika_id', palikaId)
      .order('paid_on', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as SubscriptionPayment[]) || []
  }

  async recordPayment(input: RecordPaymentInput): Promise<SubscriptionPayment> {
    const { data, error } = await this.client
      .from('subscription_payments')
      .insert({
        palika_id: input.palika_id,
        tier_id: input.tier_id,
        amount: input.amount,
        period_start: input.period_start,
        period_end: input.period_end,
        method: input.method,
        reference: input.reference || null,
        recorded_by: input.recorded_by || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SubscriptionPayment
  }
}
