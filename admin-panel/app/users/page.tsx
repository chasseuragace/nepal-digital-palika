'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Shield, Search, Filter, Edit, Trash2, Eye, Mail, Phone, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import './users.css'

interface User {
  id: string
  full_name: string
  email: string
  role: 'super_admin' | 'palika_admin' | 'moderator'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  last_login?: string
  phone?: string
  palika_name?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; user: User | null }>({ show: false, user: null })

  useEffect(() => {
    // Mock data for demonstration
    const mockUsers: User[] = [
      {
        id: '1',
        full_name: 'Aayush Koirala',
        email: 'aayush@palika.gov.np',
        role: 'super_admin',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        last_login: '2024-04-17T08:45:00Z',
        phone: '+977-9841234567',
        palika_name: 'Kathmandu Metropolitan City'
      },
      {
        id: '2',
        full_name: 'Ramesh Sharma',
        email: 'ramesh@palika.gov.np',
        role: 'palika_admin',
        status: 'active',
        created_at: '2024-02-20T14:15:00Z',
        last_login: '2024-04-16T16:30:00Z',
        phone: '+977-9856789012',
        palika_name: 'Lalitpur Metropolitan City'
      },
      {
        id: '3',
        full_name: 'Sita Gurung',
        email: 'sita@palika.gov.np',
        role: 'moderator',
        status: 'pending',
        created_at: '2024-03-10T09:00:00Z',
        phone: '+977-9823456789',
        palika_name: 'Pokhara Metropolitan City'
      },
      {
        id: '4',
        full_name: 'Bikram Thapa',
        email: 'bikram@palika.gov.np',
        role: 'palika_admin',
        status: 'inactive',
        created_at: '2024-01-25T11:20:00Z',
        last_login: '2024-03-15T12:00:00Z',
        phone: '+977-9876543210',
        palika_name: 'Bharatpur Metropolitan City'
      }
    ]
    
    setTimeout(() => {
      setUsers(mockUsers)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.palika_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'badge-success',
      inactive: 'badge-error', 
      pending: 'badge-warning'
    }
    return styles[status as keyof typeof styles] || 'badge-info'
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: '#dc2626',
      palika_admin: '#2563eb',
      moderator: '#059669'
    }
    return colors[role as keyof typeof colors] || '#6b7280'
  }

  const handleDeleteUser = () => {
    if (deleteModal.user) {
      setUsers(users.filter(u => u.id !== deleteModal.user!.id))
      setMessage({ type: 'success', text: `${deleteModal.user.full_name} has been removed successfully` })
      setDeleteModal({ show: false, user: null })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="users-container">
        {/* Page Header */}
        <div className="users-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <Users size={32} />
            </div>
            <div>
              <h1 className="page-title">User Management</h1>
              <p className="page-subtitle">Manage admin users, roles, and permissions</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/permissions')}
            >
              <Shield size={18} />
              Manage Permissions
            </button>
            <button 
              className="btn btn-primary header-add-btn"
              onClick={() => router.push('/users/new')}
            >
              <UserPlus size={18} />
              Add New User
            </button>
          </div>
        </div>

        <div className="users-content">
          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {message.text}
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard 
              label="Total Users" 
              value={users.length} 
              icon={<Users size={20} />} 
              color="#3b82f6" 
              description="All registered users"
            />
            <StatCard 
              label="Active Users" 
              value={users.filter(u => u.status === 'active').length} 
              icon={<CheckCircle size={20} />} 
              color="#10b981" 
              description="Currently active"
            />
            <StatCard 
              label="Pending" 
              value={users.filter(u => u.status === 'pending').length} 
              icon={<AlertCircle size={20} />} 
              color="#f59e0b" 
              description="Awaiting approval"
            />
            <StatCard 
              label="Inactive" 
              value={users.filter(u => u.status === 'inactive').length} 
              icon={<XCircle size={20} />} 
              color="#ef4444" 
              description="Not active"
            />
          </div>

          {/* Filters */}
          <div className="filters-card">
            <div className="filters-header">
              <div className="filters-title">
                <Filter size={18} />
                <span>Filters</span>
              </div>
              
              <div className="filter-controls">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or palika..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="palika_admin">Palika Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            <div className="results-info">
              <Info size={16} />
              <span>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all') && ' • Filters applied'}
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-card">
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Palika</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{user.full_name}</div>
                              <div className="user-email">
                                <Mail size={12} />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="user-phone">
                                  <Phone size={12} />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {user.palika_name || '-'}
                        </td>
                        <td>
                          <div className="date-cell">
                            <div className="date-primary">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                            <div className="date-secondary">
                              {new Date(user.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.last_login ? (
                            <div className="date-cell">
                              <div className="date-primary">
                                {new Date(user.last_login).toLocaleDateString()}
                              </div>
                              <div className="date-secondary">
                                {new Date(user.last_login).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Never</span>
                          )}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-btn"
                              onClick={() => router.push(`/users/${user.id}`)}
                              title="View User"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => router.push(`/users/${user.id}`)}
                              title="Edit User"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => setDeleteModal({ show: true, user })}
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="empty-state">
                          <Users size={48} className="empty-state-icon" />
                          <div className="empty-state-title">No users found</div>
                          <div className="empty-state-description">
                            Try adjusting your search or filters
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.user && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, user: null })}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">
                <AlertCircle size={24} />
              </div>
              <h3 className="modal-title">Delete User</h3>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to delete <strong>{deleteModal.user.full_name}</strong>?
              </p>
              <p className="modal-warning">
                This action cannot be undone. All user data and permissions will be permanently removed.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ show: false, user: null })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteUser}
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

// ─── Sub-components ───

function StatCard({ label, value, icon, color, description }: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  description?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {description && (
          <div className="stat-description">
            <Info size={10} />
            {description}
          </div>
        )}
      </div>
    </div>
  )
}