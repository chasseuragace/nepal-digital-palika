/**
 * Fake Tier Validation Datasource — offline-dev stand-in for the Supabase
 * implementation. Returns a plausible tier payload so `/api/tier-info` keeps
 * working with NEXT_PUBLIC_USE_FAKE_DATASOURCES=true.
 */

import { ITierValidationDatasource, PalikaTierInfo } from './tier-validation-datasource'

export class FakeTierValidationDatasource implements ITierValidationDatasource {
  async getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null> {
    await new Promise((r) => setTimeout(r, 50))
    return {
      palikaId,
      tierId: 'tier-2',
      tierLevel: 2,
      tierName: 'Silver',
      approvalRequired: true,
    }
  }
}
