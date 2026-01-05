import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get counts for each content type
    const [heritageSites, events, blogPosts] = await Promise.all([
      supabaseAdmin.from('heritage_sites').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('blog_posts').select('id', { count: 'exact', head: true })
    ])

    // Get recent activity (last 10 items across all content types)
    const { data: recentHeritage } = await supabaseAdmin
      .from('heritage_sites')
      .select('id, name_english, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentEvents } = await supabaseAdmin
      .from('events')
      .select('id, name_english, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentBlogs } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and sort recent activity
    const recentActivity = [
      ...(recentHeritage || []).map(item => ({
        id: item.id,
        type: 'Heritage Site',
        title: item.name_english,
        created_at: item.created_at
      })),
      ...(recentEvents || []).map(item => ({
        id: item.id,
        type: 'Event',
        title: item.name_english,
        created_at: item.created_at
      })),
      ...(recentBlogs || []).map(item => ({
        id: item.id,
        type: 'Blog Post',
        title: item.title,
        created_at: item.created_at
      }))
    ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

    return NextResponse.json({
      heritage_sites: heritageSites.count || 0,
      events: events.count || 0,
      blog_posts: blogPosts.count || 0,
      pending_approvals: 0, // TODO: Implement approval system
      recent_activity: recentActivity
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}