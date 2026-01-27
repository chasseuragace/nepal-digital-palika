'use client'

import { useAuthStore } from '@/lib/auth-store'
import { Bell, User } from 'lucide-react'

export function Header() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Welcome back, {user?.full_name}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <User className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  )
}
