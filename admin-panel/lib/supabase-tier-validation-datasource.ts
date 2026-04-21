/**
 * Supabase Tier Validation Datasource
 *
 * Reads a palika's subscription tier (id, name, sort_order) plus the
 * placeholder `approvalRequired` flag. This is metadata for UI labels —
 * nothing gates behaviour on it.
 */

import { ITierValidationDatasource, PalikaTierInfo } from './tier-validation-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseTierValidationDatasource implements ITierValidationDatasource {
  constructor(private db: SupabaseClient) {}

  async getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null> {
    const { data: palika } = await this.db
      .from('palikas')
      .select('id, subscription_tier_id')
      .eq('id', palikaId)
      .single()
    if (!palika) return null
    if (!palika.subscription_tier_id) return null

    const { data: tier } = await this.db
      .from('subscription_tiers')
      .select('id, name, sort_order')
      .eq('id', palika.subscription_tier_id)
      .single()
    if (!tier) return null

    // `approvalRequired` is returned for backwards-compatibility with consumers
    // that read it off `/api/tier-info`. After the tier de-gating sweep nothing
    // in the codebase actually gates on it; true keeps the label on the admin
    // UI's tier card reading "Approval Workflow: Enabled" for clarity.
    return {
      palikaId,
      tierId: tier.id,
      tierLevel: tier.sort_order,
      tierName: tier.name,
      approvalRequired: true,
    }
  }
}
