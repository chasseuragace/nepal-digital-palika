'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './register.module.css'

interface Palika {
  id: number
  name_en: string
  name_ne: string
  district_id: number
}

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [selectedPalikaId, setSelectedPalikaId] = useState<number | null>(null)
  const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Load palikas on mount
  useEffect(() => {
    const loadPalikas = async () => {
      try {
        const { data, error } = await supabase
          .from('palikas')
          .select('id, name_en, name_ne, district_id')
          .order('name_en', { ascending: true })

        if (error) throw error
        setPalikas(data || [])
      } catch (err) {
        console.error('Error loading palikas:', err)
        setError('Failed to load Palikas. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    loadPalikas()
  }, [])

  // Check if feature is enabled for selected palika
  useEffect(() => {
    if (!selectedPalikaId) {
      setFeatureEnabled(null)
      return
    }

    const checkFeature = async () => {
      setChecking(true)
      try {
        const response = await fetch(
          `/api/palikas-features?palika_id=${selectedPalikaId}`
        )
        const data = await response.json()

        if (data.success) {
          const hasFeature = data.data.feature_codes.includes('self_service_registration')
          setFeatureEnabled(hasFeature)
        } else {
          setError('Failed to check feature availability')
          setFeatureEnabled(false)
        }
      } catch (err) {
        console.error('Error checking feature:', err)
        setError('Error checking feature availability')
        setFeatureEnabled(false)
      } finally {
        setChecking(false)
      }
    }

    checkFeature()
  }, [selectedPalikaId])

  const handleContinue = () => {
    if (!selectedPalikaId) {
      setError('Please select a Palika')
      return
    }

    if (featureEnabled === false) {
      setError('Self-service registration is not available for this Palika')
      return
    }

    // Store palika_id in sessionStorage for use in form
    sessionStorage.setItem('register_palika_id', selectedPalikaId.toString())
    router.push('/businesses/register/form')
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner}>Loading Palikas...</div>
      </div>
    )
  }

  const selectedPalika = palikas.find(p => p.id === selectedPalikaId)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Register Your Business</h1>
        <p className={styles.subtitle}>
          Self-service registration on Nepal Digital Tourism Platform
        </p>

        <div className={styles.formSection}>
          <label className={styles.label}>Select Your Palika</label>
          <select
            value={selectedPalikaId || ''}
            onChange={(e) => {
              const id = e.target.value ? parseInt(e.target.value, 10) : null
              setSelectedPalikaId(id)
              setError(null)
            }}
            className={styles.select}
            disabled={checking}
          >
            <option value="">-- Choose a Palika --</option>
            {palikas.map((palika) => (
              <option key={palika.id} value={palika.id}>
                {palika.name_en} ({palika.name_ne})
              </option>
            ))}
          </select>
        </div>

        {featureEnabled === false && selectedPalikaId && (
          <div className={styles.warningBox}>
            <h3>Registration Not Available</h3>
            <p>
              Self-service business registration is not currently available for{' '}
              {selectedPalika?.name_en}.
            </p>
            <p>
              Please contact your Palika administration for business registration assistance.
            </p>
            <a href="/contact" className={styles.link}>
              Contact Palika →
            </a>
          </div>
        )}

        {featureEnabled === true && selectedPalikaId && (
          <div className={styles.successBox}>
            <h3>Ready to Register</h3>
            <p>
              {selectedPalika?.name_en} is accepting self-service business registrations.
            </p>
            <p className={styles.info}>
              The registration process takes about 5-10 minutes and includes uploading
              business details and images.
            </p>
          </div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.actions}>
          <button
            onClick={handleContinue}
            disabled={!selectedPalikaId || featureEnabled === false || checking}
            className={styles.primaryButton}
          >
            {checking ? 'Checking...' : 'Continue to Form'}
          </button>
          <button
            onClick={() => router.back()}
            className={styles.secondaryButton}
          >
            Go Back
          </button>
        </div>

        <div className={styles.helpText}>
          <h4>What you'll need:</h4>
          <ul>
            <li>Business name and contact information</li>
            <li>Business address and location</li>
            <li>Business description (50-1000 characters)</li>
            <li>Featured image and gallery images (JPG/PNG, &lt;5MB each)</li>
            <li>Operating hours and facilities information</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
