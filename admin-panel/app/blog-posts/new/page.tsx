'use client'

import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import BlogPostForm, {
  type BlogPostFormPayload,
} from '../_components/BlogPostForm'
import { blogPostsService } from '@/lib/client/blog-posts-client.service'

export default function NewBlogPostPage() {
  const router = useRouter()

  const handleSubmit = async (payload: BlogPostFormPayload) => {
    await blogPostsService.create(payload)
    router.push('/blog-posts')
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
              <h1 className="page-title">Write Blog Post</h1>
              <p className="page-subtitle">
                Share stories, updates, and heritage insights with your audience
              </p>
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

        <BlogPostForm mode="create" submitLabel="Create Post" onSubmit={handleSubmit} />
      </div>
    </AdminLayout>
  )
}
