'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, ArrowLeft, Send, Globe, User, Plus, Trash2,
  FileText, Link as LinkIcon, Smartphone, Image, Zap, Store, AlertCircle,
  Eye, EyeOff, Info, Users, Target, Sparkles, Clock, Settings
} from 'lucide-react'
import {
  NOTIFICATION_CATEGORIES,
  PRIORITIES,
  getTemplatesByCategory,
  getCategoryColor,
  type NotificationPriority,
  type NotificationTemplate,
} from '@/lib/notification-use-cases'
import BusinessTargetingSelector from '@/components/BusinessTargetingSelector'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast, { ToastType } from '@/components/Toast'
import AdminLayout from '@/components/AdminLayout'
import './compose.css'

type NotificationType = 'general' | 'personal'
type AttachmentType = 'file' | 'web_url' | 'app_link'

interface AttachmentInput {
  attachment_name: string
  attachment_url: string
  attachment_type: AttachmentType
  file_type?: string
  display_label?: string
}

const PALIKA_ID = 1 // Skeleton default

export default function NotificationComposePage() {
  const router = useRouter()

  // Form state
  const [notificationType, setNotificationType] = useState<NotificationType>('general')
  const [category, setCategory] = useState<string>('announcement')
  const [priority, setPriority] = useState<NotificationPriority>('normal')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [bodyFull, setBodyFull] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const [targetUserSearch, setTargetUserSearch] = useState('')
  const [targetUsers, setTargetUsers] = useState<{ id: string; label: string }[]>([])
  const [targetBusinessIds, setTargetBusinessIds] = useState<string[]>([])
  const [businessUsersLoading, setBusinessUsersLoading] = useState(false)

  // UI state
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)

  // Templates for the selected category
  const availableTemplates = getTemplatesByCategory(category)

  // Apply a template
  const applyTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setTitle(template.title_template)
    setBody(template.body_template)
    if (template.body_full_template) setBodyFull(template.body_full_template)
    setNotificationType(template.default_type)
    setPriority(template.default_priority)
    setIsFormDirty(true)
  }

  // ─── Attachment management ───

  const addAttachment = () => {
    setAttachments(prev => [...prev, {
      attachment_name: '',
      attachment_url: '',
      attachment_type: 'file',
      file_type: '',
      display_label: '',
    }])
  }

  const updateAttachment = (index: number, field: keyof AttachmentInput, value: string) => {
    setAttachments(prev => prev.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    ))
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // ─── User targeting (for personal notifications) ───
  // In production, this would call /api/notifications/users?search=...
  // For skeleton, we allow manual UUID entry

  const addTargetUser = () => {
    if (!targetUserSearch.trim()) return
    // Accept either a UUID or a name/email for skeleton purposes
    const id = targetUserSearch.trim()
    if (targetUsers.some(u => u.id === id)) return
    setTargetUsers(prev => [...prev, { id, label: id }])
    setTargetUserSearch('')
  }

  const removeTargetUser = (id: string) => {
    setTargetUsers(prev => prev.filter(u => u.id !== id))
  }

  // ─── Business targeting ───
  // When businesses are selected, fetch their users and add to target list
  const handleBusinessesSelected = async (businessIds: string[]) => {
    setTargetBusinessIds(businessIds)

    if (businessIds.length === 0) return

    // Fetch users for selected businesses
    setBusinessUsersLoading(true)
    try {
      const response = await fetch(
        `/api/business-targeting/users?business_ids=${businessIds.join(',')}`
      )
      if (response.ok) {
        const result = await response.json()
        const businessUsers = (result.data || []).map((u: any) => ({
          id: u.id,
          label: u.name,
        }))

        // Add these users to the target users list (avoiding duplicates)
        setTargetUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id))
          const newUsers = businessUsers.filter((u: any) => !existingIds.has(u.id))
          return [...prev, ...newUsers]
        })
      }
    } catch (error) {
      console.error('Failed to fetch business users:', error)
    } finally {
      setBusinessUsersLoading(false)
    }
  }

  // ─── Submit ───

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!title.trim()) {
      errors.push('Title is required')
    } else if (title.length > 300) {
      errors.push('Title must be 300 characters or less')
    }

    if (!body.trim()) {
      errors.push('Body text is required')
    }

    if (notificationType === 'personal' && targetUsers.length === 0) {
      errors.push('Select at least one target user for personal notifications')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the validation errors' })
      return
    }

    setIsSending(true)
    setSendResult(null)
    setValidationErrors([])

    try {
      const payload = {
        compose: {
          notification_type: notificationType,
          category,
          title: title.trim(),
          body: body.trim(),
          body_full: bodyFull.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          palika_id: PALIKA_ID,
          target_user_ids: notificationType === 'personal'
            ? targetUsers.map(u => u.id)
            : undefined,
          target_business_ids: targetBusinessIds.length > 0
            ? targetBusinessIds
            : undefined,
        },
        attachments: attachments.filter(a => a.attachment_name && a.attachment_url),
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setSendResult({ success: true, message: result.message })
        setToast({ type: 'success', message: result.message || 'Notification sent successfully!' })
        
        // Reset form after 2 seconds
        setTimeout(() => {
          router.push('/notifications')
        }, 2000)
      } else {
        const errorMsg = result.error || 'Failed to send notification'
        setSendResult({ success: false, message: errorMsg })
        setToast({ type: 'error', message: errorMsg })
      }
    } catch (error) {
      const errorMsg = 'Network error. Please check your connection and try again.'
      setSendResult({ success: false, message: errorMsg })
      setToast({ type: 'error', message: errorMsg })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AdminLayout>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="compose-page-header">
        <Link href="/notifications" className="compose-back-btn">
          <ArrowLeft size={20} />
        </Link>
        <div className="compose-header-content">
          <div className="compose-header-icon">
            <Bell size={32} />
          </div>
          <div>
            <h1>Compose Notification</h1>
            <p>Create and send targeted notifications to your palika users</p>
          </div>
        </div>
      </div>

      <div className="compose-form-container">
        <div className={`compose-grid ${showPreview ? 'with-preview' : ''}`}>
          {/* ─── Compose Form ─── */}
          <div>
            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                <div className="validation-errors-header">
                  <div className="validation-error-icon">
                    <AlertCircle size={18} />
                  </div>
                  <span className="validation-errors-title">
                    Please fix the following errors:
                  </span>
                </div>
                <ul>
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Type selector */}
            <div className="form-card">
              <label className="form-label">
                Notification Type
              </label>
              <div className="type-buttons" style={{ gap: '16px' }}>
                <TypeButton
                  active={notificationType === 'general'}
                  onClick={() => setNotificationType('general')}
                  icon={<Globe size={20} />}
                  label="General Broadcast"
                  description="Sent to all users in the palika"
                />
                <TypeButton
                  active={notificationType === 'personal'}
                  onClick={() => setNotificationType('personal')}
                  icon={<User size={20} />}
                  label="Personal"
                  description="Sent to specific users"
                />
              </div>

              {notificationType === 'general' && (
                <div className="info-banner">
                  <Info size={18} />
                  <span>
                    This will create one notification row per user in the palika.
                    All opted-in users will receive this notification.
                  </span>
                </div>
              )}
            </div>

            {/* Category selector */}
            <div className="form-card">
              <label className="form-label">
                Category
              </label>
              <div className="category-grid">
                {NOTIFICATION_CATEGORIES.map(cat => {
                  const isSelected = category === cat.value
                  return (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setCategory(cat.value)
                        setPriority(cat.default_priority)
                        setNotificationType(cat.default_type)
                        setSelectedTemplate(null)
                        setIsFormDirty(true)
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${cat.color.text}` : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? cat.color.bg : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isSelected ? `0 4px 12px ${cat.color.text}20` : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#fff'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>
                        {cat.label_en}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                        {cat.label_ne}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' }}>
                        {cat.description_en}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority selector */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>
                Priority (प्राथमिकता)
              </label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPriority(p.value)
                      setIsFormDirty(true)
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: priority === p.value ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                      backgroundColor: priority === p.value ? `${p.color}15` : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      transform: priority === p.value ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: priority === p.value ? `0 4px 12px ${p.color}30` : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      if (priority !== p.value) {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (priority !== p.value) {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: priority === p.value ? p.color : '#64748b' }}>
                      {p.label_en}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.label_ne}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick-start templates */}
            {availableTemplates.length > 0 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}>
                <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>
                  Quick Templates (ढाँचा)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {availableTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: selectedTemplate?.id === t.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        backgroundColor: selectedTemplate?.id === t.id ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: selectedTemplate?.id === t.id ? '#1d4ed8' : '#475569',
                        fontWeight: selectedTemplate?.id === t.id ? 600 : 500,
                        transition: 'all 0.2s ease',
                        transform: selectedTemplate?.id === t.id ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: selectedTemplate?.id === t.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTemplate?.id !== t.id) {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTemplate?.id !== t.id) {
                          e.currentTarget.style.backgroundColor = '#fff'
                          e.currentTarget.style.transform = 'scale(1)'
                        }
                      }}
                    >
                      {t.label_ne} / {t.label_en}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={14} />
                  Selecting a template pre-fills the form. You can edit everything after.
                </div>
              </div>
            )}

            {/* Personal: User targeting */}
            {notificationType === 'personal' && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}>
                <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>
                  Target Users
                </label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Search user by name, email, or enter UUID..."
                    value={targetUserSearch}
                    onChange={(e) => setTargetUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTargetUser()}
                    onFocus={() => setFocusedField('userSearch')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      borderColor: focusedField === 'userSearch' ? '#3b82f6' : '#e2e8f0',
                      boxShadow: focusedField === 'userSearch' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <button 
                    onClick={addTargetUser} 
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid #3b82f6',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                {targetUsers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                    {targetUsers.map(u => (
                      <span key={u.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: '#ede9fe',
                        color: '#5b21b6',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid #ddd6fe',
                        boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ddd6fe'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ede9fe'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}>
                        <User size={12} />
                        {u.label.length > 24 ? u.label.substring(0, 24) + '...' : u.label}
                        <button
                          onClick={() => removeTargetUser(u.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: '#7c3aed', 
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#c4b5fd'
                            e.currentTarget.style.color = '#5b21b6'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = '#7c3aed'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {targetUsers.length === 0 && (
                  <div style={{ 
                    color: '#94a3b8', 
                    fontSize: '13px', 
                    marginTop: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Info size={14} />
                    No users selected. In production, this will autocomplete from the palika user list.
                  </div>
                )}
              </div>
            )}

            {/* Target Businesses (Optional) — for both broadcast and personal */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>
                Target Businesses (Optional)
              </label>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: '12px', lineHeight: '1.5' }}>
                Select specific businesses to notify their owners/staff. Their users will be automatically added to the target list.
              </p>
              {businessUsersLoading && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#3b82f6', 
                  marginBottom: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <LoadingSpinner size={14} color="#3b82f6" />
                  Loading business users...
                </div>
              )}
              <BusinessTargetingSelector
                palikaId={PALIKA_ID}
                onSelectBusinesses={handleBusinessesSelected}
                mode="simple"
              />
            </div>

            {/* Content */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>Title</label>
              <input
                type="text"
                placeholder="Notification title (max 300 chars)"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value.slice(0, 300))
                  setIsFormDirty(true)
                }}
                maxLength={300}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  marginTop: '8px',
                  borderColor: focusedField === 'title' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedField === 'title' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              />
              <div style={{ 
                textAlign: 'right', 
                fontSize: '12px', 
                color: title.length > 280 ? '#ef4444' : '#94a3b8',
                marginTop: '6px',
                fontWeight: title.length > 280 ? 600 : 400,
              }}>
                {title.length}/300 {title.length > 280 && ' (approaching limit)'}
              </div>

              <label style={{ ...labelStyle, marginTop: '16px', fontSize: '14px' }}>Body (Preview Text)</label>
              <textarea
                placeholder="Short preview shown in notification cards..."
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  setIsFormDirty(true)
                }}
                onFocus={() => setFocusedField('body')}
                onBlur={() => setFocusedField(null)}
                rows={3}
                style={{
                  ...inputStyle, 
                  marginTop: '8px', 
                  resize: 'vertical',
                  borderColor: focusedField === 'body' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedField === 'body' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              />

              <label style={{ ...labelStyle, marginTop: '16px', fontSize: '14px' }}>
                Full Content <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                placeholder="Detailed content shown when user opens the notification. Supports longer text, instructions, emergency details..."
                value={bodyFull}
                onChange={(e) => {
                  setBodyFull(e.target.value)
                  setIsFormDirty(true)
                }}
                onFocus={() => setFocusedField('bodyFull')}
                onBlur={() => setFocusedField(null)}
                rows={6}
                style={{
                  ...inputStyle, 
                  marginTop: '8px', 
                  resize: 'vertical',
                  borderColor: focusedField === 'bodyFull' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedField === 'bodyFull' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#94a3b8', 
                marginTop: '6px',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Info size={12} />
                Rich text editor will replace this in a future session.
              </div>
            </div>

            {/* Image */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <label style={{...labelStyle, fontSize: '14px', marginBottom: '12px' }}>
                Featured Image URL <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setIsFormDirty(true)
                }}
                onFocus={() => setFocusedField('imageUrl')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle, 
                  marginTop: '8px',
                  borderColor: focusedField === 'imageUrl' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedField === 'imageUrl' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              />
              {imageUrl && (
                <div style={{ 
                  marginTop: '12px', 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  maxHeight: '180px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'all 0.3s ease',
                    }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement!
                      parent.innerHTML = `
                        <div style="
                          padding: 20px;
                          text-align: center;
                          color: #ef4444;
                          font-size: 13px;
                          background-color: #fef2f2;
                          border: 1px solid #fecaca;
                          border-radius: 8px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          gap: 8px;
                        ">
                          <AlertCircle size={16} />
                          Failed to load image
                        </div>
                      `
                    }}
                  />
                </div>
              )}
            </div>

            {/* Attachments */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{...labelStyle, fontSize: '14px' }}>
                  Attachments <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <button 
                  onClick={addAttachment} 
                  style={{
                    fontSize: '13px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid #3b82f6',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <Plus size={14} /> Add Attachment
                </button>
              </div>

              {attachments.map((att, idx) => (
                <div key={idx} style={{
                  marginTop: '16px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#fafafa',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: '#3b82f6' }} />
                      Attachment {idx + 1}
                    </span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#ef4444',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={smallLabelStyle}>Type</label>
                      <select
                        value={att.attachment_type}
                        onChange={(e) => updateAttachment(idx, 'attachment_type', e.target.value)}
                        style={{
                          ...inputStyle,
                          borderColor: focusedField === `attachment_type_${idx}` ? '#3b82f6' : '#e2e8f0',
                          boxShadow: focusedField === `attachment_type_${idx}` ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                        }}
                        onFocus={() => setFocusedField(`attachment_type_${idx}`)}
                        onBlur={() => setFocusedField(null)}
                      >
                        <option value="file">File (PDF, Image, etc.)</option>
                        <option value="web_url">Web URL</option>
                        <option value="app_link">App Link (in-app navigation)</option>
                      </select>
                    </div>
                    <div>
                      <label style={smallLabelStyle}>File Type</label>
                      <input
                        type="text"
                        placeholder="pdf, image, document..."
                        value={att.file_type || ''}
                        onChange={(e) => updateAttachment(idx, 'file_type', e.target.value)}
                        style={{
                          ...inputStyle,
                          borderColor: focusedField === `file_type_${idx}` ? '#3b82f6' : '#e2e8f0',
                          boxShadow: focusedField === `file_type_${idx}` ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                        }}
                        onFocus={() => setFocusedField(`file_type_${idx}`)}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={smallLabelStyle}>Name</label>
                    <input
                      type="text"
                      placeholder="Attachment name"
                      value={att.attachment_name}
                      onChange={(e) => updateAttachment(idx, 'attachment_name', e.target.value)}
                      style={{
                        ...inputStyle,
                        borderColor: focusedField === `attachment_name_${idx}` ? '#3b82f6' : '#e2e8f0',
                        boxShadow: focusedField === `attachment_name_${idx}` ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={() => setFocusedField(`attachment_name_${idx}`)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={smallLabelStyle}>URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={att.attachment_url}
                      onChange={(e) => updateAttachment(idx, 'attachment_url', e.target.value)}
                      style={{
                        ...inputStyle,
                        borderColor: focusedField === `attachment_url_${idx}` ? '#3b82f6' : '#e2e8f0',
                        boxShadow: focusedField === `attachment_url_${idx}` ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={() => setFocusedField(`attachment_url_${idx}`)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={smallLabelStyle}>Display Label (shown to user)</label>
                    <input
                      type="text"
                      placeholder="e.g., Download Festival Schedule PDF"
                      value={att.display_label || ''}
                      onChange={(e) => updateAttachment(idx, 'display_label', e.target.value)}
                      style={{
                        ...inputStyle,
                        borderColor: focusedField === `display_label_${idx}` ? '#3b82f6' : '#e2e8f0',
                        boxShadow: focusedField === `display_label_${idx}` ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={() => setFocusedField(`display_label_${idx}`)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>
              ))}

              {attachments.length === 0 && (
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '13px', 
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Info size={14} />
                  Supports file links (PDF, images), web URLs, and in-app deep links.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button
                onClick={handleSubmit}
                disabled={isSending || !title.trim() || !body.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (isSending || !title.trim() || !body.trim()) ? 'not-allowed' : 'pointer',
                  border: 'none',
                  backgroundColor: (isSending || !title.trim() || !body.trim()) ? '#94a3b8' : '#3b82f6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: (isSending || !title.trim() || !body.trim()) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transform: (isSending || !title.trim() || !body.trim()) ? 'scale(1)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSending && title.trim() && body.trim()) {
                    e.currentTarget.style.backgroundColor = '#1d4ed8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSending && title.trim() && body.trim()) {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }
                }}
              >
                {isSending ? (
                  <>
                    <LoadingSpinner size={16} color="#fff" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {notificationType === 'general' ? 'Broadcast to Palika' : 'Send to Selected Users'}
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              <Link 
                href="/notifications" 
                style={{ 
                  color: '#94a3b8', 
                  fontSize: '15px', 
                  textDecoration: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Cancel
              </Link>
            </div>

            {/* Result message - deprecated in favor of toast */}
            {sendResult && !toast && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '6px',
                backgroundColor: sendResult.success ? '#d1fae5' : '#fee2e2',
                color: sendResult.success ? '#065f46' : '#991b1b',
                fontSize: '14px',
              }}>
                {sendResult.message}
              </div>
            )}
          </div>

          {/* ─── Preview Panel ─── */}
          {showPreview && (
            <div>
              <div style={{
                position: 'sticky',
                top: '24px',
                backgroundColor: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Eye size={18} style={{ color: '#3b82f6' }} />
                  Preview — as seen on m-place
                </div>

                {/* Card preview */}
                <div style={{ padding: '20px' }}>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    {imageUrl && (
                      <div style={{ height: '140px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                        <img
                          src={imageUrl}
                          alt=""
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'all 0.3s ease',
                          }}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: getCategoryColor(category).bg,
                          color: getCategoryColor(category).text,
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                        }}>
                          {NOTIFICATION_CATEGORIES.find(c => c.value === category)?.label_ne || category}
                        </span>
                        {notificationType === 'personal' && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <User size={10} />
                            Personal
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '15px', 
                        color: '#0f172a', 
                        marginBottom: '6px',
                        lineHeight: '1.4',
                      }}>
                        {title || 'Notification Title'}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#64748b', 
                        lineHeight: '1.5',
                        marginBottom: '10px',
                      }}>
                        {body || 'Preview text will appear here...'}
                      </div>
                      {attachments.filter(a => a.attachment_name).length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {attachments.filter(a => a.attachment_name).map((a, i) => (
                            <span key={i} style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #e2e8f0',
                            }}>
                              {a.attachment_type === 'file' && <FileText size={12} />}
                              {a.attachment_type === 'web_url' && <LinkIcon size={12} />}
                              {a.attachment_type === 'app_link' && <Smartphone size={12} />}
                              {a.display_label || a.attachment_name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#cbd5e1', 
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Clock size={12} />
                        Just now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery info */}
                <div style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.5',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Target size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Delivery Info</span>
                  </div>
                  {targetBusinessIds.length > 0 ? (
                    <>
                      <div style={{ marginLeft: '22px' }}>
                        Will send to users of {targetBusinessIds.length} selected business{targetBusinessIds.length !== 1 ? 'es' : ''}
                      </div>
                      {notificationType === 'personal' && (
                        <div style={{ marginTop: '6px', marginLeft: '22px', fontSize: '12px', color: '#94a3b8' }}>
                          (Plus {targetUsers.length} direct user{targetUsers.length !== 1 ? 's' : ''})
                        </div>
                      )}
                    </>
                  ) : notificationType === 'general' ? (
                    <div style={{ marginLeft: '22px' }}>
                      Will broadcast to all opted-in users in the palika
                    </div>
                  ) : (
                    <div style={{ marginLeft: '22px' }}>
                      Will send to {targetUsers.length} selected user{targetUsers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

// ─── Sub-components ───

function TypeButton({ active, onClick, icon, label, description }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={`type-button ${active ? 'active' : ''}`}
    >
      <div className="type-button-icon">
        {icon}
      </div>
      <div>
        <div className="type-button-label">
          {label}
        </div>
        <div className="type-button-description">
          {description}
        </div>
      </div>
    </button>
  )
}

// ─── Styles ───

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  display: 'block',
}

const smallLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#6b7280',
  display: 'block',
  marginBottom: '4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '2px solid #e2e8f0',
  fontSize: '14px',
  color: '#1e293b',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
}
