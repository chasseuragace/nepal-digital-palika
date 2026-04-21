'use client'

import { Bell, User } from 'lucide-react'

export function Header() {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Platform Admin</h2>
        <p className="text-sm text-slate-500">Nepal Digital Tourism — Internal Dev Panel</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <User className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  )
}
