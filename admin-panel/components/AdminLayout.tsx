'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Landmark,
  Calendar,
  Sparkles,
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
  AlertTriangle,
  Menu,
  ArrowLeft
} from 'lucide-react'
import { adminSessionStore, type AdminSession } from '@/lib/storage/session-storage.service'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [isSosOpen, setIsSosOpen] = useState(false)
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Cookie clear is best-effort; local clear still runs.
    }
    adminSessionStore.clear()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path
  const isActiveSection = (prefix: string) => pathname?.startsWith(prefix)

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
    { href: '/festivals', label: 'Festivals', icon: Sparkles },
    { href: '/blog-posts', label: 'Blog Posts', icon: FileText },
  ]

  const sosItems = [
    { href: '/sos', label: 'SOS Requests', icon: AlertTriangle },
    { href: '/sos/providers', label: 'Service Providers', icon: Users },
  ]

  const adminNavItems = user.role === 'super_admin' || user.role === 'palika_admin' ? [
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/admins', label: 'Admins', icon: Users },
    { href: '/palika-profile', label: 'Palika Profile', icon: Building2 },
    { href: '/palika-gallery', label: 'Gallery', icon: Image },
    { href: '/tiers', label: 'Tiers', icon: Crown },
  ] : []

  const marketplaceItems = user.role === 'super_admin' || user.role === 'palika_admin' ? [
    { href: '/marketplace/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/marketplace/products', label: 'Products', icon: Package },
    { href: '/marketplace/businesses', label: 'Businesses', icon: Store },
  ] : []

  const sidebarWidth = 280

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? sidebarWidth : 0,
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        boxShadow: isSidebarOpen ? '2px 0 4px rgba(0,0,0,0.1)' : 'none',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 999,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: sidebarWidth,
          padding: '20px 0',
        }}>
          {/* Logo */}
          <Link href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#fff',
            fontWeight: 600,
            fontSize: '16px',
            padding: '0 16px',
            marginBottom: '32px',
          }}>
            <Building2 size={24} />
            <span>Digital Palika</span>
          </Link>

          {/* Nav Sections */}
          <nav style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
          }}>
            {/* Main Navigation */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#94a3b8',
                padding: '0 16px',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>Content</div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: isActive(item.href) ? '#fff' : '#cbd5e1',
                    backgroundColor: isActive(item.href) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    marginLeft: '8px',
                    marginRight: '8px',
                  }}
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
            </div>

            {/* SOS Management */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#94a3b8',
                padding: '0 16px',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>Emergency</div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActiveSection('/sos') ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isActiveSection('/sos') ? '#fff' : '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  marginLeft: '8px',
                  marginRight: '8px',
                  textAlign: 'left',
                }}
                onClick={() => setIsSosOpen(!isSosOpen)}
                onMouseEnter={(e) => {
                  if (!isActiveSection('/sos')) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveSection('/sos')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#cbd5e1'
                  }
                }}
              >
                <AlertTriangle size={18} />
                <span>SOS Management</span>
                <ChevronDown
                  size={16}
                  style={{
                    marginLeft: 'auto',
                    transform: isSosOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
              {isSosOpen && sosItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px 10px 40px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: isActive(item.href) ? '#fff' : '#cbd5e1',
                    backgroundColor: isActive(item.href) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
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
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Admin */}
            {adminNavItems.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  padding: '0 16px',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}>Administration</div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: isActive(item.href) ? '#fff' : '#cbd5e1',
                      backgroundColor: isActive(item.href) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      marginLeft: '8px',
                      marginRight: '8px',
                    }}
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
              </div>
            )}

            {/* Marketplace */}
            {marketplaceItems.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  padding: '0 16px',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}>Marketplace</div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActiveSection('/marketplace') ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: isActiveSection('/marketplace') ? '#fff' : '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    marginLeft: '8px',
                    marginRight: '8px',
                    textAlign: 'left',
                  }}
                  onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
                  onMouseEnter={(e) => {
                    if (!isActiveSection('/marketplace')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveSection('/marketplace')) {
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
                      marginLeft: 'auto',
                      transform: isMarketplaceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {isMarketplaceOpen && marketplaceItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px 10px 40px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: isActive(item.href) ? '#fff' : '#cbd5e1',
                      backgroundColor: isActive(item.href) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
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
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
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
                flexShrink: 0,
              }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: 0,
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{user.full_name}</span>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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
                flexShrink: 0,
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
      </aside>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        marginLeft: isSidebarOpen ? sidebarWidth : 0,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Toggle Sidebar Button */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fff',
        }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#1e293b',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {isSidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: '24px',
          backgroundColor: '#f8fafc',
          overflowY: 'auto',
        }}>
          {children}
        </main>

        {/* ArrowLeft Button at End */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#fff',
        }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#1e293b',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {isSidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}