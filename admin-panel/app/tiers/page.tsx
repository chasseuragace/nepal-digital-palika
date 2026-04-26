'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { tierChangeRequestsService, type Tier, type CurrentSubscription, type TierChangeRequest } from '@/lib/client/tier-change-requests-client.service'
import { adminSessionStore, type AdminSession } from '@/lib/storage/session-storage.service'
import AdminLayout from '@/components/AdminLayout'
import './tiers.css'

export default function TiersPage() {
  const router = useRouter()
  const [user, setUser] = useState<AdminSession | null>(null)
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [tiers, setTiers] = useState<Tier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [tierChangeRequests, setTierChangeRequests] = useState<TierChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const session = adminSessionStore.get()
    if (session) {
      setUser(session)
      // Defensive: coerce to number in case legacy sessions stored it as string
      const palika = session.palika_id != null ? Number(session.palika_id) : null
      setPalikaId(Number.isNaN(palika) ? null : palika)
    } else {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    if (palikaId) {
      fetchTierData()
    } else if (palikaId === null && user !== null) {
      // If we have a user but no palikaId, stop loading and show error
      setIsLoading(false)
      setMessage({ type: 'error', text: 'No Palika ID found in your session. Please contact support.' })
    }
  }, [palikaId, user])

  const fetchTierData = async () => {
    try {
      setIsLoading(true)
      const data = await tierChangeRequestsService.getTierData(palikaId!)
      setTiers(data.tiers)
      setCurrentSubscription(data.currentSubscription)
      setTierChangeRequests(data.tierChangeRequests)
    } catch (error) {
      console.error('Error fetching tier data:', error)
      setMessage({ type: 'error', text: 'Failed to load tier information' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestTierChange = async () => {
    if (!selectedTier) {
      setMessage({ type: 'error', text: 'Please select a tier' })
      return
    }

    if (selectedTier === currentSubscription?.subscription_tier_id) {
      setMessage({ type: 'error', text: 'Please select a different tier' })
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'User session not found' })
      return
    }

    try {
      setIsSubmitting(true)
      await tierChangeRequestsService.createRequest(palikaId!, user.id, {
        requested_tier_id: selectedTier,
        reason: reason || undefined
      })

      setMessage({ type: 'success', text: 'Tier change request submitted successfully' })
      setSelectedTier(null)
      setReason('')
      setTimeout(() => fetchTierData(), 1000)
    } catch (error) {
      console.error('Error submitting tier change request:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to submit request' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this tier change request?')) return

    if (!user) {
      setMessage({ type: 'error', text: 'User session not found' })
      return
    }

    try {
      await tierChangeRequestsService.deleteRequest(requestId, user.id)

      setMessage({ type: 'success', text: 'Tier change request cancelled' })
      fetchTierData()
    } catch (error) {
      console.error('Error cancelling request:', error)
      setMessage({ type: 'error', text: 'Failed to cancel request' })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading tier information...</p>
        </div>
      </AdminLayout>
    )
  }

  const pendingRequest = tierChangeRequests.find(r => r.status === 'pending')
  const hasPendingRequest = !!pendingRequest

  return (
    <AdminLayout>
      <div className="tiers-container">
        {/* Page Header */}
        <div className="tiers-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Subscription Tiers</h1>
              <p className="page-subtitle">Manage your subscription plan and billing</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className={`alert-message ${message.type}`}>
            {message.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Current Subscription Section */}
        {currentSubscription && (
          <div className="current-subscription-card">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Current Subscription
            </h2>
            <div className="subscription-grid">
              <div className="subscription-item">
                <div className="subscription-label">Current Tier</div>
                <div className="subscription-value highlight">
                  {currentSubscription.subscription_tiers?.display_name || 'Not assigned'}
                </div>
              </div>
              <div className="subscription-item">
                <div className="subscription-label">Monthly Cost</div>
                <div className="subscription-value">
                  Npr{currentSubscription.cost_per_month ? Number(currentSubscription.cost_per_month).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="subscription-item">
                <div className="subscription-label">Subscription Start</div>
                <div className="subscription-date">
                  {currentSubscription.subscription_start_date
                    ? new Date(currentSubscription.subscription_start_date).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
              <div className="subscription-item">
                <div className="subscription-label">Subscription End</div>
                <div className="subscription-date">
                  {currentSubscription.subscription_end_date
                    ? new Date(currentSubscription.subscription_end_date).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Tiers Section */}
        <div className="section-header">
          <h2>Available Tiers</h2>
          <p className="section-description">Choose the plan that best fits your needs</p>
        </div>
        <div className="tiers-grid">
          {tiers.map(tier => (
            <div
              key={tier.id}
              className={`tier-card ${selectedTier === tier.id ? 'selected' : ''} ${currentSubscription?.subscription_tier_id === tier.id ? 'current' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              <div className="tier-header">
                <h3 className="tier-name">{tier.display_name}</h3>
                <p className="tier-description">{tier.description}</p>
              </div>
              <div className="tier-pricing">
                <div className="pricing-item">
                  <div className="pricing-label">Monthly</div>
                  <div className="pricing-value">
                    Npr{tier.cost_per_month ? Number(tier.cost_per_month).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="pricing-item">
                  <div className="pricing-label">Annual</div>
                  <div className="pricing-value secondary">
                    Npr{tier.cost_per_year ? Number(tier.cost_per_year).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
              {currentSubscription?.subscription_tier_id === tier.id && (
                <div className="current-tier-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Current Tier
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Request Tier Change Section */}
        {selectedTier && selectedTier !== currentSubscription?.subscription_tier_id && !hasPendingRequest && (
          <div className="request-change-card">
            <h2>Request Tier Change</h2>
            <div className="form-group">
              <label className="form-label">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to change tiers?"
                className="form-textarea"
              />
            </div>
            <button
              onClick={handleRequestTierChange}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <svg className="spinner-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Submit Tier Change Request
                </>
              )}
            </button>
          </div>
        )}

        {/* Pending Request Alert */}
        {hasPendingRequest && (
          <div className="pending-request-alert">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Pending Tier Change Request
            </h2>
            <p>
              You have a pending request to change to <strong>{pendingRequest.subscription_tiers?.display_name}</strong>
            </p>
            <p>
              Requested on: {new Date(pendingRequest.requested_at).toLocaleDateString()}
            </p>
            {pendingRequest.reason && (
              <p>Reason: {pendingRequest.reason}</p>
            )}
            <button
              onClick={() => handleCancelRequest(pendingRequest.id)}
              className="btn-danger"
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Request History Section */}
        {tierChangeRequests.length > 0 && (
          <div className="request-history-card">
            <h2>Request History</h2>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Requested Tier</th>
                    <th>Status</th>
                    <th>Requested Date</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tierChangeRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.subscription_tiers?.display_name}</td>
                      <td>
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {new Date(request.requested_at).toLocaleDateString()}
                      </td>
                      <td>{request.reason || '-'}</td>
                      <td>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
