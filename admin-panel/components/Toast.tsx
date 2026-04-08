'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = {
    success: {
      icon: <CheckCircle size={20} />,
      bg: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
    },
    error: {
      icon: <XCircle size={20} />,
      bg: '#fee2e2',
      border: '#ef4444',
      text: '#991b1b',
    },
    warning: {
      icon: <AlertCircle size={20} />,
      bg: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
    },
    info: {
      icon: <Info size={20} />,
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
    },
  }

  const style = config[type]

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '480px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div style={{ color: style.text, flexShrink: 0 }}>
        {style.icon}
      </div>
      <div style={{ flex: 1, color: style.text, fontSize: '14px', lineHeight: '1.5' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: style.text,
          opacity: 0.7,
          flexShrink: 0,
        }}
      >
        <X size={18} />
      </button>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
