'use client'

interface SkeletonLoaderProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export default function SkeletonLoader({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  style = {},
}: SkeletonLoaderProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e2e8f0',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
