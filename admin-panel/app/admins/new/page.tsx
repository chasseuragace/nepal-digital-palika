'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { rolesService, type Role } from '@/lib/client/roles-client.service'
import { palikaService, type Province, type District, type Palika } from '@/lib/client/palika-client.service'
import { adminsService } from '@/lib/client/admins-client.service'

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
    regions: []
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [availableRegions, setAvailableRegions] = useState<Array<{ id: number; name: string; type: string }>>([])

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles()
    fetchProvinces()
  }, [])

  // Fetch districts when province changes
  useEffect(() => {
    if (formData.province_id) {
      fetchDistricts(Number(formData.province_id))
    } else {
      setDistricts([])
      setFormData(prev => ({ ...prev, district_id: '', palika_id: '' }))
    }
  }, [formData.province_id])

  // Fetch palikas when district changes
  useEffect(() => {
    if (formData.district_id) {
      fetchPalikas(Number(formData.district_id))
    } else {
      setPalikas([])
      setFormData(prev => ({ ...prev, palika_id: '' }))
    }
  }, [formData.district_id])

  // Update available regions based on hierarchy level
  useEffect(() => {
    updateAvailableRegions()
  }, [formData.hierarchy_level, provinces, districts, palikas])

  const fetchRoles = async () => {
    try {
      const data = await rolesService.getAll()
      setRoles(data.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
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
      provinces.forEach(p => {
        regions.push({ id: p.id, name: p.name_en, type: 'province' })
      })
    } else if (formData.hierarchy_level === 'district') {
      districts.forEach(d => {
        regions.push({ id: d.id, name: d.name_en, type: 'district' })
      })
    } else if (formData.hierarchy_level === 'palika') {
      palikas.forEach(p => {
        regions.push({ id: p.id, name: p.name_en, type: 'palika' })
      })
    }

    setAvailableRegions(regions)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleHierarchyLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'national' | 'province' | 'district' | 'palika' | ''
    setFormData(prev => ({
      ...prev,
      hierarchy_level: value,
      province_id: '',
      district_id: '',
      palika_id: '',
      regions: []
    }))
    setSelectedRegions(new Set())
    if (errors.hierarchy_level) {
      setErrors(prev => ({
        ...prev,
        hierarchy_level: undefined
      }))
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

    // Update regions array
    const regions = Array.from(newSelected).map(key => {
      const [type, id] = key.split('-')
      return {
        region_type: type as 'province' | 'district' | 'palika',
        region_id: Number(id)
      }
    })

    setFormData(prev => ({
      ...prev,
      regions
    }))

    if (errors.regions) {
      setErrors(prev => ({
        ...prev,
        regions: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Full name validation
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Hierarchy level validation
    if (!formData.hierarchy_level) {
      newErrors.hierarchy_level = 'Hierarchy level is required'
    }

    // Conditional validations based on hierarchy level
    if (formData.hierarchy_level === 'province') {
      if (!formData.province_id) {
        newErrors.province_id = 'Province is required for province-level admins'
      }
      if (formData.regions.length === 0) {
        newErrors.regions = 'At least one province must be selected'
      }
    } else if (formData.hierarchy_level === 'district') {
      if (!formData.province_id) {
        newErrors.province_id = 'Province is required for district-level admins'
      }
      if (!formData.district_id) {
        newErrors.district_id = 'District is required for district-level admins'
      }
      if (formData.regions.length === 0) {
        newErrors.regions = 'At least one district must be selected'
      }
    } else if (formData.hierarchy_level === 'palika') {
      if (!formData.province_id) {
        newErrors.province_id = 'Province is required for palika-level admins'
      }
      if (!formData.district_id) {
        newErrors.district_id = 'District is required for palika-level admins'
      }
      if (!formData.palika_id) {
        newErrors.palika_id = 'Palika is required for palika-level admins'
      }
      if (formData.regions.length === 0) {
        newErrors.regions = 'At least one palika must be selected'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await adminsService.create({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        hierarchy_level: formData.hierarchy_level,
        province_id: formData.province_id ? Number(formData.province_id) : undefined,
        district_id: formData.district_id ? Number(formData.district_id) : undefined,
        palika_id: formData.palika_id ? Number(formData.palika_id) : undefined,
        regions: formData.regions
      })

      // Success - redirect to admin list
      router.push('/admins')
    } catch (error) {
      console.error('Error creating admin:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred while creating the admin'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admins" className="btn btn-secondary">
          ← Back to Admins
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h1>Create New Admin</h1>

        {errors.submit && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
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
            {errors.email && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.email}</span>}
          </div>

          {/* Full Name Field */}
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
            {errors.full_name && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.full_name}</span>}
          </div>

          {/* Role Field */}
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
              {roles.map(role => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.role}</span>}
          </div>

          {/* Hierarchy Level Field */}
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
            {errors.hierarchy_level && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.hierarchy_level}</span>}
          </div>

          {/* Province Field - shown for province, district, and palika levels */}
          {(formData.hierarchy_level === 'province' || formData.hierarchy_level === 'district' || formData.hierarchy_level === 'palika') && (
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
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>
                    {province.name_en}
                  </option>
                ))}
              </select>
              {errors.province_id && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.province_id}</span>}
            </div>
          )}

          {/* District Field - shown for district and palika levels */}
          {(formData.hierarchy_level === 'district' || formData.hierarchy_level === 'palika') && (
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
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name_en}
                  </option>
                ))}
              </select>
              {errors.district_id && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.district_id}</span>}
            </div>
          )}

          {/* Palika Field - shown for palika level */}
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
                {palikas.map(palika => (
                  <option key={palika.id} value={palika.id}>
                    {palika.name_en}
                  </option>
                ))}
              </select>
              {errors.palika_id && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.palika_id}</span>}
            </div>
          )}

          {/* Region Assignment - shown for non-national levels */}
          {formData.hierarchy_level && formData.hierarchy_level !== 'national' && (
            <div className="form-group">
              <label>
                {formData.hierarchy_level === 'province' && 'Assign to Provinces *'}
                {formData.hierarchy_level === 'district' && 'Assign to Districts *'}
                {formData.hierarchy_level === 'palika' && 'Assign to Palikas *'}
              </label>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {availableRegions.length === 0 ? (
                  <p style={{ color: '#666', margin: 0 }}>
                    {formData.hierarchy_level === 'province' && 'Select a province first'}
                    {formData.hierarchy_level === 'district' && 'Select a district first'}
                    {formData.hierarchy_level === 'palika' && 'Select a palika first'}
                  </p>
                ) : (
                  availableRegions.map(region => (
                    <div key={`${region.type}-${region.id}`} style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={selectedRegions.has(`${region.type}-${region.id}`)}
                          onChange={() => handleRegionToggle(region.id, region.type)}
                          style={{ marginRight: '8px' }}
                        />
                        {region.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {errors.regions && <span style={{ color: '#dc3545', fontSize: '0.9em' }}>{errors.regions}</span>}
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Creating...' : 'Create Admin'}
            </button>
            <Link href="/admins" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
