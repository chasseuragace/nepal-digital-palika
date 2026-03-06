import { create } from 'zustand'
import { supabase } from './supabase'
import { AdminUser } from './types'

interface AuthStore {
  user: AdminUser | null
  isLoading: boolean
  setUser: (user: AdminUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore server errors — always log out locally
    }
    set({ user: null })
  },
}))
