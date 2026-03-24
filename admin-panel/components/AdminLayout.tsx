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
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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

  const isActive = (path: string) => pathname === path

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
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
    <div className="admin-layout">
      <nav className="modern-nav">
        <div className="nav-container">
          <Link href="/dashboard" className="nav-brand">
            <Building2 className="brand-icon" />
            <span className="brand-text">Nepal Tourism Admin</span>
          </Link>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {adminNavItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {marketplaceItems.length > 0 && (
              <div className="nav-dropdown">
                <button 
                  className={`nav-link dropdown-trigger ${pathname?.startsWith('/marketplace') ? 'active' : ''}`}
                  onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
                >
                  <Store size={18} />
                  <span>Marketplace</span>
                  <ChevronDown size={16} className={`dropdown-icon ${isMarketplaceOpen ? 'open' : ''}`} />
                </button>
                {isMarketplaceOpen && (
                  <div className="dropdown-menu">
                    {marketplaceItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href} 
                        className={`dropdown-item ${isActive(item.href) ? 'active' : ''}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsMarketplaceOpen(false)
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

          <div className="nav-user">
            <div className="user-info">
              <div className="user-avatar">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="logout-btn"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}