'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

interface HeritageSite {
  id: string
  name_english: string
  name_nepali: string
  category: string
  type: string
  status: string
  palika_name: string
  created_at: string
}

export default function HeritageSitesPage() {
  const [sites, setSites] = useState<HeritageSite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchHeritageSites()
  }, [])

  const fetchHeritageSites = async () => {
    try {
      const response = await fetch('/api/heritage-sites')
      if (response.ok) {
        const data = await response.json()
        setSites(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch heritage sites')
        setSites([])
      }
    } catch (error) {
      console.error('Error fetching heritage sites:', error)
      setSites([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSites = sites.filter(site => 
    site.name_english?.toLowerCase().includes(filter.toLowerCase()) ||
    site.name_nepali?.includes(filter) ||
    site.category?.toLowerCase().includes(filter.toLowerCase())
  )

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading heritage sites...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Heritage Sites Management</h1>
        <Link href="/heritage-sites/new" className="btn btn-primary">
          Add New Heritage Site
        </Link>
      </div>

      <div className="card">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search heritage sites..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name (English)</th>
              <th>Name (Nepali)</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Palika</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.map((site) => (
              <tr key={site.id}>
                <td>{site.name_english}</td>
                <td>{site.name_nepali}</td>
                <td>{site.category}</td>
                <td>{site.type}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: site.status === 'Active' ? '#d4edda' : '#f8d7da',
                    color: site.status === 'Active' ? '#155724' : '#721c24'
                  }}>
                    {site.status}
                  </span>
                </td>
                <td>{site.palika_name}</td>
                <td>{new Date(site.created_at).toLocaleDateString()}</td>
                <td>
                  <Link href={`/heritage-sites/${site.id}`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                  <Link href={`/heritage-sites/${site.id}/view`} className="btn btn-secondary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSites.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {filter ? 'No heritage sites match your search.' : 'No heritage sites found. Add your first heritage site!'}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}