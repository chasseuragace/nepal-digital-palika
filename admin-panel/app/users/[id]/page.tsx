'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter, useParams } from 'next/navigation'
import '../users.css'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'moderator',
    status: 'active',
    palika_name: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setFormData({
        full_name: 'Aayush Koirala',
        email: 'aayush@palika.gov.np',
        phone: '+977-9841234567',
        role: 'super_admin',
        status: 'active',
        palika_name: 'Kathmandu Metropolitan City'
      })
      setIsLoading(false)
    }, 500)
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('User updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/users')
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="users-container">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading user...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="users-container">
        <div className="users-page-header">
          <div className="header-content">
            <div>
              <h1 className="page-title">{isEditing ? 'Edit User' : 'User Details'}</h1>
              <p className="page-subtitle">{formData.full_name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isEditing && (
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit User
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete User
                </button>
              </>
            )}
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => router.push('/users')}
            >
              ← Back to Users
            </button>
          </div>
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
            {isEditing ? (
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

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="user-details">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Full Name</label>
                      <div>{formData.full_name}</div>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <div>{formData.email}</div>
                    </div>
                    <div className="detail-item">
                      <label>Phone</label>
                      <div>{formData.phone || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Role</label>
                      <div>
                        <span className={`role-badge ${formData.role}`}>
                          {formData.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div>
                        <span className={`status-badge ${formData.status}`}>
                          {formData.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Palika</label>
                      <div>{formData.palika_name || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
