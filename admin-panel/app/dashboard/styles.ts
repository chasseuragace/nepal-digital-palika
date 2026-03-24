// Reusable style objects for dashboard
export const styles = {
  // Card styles
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb'
  },

  // Stat card styles
  statCardBlue: {
    background: '#f0f7ff',
    borderRadius: '12px',
    padding: '24px',
    color: '#1f2937',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e0eef9',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },

  statCardWhite: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    color: '#1f2937',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },

  // Text styles
  heading1: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '8px'
  },

  heading2: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0
  },

  heading3: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '20px'
  },

  sectionHeading: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  label: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: '6px'
  },

  // Button styles
  buttonBlue: {
    width: '100%',
    padding: '14px 20px',
    background: '#f0f7ff',
    color: '#3b82f6',
    border: '1px solid #e0eef9',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'left' as const
  },

  buttonWhite: {
    width: '100%',
    padding: '14px 20px',
    background: '#ffffff',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'left' as const
  },

  // Info box styles
  infoBoxBlue: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    borderLeft: '3px solid #3b82f6'
  },

  infoBoxYellow: {
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    borderLeft: '3px solid #f59e0b'
  },

  infoBoxBlueLight: {
    padding: '16px',
    backgroundColor: '#dbeafe',
    borderRadius: '8px',
    borderLeft: '3px solid #3b82f6'
  },

  infoBoxIndigo: {
    padding: '16px',
    backgroundColor: '#e0e7ff',
    borderRadius: '8px',
    borderLeft: '3px solid #6366f1'
  },

  infoBoxGreen: {
    padding: '16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    borderLeft: '3px solid #10b981'
  },

  infoBoxRed: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    borderLeft: '3px solid #ef4444'
  },

  infoBoxGray: {
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    borderLeft: '3px solid #6b7280'
  },

  // Gradient boxes
  gradientBlue: {
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    color: 'white'
  },

  gradientPink: {
    padding: '20px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderRadius: '8px',
    color: 'white'
  }
}

export const hoverEffects = {
  statCard: {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget as HTMLDivElement
      target.style.transform = 'translateY(-4px)'
      target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget as HTMLDivElement
      target.style.transform = 'translateY(0)'
      target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
    }
  },

  buttonBlue: {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget as HTMLButtonElement
      target.style.transform = 'translateY(-2px)'
      target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
      target.style.background = '#e0eef9'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget as HTMLButtonElement
      target.style.transform = 'translateY(0)'
      target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
      target.style.background = '#f0f7ff'
    }
  },

  buttonWhite: {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget as HTMLButtonElement
      target.style.transform = 'translateY(-2px)'
      target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
      target.style.background = '#f9fafb'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget as HTMLButtonElement
      target.style.transform = 'translateY(0)'
      target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
      target.style.background = '#ffffff'
    }
  }
}
