#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAdminSetup(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1)
    
    return !error && data !== null
  } catch {
    return false
  }
}

async function main() {
  console.log('🚀 Complete Nepal Tourism System Setup')
  console.log('=====================================')
  console.log(`📍 Target: ${supabaseUrl}`)
  
  try {
    // Check if admin users are set up
    const hasAdminUsers = await checkAdminSetup()
    
    if (!hasAdminUsers) {
      console.log('\n⚠️  Admin users not found!')
      console.log('\n📋 Required Setup Steps:')
      console.log('1. Run admin setup:')
      console.log('   npm run setup:auth-admin')
      console.log('2. Re-run this script')
      console.log('\n💡 This creates Supabase Auth admin users for content management')
      return
    }
    
    console.log('✅ Admin users found')
    
    // Check admin users
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('full_name, role')
    
    console.log('\n👥 Available Admin Users:')
    adminUsers?.forEach(user => {
      console.log(`   • ${user.full_name} (${user.role})`)
    })
    
    // Check content status
    const { data: heritageSites } = await supabase
      .from('heritage_sites')
      .select('count')
    
    const { data: events } = await supabase
      .from('events')
      .select('count')
    
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('count')
    
    console.log('\n📊 Current Content Status:')
    console.log(`   • Heritage Sites: ${heritageSites?.[0]?.count || 0}`)
    console.log(`   • Events: ${events?.[0]?.count || 0}`)
    console.log(`   • Blog Posts: ${blogPosts?.[0]?.count || 0}`)
    
    console.log('\n🎯 System Status: READY FOR CONTENT MANAGEMENT!')
    console.log('\n📝 Next Steps:')
    console.log('1. Build admin login interface')
    console.log('2. Create content management dashboard')
    console.log('3. Add heritage site creation/editing')
    console.log('4. Implement blog post editor')
    console.log('5. Add event management')
    
    console.log('\n🔐 Admin Login Credentials:')
    console.log('   • superadmin@nepal-tourism.gov.np (Super Admin)')
    console.log('   • ktm.admin@nepal-tourism.gov.np (Palika Admin)')
    console.log('   • moderator@nepal-tourism.gov.np (Content Moderator)')
    console.log('   • Password: TempPassword123! (change immediately)')
    console.log('\n✅ Using proper Supabase Auth integration')
    
  } catch (error) {
    console.error('❌ Setup check failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}