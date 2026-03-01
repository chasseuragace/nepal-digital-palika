'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './form.module.css'

type FormStep = 1 | 2 | 3 | 4

interface BusinessFormData {
  // Step 1: Basic Info
  business_name: string
  business_type: string
  contact_phone: string
  contact_email: string
  contact_website: string
  address: string
  ward_number: string
  coordinates?: { lat: number; lng: number }

  // Step 2: Details
  description: string
  operating_hours: Record<string, string>
  is_24_7: boolean
  price_range: { min: number; max: number }
  languages_spoken: string[]
  facilities: Record<string, boolean>

  // Step 3: Media
  featured_image?: File
  gallery_images: File[]
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DEFAULT_HOURS = '09:00-17:00'
const FACILITIES = ['wifi', 'parking', 'restaurant', 'guide_service', 'restroom', 'wheelchair_accessible']
const LANGUAGES = ['English', 'Nepali', 'Mandarin', 'Spanish', 'Japanese', 'German', 'French']

const STORAGE_KEY = 'business_register_form'

export default function BusinessRegisterFormPage() {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>(1)
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [formData, setFormData] = useState<BusinessFormData>({
    business_name: '',
    business_type: '',
    contact_phone: '',
    contact_email: '',
    contact_website: '',
    address: '',
    ward_number: '',
    description: '',
    operating_hours: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, DEFAULT_HOURS])),
    is_24_7: false,
    price_range: { min: 0, max: 0 },
    languages_spoken: [],
    facilities: Object.fromEntries(FACILITIES.map(f => [f, false])),
    gallery_images: [],
  })

  // Load palika_id and form data on mount
  useEffect(() => {
    const palikaIdStr = sessionStorage.getItem('register_palika_id')
    if (!palikaIdStr) {
      router.push('/businesses/register')
      return
    }
    setPalikaId(parseInt(palikaIdStr, 10))

    // Load saved form data
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (err) {
        console.error('Error loading saved form:', err)
      }
    }
    setLoading(false)
  }, [router])

  // Auto-save form data
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving')
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch (err) {
        console.error('Error saving form:', err)
        setAutoSaveStatus('idle')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const updateFormData = useCallback((updates: Partial<BusinessFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateStep = useCallback((): boolean => {
    setError(null)

    switch (step) {
      case 1:
        if (!formData.business_name?.trim()) {
          setError('Business name is required')
          return false
        }
        if (formData.business_name.length < 3 || formData.business_name.length > 100) {
          setError('Business name must be 3-100 characters')
          return false
        }
        if (!formData.contact_phone?.trim()) {
          setError('Contact phone is required')
          return false
        }
        if (!formData.address?.trim()) {
          setError('Address is required')
          return false
        }
        return true

      case 2:
        if (!formData.description?.trim()) {
          setError('Business description is required')
          return false
        }
        if (formData.description.length < 50 || formData.description.length > 1000) {
          setError('Description must be 50-1000 characters')
          return false
        }
        if (formData.price_range.min < 0 || formData.price_range.max < formData.price_range.min) {
          setError('Price range is invalid')
          return false
        }
        return true

      case 3:
        if (!formData.featured_image) {
          setError('Featured image is required')
          return false
        }
        return true

      case 4:
        return true
    }
  }, [step, formData])

  const handleNext = () => {
    if (!validateStep()) return
    if (step < 4) {
      setStep((step + 1) as FormStep)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as FormStep)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep() || !palikaId) return

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('palika_id', palikaId.toString())
      formDataToSend.append('business_name', formData.business_name)
      formDataToSend.append('contact_phone', formData.contact_phone)
      formDataToSend.append('contact_email', formData.contact_email || '')
      formDataToSend.append('contact_website', formData.contact_website || '')
      formDataToSend.append('address', formData.address)
      formDataToSend.append('ward_number', formData.ward_number || '')
      formDataToSend.append('description', formData.description)
      formDataToSend.append('business_type', formData.business_type || '')
      formDataToSend.append('is_24_7', formData.is_24_7.toString())
      formDataToSend.append('operating_hours', JSON.stringify(formData.operating_hours))
      formDataToSend.append('languages_spoken', JSON.stringify(formData.languages_spoken))
      formDataToSend.append('price_range', JSON.stringify(formData.price_range))
      formDataToSend.append('facilities', JSON.stringify(formData.facilities))

      const response = await fetch('/api/businesses/register', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration')
      }

      // Clear saved form data
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem('register_palika_id')

      // Redirect to success page with business_id
      router.push(`/businesses/register/success?id=${data.data.business_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit registration')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading form...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Business Registration</h1>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <p className={styles.stepInfo}>Step {step} of 4</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Step 1: Basic Info */}
        {step === 1 && <Step1 formData={formData} updateFormData={updateFormData} />}

        {/* Step 2: Details */}
        {step === 2 && <Step2 formData={formData} updateFormData={updateFormData} />}

        {/* Step 3: Media */}
        {step === 3 && <Step3 formData={formData} updateFormData={updateFormData} />}

        {/* Step 4: Review */}
        {step === 4 && <Step4 formData={formData} />}

        <div className={styles.actions}>
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className={styles.secondaryButton}
          >
            ← Previous
          </button>

          {step < 4 ? (
            <button onClick={handleNext} className={styles.primaryButton}>
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={styles.submitButton}
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          )}
        </div>

        {autoSaveStatus !== 'idle' && (
          <p className={styles.autoSave}>
            {autoSaveStatus === 'saving' ? 'Saving...' : '✓ Saved'}
          </p>
        )}
      </div>
    </div>
  )
}

// Step components would go here...
function Step1({ formData, updateFormData }: any) {
  return (
    <div className={styles.step}>
      <h2>Business Basic Information</h2>
      <div className={styles.formGroup}>
        <label>Business Name *</label>
        <input
          type="text"
          value={formData.business_name}
          onChange={(e) => updateFormData({ business_name: e.target.value })}
          placeholder="Enter business name"
          maxLength={100}
        />
        <small>{formData.business_name.length}/100</small>
      </div>

      <div className={styles.formGroup}>
        <label>Business Type</label>
        <select value={formData.business_type} onChange={(e) => updateFormData({ business_type: e.target.value })}>
          <option value="">Select type</option>
          <option value="hotel">Hotel</option>
          <option value="homestay">Homestay</option>
          <option value="restaurant">Restaurant</option>
          <option value="tour_operator">Tour Operator</option>
          <option value="guide">Guide Service</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Contact Phone *</label>
        <input
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => updateFormData({ contact_phone: e.target.value })}
          placeholder="+977..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Email Address</label>
        <input
          type="email"
          value={formData.contact_email}
          onChange={(e) => updateFormData({ contact_email: e.target.value })}
          placeholder="your@email.com"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Website</label>
        <input
          type="url"
          value={formData.contact_website}
          onChange={(e) => updateFormData({ contact_website: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Address *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Street address"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Ward Number</label>
        <input
          type="number"
          min="1"
          max="35"
          value={formData.ward_number}
          onChange={(e) => updateFormData({ ward_number: e.target.value })}
          placeholder="1-35"
        />
      </div>
    </div>
  )
}

function Step2({ formData, updateFormData }: any) {
  return (
    <div className={styles.step}>
      <h2>Business Details</h2>

      <div className={styles.formGroup}>
        <label>Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your business (50-1000 characters)"
          rows={5}
          maxLength={1000}
        />
        <small>{formData.description.length}/1000</small>
      </div>

      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={formData.is_24_7}
            onChange={(e) => updateFormData({ is_24_7: e.target.checked })}
          />
          Open 24/7
        </label>
      </div>

      {!formData.is_24_7 && (
        <div className={styles.hoursSection}>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
            <div key={day} className={styles.formGroup}>
              <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
              <input
                type="text"
                value={formData.operating_hours[day] || '09:00-17:00'}
                onChange={(e) => updateFormData({ operating_hours: { ...formData.operating_hours, [day]: e.target.value } })}
                placeholder="09:00-17:00"
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.priceRange}>
        <div className={styles.formGroup}>
          <label>Price Range (Min)</label>
          <input
            type="number"
            min="0"
            value={formData.price_range.min}
            onChange={(e) => updateFormData({ price_range: { ...formData.price_range, min: parseInt(e.target.value) || 0 } })}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Price Range (Max)</label>
          <input
            type="number"
            min="0"
            value={formData.price_range.max}
            onChange={(e) => updateFormData({ price_range: { ...formData.price_range, max: parseInt(e.target.value) || 0 } })}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Languages Spoken</label>
        <div className={styles.checkboxGroup}>
          {LANGUAGES.map((lang) => (
            <label key={lang}>
              <input
                type="checkbox"
                checked={formData.languages_spoken.includes(lang)}
                onChange={(e) => {
                  const langs = e.target.checked
                    ? [...formData.languages_spoken, lang]
                    : formData.languages_spoken.filter((l: string) => l !== lang)
                  updateFormData({ languages_spoken: langs })
                }}
              />
              {lang}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Facilities</label>
        <div className={styles.checkboxGroup}>
          {FACILITIES.map((facility) => (
            <label key={facility}>
              <input
                type="checkbox"
                checked={formData.facilities[facility] || false}
                onChange={(e) => updateFormData({ facilities: { ...formData.facilities, [facility]: e.target.checked } })}
              />
              {facility.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3({ formData, updateFormData }: any) {
  return (
    <div className={styles.step}>
      <h2>Business Images</h2>

      <div className={styles.formGroup}>
        <label>Featured Image *</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && file.size > 5 * 1024 * 1024) {
              alert('Image must be less than 5MB')
              return
            }
            if (file) updateFormData({ featured_image: file })
          }}
        />
        {formData.featured_image && <p>✓ {formData.featured_image.name}</p>}
      </div>

      <div className={styles.formGroup}>
        <label>Gallery Images</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
            updateFormData({ gallery_images: validFiles })
          }}
        />
        {formData.gallery_images.length > 0 && <p>✓ {formData.gallery_images.length} images selected</p>}
      </div>
    </div>
  )
}

function Step4({ formData }: any) {
  return (
    <div className={styles.step}>
      <h2>Review Your Information</h2>
      <div className={styles.reviewBox}>
        <h3>Business Information</h3>
        <p><strong>Name:</strong> {formData.business_name}</p>
        <p><strong>Type:</strong> {formData.business_type}</p>
        <p><strong>Phone:</strong> {formData.contact_phone}</p>
        <p><strong>Address:</strong> {formData.address}</p>
      </div>
    </div>
  )
}
