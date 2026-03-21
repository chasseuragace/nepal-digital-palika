'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-green-200/50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-green-200 focus:border-emerald-400"
          />
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="border-green-200 focus:border-emerald-400">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="border-green-200 focus:border-emerald-400">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Button */}
        {hasFilters && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
