'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { blogPostsService, type BlogPost } from '@/lib/client/blog-posts-client.service'

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    try {
      const result = await blogPostsService.getAll()
      setPosts(result.data)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title_en?.toLowerCase().includes(filter.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(filter.toLowerCase()) ||
    post.status?.toLowerCase().includes(filter.toLowerCase())
  )

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading blog posts...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Blog Posts Management</h1>
        <Link href="/blog-posts/new" className="btn btn-primary">
          Write New Post
        </Link>
      </div>

      <div className="card">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Author</th>
              <th>Created</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td>{post.title_en}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{post.slug}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: post.status === 'published' ? '#d4edda' : 
                                   post.status === 'draft' ? '#fff3cd' : '#f8d7da',
                    color: post.status === 'published' ? '#155724' : 
                           post.status === 'draft' ? '#856404' : '#721c24'
                  }}>
                    {post.status}
                  </span>
                </td>
                <td>{post.author_name}</td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
                <td>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                </td>
                <td>
                  <Link href={`/blog-posts/${post.id}`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                  <Link href={`/blog-posts/${post.id}/view`} className="btn btn-secondary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {filter ? 'No blog posts match your search.' : 'No blog posts found. Write your first post!'}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}