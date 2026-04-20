'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Shield,
  MapPin,
  User as UserIcon,
  Edit,
  Trash2,
} from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { adminsService } from '@/lib/client/admins-client.service'
import {
  palikaService,
  type Province,
  type District,
  type Palika,
} from '@/lib/client/palika-client.service'
import '../admins.css'

interface AdminRegion {
  id: number
  region_type: 'province' | 'district' | 'palika'
  region_id: number
}

interface AdminData {
  id: string
  email: string
  full_name: string
  role: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id: number | null
  district_id: number | null
  palika_id: number | null
  is_active: boolean
  regions: AdminRegion[]
}

interface FormData {
  full_name: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika' | ''
  province_id: number | ''
  district_id: number | ''
  palika_id: number | ''
  regions: Array<{ region_type: 'province' | 'district' | 'palika'; region_id: number }>
  is_active: boolean
}

interface FormErrors {
  full_name?: string
  hierarchy_level?: string
  province_id?: string
  district_id?: string
  palika_id?: string
  regions?: string
  submit?: string
}

export default function AdminDetailPage() {
  const router = useRouter()
  const params = useParams()
  const adminId = params.id as string

  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    hierarchy_level: '',
    province_id: '',
    district_id: '',
    palika_id: '',
    regions: [],
    is_active: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [availableRegions, setAvailableRegions] = useState<
    Array<{ id: number; name: string; type: string }>
  >([])
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    isDeleting: boolean
    error: string | null
  }>({ isOpen: false, isDeleting: false, error: null })

  useEffect(() => {
    fetchAdmin()
    fetchProvinces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  useEffect(() => {
    if (formData.province_id) {
      fetchDistricts(Number(formData.province_id))
    } else {
      setDistricts([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.province_id])

  useEffect(() => {
    if (formData.district_id) {
      fetchPalikas(Number(formData.district_id))
    } else {
      setPalikas([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.district_id])

  useEffect(() => {
    updateAvailableRegions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hierarchy_level, provinces, districts, palikas])

  const fetchAdmin = async () => {
    try {
      setIsLoading(true)
      const adminData: any = await adminsService.getById(adminId)
      // The API wraps in { success, data } — handle both shapes
      const payload: AdminData = adminData?.data ?? adminData

      setAdmin(payload)
      setFormData({
        full_name: payload.full_name,
        hierarchy_level: payload.hierarchy_level,
        province_id: payload.province_id || '',
        district_id: payload.district_id || '',
        palika_id: payload.palika_id || '',
        regions: payload.regions || [],
        is_active: payload.is_active,
      })

      const selected = new Set<string>()
      ;(payload.regions || []).forEach((r: AdminRegion) => {
        selected.add(`${r.region_type}-${r.region_id}`)
      })
      setSelectedRegions(selected)

      if (payload.province_id) {
        await fetchDistricts(payload.province_id)
      }
      if (payload.district_id) {
        await fetchPalikas(payload.district_id)
      }
    } catch (error) {
      console.error('Error fetching admin:', error)
      setErrors({ submit: 'Failed to load admin data' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProvinces = async () => {
    try {
      const data = await palikaService.getProvinces()
      setProvinces(data)
    } catch (error) {
      console.error('Error fetching provinces:', error)
    }
  }

  const fetchDistricts = async (provinceId: number) => {
    try {
      const data = await palikaService.getDistricts(provinceId)
      setDistricts(data)
    } catch (error) {
      console.error('Error fetching districts:', error)
    }
  }

  const fetchPalikas = async (districtId: number) => {
    try {
      const data = await palikaService.getPalikas(districtId)
      setPalikas(data)
    } catch (error) {
      console.error('Error fetching palikas:', error)
    }
  }

  const updateAvailableRegions = () => {
    const regions: Array<{ id: number; name: string; type: string }> = []

    if (formData.hierarchy_level === 'province') {
      provinces.forEach((p) => regions.push({ id: p.id, name: p.name_en, type: 'province' }))
    } else if (formData.hierarchy_level === 'district') {
      districts.forEach((d) => regions.push({ id: d.id, name: d.name_en, type: 'district' }))
    } else if (formData.hierarchy_level === 'palika') {
      palikas.forEach((p) => regions.push({ id: p.id, name: p.name_en, type: 'palika' }))
    }

    setAvailableRegions(regions)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleHierarchyLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'national' | 'province' | 'district' | 'palika' | ''
    setFormData((prev) => ({
      ...prev,
      hierarchy_level: value,
      province_id: '',
      district_id: '',
      palika_id: '',
      regions: [],
    }))
    setSelectedRegions(new Set())
    if (errors.hierarchy_level) {
      setErrors((prev) => ({ ...prev, hierarchy_level: undefined }))
    }
  }

  const handleRegionToggle = (regionId: number, regionType: string) => {
    const key = `${regionType}-${regionId}`
    const newSelected = new Set(selectedRegions)

    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }

    setSelectedRegions(newSelected)

    const regions = Array.from(newSelected).map((k) => {
      const [type, id] = k.split('-')
      return {
        region_type: type as 'province' | 'district' | 'palika',
        region_id: Number(id),
      }
    })

    setFormData((prev) => ({ ...prev, regions }))

    if (errors.regions) {
      setErrors((prev) => ({ ...prev, regions: undefined }))
    }
  }

  const handleIsActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.full_name) newErrors.full_name = 'Full name is required'
    if (!formData.hierarchy_level) newErrors.hierarchy_level = 'Hierarchy level is required'

    if (formData.hierarchy_level === 'province') {
      if (!formData.province_id) newErrors.province_id = 'Province is required'
      if (formData.regions.length === 0)
        newErrors.regions = 'At least one province must be selected'
    } else if (formData.hierarchy_level === 'district') {
      if (!formData.province_id) newErrors.province_id = 'Province is required'
      if (!formData.district_id) newErrors.district_id = 'District is required'
      if (formData.regions.length === 0)
        newErrors.regions = 'At least one district must be selected'
    } else if (formData.hierarchy_level === 'palika') {
      if (!formData.province_id) newErrors.province_id = 'Province is required'
      if (!formData.district_id) newErrors.district_id = 'District is required'
      if (!formData.palika_id) newErrors.palika_id = 'Palika is required'
      if (formData.regions.length === 0)
        newErrors.regions = 'At least one palika must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      await adminsService.update(adminId, {
        full_name: formData.full_name,
        hierarchy_level: formData.hierarchy_level as any,
        province_id: formData.province_id ? Number(formData.province_id) : undefined,
        district_id: formData.district_id ? Number(formData.district_id) : undefined,
        palika_id: formData.palika_id ? Number(formData.palika_id) : undefined,
        is_active: formData.is_active,
      } as any)

      setSuccessMessage('Admin updated successfully')
      setIsEditing(false)
      await fetchAdmin()
    } catch (error) {
      console.error('Error updating admin:', error)
      setErrors({
        submit:
          error instanceof Error ? error.message : 'An error occurred while updating the admin',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteModal({ isOpen: true, isDeleting: false, error: null })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, isDeleting: false, error: null })
  }

  const handleDelete = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: null }))

      const response = await fetch(`/api/admins/${adminId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete admin')
      }

      router.push('/admins')
    } catch (err) {
      console.error('Error deleting admin:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete admin'
      setDeleteModal((prev) => ({ ...prev, error: errorMessage, isDeleting: false }))
    }
  }

  const regionLabel = useMemo(() => {
    if (formData.hierarchy_level === 'province') return 'Assign to Provinces *'
    if (formData.hierarchy_level === 'district') return 'Assign to Districts *'
    if (formData.hierarchy_level === 'palika') return 'Assign to Palikas *'
    return 'Regions'
  }, [formData.hierarchy_level])

  const regionEmptyHint = useMemo(() => {
    if (formData.hierarchy_level === 'province') return 'Loading provinces…'
    if (formData.hierarchy_level === 'district') return 'Select a province first'
    if (formData.hierarchy_level === 'palika') return 'Select a district first'
    return ''
  }, [formData.hierarchy_level])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admins-container">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading admin…</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!admin) {
    return (
      <AdminLayout>
        <div className="admins-container">
          <div className="admins-page-header">
            <div className="header-content">
              <div>
                <h1 className="page-title">Admin Not Found</h1>
                <p className="page-subtitle">{errors.submit || 'This admin could not be loaded'}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admins')}
            >
              <ArrowLeft size={16} />
              Back to Admins
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admins-container">
        {/* Page Header */}
        <div className="admins-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <UserIcon size={32} />
            </div>
            <div>
              <h1 className="page-title">{isEditing ? 'Edit Admin' : 'Admin Details'}</h1>
              <p className="page-subtitle">{admin.full_name}</p>
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
                  <Edit size={16} />
                  Edit Admin
                </button>
                <button type="button" className="btn btn-danger" onClick={openDeleteModal}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admins')}
            >
              <ArrowLeft size={16} />
              Back to Admins
            </button>
          </div>
        </div>

        <div className="admins-content">
          {errors.submit && (
            <div className="message-alert error">
              <AlertCircle size={20} />
              {errors.submit}
            </div>
          )}

          {successMessage && (
            <div className="message-alert success">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          <div className="form-card">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="form-section">
                  <h3>
                    <UserIcon
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Basic Information
                  </h3>

                  <div className="form-group">
                    <label htmlFor="email">Email (Read-only)</label>
                    <input
                      id="email"
                      type="email"
                      value={admin.email}
                      disabled
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                    <small>Email cannot be changed after creation.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="full_name">Full Name *</label>
                    <input
                      id="full_name"
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">Role (Read-only)</label>
                    <input
                      id="role"
                      type="text"
                      value={admin.role}
                      disabled
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                    <small>Role changes require creating a new admin account.</small>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleIsActiveChange}
                      />
                      <span style={{ fontWeight: 500, color: '#1e293b' }}>Active</span>
                    </label>
                    <small>Inactive admins cannot log in to the platform.</small>
                  </div>
                </div>

                {/* Hierarchy & Regions */}
                <div className="form-section">
                  <h3>
                    <Shield
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Hierarchy & Regions
                  </h3>

                  <div className="form-group">
                    <label htmlFor="hierarchy_level">Hierarchy Level *</label>
                    <select
                      id="hierarchy_level"
                      name="hierarchy_level"
                      value={formData.hierarchy_level}
                      onChange={handleHierarchyLevelChange}
                      required
                    >
                      <option value="">Select hierarchy level</option>
                      <option value="national">National</option>
                      <option value="province">Province</option>
                      <option value="district">District</option>
                      <option value="palika">Palika</option>
                    </select>
                    {errors.hierarchy_level && (
                      <span className="field-error">{errors.hierarchy_level}</span>
                    )}
                  </div>

                  {(formData.hierarchy_level === 'province' ||
                    formData.hierarchy_level === 'district' ||
                    formData.hierarchy_level === 'palika') && (
                    <div className="form-group">
                      <label htmlFor="province_id">Province *</label>
                      <select
                        id="province_id"
                        name="province_id"
                        value={formData.province_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a province</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {province.name_en}
                          </option>
                        ))}
                      </select>
                      {errors.province_id && (
                        <span className="field-error">{errors.province_id}</span>
                      )}
                    </div>
                  )}

                  {(formData.hierarchy_level === 'district' ||
                    formData.hierarchy_level === 'palika') && (
                    <div className="form-group">
                      <label htmlFor="district_id">District *</label>
                      <select
                        id="district_id"
                        name="district_id"
                        value={formData.district_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.province_id}
                      >
                        <option value="">Select a district</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name_en}
                          </option>
                        ))}
                      </select>
                      {errors.district_id && (
                        <span className="field-error">{errors.district_id}</span>
                      )}
                    </div>
                  )}

                  {formData.hierarchy_level === 'palika' && (
                    <div className="form-group">
                      <label htmlFor="palika_id">Palika *</label>
                      <select
                        id="palika_id"
                        name="palika_id"
                        value={formData.palika_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.district_id}
                      >
                        <option value="">Select a palika</option>
                        {palikas.map((palika) => (
                          <option key={palika.id} value={palika.id}>
                            {palika.name_en}
                          </option>
                        ))}
                      </select>
                      {errors.palika_id && (
                        <span className="field-error">{errors.palika_id}</span>
                      )}
                    </div>
                  )}

                  {formData.hierarchy_level && formData.hierarchy_level !== 'national' && (
                    <div className="form-group">
                      <label>
                        <MapPin
                          size={14}
                          style={{
                            display: 'inline-block',
                            marginRight: '6px',
                            verticalAlign: '-2px',
                          }}
                        />
                        {regionLabel}
                      </label>
                      <div className="region-picker">
                        {availableRegions.length === 0 ? (
                          <p className="region-picker-empty">{regionEmptyHint}</p>
                        ) : (
                          availableRegions.map((region) => (
                            <label
                              key={`${region.type}-${region.id}`}
                              className="region-picker-item"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRegions.has(`${region.type}-${region.id}`)}
                                onChange={() => handleRegionToggle(region.id, region.type)}
                              />
                              {region.name}
                            </label>
                          ))
                        )}
                      </div>
                      {errors.regions && <span className="field-error">{errors.regions}</span>}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setErrors({})
                      // Reset form to current admin values
                      if (admin) {
                        setFormData({
                          full_name: admin.full_name,
                          hierarchy_level: admin.hierarchy_level,
                          province_id: admin.province_id || '',
                          district_id: admin.district_id || '',
                          palika_id: admin.palika_id || '',
                          regions: admin.regions || [],
                          is_active: admin.is_active,
                        })
                        const selected = new Set<string>()
                        ;(admin.regions || []).forEach((r) => {
                          selected.add(`${r.region_type}-${r.region_id}`)
                        })
                        setSelectedRegions(selected)
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="user-details">
                <div className="detail-section">
                  <h3>
                    <UserIcon
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Basic Information
                  </h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Full Name</label>
                      <div>{admin.full_name}</div>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <div>{admin.email}</div>
                    </div>
                    <div className="detail-item">
                      <label>Role</label>
                      <div>
                        <span className={`role-badge ${admin.role.replace(/_/g, '-')}`}>
                          {admin.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div>
                        <span className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                          {admin.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>
                    <Shield
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Hierarchy & Regions
                  </h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Hierarchy Level</label>
                      <div>
                        <span className="hierarchy-badge">{admin.hierarchy_level}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Region Assignments</label>
                      <div>
                        {admin.regions && admin.regions.length > 0
                          ? `${admin.regions.length} region${admin.regions.length !== 1 ? 's' : ''} assigned`
                          : admin.hierarchy_level === 'national'
                          ? 'National (all regions)'
                          : 'No regions assigned'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">
                <AlertCircle size={24} />
              </div>
              <h3 className="modal-title">Delete Admin</h3>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to delete <strong>{admin.full_name}</strong>?
              </p>
              <p className="modal-warning">
                This action cannot be undone. All region assignments will be removed, and the admin
                will lose access to the platform.
              </p>
              {deleteModal.error && (
                <div
                  className="message-alert error"
                  style={{ marginTop: '16px', marginBottom: 0 }}
                >
                  <AlertCircle size={20} />
                  {deleteModal.error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleteModal.isDeleting}
              >
                <Trash2 size={16} />
                {deleteModal.isDeleting ? 'Deleting…' : 'Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
