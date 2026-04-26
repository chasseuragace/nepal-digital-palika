'use client'

import { useState } from 'react'

interface TrendChartProps {
  title: string
  data: Array<{ date: string; count: number }>
  height?: number
}

export function TrendChart({ title, data, height = 280 }: TrendChartProps) {
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(100)

  if (!data || data.length === 0) {
    return (
      <div className="chart-panel">
        <h3 className="chart-panel-title">{title}</h3>
        <div className="chart-empty">No data available</div>
      </div>
    )
  }

  // Calculate visible data based on slider range
  const startIndex = Math.floor((rangeStart / 100) * data.length)
  const endIndex = Math.ceil((rangeEnd / 100) * data.length)
  const visibleData = data.slice(startIndex, endIndex)

  const maxCount = Math.max(...visibleData.map((d) => d.count), 1)
  const minCount = 0
  const range = maxCount - minCount || 1

  // Calculate Y-axis labels with unique values
  const yAxisSteps = 5
  const stepValue = maxCount / yAxisSteps
  
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const value = maxCount - stepValue * i
    return Math.round(value)
  }).filter((value, index, self) => {
    return self.indexOf(value) === index
  })

  if (yAxisLabels.length < 3) {
    const uniqueLabels = [maxCount]
    if (maxCount > 2) {
      uniqueLabels.push(Math.round(maxCount / 2))
    }
    uniqueLabels.push(0)
    yAxisLabels.length = 0
    yAxisLabels.push(...uniqueLabels)
  }

  const handleRangeChange = (type: 'start' | 'end', value: number) => {
    if (type === 'start') {
      setRangeStart(Math.min(value, rangeEnd - 5))
    } else {
      setRangeEnd(Math.max(value, rangeStart + 5))
    }
  }

  return (
    <div className="chart-panel chart-panel-full">
      <h3 className="chart-panel-title">{title}</h3>
      <div className="trend-chart-container">
        {/* Y-axis */}
        <div className="trend-y-axis">
          {yAxisLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="y-axis-label">
              {label}
            </div>
          ))}
        </div>

        {/* Chart area with grid */}
        <div className="trend-chart-wrapper">
          {/* Grid lines */}
          <div className="trend-grid">
            {yAxisLabels.map((_, index) => (
              <div key={index} className="grid-line" />
            ))}
          </div>

          {/* Bars */}
          <div className="trend-chart" style={{ height: `${height}px` }}>
            {visibleData.map((item, index) => {
              const normalizedHeight = ((item.count - minCount) / range) * 100
              const displayHeight = Math.max(normalizedHeight, 2)
              
              return (
                <div key={index} className="trend-bar-column" title={`${item.count} on ${item.date}`}>
                  <div className="trend-bar-wrap">
                    <div
                      className="trend-bar"
                      style={{ height: `${displayHeight}%` }}
                    >
                      <span className="trend-bar-value">{item.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="trend-x-axis">
            {visibleData.map((item, index) => (
              <div key={index} className="x-axis-label">
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            ))}
          </div>

          {/* Range Slider */}
          <div className="trend-slider-container">
            <div className="trend-slider-info">
              <span className="slider-label">
                {new Date(data[startIndex].date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="slider-label-center">
                Showing {visibleData.length} of {data.length} days
              </span>
              <span className="slider-label">
                {new Date(data[Math.min(endIndex - 1, data.length - 1)].date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="trend-slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={rangeStart}
                onChange={(e) => handleRangeChange('start', Number(e.target.value))}
                className="trend-slider trend-slider-start"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={rangeEnd}
                onChange={(e) => handleRangeChange('end', Number(e.target.value))}
                className="trend-slider trend-slider-end"
              />
              <div className="slider-track">
                <div 
                  className="slider-track-active"
                  style={{
                    left: `${rangeStart}%`,
                    width: `${rangeEnd - rangeStart}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
