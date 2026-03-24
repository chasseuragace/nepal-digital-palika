import Link from 'next/link'
import { styles, hoverEffects } from './styles'

interface StatCardProps {
  title: string
  value: number
  href: string
  isBlue?: boolean
  color?: string
}

export function StatCard({ title, value, href, isBlue = true, color }: StatCardProps) {
  return (
    <div
      style={isBlue ? styles.statCardBlue : styles.statCardWhite}
      {...hoverEffects.statCard}
      onClick={() => (window.location.href = href)}
    >
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
        {title}
      </div>
      <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px', color: color || (isBlue ? '#3b82f6' : '#1f2937') }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>
        Click to manage →
      </div>
    </div>
  )
}

interface InfoBoxProps {
  label: string
  value: string | number
  variant?: 'blue' | 'yellow' | 'blueLight' | 'indigo' | 'green' | 'red' | 'gray'
}

export function InfoBox({ label, value, variant = 'blue' }: InfoBoxProps) {
  const variantMap = {
    blue: styles.infoBoxBlue,
    yellow: styles.infoBoxYellow,
    blueLight: styles.infoBoxBlueLight,
    indigo: styles.infoBoxIndigo,
    green: styles.infoBoxGreen,
    red: styles.infoBoxRed,
    gray: styles.infoBoxGray
  }

  const colorMap = {
    blue: '#1f2937',
    yellow: '#78350f',
    blueLight: '#1e3a8a',
    indigo: '#312e81',
    green: '#047857',
    red: '#7f1d1d',
    gray: '#1f2937'
  }

  return (
    <div style={variantMap[variant]}>
      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: colorMap[variant] }}>
        {value}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  href: string
  label: string
  icon: string
  isBlue?: boolean
}

export function ActionButton({ href, label, icon, isBlue = true }: ActionButtonProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <button
        style={isBlue ? styles.buttonBlue : styles.buttonWhite}
        {...(isBlue ? hoverEffects.buttonBlue : hoverEffects.buttonWhite)}
      >
        {icon} {label}
      </button>
    </Link>
  )
}

interface SectionHeadingProps {
  title: string
  status?: string
  statusColor?: string
}

export function SectionHeading({ title, status, statusColor }: SectionHeadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f3f4f6'
      }}
    >
      <h2 style={styles.heading2}>{title}</h2>
      {status && (
        <span
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: statusColor || '#d1fae5',
            color: statusColor === '#fee2e2' ? '#991b1b' : '#065f46'
          }}
        >
          {status}
        </span>
      )}
    </div>
  )
}
