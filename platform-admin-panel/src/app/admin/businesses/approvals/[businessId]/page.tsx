'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './review.module.css'

interface ApprovalDetails {
  id: string
  business_name: string
  business_type?: string
  category?: string
  contact_phone: string
  contact_email?: string
  contact_website?: string
  address: string
  ward_number?: number
  description: string
  is_24_7: boolean
  operating_hours?: Record<string, string>
  languages_spoken?: string[]
  price_range?: { min: number; max: number }
  facilities?: Record<string, boolean>
  status: string
  verification_status: string
  reviewer_feedback?: string
  created_at: string
  owner_info?: Record<string, any>
  images: Array<{ id: string; image_url: string; is_featured: boolean }>
  approval_notes: Array<{ id: string; content: string; author_name: string; created_at: string }>
  palika: { name_en: string }
  verification_rules?: Array<{ id: string; name: string; enabled: boolean }>
}

export default function BusinessReviewPage({
  params,
}: {
  params: { businessId: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessId = params.businessId
  const action = searchParams.get('action') // approve, reject, changes

  const [business, setBusiness] = useState<ApprovalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(!!action)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'changes' | null>(
    (action as any) || null
  )
  const [reason, setReason] = useState('')
  const [ruleCompliance, setRuleCompliance] = useState<Record<string, boolean>>({})

  // Load business details
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const response = await fetch(`/api/businesses/${businessId}/approval-details`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load business')
        }

        setBusiness(data.data)

        // Initialize rule compliance tracking
        if (data.data.verification_rules) {
          const compliance: Record<string, boolean> = {}
          data.data.verification_rules.forEach((rule: any) => {
            compliance[rule.id] = false
          })
          setRuleCompliance(compliance)
        }
      } catch (err) {
        console.error('Error loading business:', err)
        setError(err instanceof Error ? err.message : 'Failed to load business')
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessId])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/approval-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          reason: reason || undefined,
          rule_compliance: ruleCompliance,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to approve')

      // Redirect to list
      router.push('/admin/businesses/approvals?status=approved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve business')
    } finally {
      setSubmitting(false)
      setShowModal(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/approval-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          reason: reason,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to reject')

      router.push('/admin/businesses/approvals?status=rejected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject business')
    } finally {
      setSubmitting(false)
      setShowModal(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!reason.trim()) {
      setError('Please specify what changes are needed')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/approval-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'request_changes',
          reason: reason,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to request changes')

      router.push('/admin/businesses/approvals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request changes')
    } finally {
      setSubmitting(false)
      setShowModal(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading business details...</div>
  }

  if (!business) {
    return <div className={styles.error}>Business not found</div>
  }

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backButton}>
        ← Back to Approvals
      </button>

      <div className={styles.grid}>
        {/* Main Content */}
        <div className={styles.main}>
          {/* Business Info */}
          <div className={styles.card}>
            <h1>{business.business_name}</h1>
            <div className={styles.metaRow}>
              <span className={styles.meta}>
                <strong>Type:</strong> {business.business_type || 'Not specified'}
              </span>
              <span className={styles.meta}>
                <strong>Category:</strong> {business.category || 'Not specified'}
              </span>
              <span className={styles.meta}>
                <strong>Submitted:</strong> {new Date(business.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Images Gallery */}
          {business.images && business.images.length > 0 && (
            <div className={styles.card}>
              <h2>Images</h2>
              <div className={styles.imageGallery}>
                {business.images.map((img) => (
                  <div key={img.id} className={styles.imageItem}>
                    <img src={img.image_url} alt="Business" />
                    {img.is_featured && <span className={styles.featured}>Featured</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Details */}
          <div className={styles.card}>
            <h2>Business Details</h2>
            <div className={styles.detailsGrid}>
              <div>
                <strong>Address:</strong>
                <p>{business.address}</p>
              </div>
              <div>
                <strong>Contact Phone:</strong>
                <p>
                  <a href={`tel:${business.contact_phone}`}>{business.contact_phone}</a>
                </p>
              </div>
              {business.contact_email && (
                <div>
                  <strong>Email:</strong>
                  <p>
                    <a href={`mailto:${business.contact_email}`}>{business.contact_email}</a>
                  </p>
                </div>
              )}
              {business.contact_website && (
                <div>
                  <strong>Website:</strong>
                  <p>
                    <a href={business.contact_website} target="_blank" rel="noopener noreferrer">
                      {business.contact_website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2>Description</h2>
            <p>{business.description}</p>
          </div>

          {/* Operating Hours */}
          {!business.is_24_7 && business.operating_hours && (
            <div className={styles.card}>
              <h2>Operating Hours</h2>
              <div className={styles.hoursGrid}>
                {Object.entries(business.operating_hours).map(([day, hours]) => (
                  <div key={day}>
                    <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                    <p>{hours}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {business.is_24_7 && (
            <div className={styles.card}>
              <p className={styles.highlight}>🕐 Open 24/7</p>
            </div>
          )}

          {/* Facilities & Languages */}
          <div className={styles.card}>
            <h2>Additional Info</h2>
            {business.price_range && (
              <div>
                <strong>Price Range:</strong>
                <p>
                  {business.price_range.min} - {business.price_range.max}
                </p>
              </div>
            )}
            {business.languages_spoken && business.languages_spoken.length > 0 && (
              <div>
                <strong>Languages:</strong>
                <p>{business.languages_spoken.join(', ')}</p>
              </div>
            )}
            {business.facilities && Object.keys(business.facilities).length > 0 && (
              <div>
                <strong>Facilities:</strong>
                <div className={styles.facilityTags}>
                  {Object.entries(business.facilities)
                    .filter(([_, enabled]) => enabled)
                    .map(([facility]) => (
                      <span key={facility} className={styles.tag}>
                        {facility.replace(/_/g, ' ')}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Verification Rules */}
          {business.verification_rules && business.verification_rules.length > 0 && (
            <div className={styles.card}>
              <h2>Verification Rules</h2>
              <div className={styles.rulesGrid}>
                {business.verification_rules.map((rule) => (
                  <label key={rule.id} className={styles.ruleCheckbox}>
                    <input
                      type="checkbox"
                      checked={ruleCompliance[rule.id] || false}
                      onChange={(e) =>
                        setRuleCompliance({
                          ...ruleCompliance,
                          [rule.id]: e.target.checked,
                        })
                      }
                    />
                    <span>{rule.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {business.approval_notes && business.approval_notes.length > 0 && (
            <div className={styles.card}>
              <h2>Staff Notes</h2>
              <div className={styles.notesList}>
                {business.approval_notes.map((note) => (
                  <div key={note.id} className={styles.note}>
                    <strong>{note.author_name}</strong>
                    <small>{new Date(note.created_at).toLocaleDateString()}</small>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className={styles.sidebar}>
          <div className={styles.actionCard}>
            <h3>Actions</h3>
            <button
              onClick={() => {
                setModalAction('approve')
                setShowModal(true)
                setReason('')
              }}
              className={styles.approveBtn}
            >
              ✓ Approve Business
            </button>
            <button
              onClick={() => {
                setModalAction('changes')
                setShowModal(true)
                setReason('')
              }}
              className={styles.changesBtn}
            >
              📝 Request Changes
            </button>
            <button
              onClick={() => {
                setModalAction('reject')
                setShowModal(true)
                setReason('')
              }}
              className={styles.rejectBtn}
            >
              ✕ Reject
            </button>
          </div>

          <div className={styles.statusCard}>
            <h3>Status</h3>
            <p className={styles.status}>
              <strong>Verification:</strong>
              <span className={`${styles.badge} ${styles[business.verification_status]}`}>
                {business.verification_status}
              </span>
            </p>
            <p className={styles.status}>
              <strong>Current:</strong>
              <span className={`${styles.badge} ${styles[business.status]}`}>
                {business.status.replace(/_/g, ' ')}
              </span>
            </p>
            {business.reviewer_feedback && (
              <div>
                <strong>Feedback:</strong>
                <p className={styles.feedback}>{business.reviewer_feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
              ✕
            </button>

            <h2>
              {modalAction === 'approve'
                ? 'Approve Business'
                : modalAction === 'reject'
                  ? 'Reject Business'
                  : 'Request Changes'}
            </h2>

            {modalAction === 'approve' && (
              <div>
                <p>Are you sure you want to approve this business?</p>
                <p className={styles.info}>
                  Once approved, the business will be published on the marketplace.
                </p>
                <textarea
                  placeholder="Add optional notes (visible to business owner)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className={styles.textarea}
                />
                <div className={styles.modalActions}>
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    {submitting ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modalAction === 'reject' && (
              <div>
                <p>Rejection reason (required, will be sent to business owner):</p>
                <textarea
                  placeholder="Explain why this business is being rejected..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className={styles.textarea}
                />
                <div className={styles.modalActions}>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !reason.trim()}
                    className={styles.submitBtn}
                  >
                    {submitting ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modalAction === 'changes' && (
              <div>
                <p>What changes are needed? (required, will be sent to owner):</p>
                <textarea
                  placeholder="Describe the changes needed..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className={styles.textarea}
                />
                <div className={styles.modalActions}>
                  <button
                    onClick={handleRequestChanges}
                    disabled={submitting || !reason.trim()}
                    className={styles.submitBtn}
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && <div className={styles.errorBox}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
