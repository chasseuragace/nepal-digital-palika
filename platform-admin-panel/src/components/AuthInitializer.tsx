'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth-store'

/**
 * Initializes auth on app load and protects routes
 * - Syncs Supabase session with auth store
 * - Redirects to /login if user is not authenticated
 */
export function AuthInitializer() {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setLoading, user } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setUser(null)
          // Redirect to login if not on login page
          if (mounted && pathname !== '/login') {
            router.push('/login')
          }
          return
        }

        // Fetch admin user data
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, auth_id, full_name, email, role, palika_id, created_at')
          .eq('auth_id', session.user.id)
          .single()

        if (mounted) {
          if (adminUser) {
            setUser({
              id: adminUser.id,
              auth_id: adminUser.auth_id,
              full_name: adminUser.full_name,
              email: adminUser.email,
              role: adminUser.role,
              palika_id: adminUser.palika_id,
              created_at: adminUser.created_at,
            })
          } else {
            // User authenticated but no admin record
            await supabase.auth.signOut()
            setUser(null)
            router.push('/login')
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (!session) {
        setUser(null)
        if (pathname !== '/login') {
          router.push('/login')
        }
      } else {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, auth_id, full_name, email, role, palika_id, created_at')
          .eq('auth_id', session.user.id)
          .single()

        if (adminUser) {
          setUser({
            id: adminUser.id,
            auth_id: adminUser.auth_id,
            full_name: adminUser.full_name,
            email: adminUser.email,
            role: adminUser.role,
            palika_id: adminUser.palika_id,
            created_at: adminUser.created_at,
          })
        }
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [pathname, router, setUser, setLoading])

  // Don't render anything, just manages auth state
  return null
}
