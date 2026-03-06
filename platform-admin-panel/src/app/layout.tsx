import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import { AuthInitializer } from '@/components/AuthInitializer'
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Panel - Nepal Digital Tourism (Dev)',
  description: 'Internal developer admin panel for platform management. Manages admins, roles, permissions, regions, subscriptions, and audit logs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthInitializer />
          <AuthLoadingScreen />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
