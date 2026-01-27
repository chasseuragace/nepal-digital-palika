import { create } from 'zustand'
import { AdminUser } from './types'

interface AuthStore {
  user: AdminUser | null
  isLoading: boolean
  setUser: (user: AdminUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}))
