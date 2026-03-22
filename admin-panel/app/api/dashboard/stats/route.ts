import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get palika_id from query param
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null
    
    let palikaProfile = null
    
    // If palika_id is provided, fetch palika details
    if (palikaId) {
      const { data: palika, error: palikaError } = await supabaseAdmin
        .from('palikas')
        .select(`
          id, 
          name_en, 
          name_ne, 
          code, 
          type,
          district_id,
          office_phone,
          office_email,
          website,
          total_wards,
          is_active,
          subscription_tier_id,
          subscription_start_date,
          subscription_end_date,
          cost_per_month,
          created_at,
          updated_at
        `)
        .eq('id', palikaId)
        .single()
      
      if (palikaError) {
        console.error('Error fetching palika:', palikaError)
      }
      
      if (palika) {
        // Get district info to get province
        const { data: district } = await supabaseAdmin
          .from('districts')
          .select('name_en, name_ne, province_id')
          .eq('id', palika.district_id)
          .single()
        
        // Get province info
        const { data: province } = district ? await supabaseAdmin
          .from('provinces')
          .select('name_en, name_ne')
          .eq('id', district.province_id)
          .single() : { data: null }
        
        // Get subscription tier info if exists
        const { data: tier } = palika.subscription_tier_id ? await supabaseAdmin
          .from('subscription_tiers')
          .select('display_name, description')
          .eq('id', palika.subscription_tier_id)
          .single() : { data: null }
        
        palikaProfile = {
          id: palika.id,
          name_en: palika.name_en,
          name_ne: palika.name_ne,
          code: palika.code,
          type: palika.type,
          province: province?.name_en || 'Unknown',
          district: district?.name_en || 'Unknown',
          office_phone: palika.office_phone,
          office_email: palika.office_email,
          website: palika.website,
          total_wards: palika.total_wards,
          is_active: palika.is_active,
          subscription_tier_id: palika.subscription_tier_id,
          subscription_tier_display: tier?.display_name,
          subscription_start_date: palika.subscription_start_date,
          subscription_end_date: palika.subscription_end_date,
          cost_per_month: palika.cost_per_month,
          created_at: palika.created_at,
          updated_at: palika.updated_at
        }
      }
    }

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
      palika_profile: palikaProfile,
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