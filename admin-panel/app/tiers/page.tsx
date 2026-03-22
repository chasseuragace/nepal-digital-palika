'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tier {
  id: string
  name: string
  display_name: string
  description: string
  cost_per_month: number
  cost_per_year: number
}

interface CurrentSubscription {
  id: number
  name_en: string
  subscription_tier_id: string
  subscription_start_date: string
  subscription_end_date: string
  cost_per_month: number
  subscription_tiers: {
    id: string
    name: string
    display_name: string
    description: string
    cost_per_month: number
    cost_per_year: number
  }
}

interface TierChangeRequest {
  id: string
  current_tier_id: string
  requested_tier_id: string
  reason: string
  status: string
  requested_at: string
  reviewed_at: string
  review_notes: string
  subscription_tiers: {
    id: string
    name: string
    display_name: string
  }
}

export default function TiersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      const userData = JSON.parse(adminSession)
      setUser(userData)
      const palika = userData.palika_id ? parseInt(userData.palika_id, 10) : null
      setPalikaId(palika)
    } else {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    if (palikaId) {
      fetchTierData()
    }
  }, [palikaId])

  const fetchTierData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tiers?palika_id=${palikaId}`)
      if (!response.ok) throw new Error('Failed to fetch tier data')
      const data = await response.json()
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

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/tier-change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Palika-ID': palikaId!.toString(),
          'X-User-ID': user.id
        },
        body: JSON.stringify({
          requested_tier_id: selectedTier,
          reason: reason || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit tier change request')
      }

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

    try {
      const response = await fetch(`/api/tier-change-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': user.id
        }
      })

      if (!response.ok) throw new Error('Failed to cancel request')

      setMessage({ type: 'success', text: 'Tier change request cancelled' })
      fetchTierData()
    } catch (error) {
      console.error('Error cancelling request:', error)
      setMessage({ type: 'error', text: 'Failed to cancel request' })
    }
  }

  if (isLoading) {
    return <div className="container"><p>Loading tier information...</p></div>
  }

  const pendingRequest = tierChangeRequests.find(r => r.status === 'pending')
  const hasPendingRequest = !!pendingRequest

  return (
    <div className="container">
      <h1>Subscription Tiers</h1>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Current Subscription Section */}
      {currentSubscription && (
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2>Current Subscription</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Current Tier</p>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                {currentSubscription.subscription_tiers?.display_name || 'Not assigned'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Monthly Cost</p>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                ₹{currentSubscription.cost_per_month ? Number(currentSubscription.cost_per_month).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Subscription Start</p>
              <p style={{ margin: '0', fontSize: '14px' }}>
                {currentSubscription.subscription_start_date
                  ? new Date(currentSubscription.subscription_start_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Subscription End</p>
              <p style={{ margin: '0', fontSize: '14px' }}>
                {currentSubscription.subscription_end_date
                  ? new Date(currentSubscription.subscription_end_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Available Tiers Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Available Tiers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {tiers.map(tier => (
            <div
              key={tier.id}
              style={{
                padding: '20px',
                border: selectedTier === tier.id ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: selectedTier === tier.id ? '#f0f7ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSelectedTier(tier.id)}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{tier.display_name}</h3>
              <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                {tier.description}
              </p>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Monthly</p>
                <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                  ₹{tier.cost_per_month ? Number(tier.cost_per_month).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Annual</p>
                <p style={{ margin: '0', fontSize: '16px' }}>
                  ₹{tier.cost_per_year ? Number(tier.cost_per_year).toLocaleString() : 'N/A'}
                </p>
              </div>
              {currentSubscription?.subscription_tier_id === tier.id && (
                <p style={{ margin: '15px 0 0 0', color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                  ✓ Current Tier
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Request Tier Change Section */}
      {selectedTier && selectedTier !== currentSubscription?.subscription_tier_id && !hasPendingRequest && (
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2>Request Tier Change</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to change tiers?"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                minHeight: '100px'
              }}
            />
          </div>
          <button
            onClick={handleRequestTierChange}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Tier Change Request'}
          </button>
        </section>
      )}

      {/* Pending Request Alert */}
      {hasPendingRequest && (
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h2>Pending Tier Change Request</h2>
          <p style={{ margin: '0 0 15px 0' }}>
            You have a pending request to change to <strong>{pendingRequest.subscription_tiers?.display_name}</strong>
          </p>
          <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
            Requested on: {new Date(pendingRequest.requested_at).toLocaleDateString()}
          </p>
          {pendingRequest.reason && (
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              Reason: {pendingRequest.reason}
            </p>
          )}
          <button
            onClick={() => handleCancelRequest(pendingRequest.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel Request
          </button>
        </section>
      )}

      {/* Request History Section */}
      {tierChangeRequests.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Request History</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Requested Tier</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Requested Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tierChangeRequests.map(request => (
                  <tr key={request.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{request.subscription_tiers?.display_name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: request.status === 'pending' ? '#fff3cd' : request.status === 'approved' ? '#d4edda' : '#f8d7da',
                        color: request.status === 'pending' ? '#856404' : request.status === 'approved' ? '#155724' : '#721c24'
                      }}>
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                      {request.reason || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
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
        </section>
      )}
    </div>
  )
}
