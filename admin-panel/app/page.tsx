'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminSessionStore } from '@/lib/storage/session-storage.service'

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    if (adminSessionStore.exists()) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return null
}