'use client'

import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface SubscriptionPayment {
  id: string
  palika_id: number
  tier_id: string
  amount: number
  period_start: string
  period_end: string
  paid_on: string
  method: 'cash' | 'bank_transfer' | 'cheque' | 'other'
  reference: string | null
  recorded_by: string | null
  created_at: string
}

async function fetchPayments(palikaId: string): Promise<SubscriptionPayment[]> {
  const response = await fetch(`/api/subscriptions/payments/${palikaId}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch payment history')
  }
  const { data } = await response.json()
  return data as SubscriptionPayment[]
}

async function fetchPalika(palikaId: string): Promise<{ id: number; name_en: string } | null> {
  const response = await fetch(`/api/subscriptions/palikas/${palikaId}`)
  if (response.status === 404) return null
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error || 'Failed to fetch palika')
  }
  const { data } = await response.json()
  return data as { id: number; name_en: string }
}

export default function PaymentHistoryPage() {
  const params = useParams<{ palikaId: string }>()
  const palikaId = params?.palikaId ?? ''

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payment-history', palikaId],
    queryFn: () => fetchPayments(palikaId),
    enabled: !!palikaId,
  })

  const { data: palika, isLoading: palikaLoading } = useQuery({
    queryKey: ['palika', palikaId],
    queryFn: () => fetchPalika(palikaId),
    enabled: !!palikaId,
  })

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number): string => {
    return `NPR ${amount.toLocaleString()}`
  }

  const formatMethod = (method: string): string => {
    const methodLabels: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      other: 'Other',
    }
    return methodLabels[method] || method
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payment History</h1>
            <p className="text-slate-600 mt-1">
              {palikaLoading
                ? 'Loading palika…'
                : palika
                  ? `${palika.name_en} (ID: ${palikaId})`
                  : `Palika #${palikaId} — not found`}
            </p>
          </div>
          <Link href="/subscriptions">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Subscriptions
            </Button>
          </Link>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading payment history...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                Error loading payment history: {(error as Error).message}
              </div>
            ) : !payments || payments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No payments recorded yet for this palika.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Paid On</TableHeader>
                    <TableHeader>Period</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Method</TableHeader>
                    <TableHeader>Reference</TableHeader>
                    <TableHeader>Recorded By</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">{formatDate(payment.paid_on)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(payment.period_start)} → {formatDate(payment.period_end)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatAmount(payment.amount)}</TableCell>
                      <TableCell className="text-sm">{formatMethod(payment.method)}</TableCell>
                      <TableCell className="text-sm">{payment.reference || '—'}</TableCell>
                      <TableCell className="text-sm">{payment.recorded_by || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
