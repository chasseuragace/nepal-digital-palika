'use client'

import { ProductFilters } from '@/services/marketplace-products.service'

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}

export function ProductFiltersComponent({ filters, onFiltersChange }: ProductFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      verificationStatus: status === 'all' ? undefined : (status as any),
      page: 1
    })
  }

  const handleSortChange = (sort: string) => {
    onFiltersChange({ ...filters, sort: sort as any, page: 1 })
  }

  return (
    <div className="filters-section">
      <div className="search-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={e => handleSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-group">
        <select
          value={filters.verificationStatus || 'all'}
          onChange={e => handleStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select
          value={filters.sort || 'newest'}
          onChange={e => handleSortChange(e.target.value)}
          className="filter-select"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="mostViewed">Most Viewed</option>
          <option value="leastViewed">Least Viewed</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
        
              </div>
    </div>
  )
}
