import { SubscriptionPaymentsDatasource } from './subscription-payments-datasource'
import { FakeSubscriptionPaymentsDatasource } from './fake-subscription-payments-datasource'

let instance: SubscriptionPaymentsDatasource | null = null

export function createSubscriptionPaymentsDatasource(): SubscriptionPaymentsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[SubscriptionPayments] Using FAKE datasource')
    return new FakeSubscriptionPaymentsDatasource()
  }
  // Lazy-load supabase impl so fake mode works without Supabase env vars.
  console.log('[SubscriptionPayments] Using SUPABASE datasource')
  const {
    SupabaseSubscriptionPaymentsDatasource,
  } = require('./supabase-subscription-payments-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseSubscriptionPaymentsDatasource(supabaseServer)
}

export function getSubscriptionPaymentsDatasource(): SubscriptionPaymentsDatasource {
  if (!instance) instance = createSubscriptionPaymentsDatasource()
  return instance
}

export function setSubscriptionPaymentsDatasource(ds: SubscriptionPaymentsDatasource) {
  instance = ds
}
