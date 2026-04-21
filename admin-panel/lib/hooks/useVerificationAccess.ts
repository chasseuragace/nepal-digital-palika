'use client'

import { useEffect, useState } from 'react'

interface VerificationAccess {
  canVerify: boolean
  tierLevel: number
  tierName: string
  approvalRequired: boolean
  errorMessage?: string
  loading: boolean
}

/**
 * Hook for the business/product approval workflow UI.
 *
 * Historical behaviour: this hook gated the Verify/Reject buttons on a tier
 * policy (`tierLevel >= 2 && approvalRequired`). The tier de-gating work
 * decided that tiers are metadata only and must not alter functionality, so
 * the gate is gone: `canVerify` is always true once `/api/tier-info` resolves
 * for the given palika. The hook still returns tierName/tierLevel so the
 * surrounding UI can keep showing "Tier: Basic" labels without rewiring.
 */
export function useVerificationAccess(palikaId?: number): VerificationAccess {
  const [access, setAccess] = useState<VerificationAccess>({
    canVerify: true,
    tierLevel: 0,
    tierName: '',
    approvalRequired: true,
    loading: true,
  })

  useEffect(() => {
    if (!palikaId) {
      // No palika context (e.g. super_admin with no scoped palika). The API
      // calls will still include admin_id/palika_id at click time; the hook
      // just can't show the tier label.
      setAccess((prev) => ({ ...prev, loading: false }))
      return
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/tier-info?palika_id=${palikaId}`)
        if (!response.ok) throw new Error('Failed to fetch tier information')

        const data = await response.json()
        setAccess({
          canVerify: true,
          tierLevel: data.tierLevel ?? 0,
          tierName: data.tierName ?? '',
          approvalRequired: true,
          loading: false,
        })
      } catch (error) {
        // Tier info is nice-to-have for the label; do not block the flow.
        console.error('Error fetching tier info:', error)
        setAccess({
          canVerify: true,
          tierLevel: 0,
          tierName: '',
          approvalRequired: true,
          loading: false,
        })
      }
    }

    checkAccess()
  }, [palikaId])

  return access
}
