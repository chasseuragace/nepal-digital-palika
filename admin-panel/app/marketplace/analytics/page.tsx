'use client'

import { useEffect, useState } from 'react'
import { SummaryCard } from '@/components/SummaryCard'
import { TrendChart } from '@/components/TrendChart'
import { CategoryBreakdown } from '@/components/CategoryBreakdown'
import { VerificationStatusChart } from '@/components/VerificationStatusChart'

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
        // Get palika_id from admin session
        const adminSession = localStorage.getItem('adminSession')
        if (!adminSession) {
          throw new Error('No admin session found')
        }
        
        const admin = JSON.parse(adminSession)
        const palikaId = admin.palika_id ? parseInt(admin.palika_id, 10) : null
        
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Marketplace Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            trend={{ value: analytics.products.byVerificationStatus.pending, isPositive: false }}
          />
          <SummaryCard
            title="Pending Verification"
            value={analytics.products.byVerificationStatus.pending}
            icon="⏳"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart title="User Growth (30 days)" data={analytics.users.trend} />
          <TrendChart title="Business Growth (30 days)" data={analytics.businesses.trend} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart title="Product Growth (30 days)" data={analytics.products.trend} />
          <VerificationStatusChart
            pending={analytics.products.byVerificationStatus.pending}
            verified={analytics.products.byVerificationStatus.verified}
            rejected={analytics.products.byVerificationStatus.rejected}
          />
        </div>

        {/* Category Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryBreakdown title="Products by Category" data={analytics.products.byCategory} />
          <CategoryBreakdown title="Businesses by Category" data={analytics.businesses.byCategory} />
        </div>
      </div>
    </div>
  )
}
