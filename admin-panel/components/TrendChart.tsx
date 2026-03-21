'use client'

interface TrendChartProps {
  title: string
  data: Array<{ date: string; count: number }>
  height?: number
}

export function TrendChart({ title, data, height = 300 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const minCount = Math.min(...data.map(d => d.count), 0)
  const range = maxCount - minCount || 1

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height: `${height}px` }} className="flex items-end gap-1">
        {data.map((item, index) => {
          const normalizedHeight = ((item.count - minCount) / range) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                style={{ height: `${Math.max(normalizedHeight, 5)}%` }}
                title={`${item.date}: ${item.count}`}
              />
              <span className="text-xs text-gray-500 mt-2 text-center truncate w-full">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
