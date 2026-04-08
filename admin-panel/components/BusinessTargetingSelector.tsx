'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Filter, Zap, X, Check, Users } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface FilterOptions {
  wards: number[]
  businessTypes: { id: number; name: string; name_ne: string }[]
  ratingRange: { min: number; max: number }
}

interface BusinessResult {
  id: string
  business_name: string
  business_name_ne: string
  ward_number: number
  rating_average: number
  rating_count: number
  product_count: number
  view_count: number
}

interface BusinessTargetingStats {
  totalBusinesses: number
  activeBusinesses: number
  publishedBusinesses: number
  avgRating: number
  totalProducts: number
}

interface BusinessTargetingSelectorProps {
  palikaId: number
  onSelectBusinesses: (selectedIds: string[]) => void
  mode?: 'simple' | 'advanced' // Default: simple for non-technical admins
}

export default function BusinessTargetingSelector({
  palikaId,
  onSelectBusinesses,
  mode: defaultMode = 'simple',
}: BusinessTargetingSelectorProps) {
  // UI state
  const [mode, setMode] = useState<'simple' | 'advanced'>(defaultMode)
  const [showExpanded, setShowExpanded] = useState(false)

  // Filter state (Simple mode)
  const [wards, setWards] = useState<number[]>([])
  const [businessTypes, setBusinessTypes] = useState<number[]>([])
  const [minRating, setMinRating] = useState(0)
  const [minProducts, setMinProducts] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [search, setSearch] = useState('')

  // Filter state (Advanced mode)
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({})

  // Results
  const [results, setResults] = useState<BusinessResult[]>([])
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [stats, setStats] = useState<BusinessTargetingStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions()
    loadStats()
  }, [palikaId])

  // Auto-search when filters change (simple mode)
  useEffect(() => {
    if (mode === 'simple') {
      executeSimpleSearch()
    }
  }, [wards, businessTypes, minRating, minProducts, isActive, search, pagination.page])

  const loadFilterOptions = async () => {
    try {
      const res = await fetch(`/api/business-targeting/filter-options?palika_id=${palikaId}`)
      if (res.ok) {
        setFilterOptions(await res.json())
      }
    } catch (error) {
      console.error('Failed to load filter options:', error)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/business-targeting/stats?palika_id=${palikaId}`)
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const executeSimpleSearch = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        palika_id: String(palikaId),
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      })

      if (wards.length > 0) params.set('wards', wards.join(','))
      if (businessTypes.length > 0) params.set('business_types', businessTypes.join(','))
      if (minRating > 0) params.set('min_rating', String(minRating))
      if (minProducts > 0) params.set('min_product_count', String(minProducts))
      if (isActive !== undefined) params.set('is_active', String(isActive))
      if (search) params.set('search', search)

      const res = await fetch(`/api/business-targeting?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data)
        setPagination(prev => ({ ...prev, total: data.total }))
        setError(null)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load businesses')
      }
    } catch (error) {
      console.error('Search failed:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const executeAdvancedSearch = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        palika_id: String(palikaId),
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      })

      // Apply advanced filters
      for (const [key, value] of Object.entries(advancedFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      }

      const res = await fetch(`/api/business-targeting?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data)
        setPagination(prev => ({ ...prev, total: data.total }))
      }
    } catch (error) {
      console.error('Advanced search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBusinessSelection = (businessId: string) => {
    const newSelected = new Set(selectedBusinesses)
    if (newSelected.has(businessId)) {
      newSelected.delete(businessId)
    } else {
      newSelected.add(businessId)
    }
    setSelectedBusinesses(newSelected)
    onSelectBusinesses(Array.from(newSelected))
  }

  const selectAllResults = () => {
    const allIds = new Set(selectedBusinesses)
    results.forEach(b => allIds.add(b.id))
    setSelectedBusinesses(allIds)
    onSelectBusinesses(Array.from(allIds))
  }

  const clearSelection = () => {
    setSelectedBusinesses(new Set())
    onSelectBusinesses([])
  }

  if (!showExpanded) {
    return (
      <button
        onClick={() => setShowExpanded(true)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '6px',
          border: '1px dashed #cbd5e1',
          backgroundColor: '#f8fafc',
          color: '#475569',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Users size={16} />
        {selectedBusinesses.size > 0
          ? `${selectedBusinesses.size} businesses selected`
          : 'Select target businesses...'}
      </button>
    )
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              Select Target Businesses
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {selectedBusinesses.size} of {pagination.total} selected
            </p>
          </div>
          <button
            onClick={() => setShowExpanded(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={() => {
              setMode('simple')
              setAdvancedFilters({})
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: mode === 'simple' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              backgroundColor: mode === 'simple' ? '#eff6ff' : '#fff',
              color: mode === 'simple' ? '#1e40af' : '#64748b',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Filter size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Simple Filters
          </button>
          <button
            onClick={() => setMode('advanced')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: mode === 'advanced' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              backgroundColor: mode === 'advanced' ? '#eff6ff' : '#fff',
              color: mode === 'advanced' ? '#1e40af' : '#64748b',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Zap size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Advanced Query
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
          {/* Left: Filters */}
          <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            {mode === 'simple' ? (
              <SimpleFilters
                filterOptions={filterOptions}
                wards={wards}
                onWardsChange={setWards}
                businessTypes={businessTypes}
                onBusinessTypesChange={setBusinessTypes}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                minProducts={minProducts}
                onMinProductsChange={setMinProducts}
                isActive={isActive}
                onIsActiveChange={setIsActive}
                search={search}
                onSearchChange={setSearch}
              />
            ) : (
              <AdvancedQueryBuilder
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                onSearch={executeAdvancedSearch}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Right: Results */}
          <div style={{ flex: 1 }}>
            {/* Stats */}
            {stats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '14px',
              }}>
                <StatBadge label="Active" value={stats.activeBusinesses} />
                <StatBadge label="Avg Rating" value={stats.avgRating.toFixed(1)} />
                <StatBadge label="Published" value={stats.publishedBusinesses} />
                <StatBadge label="Products" value={stats.totalProducts} />
              </div>
            )}

            {/* Results Table */}
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                marginBottom: '12px',
                color: '#991b1b',
                fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '350px',
              overflowY: 'auto',
              marginBottom: '12px',
            }}>
              {isLoading ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <LoadingSpinner size={24} />
                  <span>Searching businesses...</span>
                </div>
              ) : results.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}>
                  {error ? 'Failed to load businesses. Please try again.' : 'No businesses match your filters'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={results.length > 0 && results.every(b => selectedBusinesses.has(b.id))}
                          onChange={selectAllResults}
                        />
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                        Business
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                        Rating
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                        Products
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(business => (
                      <tr
                        key={business.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: selectedBusinesses.has(business.id) ? '#f0fdf4' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleBusinessSelection(business.id)}
                      >
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="checkbox"
                            checked={selectedBusinesses.has(business.id)}
                            onChange={() => {}}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px' }}>
                          <div style={{ fontWeight: 500, color: '#1e293b' }}>{business.business_name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Ward {business.ward_number}
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b' }}>
                          ⭐ {business.rating_average.toFixed(1)}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b' }}>
                          {business.product_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
              }}>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    opacity: pagination.page === 1 ? 0.5 : 1,
                  }}
                >
                  Prev
                </button>
                <span style={{ padding: '4px 8px', color: '#64748b' }}>
                  {pagination.page} / {totalPages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: pagination.page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: pagination.page === totalPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={clearSelection}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setShowExpanded(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            Done ({selectedBusinesses.size} selected)
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───

function SimpleFilters({
  filterOptions,
  wards,
  onWardsChange,
  businessTypes,
  onBusinessTypesChange,
  minRating,
  onMinRatingChange,
  minProducts,
  onMinProductsChange,
  isActive,
  onIsActiveChange,
  search,
  onSearchChange,
}: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Business name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
          }}
        />
      </div>

      {/* Ward Filter */}
      {filterOptions?.wards && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Ward
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filterOptions.wards.map((w: number) => (
              <button
                key={w}
                onClick={() => {
                  if (wards.includes(w)) {
                    onWardsChange(wards.filter((x: number) => x !== w))
                  } else {
                    onWardsChange([...wards, w])
                  }
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: wards.includes(w) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: wards.includes(w) ? '#eff6ff' : '#fff',
                  color: wards.includes(w) ? '#1e40af' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business Type */}
      {filterOptions?.businessTypes && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Business Type
          </label>
          <select
            multiple
            value={businessTypes.map(String)}
            onChange={(e) => onBusinessTypesChange(Array.from(e.target.selectedOptions, (o: any) => parseInt(o.value)))}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          >
            {filterOptions.businessTypes.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.name_ne})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Min Rating */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
          Min Rating: {minRating}⭐
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={minRating}
          onChange={(e) => onMinRatingChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Min Products */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
          Min Products
        </label>
        <input
          type="number"
          min="0"
          value={minProducts}
          onChange={(e) => onMinProductsChange(parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
          }}
        />
      </div>

      {/* Active Only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onIsActiveChange(e.target.checked)}
          id="active-filter"
        />
        <label htmlFor="active-filter" style={{ fontSize: '12px', color: '#475569', margin: 0, cursor: 'pointer' }}>
          Active only
        </label>
      </div>
    </div>
  )
}

function AdvancedQueryBuilder({ filters, onFiltersChange, onSearch, isLoading }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
        Build complex queries using the Supabase filter syntax. See documentation for details.
      </p>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
          Custom Filters (JSON)
        </label>
        <textarea
          placeholder={`{\n  "min_rating": 3.5,\n  "wards": "1,2,3",\n  "is_24_7": true\n}`}
          value={JSON.stringify(filters, null, 2)}
          onChange={(e) => {
            try {
              onFiltersChange(JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, allow user to keep typing
            }
          }}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            fontFamily: 'monospace',
            minHeight: '120px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={onSearch}
        disabled={isLoading}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: isLoading ? '#cbd5e1' : '#3b82f6',
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: any }) {
  return (
    <div style={{
      padding: '8px',
      borderRadius: '6px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}
