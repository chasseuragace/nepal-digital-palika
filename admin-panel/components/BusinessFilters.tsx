'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface BusinessFiltersProps {
  onStatusChange?: (status: string) => void;
  onCategoryChange?: (category: string) => void;
  onSearchChange?: (search: string) => void;
  onReset?: () => void;
  categories?: Array<{ id: string; name: string }>;
}

export function BusinessFilters({
  onStatusChange,
  onCategoryChange,
  onSearchChange,
  onReset,
  categories = [],
}: BusinessFiltersProps) {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [category, setCategory] = React.useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onStatusChange?.(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onCategoryChange?.(value);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    onReset?.();
  };

  const hasFilters = search || status || category;

  return (
    <div className="filters-section">
      <div className="search-box">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-group">
        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasFilters && (
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            <X className="w-4 h-4" style={{ marginRight: '8px' }} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
