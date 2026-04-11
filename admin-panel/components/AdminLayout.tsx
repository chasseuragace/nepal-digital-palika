'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Landmark,
  Calendar,
  FileText,
  Users,
  Building2,
  Image,
  Crown,
  TrendingUp,
  Package,
  Store,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { adminSessionStore, type AdminSession } from '@/lib/storage/session-storage.service'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const session = adminSessionStore.get()
    if (session) {
      setUser(session)
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    adminSessionStore.clear()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/heritage-sites', label: 'Heritage Sites', icon: Landmark },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/blog-posts', label: 'Blog Posts', icon: FileText },
  ]

  const adminNavItems = user.role === 'super_admin' || user.role === 'palika_admin' ? [
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/palika-profile', label: 'Palika Profile', icon: Building2 },
    { href: '/palika-gallery', label: 'Gallery', icon: Image },
    { href: '/tiers', label: 'Tiers', icon: Crown },
  ] : []

  const marketplaceItems = user.role === 'super_admin' || user.role === 'palika_admin' ? [
    { href: '/marketplace/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/marketplace/products', label: 'Products', icon: Package },
    { href: '/marketplace/businesses', label: 'Businesses', icon: Store },
  ] : []

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          <Link href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#fff',
            fontWeight: 600,
            fontSize: '18px',
          }}>
            <Building2 size={24} />
            <span>Nepal Tourism Admin</span>
          </Link>

          <button 
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
            }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            justifyContent: 'center',
          }}>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: isActive(item.href) ? '#fff' : '#cbd5e1',
                  backgroundColor: isActive(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setIsMobileMenuOpen(false)}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#cbd5e1'
                  }
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {adminNavItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: isActive(item.href) ? '#fff' : '#cbd5e1',
                  backgroundColor: isActive(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setIsMobileMenuOpen(false)}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#cbd5e1'
                  }
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {marketplaceItems.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: pathname?.startsWith('/marketplace') ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: pathname?.startsWith('/marketplace') ? '#fff' : '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
                  onMouseEnter={(e) => {
                    if (!pathname?.startsWith('/marketplace')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pathname?.startsWith('/marketplace')) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#cbd5e1'
                    }
                  }}
                >
                  <Store size={18} />
                  <span>Marketplace</span>
                  <ChevronDown 
                    size={16} 
                    style={{
                      transform: isMarketplaceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {isMarketplaceOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    minWidth: '200px',
                    padding: '8px',
                    zIndex: 1000,
                  }}>
                    {marketplaceItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: isActive(item.href) ? '#3b82f6' : '#475569',
                          backgroundColor: isActive(item.href) ? '#eff6ff' : 'transparent',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsMarketplaceOpen(false)
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
              }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>{user.full_name}</span>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                }}>{user.role.replace('_', ' ')}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Logout"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#cbd5e1'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      <main style={{
        flex: 1,
        padding: '24px',
        backgroundColor: '#f8fafc',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {children}
      </main>
    </div>
  )
}