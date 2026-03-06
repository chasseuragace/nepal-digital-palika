'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Check, AlertCircle } from 'lucide-react'

interface SubscriptionTier {
  id: string
  name: string
  display_name: string
  cost_per_year: number
  tier_features: Array<{
    feature_id: string
    features: {
      id: string
      code: string
      display_name: string
      category: string
    }
  }>
}

interface PalikaWithTier {
  id: number
  name_en: string
  subscription_tier_id: string | null
  subscription_tiers: {
    id: string
    name: string
    display_name: string
  } | null
}

async function fetchTiers() {
  const response = await fetch('/api/subscriptions/tiers')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch tiers')
  }
  const { data } = await response.json()
  return data as SubscriptionTier[]
}

async function fetchPalikas() {
  const response = await fetch('/api/subscriptions/palikas')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch palikas')
  }
  const { data } = await response.json()
  return data as PalikaWithTier[]
}

async function updatePalikaTier(palikaId: string, tierId: string) {
  const response = await fetch('/api/subscriptions/palikas', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ palikaId, tierId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update tier')
  }
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const { data: tiers, isLoading: tiersLoading, error: tiersError } = useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: fetchTiers,
    staleTime: 5 * 60 * 1000,
  })

  const { data: palikas, isLoading: palikaLoading, error: palikaError } = useQuery({
    queryKey: ['palikas-with-tiers'],
    queryFn: fetchPalikas,
    staleTime: 5 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ palikaId, tierId }: { palikaId: string; tierId: string }) =>
      updatePalikaTier(palikaId, tierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['palikas-with-tiers'] })
    },
  })

  const [searchTerm, setSearchTerm] = useState('')
  const filteredPalikas = palikas?.filter((palika) =>
    palika.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (tiersError || palikaError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Error loading data: {tiersError?.message || palikaError?.message}
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-600 mt-1">Manage Palika subscription tiers and features</p>
        </div>

        {/* Tier Cards */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Available Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiersLoading ? (
              <p className="text-slate-600">Loading tiers...</p>
            ) : (
              tiers?.map((tier) => (
                <Card key={tier.id} className="border-2">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900">{tier.display_name}</h3>
                    <p className="text-sm text-slate-600">
                      {tier.cost_per_year > 0 ? `NPR ${tier.cost_per_year.toLocaleString()}` : 'Free'} / year
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {tier.tier_features?.slice(0, 6).map((tf) => (
                        <div key={tf.features.id} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{tf.features.display_name}</span>
                        </div>
                      ))}
                      {tier.tier_features?.length > 6 && (
                        <p className="text-xs text-slate-500 mt-2">
                          + {tier.tier_features.length - 6} more features
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Palikas Table */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Palika Assignments</h2>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search palikas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Palika Name</TableHeader>
                    <TableHeader>Current Tier</TableHeader>
                    <TableHeader>Annual Cost</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {palikaLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Loading palikas...
                      </TableCell>
                    </TableRow>
                  ) : filteredPalikas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No palikas found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPalikas.map((palika) => {
                      const currentTier = tiers?.find((t) => t.id === palika.subscription_tier_id)
                      return (
                        <TableRow key={palika.id}>
                          <TableCell className="font-medium">{palika.name_en}</TableCell>
                          <TableCell>
                            {palika.subscription_tiers ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {palika.subscription_tiers.display_name}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {currentTier?.cost_per_year ? `NPR ${currentTier.cost_per_year.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <select
                              value={palika.subscription_tier_id || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateMutation.mutate({
                                    palikaId: palika.id,
                                    tierId: e.target.value,
                                  })
                                }
                              }}
                              disabled={updateMutation.isPending}
                              className="px-3 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="">Select Tier...</option>
                              {tiers?.map((tier) => (
                                <option key={tier.id} value={tier.id}>
                                  {tier.display_name}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
