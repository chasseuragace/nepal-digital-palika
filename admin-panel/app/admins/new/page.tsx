'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Shield,
  MapPin,
  User as UserIcon,
} from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import {
  palikaService,
  type Province,
  type District,
  type Palika,
} from '@/lib/client/palika-client.service'
import { adminsService } from '@/lib/client/admins-client.service'
import '../admins.css'

// Source of truth is the admin_users.role CHECK constraint in Supabase.
// Keep this list in sync with that migration if it ever changes.
const ADMIN_ROLES = [
  { name: 'super_admin', label: 'Super Admin' },
  { name: 'palika_admin', label: 'Palika Admin' },
  { name: 'moderator', label: 'Moderator' },
  { name: 'support', label: 'Support' },
] as const

interface FormData {
  email: string
  full_name: string
  role: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika' | ''
  province_id: number | ''
  district_id: number | ''
  palika_id: number | ''
  regions: Array<{ region_type: 'province' | 'district' | 'palika'; region_id: number }>
}

interface FormErrors {
  email?: string
  full_name?: string
  role?: string
  hierarchy_level?: string
  province_id?: string
  district_id?: string
  palika_id?: string
  regions?: string
  submit?: string
}

export default function NewAdminPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    full_name: '',
    role: '',
    hierarchy_level: '',
    province_id: '',
    district_id: '',
    palika_id: '',
    regions: [],
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [availableRegions, setAvailableRegions] = useState<
    Array<{ id: number; name: string; type: string }>
  >([])

  useEffect(() => {
    fetchProvinces()
  }, [])

  useEffect(() => {
    if (formData.province_id) {
      fetchDistricts(Number(formData.province_id))
    } else {
      setDistricts([])
      setFormData((prev) => ({ ...prev, district_id: '', palika_id: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.province_id])

  useEffect(() => {
    if (formData.district_id) {
      fetchPalikas(Number(formData.district_id))
    } else {
      setPalikas([])
      setFormData((prev) => ({ ...prev, palika_id: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.district_id])

  useEffect(() => {
    updateAvailableRegions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hierarchy_level, provinces, districts, palikas])

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.full_name) newErrors.full_name = 'Full name is required'
    if (!formData.role) newErrors.role = 'Role is required'
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

    try {
      await adminsService.create({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        hierarchy_level: formData.hierarchy_level as string,
        province_id: formData.province_id ? Number(formData.province_id) : undefined,
        district_id: formData.district_id ? Number(formData.district_id) : undefined,
        palika_id: formData.palika_id ? Number(formData.palika_id) : undefined,
        regions: formData.regions,
      })

      router.push('/admins')
    } catch (error) {
      console.error('Error creating admin:', error)
      setErrors({
        submit:
          error instanceof Error ? error.message : 'An error occurred while creating the admin',
      })
    } finally {
      setIsSubmitting(false)
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

  return (
    <AdminLayout>
      <div className="admins-container">
        {/* Page Header */}
        <div className="admins-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <UserPlus size={32} />
            </div>
            <div>
              <h1 className="page-title">Add New Admin</h1>
              <p className="page-subtitle">Create a new admin account with role and regional scope</p>
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

        <div className="admins-content">
          {errors.submit && (
            <div className="message-alert error">
              <AlertCircle size={20} />
              {errors.submit}
            </div>
          )}

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <div className="form-section">
                <h3>
                  <UserIcon
                    size={18}
                    style={{ display: 'inline-block', marginRight: '8px', verticalAlign: '-3px' }}
                  />
                  Basic Information
                </h3>

                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                  {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                    required
                  />
                  <small>
                    A temporary password will be generated. The admin can reset it after first login.
                  </small>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              {/* Role & Permissions Section */}
              <div className="form-section">
                <h3>
                  <Shield
                    size={18}
                    style={{ display: 'inline-block', marginRight: '8px', verticalAlign: '-3px' }}
                  />
                  Role & Permissions
                </h3>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a role</option>
                    {ADMIN_ROLES.map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && <span className="field-error">{errors.role}</span>}
                </div>

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
                  <small>
                    Determines the scope of regional authority. National admins have access to all
                    regions.
                  </small>
                  {errors.hierarchy_level && (
                    <span className="field-error">{errors.hierarchy_level}</span>
                  )}
                </div>
              </div>

              {/* Regional Assignment Section - only for non-national */}
              {formData.hierarchy_level && formData.hierarchy_level !== 'national' && (
                <div className="form-section">
                  <h3>
                    <MapPin
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Regional Assignment
                  </h3>

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

                  <div className="form-group">
                    <label>{regionLabel}</label>
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
                    <small>
                      Select one or more {formData.hierarchy_level}s this admin will manage.
                    </small>
                    {errors.regions && <span className="field-error">{errors.regions}</span>}
                  </div>
                </div>
              )}

              {formData.hierarchy_level === 'national' && (
                <div className="form-section">
                  <h3>
                    <MapPin
                      size={18}
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        verticalAlign: '-3px',
                      }}
                    />
                    Regional Assignment
                  </h3>
                  <div
                    className="message-alert success"
                    style={{ marginBottom: 0, animation: 'none' }}
                  >
                    <CheckCircle size={20} />
                    National-level admins automatically have access to all regions.
                  </div>
                </div>
              )}

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
                  {isSubmitting ? 'Creating…' : 'Create Admin'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/admins')}
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
