import { SubscriptionPaymentsDatasource, SubscriptionPayment } from '@/lib/datasources/subscription-payments-datasource'
import { IPalikasDatasource, PalikaWithSubscriptionDates } from '@/lib/datasources/palikas-datasource'
import { getSubscriptionPaymentsDatasource } from '@/lib/datasources/subscription-payments-config'
import { getPalikasDatasource } from '@/lib/datasources/palikas-config'
import { ServiceResponse } from './types'

export interface RenewInput {
  palikaId: number
  tierId: string
  amount: number
  periodMonths: number
  method: 'cash' | 'bank_transfer' | 'cheque' | 'other'
  reference?: string
  recordedBy?: string
}

export class SubscriptionPaymentsService {
  private paymentsDatasource: SubscriptionPaymentsDatasource
  private palikasDatasource: IPalikasDatasource

  constructor(
    paymentsDatasource?: SubscriptionPaymentsDatasource,
    palikasDatasource?: IPalikasDatasource
  ) {
    this.paymentsDatasource = paymentsDatasource ?? getSubscriptionPaymentsDatasource()
    this.palikasDatasource = palikasDatasource ?? getPalikasDatasource()
  }

  async listForPalika(palikaId: number): Promise<ServiceResponse<SubscriptionPayment[]>> {
    try {
      const data = await this.paymentsDatasource.listForPalika(palikaId)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch payment history'
      return { success: false, error: message }
    }
  }

  async renew(input: RenewInput): Promise<ServiceResponse<SubscriptionPayment>> {
    try {
      // Step 1: Read palika's current subscription_end_date
      const palika = await this.palikasDatasource.getById(input.palikaId)
      if (!palika) {
        return { success: false, error: `Palika ${input.palikaId} not found` }
      }

      const currentEndDate = palika.subscription_end_date
      const now = new Date()

      // Step 2: Calculate newStart = max(NOW(), current_end_date ?? NOW())
      let newStart: Date
      if (currentEndDate) {
        newStart = new Date(currentEndDate) > now ? new Date(currentEndDate) : now
      } else {
        newStart = now
      }

      // Step 3: Calculate newEnd = newStart + periodMonths months
      const newEnd = new Date(newStart)
      newEnd.setMonth(newEnd.getMonth() + input.periodMonths)

      // Step 4: Insert subscription_payments row
      const payment = await this.paymentsDatasource.recordPayment({
        palika_id: input.palikaId,
        tier_id: input.tierId,
        amount: input.amount,
        period_start: newStart.toISOString(),
        period_end: newEnd.toISOString(),
        method: input.method,
        reference: input.reference,
        recorded_by: input.recordedBy,
      })

      // Step 5: UPDATE palika with new dates and tier
      await this.palikasDatasource.updateSubscriptionDates(
        input.palikaId,
        palika.subscription_start_date || newStart.toISOString(),
        newEnd.toISOString(),
        input.tierId
      )

      // Step 6: Return the inserted payment row
      return { success: true, data: payment }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to renew subscription'
      return { success: false, error: message }
    }
  }
}
