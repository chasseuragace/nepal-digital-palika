import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        id,
        title_en,
        slug,
        status,
        created_at,
        published_at,
        admin_users!inner(full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
    }

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title_en,
      slug: post.slug,
      status: post.status,
      author_name: post.admin_users?.full_name || 'Unknown Author',
      created_at: post.created_at,
      published_at: post.published_at
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}