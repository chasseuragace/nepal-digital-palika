'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import BlogPostForm, {
  type BlogPostFormPayload,
  type BlogPostFormValues,
} from '../_components/BlogPostForm'
import {
  blogPostsService,
  type BlogPost,
} from '@/lib/client/blog-posts-client.service'
import '../../heritage-sites/new/heritage-sites-new.css'

function postToFormValues(post: BlogPost): Partial<BlogPostFormValues> {
  const status = (post.status as BlogPostFormValues['status']) || 'draft'
  return {
    title_en: post.title_en || '',
    title_ne: post.title_ne || '',
    slug: post.slug || '',
    excerpt: post.excerpt || '',
    excerpt_ne: post.excerpt_ne || '',
    content: post.content || '',
    content_ne: post.content_ne || '',
    featured_image: post.featured_image || '',
    category: post.category || '',
    tags: post.tags || [],
    status,
    palika_id: post.palika_id ? String(post.palika_id) : '',
    author_id: post.author_id || '',
    author_name: post.author_name || '',
  }
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [initial, setInitial] = useState<Partial<BlogPostFormValues> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const post = await blogPostsService.getById(id)
        setInitial(postToFormValues(post))
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to load blog post')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [id])

  const handleSubmit = async (payload: BlogPostFormPayload) => {
    if (!id) return
    await blogPostsService.update(id, payload)
    router.push('/blog-posts')
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading blog post...</p>
        </div>
      </AdminLayout>
    )
  }

  if (loadError || !initial) {
    return (
      <AdminLayout>
        <div className="heritage-container">
          <div className="alert alert-error slide-in-up">
            <span className="alert-icon">✕</span>
            <span>{loadError || 'Blog post not found'}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/blog-posts')}
            >
              ← Back to Posts
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="heritage-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">Edit Blog Post</h1>
              <p className="page-subtitle">Update content, refine the story, adjust publish state</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary header-cancel-btn"
            onClick={() => router.push('/blog-posts')}
          >
            ← Back to Posts
          </button>
        </div>

        <BlogPostForm
          mode="edit"
          initial={initial}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  )
}
