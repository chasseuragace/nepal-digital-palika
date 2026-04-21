/**
 * Tier Validation Datasource contract.
 *
 * Scope reduced to tier metadata lookup only, following the tier de-gating
 * sweep. The previous interface also included `validateTier`, `getTierLimits`,
 * `checkUpgradeEligibility`, `productBelongsToPalika`, and
 * `businessBelongsToPalika`; all of those were deleted along with the service
 * methods that called them. If a future dynamic-policy layer needs that kind
 * of check, introduce it as a dedicated datasource rather than reviving this.
 */

export interface PalikaTierInfo {
  palikaId: number
  tierId: string
  tierLevel: number
  tierName: string
  approvalRequired: boolean
}

export interface ITierValidationDatasource {
  getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null>
}
