'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface AdminUser {
  full_name: string
}

interface AuditLogEntry {
  id: number
  admin_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  entity_type: string
  entity_id: string
  changes: Record<string, any>
  created_at: string
  admin_users: AdminUser | null
}

interface ApiResponse {
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

interface ExpandedEntry {
  id: number
  isOpen: boolean
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(20)
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchAuditLog()
  }, [search, actionFilter, entityTypeFilter, dateFrom, dateTo, currentPage])

  const fetchAuditLog = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (actionFilter) params.append('action_filter', actionFilter)
      if (entityTypeFilter) params.append('entity_type_filter', entityTypeFilter)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await fetch(`/api/audit-log?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized: Please log in')
        } else if (response.status === 403) {
          setError('Forbidden: You do not have permission to view audit logs')
        } else {
          setError('Failed to fetch audit log')
        }
        setLogs([])
        return
      }

      const data: ApiResponse = await response.json()
      setLogs(data.data || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Error fetching audit log:', err)
      setError('Error fetching audit log')
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleActionFilter = (value: string) => {
    setActionFilter(value)
    setCurrentPage(1)
  }

  const handleEntityTypeFilter = (value: string) => {
    setEntityTypeFilter(value)
    setCurrentPage(1)
  }

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    setCurrentPage(1)
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    setCurrentPage(1)
  }

  const toggleExpanded = (id: number) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const totalPages = Math.ceil(totalCount / limit)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return { bg: '#d4edda', color: '#155724' }
      case 'UPDATE':
        return { bg: '#cfe2ff', color: '#084298' }
      case 'DELETE':
        return { bg: '#f8d7da', color: '#721c24' }
      default:
        return { bg: '#e2e3e5', color: '#383d41' }
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      if (format === 'json') {
        const dataStr = JSON.stringify(logs, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        // Convert to CSV
        const headers = ['ID', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'Created At']
        const rows = logs.map(log => [
          log.id,
          log.admin_users?.full_name || log.admin_id,
          log.action,
          log.entity_type,
          log.entity_id,
          new Date(log.created_at).toLocaleString()
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const dataBlob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting audit log:', err)
      alert('Failed to export audit log')
    }
  }

  if (isLoading && logs.length === 0) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading audit log...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Audit Log</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleExport('json')}
            className="btn btn-secondary"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div className="form-group">
            <label htmlFor="search">Search by Entity ID</label>
            <input
              id="search"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="action-filter">Filter by Action</label>
            <select
              id="action-filter"
              value={actionFilter}
              onChange={(e) => handleActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="entity-type-filter">Filter by Entity Type</label>
            <select
              id="entity-type-filter"
              value={entityTypeFilter}
              onChange={(e) => handleEntityTypeFilter(e.target.value)}
            >
              <option value="">All Entity Types</option>
              <option value="admin_users">Admin Users</option>
              <option value="admin_regions">Admin Regions</option>
              <option value="roles">Roles</option>
              <option value="permissions">Permissions</option>
              <option value="role_permissions">Role Permissions</option>
              <option value="heritage_sites">Heritage Sites</option>
              <option value="events">Events</option>
              <option value="businesses">Businesses</option>
              <option value="blog_posts">Blog Posts</option>
              <option value="sos_requests">SOS Requests</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date-from">From Date</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date-to">To Date</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          {logs.map((log) => {
            const isExpanded = expandedEntries[log.id]
            const actionColor = getActionColor(log.action)

            return (
              <div
                key={log.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => toggleExpanded(log.id)}
                  style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: actionColor.bg,
                          color: actionColor.color,
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>
                        {log.entity_type}
                      </span>
                      <span style={{ color: '#666' }}>
                        ID: {log.entity_id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <span style={{ marginRight: '20px' }}>
                        Admin: {log.admin_users?.full_name || log.admin_id}
                      </span>
                      <span>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2em', color: '#666' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Changes</h4>
                    <pre style={{
                      backgroundColor: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '0.85em',
                      color: '#333'
                    }}>
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}

          {logs.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {search || actionFilter || entityTypeFilter || dateFrom || dateTo
                ? 'No audit log entries match your filters.'
                : 'No audit log entries found.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
            <div style={{ color: '#666', fontSize: '0.9em' }}>
              Showing {logs.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} entries
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
