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
        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push('/blog-posts')}
          >
            ← Back to Posts
          </button>
        </div>

        <BlogPostForm
          mode="edit"
          postId={id}
          initial={initial}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  )
}
