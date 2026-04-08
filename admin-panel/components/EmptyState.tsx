'use client'

import React from 'react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <div className="empty-state-title">
        {title}
      </div>
      <div className="empty-state-description">
        {description}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
          style={{ marginTop: '8px' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
