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
          padding: '12px 16px',
          borderRadius: '8px',
          border: '2px dashed #cbd5e1',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          color: '#475569',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          e.currentTarget.style.color = '#1e40af'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          e.currentTarget.style.color = '#475569'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Users size={18} />
        {selectedBusinesses.size > 0 ? (
          <>
            <span style={{ fontWeight: 600, color: '#3b82f6' }}>{selectedBusinesses.size}</span>
            <span>businesses selected</span>
          </>
        ) : (
          'Select target businesses...'
        )}
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
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '92%',
        maxWidth: '1000px',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '22px', 
              fontWeight: 700, 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Users size={24} />
              Select Target Businesses
            </h2>
            <p style={{ 
              margin: '6px 0 0', 
              fontSize: '13px', 
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: selectedBusinesses.size > 0 ? '#10b981' : '#64748b',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {selectedBusinesses.size}
              </span>
              of {pagination.total} businesses selected
            </p>
          </div>
          <button
            onClick={() => setShowExpanded(false)}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'rotate(90deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
          >
            <X size={22} color="#fff" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{
          padding: '16px 28px',
          borderBottom: '2px solid #f1f5f9',
          display: 'flex',
          gap: '12px',
          backgroundColor: '#fafbfc',
        }}>
          <button
            onClick={() => {
              setMode('simple')
              setAdvancedFilters({})
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'simple' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                : 'transparent',
              color: mode === 'simple' ? '#fff' : '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'simple' ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (mode !== 'simple') {
                e.currentTarget.style.backgroundColor = '#f1f5f9'
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'simple') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Filter size={16} />
            Simple Filters
          </button>
          <button
            onClick={() => setMode('advanced')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'advanced' 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                : 'transparent',
              color: mode === 'advanced' ? '#fff' : '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'advanced' ? '0 4px 6px -1px rgba(139, 92, 246, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (mode !== 'advanced') {
                e.currentTarget.style.backgroundColor = '#f1f5f9'
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'advanced') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Zap size={16} />
            Advanced Query
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', gap: '24px' }}>
          {/* Left: Filters */}
          <div style={{ 
            width: '300px', 
            borderRight: '2px solid #f1f5f9', 
            paddingRight: '24px',
          }}>
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
                gap: '12px',
                marginBottom: '16px',
              }}>
                <StatBadge label="Active" value={stats.activeBusinesses} color="#10b981" />
                <StatBadge label="Avg Rating" value={stats.avgRating.toFixed(1)} color="#f59e0b" />
                <StatBadge label="Published" value={stats.publishedBusinesses} color="#3b82f6" />
                <StatBadge label="Products" value={stats.totalProducts} color="#8b5cf6" />
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
              border: '2px solid #f1f5f9',
              borderRadius: '12px',
              overflow: 'hidden',
              maxHeight: '380px',
              overflowY: 'auto',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
                    <tr style={{ 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderBottom: '2px solid #e2e8f0',
                    }}>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: '2px solid #cbd5e1',
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={selectAllResults}
                        >
                          {results.length > 0 && results.every(b => selectedBusinesses.has(b.id)) && (
                            <Check size={14} color="#10b981" strokeWidth={3} />
                          )}
                        </div>
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Business
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Rating
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Products
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(business => (
                      <tr
                        key={business.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: selectedBusinesses.has(business.id) 
                            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => toggleBusinessSelection(business.id)}
                        onMouseEnter={(e) => {
                          if (!selectedBusinesses.has(business.id)) {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                            e.currentTarget.style.transform = 'scale(1.01)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedBusinesses.has(business.id)) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: selectedBusinesses.has(business.id) ? '2px solid #10b981' : '2px solid #cbd5e1',
                            backgroundColor: selectedBusinesses.has(business.id) ? '#10b981' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}>
                            {selectedBusinesses.has(business.id) && (
                              <Check size={14} color="#fff" strokeWidth={3} />
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>
                            {business.business_name}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6',
                            }}></span>
                            Ward {business.ward_number}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 600,
                          }}>
                            ⭐ {business.rating_average.toFixed(1)}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            fontWeight: 600,
                          }}>
                            {business.product_count}
                          </div>
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
          padding: '20px 28px',
          borderTop: '2px solid #f1f5f9',
          background: 'linear-gradient(to top, #fafbfc 0%, #fff 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }}>
          <button
            onClick={clearSelection}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '2px solid #fecaca',
              backgroundColor: '#fff',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <X size={16} />
            Clear All
          </button>
          <button
            onClick={() => setShowExpanded(false)}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={18} />
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
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
          🔍 Search Business
        </label>
        <input
          type="text"
          placeholder="Type business name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            backgroundColor: '#fff',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Ward Filter */}
      {filterOptions?.wards && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
            Ward Number
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filterOptions.wards.map((w: number) => {
              const isSelected = wards.includes(w)
              return (
                <button
                  key={w}
                  onClick={() => {
                    if (isSelected) {
                      onWardsChange(wards.filter((x: number) => x !== w))
                    } else {
                      onWardsChange([...wards, w])
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                      : '#fff',
                    color: isSelected ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none',
                    minWidth: '44px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.backgroundColor = '#eff6ff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.backgroundColor = '#fff'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {w}
                </button>
              )
            })}
          </div>
          {wards.length > 0 && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              border: '1px solid #93c5fd',
              fontSize: '11px',
              color: '#1e40af',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Check size={12} />
              {wards.length} ward{wards.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {/* Business Type */}
      {filterOptions?.businessTypes && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
            Business Type
          </label>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px',
          }}>
            {filterOptions.businessTypes.map((t: any) => {
              const isSelected = businessTypes.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (isSelected) {
                      onBusinessTypesChange(businessTypes.filter((x: number) => x !== t.id))
                    } else {
                      onBusinessTypesChange([...businessTypes, t.id])
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                      : '#fff',
                    color: isSelected ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                    boxShadow: isSelected ? '0 4px 6px -1px rgba(139, 92, 246, 0.3)' : 'none',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#8b5cf6'
                      e.currentTarget.style.backgroundColor = '#f5f3ff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.backgroundColor = '#fff'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{t.name}</span>
                  <span style={{ 
                    fontSize: '10px', 
                    opacity: 0.9,
                    fontWeight: 500,
                  }}>{t.name_ne}</span>
                </button>
              )
            })}
          </div>
          {businessTypes.length > 0 && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              fontSize: '11px',
              color: '#166534',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Check size={12} />
              {businessTypes.length} type{businessTypes.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {/* Min Rating */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
          ⭐ Minimum Rating: <span style={{ 
            color: '#f59e0b', 
            fontSize: '14px', 
            fontWeight: 700,
            backgroundColor: '#fef3c7',
            padding: '2px 8px',
            borderRadius: '6px',
          }}>{minRating}</span>
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={minRating}
          onChange={(e) => onMinRatingChange(parseFloat(e.target.value))}
          style={{ 
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            outline: 'none',
            background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(minRating / 5) * 100}%, #e2e8f0 ${(minRating / 5) * 100}%, #e2e8f0 100%)`,
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '4px',
          fontSize: '10px',
          color: '#94a3b8',
          fontWeight: 600,
        }}>
          <span>0</span>
          <span>2.5</span>
          <span>5</span>
        </div>
      </div>

      {/* Min Products */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
          📦 Minimum Products
        </label>
        <input
          type="number"
          min="0"
          value={minProducts}
          onChange={(e) => onMinProductsChange(parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Active Only */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        padding: '12px',
        borderRadius: '8px',
        border: '2px solid #e2e8f0',
        backgroundColor: isActive ? '#f0fdf4' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => onIsActiveChange(!isActive)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#10b981'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0'
      }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          border: isActive ? '2px solid #10b981' : '2px solid #cbd5e1',
          backgroundColor: isActive ? '#10b981' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          {isActive && <Check size={14} color="#fff" strokeWidth={3} />}
        </div>
        <label htmlFor="active-filter" style={{ 
          fontSize: '13px', 
          color: isActive ? '#166534' : '#475569', 
          margin: 0, 
          cursor: 'pointer',
          fontWeight: 600,
        }}>
          ✅ Active Businesses Only
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

function StatBadge({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '10px',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `2px solid ${color}30`,
      textAlign: 'center',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = `0 4px 6px -1px ${color}30`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{ fontSize: '18px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}
