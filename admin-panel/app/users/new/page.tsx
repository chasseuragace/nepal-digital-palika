'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/navigation'
import '../users.css'

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'moderator',
    palika_id: '',
    password: '',
    confirm_password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('User created successfully!')
      setTimeout(() => {
        router.push('/users')
      }, 2000)
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="users-container">
        <div className="users-page-header">
          <div className="header-content">
            <div>
              <h1 className="page-title">Add New User</h1>
              <p className="page-subtitle">Create a new admin user account</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => router.push('/users')}
          >
            ← Back to Users
          </button>
        </div>

        <div className="users-content">
          {error && (
            <div className="message-alert error">
              {error}
            </div>
          )}

          {success && (
            <div className="message-alert success">
              {success}
            </div>
          )}

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+977-9841234567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="moderator">Moderator</option>
                    <option value="palika_admin">Palika Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Security</h3>
                
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <small>Minimum 8 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => router.push('/users')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
