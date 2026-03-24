'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminSession', JSON.stringify(data.user))
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Building2 size={40} />
            </div>
            <h1 className="login-title">Nepal Tourism Admin</h1>
            <p className="login-subtitle">Sign in to manage your palika</p>
          </div>

          {error && (
            <div className="login-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>Development Mode</span>
          </div>

          <button 
            className="test-credentials-toggle"
            onClick={() => setShowCredentials(!showCredentials)}
          >
            {showCredentials ? 'Hide' : 'Show'} Test Credentials
          </button>

          {showCredentials && (
            <div className="test-credentials">
              <div className="credential-item">
                <div className="credential-header">
                  <span className="credential-badge super-admin">Super Admin</span>
                </div>
                <div className="credential-details">
                  <p className="credential-email">superadmin@nepaltourism.dev</p>
                  <p className="credential-password">SuperSecurePass123!</p>
                </div>
                <button 
                  className="quick-login-btn"
                  onClick={() => quickLogin('superadmin@nepaltourism.dev', 'SuperSecurePass123!')}
                >
                  Quick Login
                </button>
              </div>

              <div className="credential-item">
                <div className="credential-header">
                  <span className="credential-badge palika-admin">Palika Admin</span>
                </div>
                <div className="credential-details">
                  <p className="credential-email">palika.admin@kathmandu.gov.np</p>
                  <p className="credential-password">KathmanduAdmin456!</p>
                </div>
                <button 
                  className="quick-login-btn"
                  onClick={() => quickLogin('palika.admin@kathmandu.gov.np', 'KathmanduAdmin456!')}
                >
                  Quick Login
                </button>
              </div>

              <div className="credential-item">
                <div className="credential-header">
                  <span className="credential-badge moderator">Moderator</span>
                </div>
                <div className="credential-details">
                  <p className="credential-email">content.moderator@kathmandu.gov.np</p>
                  <p className="credential-password">ModeratorSecure789!</p>
                </div>
                <button 
                  className="quick-login-btn"
                  onClick={() => quickLogin('content.moderator@kathmandu.gov.np', 'ModeratorSecure789!')}
                >
                  Quick Login
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} Nepal Tourism Admin. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}