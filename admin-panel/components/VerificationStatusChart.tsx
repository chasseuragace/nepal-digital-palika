'use client'

interface VerificationStatusChartProps {
  pending: number
  verified: number
  rejected: number
}

export function VerificationStatusChart({
  pending,
  verified,
  rejected,
}: VerificationStatusChartProps) {
  const total = pending + verified + rejected
  const rows: Array<{ label: string; value: number; statusClass: string }> = [
    { label: 'Pending', value: pending, statusClass: 'pending' },
    { label: 'Verified', value: verified, statusClass: 'verified' },
    { label: 'Rejected', value: rejected, statusClass: 'rejected' },
  ]

  return (
    <div className="chart-panel">
      <h3 className="chart-panel-title">Verification Status</h3>
      <div className="breakdown-list">
        {rows.map((row) => {
          const percentage = total > 0 ? (row.value / total) * 100 : 0
          return (
            <div key={row.label} className="breakdown-row">
              <div className="breakdown-row-header">
                <span className="breakdown-row-label">{row.label}</span>
                <span className={`breakdown-row-value ${row.statusClass}`}>{row.value}</span>
              </div>
              <div className="breakdown-bar-track">
                <div
                  className={`breakdown-bar status-${row.statusClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
