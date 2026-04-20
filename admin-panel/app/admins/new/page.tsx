'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Shield,
  MapPin,
  User as UserIcon,
} from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { palikaService, type Palika } from '@/lib/client/palika-client.service'
import { adminsService } from '@/lib/client/admins-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import '../admins.css'

// Roles this panel can create. Keep in sync with lib/server/rbac.ts
// (PALIKA_MANAGEABLE_ROLES). Platform roles (super/province/district) are
// managed from platform-admin-panel, not here.
const PALIKA_ROLES = [
  { name: 'palika_admin', label: 'Palika Admin' },
  { name: 'moderator', label: 'Moderator' },
  { name: 'content_editor', label: 'Content Editor' },
  { name: 'content_reviewer', label: 'Content Reviewer' },
  { name: 'support_agent', label: 'Support Agent' },
] as const

interface FormData {
  email: string
  full_name: string
  role: string
}

interface FormErrors {
  email?: string
  full_name?: string
  role?: string
  submit?: string
}

export default function NewAdminPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({ email: '', full_name: '', role: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [callerPalikaId, setCallerPalikaId] = useState<number | null>(null)
  const [callerDistrictId, setCallerDistrictId] = useState<number | null>(null)
  const [callerProvinceId, setCallerProvinceId] = useState<number | null>(null)
  const [callerRole, setCallerRole] = useState<string>('')
  const [palika, setPalika] = useState<Palika | null>(null)
  const [authBlocked, setAuthBlocked] = useState<string | null>(null)

  useEffect(() => {
    const session = adminSessionStore.get()
    if (!session) {
      router.push('/login')
      return
    }
    setCallerRole(session.role)
    if (session.role !== 'palika_admin' && session.role !== 'super_admin') {
      setAuthBlocked('Only palika admins can create new admins.')
      return
    }
    if (session.palika_id == null) {
      setAuthBlocked('Your account has no palika assigned. Contact platform admin.')
      return
    }
    const pid = Number(session.palika_id)
    setCallerPalikaId(pid)
    setCallerDistrictId(session.district_id != null ? Number(session.district_id) : null)
    // session doesn't store province_id today; leave null and let server derive.
    setCallerProvinceId(null)
    palikaService.getPalikas().then((all) => {
      const match = all.find((p) => p.id === pid) || null
      setPalika(match)
    })
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.full_name) newErrors.full_name = 'Full name is required'
    if (!formData.role) newErrors.role = 'Role is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (callerPalikaId == null) {
      setErrors({ submit: 'Missing palika scope; please re-login.' })
      return
    }
    setIsSubmitting(true)
    try {
      await adminsService.create({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        hierarchy_level: 'palika',
        province_id: callerProvinceId ?? undefined,
        district_id: callerDistrictId ?? undefined,
        palika_id: callerPalikaId,
        regions: [{ region_type: 'palika', region_id: callerPalikaId }],
      })
      router.push('/admins')
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'An error occurred while creating the admin',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authBlocked) {
    return (
      <AdminLayout>
        <div className="admins-container">
          <div className="message-alert error" style={{ marginTop: 24 }}>
            <AlertCircle size={20} />
            {authBlocked}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admins-container">
        <div className="admins-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <UserPlus size={32} />
            </div>
            <div>
              <h1 className="page-title">Add New Admin</h1>
              <p className="page-subtitle">
                Create a new admin account for {palika ? palika.name_en : 'your palika'}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/admins')}>
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
                  <small>A temporary password will be generated. The admin resets it after first login.</small>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-section">
                <h3>
                  <Shield
                    size={18}
                    style={{ display: 'inline-block', marginRight: '8px', verticalAlign: '-3px' }}
                  />
                  Role
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
                    {PALIKA_ROLES.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <small>
                    Platform roles (super admin, province admin, district admin) are managed from the platform admin panel.
                  </small>
                  {errors.role && <span className="field-error">{errors.role}</span>}
                </div>
              </div>

              <div className="form-section">
                <h3>
                  <MapPin
                    size={18}
                    style={{ display: 'inline-block', marginRight: '8px', verticalAlign: '-3px' }}
                  />
                  Scope
                </h3>
                <div className="form-group">
                  <label>Palika</label>
                  <div
                    style={{
                      padding: '10px 12px',
                      background: '#f5f7fa',
                      borderRadius: 6,
                      fontWeight: 500,
                    }}
                  >
                    {palika ? palika.name_en : `Palika #${callerPalikaId ?? '—'}`}
                  </div>
                  <small>
                    New admins are automatically scoped to your palika. Cross-palika assignment is not available from this panel.
                  </small>
                </div>
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
