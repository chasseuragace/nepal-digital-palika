'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './success.module.css'

interface BusinessData {
  id: string
  business_name: string
  status: string
  verification_status: string
  created_at: string
  palika_id: number
}

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessId = searchParams.get('id')
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationWorkflowEnabled, setVerificationWorkflowEnabled] = useState(false)

  useEffect(() => {
    if (!businessId) {
      router.push('/businesses/register')
      return
    }

    const loadBusiness = async () => {
      try {
        // Fetch business details
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name, status, verification_status, created_at, palika_id')
          .eq('id', businessId)
          .single()

        if (businessError || !businessData) {
          throw new Error('Business not found')
        }

        setBusiness(businessData)

        // Check if verification workflow is enabled for this palika
        const response = await fetch(
          `/api/palikas-features?palika_id=${businessData.palika_id}`
        )
        const featureData = await response.json()
        if (featureData.success) {
          const hasVerification = featureData.data.feature_codes.includes('verification_workflow')
          setVerificationWorkflowEnabled(hasVerification)
        }
      } catch (err) {
        console.error('Error loading business:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessId, router])

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (!business) {
    return <div className={styles.error}>Business not found</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>Registration Submitted!</h1>
        <p className={styles.subtitle}>
          Thank you for registering your business on Nepal Digital Tourism Platform
        </p>

        <div className={styles.detailsBox}>
          <h3>Registration Details</h3>
          <div className={styles.detail}>
            <strong>Business Name:</strong>
            <span>{business.business_name}</span>
          </div>
          <div className={styles.detail}>
            <strong>Business ID:</strong>
            <span className={styles.code}>{business.id}</span>
          </div>
          <div className={styles.detail}>
            <strong>Submission Date:</strong>
            <span>{new Date(business.created_at).toLocaleDateString()}</span>
          </div>
          <div className={styles.detail}>
            <strong>Status:</strong>
            <span className={styles.statusBadge}>
              {business.status === 'pending_review' ? 'Pending Review' : business.status}
            </span>
          </div>
        </div>

        <div className={verificationWorkflowEnabled ? styles.infoBox : styles.successBox}>
          <h3>
            {verificationWorkflowEnabled
              ? '📋 Your Business is Under Review'
              : '🎉 Your Business is Now Live!'}
          </h3>
          {verificationWorkflowEnabled ? (
            <p>
              Your business registration has been submitted for review by our Palika team.
              You'll receive an email notification once your business is approved.
              This usually takes 3-5 business days.
            </p>
          ) : (
            <p>
              Congratulations! Your business is now visible on the Nepal Digital Tourism
              Platform marketplace. Citizens and tourists can discover and contact your business.
            </p>
          )}
        </div>

        <div className={styles.nextStepsBox}>
          <h3>What Happens Next?</h3>
          <ol>
            {verificationWorkflowEnabled && (
              <li>Our Palika team will review your business information</li>
            )}
            <li>We'll verify your contact information</li>
            <li>Your business will be published on the marketplace</li>
            <li>Customers can start finding and contacting you</li>
            <li>Monitor inquiries and manage your business profile</li>
          </ol>
        </div>

        <div className={styles.helpBox}>
          <h3>Need Help?</h3>
          <p>
            Check your email for next steps. If you have questions, contact our support team.
          </p>
          <a href="/contact" className={styles.link}>
            Contact Support →
          </a>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => router.push('/businesses/register')}
            className={styles.secondaryButton}
          >
            Register Another Business
          </button>
          <button
            onClick={() => router.push('/')}
            className={styles.primaryButton}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}
