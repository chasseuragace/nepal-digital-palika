'use client'

import { useState, useEffect } from 'react'
import styles from './tiers.module.css'

interface Tier {
  id: string
  name: string
  display_name: string
  cost_per_year: number
  feature_count?: number
}

interface Palika {
  id: number
  name_en: string
  name_ne: string
  district_id: number
  subscription_tier_id?: string
  current_tier?: Tier
}

interface PalikaWithTier extends Palika {
  current_tier?: Tier
}

export default function TierAssignmentPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [palikas, setPalikas] = useState<PalikaWithTier[]>([])
  const [filteredPalikas, setFilteredPalikas] = useState<PalikaWithTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [selectedPalika, setSelectedPalika] = useState<PalikaWithTier | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTierId, setNewTierId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load tiers
  useEffect(() => {
    const loadTiers = async () => {
      try {
        const response = await fetch('/api/tiers')
        const data = await response.json()
        if (data.success) {
          setTiers(data.data || [])
        }
      } catch (err) {
        console.error('Error loading tiers:', err)
      }
    }
    loadTiers()
  }, [])

  // Load palikas
  useEffect(() => {
    const loadPalikas = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/palikas/tiers?page=${currentPage}&limit=${pageSize}`
        )
        const data = await response.json()
        if (data.success) {
          setPalikas(data.data || [])
        } else {
          setError(data.error || 'Failed to load palikas')
        }
      } catch (err) {
        console.error('Error loading palikas:', err)
        setError('Failed to load palikas')
      } finally {
        setLoading(false)
      }
    }
    loadPalikas()
  }, [currentPage, pageSize])

  // Filter and search
  useEffect(() => {
    let filtered = palikas

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name_ne.includes(searchQuery)
      )
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter((p) => p.subscription_tier_id === filterTier)
    }

    setFilteredPalikas(filtered)
    setCurrentPage(1)
  }, [palikas, searchQuery, filterTier])

  const handleAssignTier = async () => {
    if (!selectedPalika || !newTierId) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/palikas/${selectedPalika.id}/tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_tier_id: newTierId,
          reason: reason || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to assign tier')

      // Update local palikas list
      setPalikas(
        palikas.map((p) =>
          p.id === selectedPalika.id
            ? {
                ...p,
                subscription_tier_id: newTierId,
                current_tier: tiers.find((t) => t.id === newTierId),
              }
            : p
        )
      )

      setShowModal(false)
      setSelectedPalika(null)
      setNewTierId('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tier')
    } finally {
      setSubmitting(false)
    }
  }

  const getTierColor = (tierId?: string) => {
    if (!tierId) return 'gray'
    const tier = tiers.find((t) => t.id === tierId)
    if (tier?.name === 'basic') return 'gray'
    if (tier?.name === 'tourism') return 'blue'
    if (tier?.name === 'premium') return 'gold'
    return 'gray'
  }

  const paginatedPalikas = filteredPalikas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const totalPages = Math.ceil(filteredPalikas.length / pageSize)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tier Assignment Management</h1>
        <p>Manage subscription tiers for Palikas</p>
      </div>

      {/* Tier Summary Cards */}
      <div className={styles.tierSummary}>
        {tiers.map((tier) => {
          const count = palikas.filter((p) => p.subscription_tier_id === tier.id).length
          return (
            <div key={tier.id} className={`${styles.tierCard} ${styles[getTierColor(tier.id)]}`}>
              <h3>{tier.display_name}</h3>
              <div className={styles.tierCount}>{count} Palikas</div>
              <div className={styles.tierPrice}>NPR {tier.cost_per_year?.toLocaleString()}/year</div>
            </div>
          )
        })}
      </div>

      {/* Filters and Search */}
      <div className={styles.filterCard}>
        <input
          type="text"
          placeholder="Search by Palika name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Tiers</option>
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Palikas Table */}
      {loading ? (
        <div className={styles.loadingBox}>Loading palikas...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : filteredPalikas.length === 0 ? (
        <div className={styles.emptyBox}>No palikas found</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Palika Name</th>
                  <th>Current Tier</th>
                  <th>Annual Cost</th>
                  <th>Features</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPalikas.map((palika) => (
                  <tr key={palika.id}>
                    <td>
                      <strong>{palika.name_en}</strong>
                      <br />
                      <small>{palika.name_ne}</small>
                    </td>
                    <td>
                      <span
                        className={`${styles.tierBadge} ${styles[getTierColor(palika.subscription_tier_id)]}`}
                      >
                        {palika.current_tier?.display_name || 'None'}
                      </span>
                    </td>
                    <td>
                      {palika.current_tier?.cost_per_year
                        ? `NPR ${palika.current_tier.cost_per_year.toLocaleString()}`
                        : '-'}
                    </td>
                    <td>{palika.current_tier?.feature_count || 0} features</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedPalika(palika)
                          setNewTierId(palika.subscription_tier_id || '')
                          setReason('')
                          setShowModal(true)
                        }}
                        className={styles.editButton}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && selectedPalika && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Assign Tier: {selectedPalika.name_en}</h2>
            <p>Current: {selectedPalika.current_tier?.display_name || 'None'}</p>

            <div className={styles.tierSelection}>
              {tiers.map((tier) => (
                <label key={tier.id} className={styles.tierOption}>
                  <input
                    type="radio"
                    name="tier"
                    value={tier.id}
                    checked={newTierId === tier.id}
                    onChange={(e) => setNewTierId(e.target.value)}
                  />
                  <div className={styles.tierOptionContent}>
                    <strong>{tier.display_name}</strong>
                    <span>NPR {tier.cost_per_year?.toLocaleString()}/year</span>
                  </div>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Add reason for tier change (optional)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={styles.textarea}
            />

            <div className={styles.modalActions}>
              <button
                onClick={handleAssignTier}
                disabled={submitting || !newTierId}
                className={styles.submitButton}
              >
                {submitting ? 'Assigning...' : 'Assign Tier'}
              </button>
              <button onClick={() => setShowModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
