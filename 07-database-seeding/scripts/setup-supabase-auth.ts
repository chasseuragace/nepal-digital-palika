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

// Admin users to create
const adminUsers = [
  {
    email: 'superadmin@nepal-tourism.gov.np',
    password: 'TempPassword123!', // Change this!
    full_name: 'System Administrator',
    full_name_ne: 'प्रणाली प्रशासक',
    role: 'super_admin',
    palika: 'Kathmandu Metropolitan',
    permissions: ['manage_heritage_sites', 'manage_events', 'manage_businesses', 'manage_blog_posts', 'manage_users', 'manage_admins']
  },
  {
    email: 'ktm.admin@nepal-tourism.gov.np',
    password: 'TempPassword123!',
    full_name: 'Kathmandu Metro Administrator', 
    full_name_ne: 'काठमाडौं महानगर प्रशासक',
    role: 'palika_admin',
    palika: 'Kathmandu Metropolitan',
    permissions: ['manage_heritage_sites', 'manage_events', 'manage_businesses', 'view_analytics']
  },
  {
    email: 'moderator@nepal-tourism.gov.np',
    password: 'TempPassword123!',
    full_name: 'Content Moderator',
    full_name_ne: 'सामग्री संयोजक', 
    role: 'moderator',
    palika: 'Kathmandu Metropolitan',
    permissions: ['moderate_content', 'manage_reviews', 'view_reports']
  }
]

async function getPalikaId(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('palikas')
    .select('id')
    .eq('name_en', name)
    .single()
  
  if (error || !data) {
    throw new Error(`Palika '${name}' not found`)
  }
  
  return data.id
}

async function createAdminUser(userData: typeof adminUsers[0]) {
  try {
    console.log(`👤 Creating admin user: ${userData.email}`)
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })
    
    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`)
    }
    
    if (!authData.user) {
      throw new Error('No user returned from auth creation')
    }
    
    // 2. Get palika ID
    const palikaId = await getPalikaId(userData.palika)
    
    // 3. Create admin_users record
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role,
        palika_id: palikaId,
        permissions: userData.permissions,
        is_active: true
      })
    
    if (adminError) {
      throw new Error(`Admin record creation failed: ${adminError.message}`)
    }
    
    console.log(`✅ Created admin user: ${userData.email}`)
    return authData.user.id
    
  } catch (error) {
    console.error(`❌ Failed to create ${userData.email}:`, error)
    return null
  }
}

async function main() {
  console.log('👥 Creating Supabase Auth admin users...')
  console.log(`📍 Target: ${supabaseUrl}`)
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('palikas')
      .select('count')
      .limit(1)
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    console.log('✅ Database connection successful')
    
    // Create admin users
    let successCount = 0
    for (const userData of adminUsers) {
      const userId = await createAdminUser(userData)
      if (userId) successCount++
    }
    
    console.log('\n🎉 Admin user creation completed!')
    console.log(`📊 Summary: ${successCount}/${adminUsers.length} users created`)
    
    if (successCount > 0) {
      console.log('\n🔐 Login Credentials:')
      adminUsers.forEach(user => {
        console.log(`   ${user.email} / ${user.password}`)
      })
      console.log('\n⚠️  IMPORTANT: Change these passwords immediately!')
    }
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}