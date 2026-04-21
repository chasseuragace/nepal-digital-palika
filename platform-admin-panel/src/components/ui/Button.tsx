import { ReactNode } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = variant ? `btn-${variant}` : 'btn-primary'

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
