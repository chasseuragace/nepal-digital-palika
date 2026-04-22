'use client'

/**
 * BlogPostForm — shared create/edit form.
 *
 * Shape & styling mirror app/heritage-sites/new/page.tsx so the admin
 * panel feels coherent. Three-tab wizard:
 *   1. Content        — titles, slug, excerpts, bilingual rich text
 *   2. Media & Tags   — featured image, category, tags
 *   3. Publish        — status, palika (author_id auto-injected)
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { palikaService, type Palika } from '@/lib/client/palika-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import AssetGallery from '@/components/AssetGallery'
import RichTextEditor from './RichTextEditor'
import '../blog-posts.css'

const DEFAULT_CATEGORIES = [
  'News',
  'Culture',
  'Festival',
  'Tourism Tips',
  'Heritage',
  'Events',
]

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()

export type BlogPostFormValues = {
  title_en: string
  title_ne: string
  slug: string
  excerpt: string
  excerpt_ne: string
  content: string
  content_ne: string
  featured_image: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  palika_id: string
  author_id: string
  author_name: string
}

export type BlogPostFormPayload = {
  title_en: string
  title_ne: string
  slug?: string
  excerpt?: string
  excerpt_ne?: string
  content: string
  content_ne?: string
  featured_image?: string
  category?: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  palika_id: number
  author_id: string
  author_name?: string
}

export const EMPTY_BLOG_POST_FORM: BlogPostFormValues = {
  title_en: '',
  title_ne: '',
  slug: '',
  excerpt: '',
  excerpt_ne: '',
  content: '',
  content_ne: '',
  featured_image: '',
  category: '',
  tags: [],
  status: 'draft',
  palika_id: '',
  author_id: '',
  author_name: '',
}

interface BlogPostFormProps {
  mode: 'create' | 'edit'
  postId?: string
  initial?: Partial<BlogPostFormValues>
  submitLabel?: string
  onSubmit: (payload: BlogPostFormPayload) => Promise<void>
}

type FieldErrors = Partial<Record<keyof BlogPostFormValues, string>>

const TABS = [
  { id: 'content', label: 'Content', icon: '1', description: 'Titles & editor' },
  { id: 'media', label: 'Media & Tags', icon: '2', description: 'Image, category, tags' },
  { id: 'publish', label: 'Publish', icon: '3', description: 'Status & palika' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function BlogPostForm({
  mode,
  postId,
  initial,
  submitLabel,
  onSubmit,
}: BlogPostFormProps) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabId>('content')
  const [formData, setFormData] = useState<BlogPostFormValues>(() => ({
    ...EMPTY_BLOG_POST_FORM,
    ...(initial ?? {}),
  }))
  const [slugEdited, setSlugEdited] = useState<boolean>(
    !!(initial?.slug && initial.slug.trim().length > 0)
  )
  const [tagDraft, setTagDraft] = useState('')
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Keep form state in sync if `initial` arrives asynchronously (edit page)
  useEffect(() => {
    if (!initial) return
    setFormData(prev => ({ ...prev, ...initial }))
    if (initial.slug) setSlugEdited(true)
  }, [initial])

  // Inject author_id and author_name from the logged-in session (one-shot on mount)
  useEffect(() => {
    if (formData.author_id) return
    const session = adminSessionStore.get()
    if (session?.id) {
      setFormData(prev => ({ 
        ...prev, 
        author_id: session.id,
        author_name: session.full_name || ''
      }))
    }
  }, [formData.author_id])

  // Load palikas for the Publish tab
  useEffect(() => {
    let cancelled = false
    palikaService
      .getPalikas()
      .then(data => {
        if (!cancelled) setPalikas(data)
      })
      .catch(err => {
        console.error('Error fetching palikas:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const progress = useMemo(() => {
    const idx = TABS.findIndex(t => t.id === activeTab)
    return ((idx + 1) / TABS.length) * 100
  }, [activeTab])

  const stepIndex = TABS.findIndex(t => t.id === activeTab)

  /* ---------- field helpers ---------- */

  const setField = <K extends keyof BlogPostFormValues>(
    key: K,
    value: BlogPostFormValues[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleTitleEnChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title_en: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }))
    setErrors(prev => ({ ...prev, title_en: undefined }))
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setField('slug', slugify(value))
  }

  /* ---------- tag chip input ---------- */

  const addTagsFromDraft = () => {
    const raw = tagDraft.trim()
    if (!raw) return
    const pieces = raw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    if (pieces.length === 0) return
    setFormData(prev => {
      const next = [...prev.tags]
      for (const p of pieces) {
        if (!next.includes(p)) next.push(p)
      }
      return { ...prev, tags: next }
    })
    setTagDraft('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTagsFromDraft()
    } else if (e.key === 'Backspace' && !tagDraft && formData.tags.length > 0) {
      setFormData(prev => ({ ...prev, tags: prev.tags.slice(0, -1) }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  /* ---------- validation ---------- */

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!formData.title_en.trim()) next.title_en = 'English title is required'
    if (!formData.title_ne.trim()) next.title_ne = 'Nepali title is required'
    // react-quill emits '<p><br></p>' for blank editors — strip that too
    const contentText = formData.content
      .replace(/<(.|\n)*?>/g, '')
      .replace(/&nbsp;/g, '')
      .trim()
    if (!contentText) next.content = 'Content is required'
    if (!formData.palika_id) next.palika_id = 'Palika is required'

    setErrors(next)
    if (Object.keys(next).length === 0) return true

    // Route user back to the tab that contains the first missing field
    if (next.title_en || next.title_ne || next.content) setActiveTab('content')
    else if (next.palika_id) setActiveTab('publish')
    return false
  }

  /* ---------- submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Allow trailing-tag text in the input to be submitted too
    if (tagDraft.trim()) addTagsFromDraft()

    if (!validate()) {
      setError('Please fill in all required fields.')
      return
    }

    const session = adminSessionStore.get()
    const authorId = formData.author_id || session?.id
    if (!authorId) {
      setError('Cannot determine logged-in author. Please sign in again.')
      return
    }

    const payload: BlogPostFormPayload = {
      title_en: formData.title_en.trim(),
      title_ne: formData.title_ne.trim(),
      slug: formData.slug.trim() || undefined,
      excerpt: formData.excerpt.trim() || undefined,
      excerpt_ne: formData.excerpt_ne.trim() || undefined,
      content: formData.content,
      content_ne: formData.content_ne.trim() ? formData.content_ne : undefined,
      featured_image: formData.featured_image.trim() || undefined,
      category: formData.category.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      status: formData.status,
      palika_id: parseInt(formData.palika_id, 10),
      author_id: authorId,
      author_name: formData.author_name.trim() || undefined,
    }

    try {
      setIsSaving(true)
      await onSubmit(payload)
      setSuccess(
        mode === 'create' ? 'Blog post created successfully!' : 'Blog post updated successfully!'
      )
      setTimeout(() => {
        router.push('/blog-posts')
      }, 1200)
    } catch (err) {
      console.error('BlogPostForm submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save blog post')
    } finally {
      setIsSaving(false)
    }
  }

  /* ---------- render ---------- */

  return (
    <>
      {error && (
        <div className="alert alert-error slide-in-up">
          <span className="alert-icon">✕</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success slide-in-up">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      <div className="heritage-form-container blog-form-container">
        <form onSubmit={handleSubmit} noValidate>
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">
              Step {stepIndex + 1} of {TABS.length}
            </div>
          </div>

          <div className="tabs-container">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${
                  index < stepIndex ? 'completed' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="tab-icon">{tab.icon}</div>
                <div className="tab-content">
                  <div className="tab-label">{tab.label}</div>
                  <div className="tab-description">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* ========== CONTENT TAB ========== */}
          {activeTab === 'content' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Content</h3>
                <p className="section-subtitle">Titles, summaries, and the body of your post</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Titles</span>
                  <h4>Bilingual Title</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="title_en" className="form-label">
                      Title (English) <span className="required">*</span>
                    </label>
                    <input
                      id="title_en"
                      type="text"
                      className="form-input"
                      value={formData.title_en}
                      onChange={e => handleTitleEnChange(e.target.value)}
                      placeholder="Exploring the temples of Kathmandu Valley"
                    />
                    {errors.title_en && <div className="field-error">{errors.title_en}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="title_ne" className="form-label">
                      Title (Nepali) <span className="required">*</span>
                    </label>
                    <input
                      id="title_ne"
                      type="text"
                      className="form-input"
                      value={formData.title_ne}
                      onChange={e => setField('title_ne', e.target.value)}
                      placeholder="काठमाडौँ उपत्यकाका मन्दिरहरूको अन्वेषण"
                    />
                    {errors.title_ne && <div className="field-error">{errors.title_ne}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="slug" className="form-label">
                    URL Slug
                  </label>
                  <div className="slug-row">
                    <span className="slug-prefix">/blog/</span>
                    <input
                      id="slug"
                      type="text"
                      className="form-input"
                      value={formData.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder="auto-generated-from-english-title"
                    />
                  </div>
                  <div className="help-text">
                    <span>
                      {slugEdited
                        ? 'Manual override in effect.'
                        : 'Auto-generated from the English title.'}
                    </span>
                    {formData.slug && (
                      <span className="url-preview">Preview: /blog/{formData.slug}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Summary</span>
                  <h4>Excerpts</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="excerpt" className="form-label">
                      Excerpt (English)
                    </label>
                    <textarea
                      id="excerpt"
                      className="form-textarea"
                      value={formData.excerpt}
                      onChange={e => setField('excerpt', e.target.value)}
                      placeholder="A short summary shown on listings and cards"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="excerpt_ne" className="form-label">
                      Excerpt (Nepali)
                    </label>
                    <textarea
                      id="excerpt_ne"
                      className="form-textarea"
                      value={formData.excerpt_ne}
                      onChange={e => setField('excerpt_ne', e.target.value)}
                      placeholder="सूची र कार्डमा देखिने संक्षिप्त विवरण"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Body</span>
                  <h4>Content (English)</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="content" className="form-label">
                    English Content <span className="required">*</span>
                  </label>
                  <RichTextEditor
                    id="content"
                    value={formData.content}
                    onChange={html => setField('content', html)}
                    placeholder="Write the English version of your post here…"
                  />
                  {errors.content && <div className="field-error">{errors.content}</div>}
                  <div className="help-text">
                    <span>💡 Tip: Drag the bottom-right corner to resize the editor</span>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Body</span>
                  <h4>Content (Nepali)</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="content_ne" className="form-label">
                    Nepali Content
                  </label>
                  <RichTextEditor
                    id="content_ne"
                    value={formData.content_ne}
                    onChange={html => setField('content_ne', html)}
                    placeholder="यहाँ आफ्नो पोष्टको नेपाली संस्करण लेख्नुहोस्…"
                  />
                  <div className="help-text">
                    <span>💡 Tip: Drag the bottom-right corner to resize the editor</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== MEDIA & TAGS TAB ========== */}
          {activeTab === 'media' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Media & Tags</h3>
                <p className="section-subtitle">Featured image, category, and tags</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Image</span>
                  <h4>Featured Image</h4>
                </div>
                <div className="form-group">
                  <label className="form-label">Featured Image</label>

                  {formData.palika_id ? (
                    <>
                      <AssetGallery
                        palikaId={parseInt(formData.palika_id, 10)}
                        selectMode={true}
                        fileType="image"
                        uploadEnabled={true}
                        onAssetSelect={(asset) => {
                          setField('featured_image', asset.public_url)
                        }}
                      />
                      <div className="featured-image-preview" style={{ marginTop: '15px' }}>
                        {formData.featured_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formData.featured_image} alt="Featured preview" />
                        ) : (
                          <div className="featured-image-placeholder">No image selected</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        id="featured_image"
                        type="url"
                        className="form-input"
                        value={formData.featured_image}
                        onChange={e => setField('featured_image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <div className="help-text">
                        <span>Select a palika first to enable gallery upload, or paste a hosted image URL.</span>
                      </div>
                      <div className="featured-image-preview">
                        {formData.featured_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formData.featured_image} alt="Featured preview" />
                        ) : (
                          <div className="featured-image-placeholder">No image selected</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Category</span>
                  <h4>Categorization</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    className="form-input"
                    value={formData.category}
                    onChange={e => setField('category', e.target.value)}
                    placeholder="e.g. News, Culture, Festival"
                    list="blog-category-suggestions"
                  />
                  <datalist id="blog-category-suggestions">
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <div className="help-text">
                    <span>Free text — pick a suggestion or type your own.</span>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Tags</span>
                  <h4>Tags</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="tags" className="form-label">
                    Tags
                  </label>
                  <div className="tag-input-wrapper">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag-chip">
                        {tag}
                        <button
                          type="button"
                          className="tag-chip-remove"
                          aria-label={`Remove ${tag}`}
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      id="tags"
                      type="text"
                      className="tag-input-field"
                      value={tagDraft}
                      onChange={e => setTagDraft(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTagsFromDraft}
                      placeholder={
                        formData.tags.length === 0
                          ? 'Type a tag and press Enter or comma'
                          : 'Add another…'
                      }
                    />
                  </div>
                  <div className="help-text">
                    <span>Enter or comma to add, × or Backspace to remove.</span>
                    <span className="char-count">{formData.tags.length} tag(s)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== PUBLISH TAB ========== */}
          {activeTab === 'publish' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Publish</h3>
                <p className="section-subtitle">Where and how this post goes live</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Status</span>
                  <h4>Publication Status</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status <span className="required">*</span>
                  </label>
                  <select
                    id="status"
                    className="form-select"
                    value={formData.status}
                    onChange={e =>
                      setField('status', e.target.value as BlogPostFormValues['status'])
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Palika</span>
                  <h4>Ownership</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="palika_id" className="form-label">
                    Palika <span className="required">*</span>
                  </label>
                  <select
                    id="palika_id"
                    className="form-select"
                    value={formData.palika_id}
                    onChange={e => setField('palika_id', e.target.value)}
                  >
                    <option value="">Select Palika</option>
                    {palikas.map(p => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.name_en}
                      </option>
                    ))}
                  </select>
                  {errors.palika_id && <div className="field-error">{errors.palika_id}</div>}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Author</span>
                  <h4>Author Information</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="author_name" className="form-label">
                    Author Name
                  </label>
                  <input
                    type="text"
                    id="author_name"
                    className="form-input"
                    value={formData.author_name}
                    onChange={(e) => setField('author_name', e.target.value)}
                    placeholder="Enter author name"
                  />
                  <div className="help-text">
                    <span>
                      The name that will be displayed as the post author. Defaults to your profile name.
                    </span>
                  </div>
                </div>
                {/* Hidden input keeps author_id in the submit payload */}
                <input type="hidden" name="author_id" value={formData.author_id} />
              </div>
            </div>
          )}

          {/* ========== Actions ========== */}
          <div className="form-actions">
            <div className="form-actions-left">
              {stepIndex > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(TABS[stepIndex - 1].id)}
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="form-actions-right">
              {stepIndex < TABS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(TABS[stepIndex + 1].id)}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary btn-submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" />
                      {mode === 'create' ? 'Creating…' : 'Saving…'}
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      {submitLabel || (mode === 'create' ? 'Create Post' : 'Save Changes')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
