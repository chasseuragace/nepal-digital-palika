'use client'

interface CategoryBreakdownProps {
  title: string
  data: Array<{ category: string; count: number }>
}

export function CategoryBreakdown({ title, data }: CategoryBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-panel">
        <h3 className="chart-panel-title">{title}</h3>
        <div className="chart-empty">No data available</div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="chart-panel">
      <h3 className="chart-panel-title">{title}</h3>
      <div className="breakdown-list">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={index} className="breakdown-row">
              <div className="breakdown-row-header">
                <span className="breakdown-row-label">{item.category}</span>
                <span className="breakdown-row-value">{item.count}</span>
              </div>
              <div className="breakdown-bar-track">
                <div
                  className={`breakdown-bar color-${index % 6}`}
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
