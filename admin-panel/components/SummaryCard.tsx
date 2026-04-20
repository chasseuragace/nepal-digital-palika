'use client'

interface SummaryCardProps {
  title: string
  value: number
  icon: string
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

export function SummaryCard({ title, value, icon, trend, onClick }: SummaryCardProps) {
  const className = onClick ? 'summary-card clickable' : 'summary-card'
  return (
    <div onClick={onClick} className={className}>
      <div>
        <p className="summary-card-label">{title}</p>
        <p className="summary-card-value">{value.toLocaleString()}</p>
        {trend && (
          <p className={`summary-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)} this week
          </p>
        )}
      </div>
      <div className="summary-card-icon">{icon}</div>
    </div>
  )
}
