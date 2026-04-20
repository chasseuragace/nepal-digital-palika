'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { SummaryCard } from '@/components/SummaryCard'
import { TrendChart } from '@/components/TrendChart'
import { CategoryBreakdown } from '@/components/CategoryBreakdown'
import { VerificationStatusChart } from '@/components/VerificationStatusChart'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import './analytics.css'

interface AnalyticsSummary {
  users: {
    total: number
    newThisWeek: number
    trend: Array<{ date: string; count: number }>
  }
  businesses: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    newThisWeek: number
    trend: Array<{ date: string; count: number }>
  }
  products: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    byVerificationStatus: {
      pending: number
      verified: number
      rejected: number
    }
    trend: Array<{ date: string; count: number }>
  }
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const session = adminSessionStore.get()
        if (!session) {
          throw new Error('No admin session found')
        }

        const palikaRaw = session.palika_id != null ? Number(session.palika_id) : null
        const palikaId = palikaRaw != null && !Number.isNaN(palikaRaw) ? palikaRaw : null

        if (!palikaId) {
          throw new Error('Admin is not assigned to a palika')
        }

        const response = await fetch(`/api/analytics/summary?palika_id=${palikaId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <AdminLayout>
      <div className="analytics-container">
        <div className="analytics-page-header">
          <h1 className="analytics-page-title">Marketplace Analytics</h1>
          <p className="analytics-page-subtitle">
            Palika-scoped overview of users, businesses, and marketplace products.
          </p>
        </div>

        {loading && <div className="analytics-state">Loading analytics…</div>}

        {!loading && error && (
          <div className="analytics-state error">Error: {error}</div>
        )}

        {!loading && !error && !analytics && (
          <div className="analytics-state">No data available</div>
        )}

        {!loading && !error && analytics && (
          <>
            <div className="summary-grid">
              <SummaryCard
                title="Total Users"
                value={analytics.users.total}
                icon="👥"
                trend={{ value: analytics.users.newThisWeek, isPositive: true }}
              />
              <SummaryCard
                title="Total Businesses"
                value={analytics.businesses.total}
                icon="🏢"
                trend={{ value: analytics.businesses.newThisWeek, isPositive: true }}
              />
              <SummaryCard
                title="Total Products"
                value={analytics.products.total}
                icon="📦"
                trend={{
                  value: analytics.products.byVerificationStatus.pending,
                  isPositive: false,
                }}
              />
              <SummaryCard
                title="Pending Verification"
                value={analytics.products.byVerificationStatus.pending}
                icon="⏳"
              />
            </div>

            <div className="chart-row">
              <TrendChart title="User Growth (30 days)" data={analytics.users.trend} />
              <TrendChart title="Business Growth (30 days)" data={analytics.businesses.trend} />
            </div>

            <div className="chart-row">
              <TrendChart title="Product Growth (30 days)" data={analytics.products.trend} />
              <VerificationStatusChart
                pending={analytics.products.byVerificationStatus.pending}
                verified={analytics.products.byVerificationStatus.verified}
                rejected={analytics.products.byVerificationStatus.rejected}
              />
            </div>

            <div className="chart-row">
              <CategoryBreakdown
                title="Products by Category"
                data={analytics.products.byCategory}
              />
              <CategoryBreakdown
                title="Businesses by Category"
                data={analytics.businesses.byCategory}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
