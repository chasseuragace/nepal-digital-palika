'use client'

interface TrendChartProps {
  title: string
  data: Array<{ date: string; count: number }>
  height?: number
}

export function TrendChart({ title, data, height = 220 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-panel">
        <h3 className="chart-panel-title">{title}</h3>
        <div className="chart-empty">No data available</div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const minCount = Math.min(...data.map((d) => d.count), 0)
  const range = maxCount - minCount || 1

  return (
    <div className="chart-panel">
      <h3 className="chart-panel-title">{title}</h3>
      <div className="trend-chart" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const normalizedHeight = ((item.count - minCount) / range) * 100
          return (
            <div key={index} className="trend-bar-column">
              <div className="trend-bar-wrap">
                <div
                  className="trend-bar"
                  style={{ height: `${Math.max(normalizedHeight, 2)}%` }}
                  title={`${item.date}: ${item.count}`}
                />
              </div>
              <span className="trend-bar-label">
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
