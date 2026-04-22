'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RenewModalProps {
  isOpen: boolean
  onClose: () => void
  palikaId: number
  palikaName: string
  currentTierId: string
  tiers: Array<{
    id: string
    display_name: string
    cost_per_month: number
    cost_per_year: number
  }>
}

export default function RenewModal({
  isOpen,
  onClose,
  palikaId,
  palikaName,
  currentTierId,
  tiers,
}: RenewModalProps) {
  const queryClient = useQueryClient()
  const [tierId, setTierId] = useState(currentTierId)
  const [periodMonths, setPeriodMonths] = useState(12)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'other'>('cash')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentTier = tiers.find((t) => t.id === tierId)

  // Update amount when tier or period changes
  useEffect(() => {
    if (currentTier) {
      if (periodMonths === 12) {
        setAmount(currentTier.cost_per_year)
      } else {
        setAmount(currentTier.cost_per_month * periodMonths)
      }
    }
  }, [currentTier, periodMonths])

  // Reset form when modal opens with new palika
  useEffect(() => {
    if (isOpen) {
      setTierId(currentTierId)
      setPeriodMonths(12)
      setReference('')
      setError(null)
    }
  }, [isOpen, currentTierId])

  const renewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/subscriptions/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to renew subscription')
      }
      return response.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['palikas-with-tiers'] })
      const newEndDate = result.data?.period_end
        ? new Date(result.data.period_end).toISOString().split('T')[0]
        : 'unknown'
      alert(`Subscription renewed — new end date: ${newEndDate}`)
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    renewMutation.mutate({
      palikaId,
      tierId,
      amount,
      periodMonths,
      method,
      reference: reference || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Renew Subscription — {palikaName}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tier</label>
            <select
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
            <select
              value={periodMonths}
              onChange={(e) => {
                const months = Number(e.target.value)
                setPeriodMonths(months)
                if (currentTier) {
                  if (months === 12) {
                    setAmount(currentTier.cost_per_year)
                  } else {
                    setAmount(currentTier.cost_per_month * months)
                  }
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (NPR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reference / Note (optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt #, transaction ID, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              disabled={renewMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={renewMutation.isPending}
            >
              {renewMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
