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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.verificationStatus || 'all'}
            onChange={e => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={filters.sort || 'newest'}
            onChange={e => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="mostViewed">Most Viewed</option>
            <option value="leastViewed">Least Viewed</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
          <select
            value={filters.limit || 25}
            onChange={e => onFiltersChange({ ...filters, limit: parseInt(e.target.value), page: 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  )
}
