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
 * Hook to check if current palika can access product verification workflow
 * Tier 1: NO verification
 * Tier 2+: YES, but only if approval_required = true
 */
export function useVerificationAccess(palikaId?: number): VerificationAccess {
  const [access, setAccess] = useState<VerificationAccess>({
    canVerify: false,
    tierLevel: 0,
    tierName: '',
    approvalRequired: false,
    loading: true
  })

  useEffect(() => {
    if (!palikaId) {
      setAccess(prev => ({ ...prev, loading: false }))
      return
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/tier-info?palika_id=${palikaId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch tier information')
        }

        const data = await response.json()

        const canVerify = data.tierLevel >= 2 && data.approvalRequired

        setAccess({
          canVerify,
          tierLevel: data.tierLevel,
          tierName: data.tierName,
          approvalRequired: data.approvalRequired,
          errorMessage: canVerify ? undefined : getErrorMessage(data),
          loading: false
        })
      } catch (error) {
        console.error('Error checking verification access:', error)
        setAccess(prev => ({
          ...prev,
          loading: false,
          errorMessage: 'Unable to determine verification access'
        }))
      }
    }

    checkAccess()
  }, [palikaId])

  return access
}

function getErrorMessage(tierInfo: any): string {
  if (tierInfo.tierLevel === 1) {
    return `Product verification is not available for ${tierInfo.tierName} tier palikas. Products are auto-published immediately.`
  }

  if (!tierInfo.approvalRequired) {
    return `Product verification workflow is not enabled for this palika. Contact your administrator to enable approval workflows.`
  }

  return 'Product verification is not available at this time'
}
