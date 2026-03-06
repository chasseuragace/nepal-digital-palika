'use client'

import { useAuthStore } from '@/lib/auth-store'
import { usePathname } from 'next/navigation'

/**
 * Shows loading screen while auth is initializing
 */
export function AuthLoadingScreen() {
  const isLoading = useAuthStore((state) => state.isLoading)
  const pathname = usePathname()

  // Don't show loading on login page
  if (pathname === '/login' || !isLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
