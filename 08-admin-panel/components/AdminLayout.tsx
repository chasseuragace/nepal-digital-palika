'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  palika_id?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      setUser(JSON.parse(adminSession))
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <nav className="nav">
        <ul>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/heritage-sites">Heritage Sites</Link></li>
          <li><Link href="/events">Events</Link></li>
          <li><Link href="/blog-posts">Blog Posts</Link></li>
          <li><Link href="/media">Media</Link></li>
          {user.role === 'super_admin' || user.role === 'palika_admin' ? (
            <li><Link href="/users">Users</Link></li>
          ) : null}
          <li style={{ marginLeft: 'auto' }}>
            <span style={{ color: '#ccc', marginRight: '10px' }}>
              {user.full_name} ({user.role})
            </span>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: '1px solid #ccc', 
                color: 'white', 
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  )
}