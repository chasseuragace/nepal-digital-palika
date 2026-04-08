'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, ArrowLeft, Send, Globe, User, Plus, Trash2,
  FileText, Link as LinkIcon, Smartphone, Image, Zap, Store
} from 'lucide-react'
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TEMPLATES,
  PRIORITIES,
  getTemplatesByCategory,
  getCategoryColor,
  type NotificationPriority,
  type NotificationTemplate,
} from '@/lib/notification-use-cases'
import BusinessTargetingSelector from '@/components/BusinessTargetingSelector'

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

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setSendResult({ success: false, message: 'Title and body are required.' })
      return
    }

    if (notificationType === 'personal' && targetUsers.length === 0) {
      setSendResult({ success: false, message: 'Select at least one target user for personal notifications.' })
      return
    }

    setIsSending(true)
    setSendResult(null)

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
      } else {
        setSendResult({ success: false, message: result.error || 'Failed to send notification.' })
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Network error. Is the server running?' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top nav */}
      <nav style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Link href="/notifications" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <Bell size={20} color="#fff" />
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
          Compose Notification
        </span>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* ─── Compose Form ─── */}
          <div>
            {/* Type selector */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Notification Type</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <TypeButton
                  active={notificationType === 'general'}
                  onClick={() => setNotificationType('general')}
                  icon={<Globe size={18} />}
                  label="General Broadcast"
                  description="Sent to all users in the palika"
                />
                <TypeButton
                  active={notificationType === 'personal'}
                  onClick={() => setNotificationType('personal')}
                  icon={<User size={18} />}
                  label="Personal"
                  description="Sent to specific users"
                />
              </div>

              {notificationType === 'general' && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#1e40af',
                  lineHeight: '1.5',
                }}>
                  This will create one notification row per user in the palika.
                  All opted-in users will receive this notification.
                </div>
              )}
            </div>

            {/* Category selector — governance-grounded */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Category (विषय)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '8px',
                marginTop: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
              }}>
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
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: isSelected ? `2px solid ${cat.color.text}` : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? cat.color.bg : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>
                        {cat.label_en}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        {cat.label_ne}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                        {cat.description_en}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority selector */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Priority (प्राथमिकता)</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: priority === p.value ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                      backgroundColor: priority === p.value ? `${p.color}10` : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: '12px', color: priority === p.value ? p.color : '#64748b' }}>
                      {p.label_en}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.label_ne}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick-start templates */}
            {availableTemplates.length > 0 && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>
                  <Zap size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Quick Templates (ढाँचा)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {availableTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: selectedTemplate?.id === t.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        backgroundColor: selectedTemplate?.id === t.id ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#475569',
                      }}
                    >
                      {t.label_ne} / {t.label_en}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Selecting a template pre-fills the form. You can edit everything after.
                </div>
              </div>
            )}

            {/* Personal: User targeting */}
            {notificationType === 'personal' && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Target Users</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search user by name, email, or enter UUID..."
                    value={targetUserSearch}
                    onChange={(e) => setTargetUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTargetUser()}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={addTargetUser} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {targetUsers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {targetUsers.map(u => (
                      <span key={u.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: '#ede9fe',
                        color: '#5b21b6',
                        fontSize: '12px',
                      }}>
                        {u.label.length > 24 ? u.label.substring(0, 24) + '...' : u.label}
                        <button
                          onClick={() => removeTargetUser(u.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {targetUsers.length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
                    No users selected. In production, this will autocomplete from the palika user list.
                  </div>
                )}
              </div>
            )}

            {/* Target Businesses (Optional) — for both broadcast and personal */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                <Store size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Target Businesses (Optional)
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: '8px' }}>
                Select specific businesses to notify their owners/staff. Their users will be automatically added to the target list.
              </p>
              {businessUsersLoading && (
                <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>
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
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                placeholder="Notification title (max 300 chars)"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 300))}
                maxLength={300}
                style={{ ...inputStyle, marginTop: '6px' }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                {title.length}/300
              </div>

              <label style={{ ...labelStyle, marginTop: '12px' }}>Body (Preview Text)</label>
              <textarea
                placeholder="Short preview shown in notification cards..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                style={{ ...inputStyle, marginTop: '6px', resize: 'vertical' }}
              />

              <label style={{ ...labelStyle, marginTop: '12px' }}>
                Full Content <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                placeholder="Detailed content shown when user opens the notification. Supports longer text, instructions, emergency details..."
                value={bodyFull}
                onChange={(e) => setBodyFull(e.target.value)}
                rows={6}
                style={{ ...inputStyle, marginTop: '6px', resize: 'vertical' }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Rich text editor will replace this in a future session.
              </div>
            </div>

            {/* Image */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                <Image size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Featured Image URL <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ ...inputStyle, marginTop: '6px' }}
              />
              {imageUrl && (
                <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', maxHeight: '150px' }}>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ width: '100%', objectFit: 'cover' }}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>
                  Attachments <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <button onClick={addAttachment} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  <Plus size={12} /> Add Attachment
                </button>
              </div>

              {attachments.map((att, idx) => (
                <div key={idx} style={{
                  marginTop: '12px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      Attachment {idx + 1}
                    </span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={smallLabelStyle}>Type</label>
                      <select
                        value={att.attachment_type}
                        onChange={(e) => updateAttachment(idx, 'attachment_type', e.target.value)}
                        style={inputStyle}
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
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={smallLabelStyle}>Name</label>
                    <input
                      type="text"
                      placeholder="Attachment name"
                      value={att.attachment_name}
                      onChange={(e) => updateAttachment(idx, 'attachment_name', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={smallLabelStyle}>URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={att.attachment_url}
                      onChange={(e) => updateAttachment(idx, 'attachment_url', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={smallLabelStyle}>Display Label (shown to user)</label>
                    <input
                      type="text"
                      placeholder="e.g., Download Festival Schedule PDF"
                      value={att.display_label || ''}
                      onChange={(e) => updateAttachment(idx, 'display_label', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {attachments.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>
                  Supports file links (PDF, images), web URLs, and in-app deep links.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={isSending || !title.trim() || !body.trim()}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (isSending || !title.trim() || !body.trim()) ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                {isSending ? 'Sending...' : notificationType === 'general' ? 'Broadcast to Palika' : 'Send to Selected Users'}
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Preview
              </button>

              <Link href="/notifications" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
                Cancel
              </Link>
            </div>

            {/* Result message */}
            {sendResult && (
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
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                }}>
                  Preview — as seen on m-place
                </div>

                {/* Card preview */}
                <div style={{ padding: '16px' }}>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                  }}>
                    {imageUrl && (
                      <div style={{ height: '120px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                        <img
                          src={imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          backgroundColor: getCategoryColor(category).bg,
                          color: getCategoryColor(category).text,
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}>
                          {NOTIFICATION_CATEGORIES.find(c => c.value === category)?.label_ne || category}
                        </span>
                        {notificationType === 'personal' && (
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Personal
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                        {title || 'Notification Title'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                        {body || 'Preview text will appear here...'}
                      </div>
                      {attachments.filter(a => a.attachment_name).length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {attachments.filter(a => a.attachment_name).map((a, i) => (
                            <span key={i} style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}>
                              {a.attachment_type === 'file' && <FileText size={10} />}
                              {a.attachment_type === 'web_url' && <LinkIcon size={10} />}
                              {a.attachment_type === 'app_link' && <Smartphone size={10} />}
                              {a.display_label || a.attachment_name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px' }}>
                        Just now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery info */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  {targetBusinessIds.length > 0 ? (
                    <>
                      <div>Will send to users of {targetBusinessIds.length} selected business{targetBusinessIds.length !== 1 ? 'es' : ''}</div>
                      {notificationType === 'personal' && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                          (Plus {targetUsers.length} direct user{targetUsers.length !== 1 ? 's' : ''})
                        </div>
                      )}
                    </>
                  ) : notificationType === 'general' ? (
                    'Will broadcast to all opted-in users in the palika'
                  ) : (
                    `Will send to ${targetUsers.length} selected user${targetUsers.length !== 1 ? 's' : ''}`
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
      style={{
        flex: 1,
        padding: '14px 16px',
        borderRadius: '8px',
        border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        backgroundColor: active ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <div style={{
        color: active ? '#3b82f6' : '#94a3b8',
        marginTop: '2px',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: active ? '#1e293b' : '#64748b' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
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
  color: '#475569',
  display: 'block',
}

const smallLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#94a3b8',
  display: 'block',
  marginBottom: '3px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#1e293b',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
}
