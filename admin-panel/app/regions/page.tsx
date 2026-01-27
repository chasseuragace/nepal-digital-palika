'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface AdminUser {
  id: string
  full_name: string
  role: string
}

interface AdminRegion {
  id: number
  admin_id: string
  region_type: string
  region_id: number
  assigned_at: string
  admin_users: AdminUser | null
}

interface Palika {
  id: number
  district_id: number
  name: string
  name_ne: string
  code: string
  type: string
  admins: AdminRegion[]
}

interface District {
  id: number
  province_id: number
  name: string
  name_ne: string
  code: string
  admins: AdminRegion[]
  palikas: Palika[]
}

interface Province {
  id: number
  name: string
  name_ne: string
  code: string
  admins: AdminRegion[]
  districts: District[]
}

interface AllAdmins {
  id: string
  full_name: string
  role: string
  hierarchy_level: string
}

export default function RegionsPage() {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [allAdmins, setAllAdmins] = useState<AllAdmins[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedProvinces, setExpandedProvinces] = useState<Record<number, boolean>>({})
  const [expandedDistricts, setExpandedDistricts] = useState<Record<number, boolean>>({})
  const [assigningRegion, setAssigningRegion] = useState<{ type: string; id: number } | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    fetchRegionsAndAdmins()
  }, [])

  const fetchRegionsAndAdmins = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch regions
      const regResponse = await fetch('/api/regions')
      if (!regResponse.ok) {
        throw new Error('Failed to fetch regions')
      }
      const regData = await regResponse.json()
      setProvinces(regData.data || [])

      // Fetch all admins
      const adminResponse = await fetch('/api/admins?limit=1000')
      if (!adminResponse.ok) {
        throw new Error('Failed to fetch admins')
      }
      const adminData = await adminResponse.json()
      setAllAdmins(adminData.data || [])
    } catch (err) {
      console.error('Error fetching regions:', err)
      setError('Failed to load regions')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProvince = (provinceId: number) => {
    setExpandedProvinces(prev => ({
      ...prev,
      [provinceId]: !prev[provinceId]
    }))
  }

  const toggleDistrict = (districtId: number) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [districtId]: !prev[districtId]
    }))
  }

  const handleAssignAdmin = async () => {
    if (!selectedAdmin || !assigningRegion) {
      setAssignError('Please select an admin')
      return
    }

    try {
      setIsAssigning(true)
      setAssignError(null)

      const response = await fetch('/api/regions/assign-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: selectedAdmin,
          regionType: assigningRegion.type,
          regionId: assigningRegion.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign admin')
      }

      await fetchRegionsAndAdmins()
      setAssigningRegion(null)
      setSelectedAdmin('')
    } catch (err) {
      console.error('Error assigning admin:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign admin'
      setAssignError(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAdmin = async (adminRegionId: number) => {
    if (!confirm('Are you sure you want to remove this admin assignment?')) {
      return
    }

    try {
      const response = await fetch('/api/regions/remove-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminRegionId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove admin')
      }

      await fetchRegionsAndAdmins()
    } catch (err) {
      console.error('Error removing admin:', err)
      alert('Failed to remove admin assignment')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading regions...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>Geographic Hierarchy & Admin Assignments</h1>

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
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666' }}>
            Click on provinces and districts to expand and view palikas. Click "Assign Admin" to add an admin to a region.
          </p>
        </div>

        {provinces.map((province) => (
          <div key={province.id} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            {/* Province Header */}
            <div
              onClick={() => toggleProvince(province.id)}
              style={{
                padding: '15px',
                backgroundColor: '#e7f3ff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#004085', fontSize: '1.1em' }}>
                  {province.name}
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  {province.districts?.length || 0} districts
                </div>
              </div>
              <div style={{ fontSize: '1.2em', color: '#004085' }}>
                {expandedProvinces[province.id] ? '▼' : '▶'}
              </div>
            </div>

            {/* Province Admins */}
            {province.admins && province.admins.length > 0 && (
              <div style={{ padding: '10px 15px', backgroundColor: '#f0f8ff', borderBottom: '1px solid #ddd' }}>
                <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '5px', color: '#004085' }}>
                  Admins assigned to this province:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {province.admins.map(admin => (
                    <div
                      key={admin.id}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724',
                        fontSize: '0.9em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{admin.admin_users?.full_name}</span>
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#721c24',
                          cursor: 'pointer',
                          fontSize: '1.1em',
                          padding: '0'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign Admin Button for Province */}
            <div style={{ padding: '10px 15px', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setAssigningRegion({ type: 'province', id: province.id })}
                className="btn btn-secondary"
                style={{ fontSize: '0.9em' }}
              >
                Assign Admin to Province
              </button>
            </div>

            {/* Districts */}
            {expandedProvinces[province.id] && (
              <div style={{ padding: '10px' }}>
                {province.districts?.map((district) => (
                  <div key={district.id} style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', marginLeft: '20px' }}>
                    {/* District Header */}
                    <div
                      onClick={() => toggleDistrict(district.id)}
                      style={{
                        padding: '12px',
                        backgroundColor: '#cfe2ff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#084298' }}>
                          {district.name}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {district.palikas?.length || 0} palikas
                        </div>
                      </div>
                      <div style={{ fontSize: '1.2em', color: '#084298' }}>
                        {expandedDistricts[district.id] ? '▼' : '▶'}
                      </div>
                    </div>

                    {/* District Admins */}
                    {district.admins && district.admins.length > 0 && (
                      <div style={{ padding: '10px 12px', backgroundColor: '#f0f8ff', borderBottom: '1px solid #ddd' }}>
                        <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '5px', color: '#084298' }}>
                          Admins:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {district.admins.map(admin => (
                            <div
                              key={admin.id}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#d4edda',
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px',
                                color: '#155724',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>{admin.admin_users?.full_name}</span>
                              <button
                                onClick={() => handleRemoveAdmin(admin.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#721c24',
                                  cursor: 'pointer',
                                  fontSize: '1.1em',
                                  padding: '0'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assign Admin Button for District */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
                      <button
                        onClick={() => setAssigningRegion({ type: 'district', id: district.id })}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.9em' }}
                      >
                        Assign Admin to District
                      </button>
                    </div>

                    {/* Palikas */}
                    {expandedDistricts[district.id] && (
                      <div style={{ padding: '10px' }}>
                        {district.palikas?.map((palika) => (
                          <div key={palika.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginLeft: '20px' }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                              {palika.name}
                            </div>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
                              Type: {palika.type}
                            </div>

                            {/* Palika Admins */}
                            {palika.admins && palika.admins.length > 0 && (
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.85em', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                                  Admins:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {palika.admins.map(admin => (
                                    <div
                                      key={admin.id}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#d4edda',
                                        border: '1px solid #c3e6cb',
                                        borderRadius: '3px',
                                        color: '#155724',
                                        fontSize: '0.85em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <span>{admin.admin_users?.full_name}</span>
                                      <button
                                        onClick={() => handleRemoveAdmin(admin.id)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#721c24',
                                          cursor: 'pointer',
                                          fontSize: '1em',
                                          padding: '0'
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assign Admin Button for Palika */}
                            <button
                              onClick={() => setAssigningRegion({ type: 'palika', id: palika.id })}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.85em' }}
                            >
                              Assign Admin
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assign Admin Modal */}
      {assigningRegion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              Assign Admin to {assigningRegion.type}
            </h2>

            {assignError && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                border: '1px solid #f5c6cb'
              }}>
                {assignError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="admin-select">Select Admin *</label>
              <select
                id="admin-select"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
              >
                <option value="">-- Select an admin --</option>
                {allAdmins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name} ({admin.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAssigningRegion(null)
                  setSelectedAdmin('')
                  setAssignError(null)
                }}
                disabled={isAssigning}
                className="btn btn-secondary"
                style={{ opacity: isAssigning ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAdmin}
                disabled={isAssigning || !selectedAdmin}
                className="btn btn-primary"
                style={{
                  opacity: isAssigning || !selectedAdmin ? 0.5 : 1,
                  cursor: isAssigning || !selectedAdmin ? 'not-allowed' : 'pointer'
                }}
              >
                {isAssigning ? 'Assigning...' : 'Assign Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
