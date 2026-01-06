import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nepal Tourism Admin Panel',
  description: 'Content management system for Nepal Digital Tourism Infrastructure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}