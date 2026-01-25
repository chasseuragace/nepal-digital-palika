'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
        // Store session in localStorage (temporary solution)
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

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '100px auto' }}>
        <div className="card">
          <h1>Nepal Tourism Admin Login</h1>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="superadmin@nepaltourism.dev"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="SuperSecurePass123!"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <h3>Test Credentials (Local Supabase):</h3>
            <p><strong>Super Admin:</strong></p>
            <p style={{ marginLeft: '20px' }}>Email: superadmin@nepaltourism.dev</p>
            <p style={{ marginLeft: '20px' }}>Password: SuperSecurePass123!</p>
            
            <p style={{ marginTop: '10px' }}><strong>Palika Admin (Kathmandu):</strong></p>
            <p style={{ marginLeft: '20px' }}>Email: palika.admin@kathmandu.gov.np</p>
            <p style={{ marginLeft: '20px' }}>Password: KathmanduAdmin456!</p>
            
            <p style={{ marginTop: '10px' }}><strong>Content Moderator:</strong></p>
            <p style={{ marginLeft: '20px' }}>Email: content.moderator@kathmandu.gov.np</p>
            <p style={{ marginLeft: '20px' }}>Password: ModeratorSecure789!</p>
          </div>
        </div>
      </div>
    </div>
  )
}