'use client'

import AdminLayout from '@/components/AdminLayout'

export default function UsersPage() {
  return (
    <AdminLayout>
      <h1>User Management</h1>
      
      <div className="card">
        <h3>Admin Users</h3>
        <p>User management functionality coming soon...</p>
        
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" style={{ marginRight: '10px' }}>
            Add New User
          </button>
          <button className="btn btn-secondary">
            Manage Permissions
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}