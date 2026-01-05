#!/usr/bin/env tsx

/**
 * Nepal Digital Tourism Infrastructure - Database Seeding Script
 * 
 * 1. Optionally drops all tables (dev mode)
 * 2. Creates database schema from schema-setup.sql
 * 3. Seeds essential reference data into Supabase database
 * 
 * Usage:
 *   npx tsx seed-database.ts              # Normal seeding
 *   npx tsx seed-database.ts --drop-all   # Drop tables first (dev mode)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config()

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Command line arguments
const args = process.argv.slice(2)
const shouldDropAll = args.includes('--drop-all')

/**
 * Drop all tables (for development)
 */
async function dropAllTables() {
  console.log('🗑️  Drop all tables (development mode)...')
  console.log('⚠️  This requires manual execution in Supabase SQL Editor')
  console.log('')
  console.log('📋 Manual Drop Instructions:')
  console.log('   1. Open Supabase Dashboard → SQL Editor')
  console.log('   2. Copy and run this SQL:')
  console.log('')
  console.log('   -- Drop all tables in reverse dependency order')
  console.log('   DROP TABLE IF EXISTS analytics_events CASCADE;')
  console.log('   DROP TABLE IF EXISTS audit_log CASCADE;')
  console.log('   DROP TABLE IF EXISTS user_events CASCADE;')
  console.log('   DROP TABLE IF EXISTS role_permissions CASCADE;')
  console.log('   DROP TABLE IF EXISTS permissions CASCADE;')
  console.log('   DROP TABLE IF EXISTS roles CASCADE;')
  console.log('   DROP TABLE IF EXISTS content_moderation CASCADE;')
  console.log('   DROP TABLE IF EXISTS support_tickets CASCADE;')
  console.log('   DROP TABLE IF EXISTS notifications CASCADE;')
  console.log('   DROP TABLE IF EXISTS categories CASCADE;')
  console.log('   DROP TABLE IF EXISTS blog_posts CASCADE;')
  console.log('   DROP TABLE IF EXISTS favorites CASCADE;')
  console.log('   DROP TABLE IF EXISTS sos_requests CASCADE;')
  console.log('   DROP TABLE IF EXISTS reviews CASCADE;')
  console.log('   DROP TABLE IF EXISTS inquiries CASCADE;')
  console.log('   DROP TABLE IF EXISTS businesses CASCADE;')
  console.log('   DROP TABLE IF EXISTS events CASCADE;')
  console.log('   DROP TABLE IF EXISTS heritage_sites CASCADE;')
  console.log('   DROP TABLE IF EXISTS admin_users CASCADE;')
  console.log('   DROP TABLE IF EXISTS profiles CASCADE;')
  console.log('   DROP TABLE IF EXISTS palikas CASCADE;')
  console.log('   DROP TABLE IF EXISTS districts CASCADE;')
  console.log('   DROP TABLE IF EXISTS provinces CASCADE;')
  console.log('   DROP TABLE IF EXISTS otp_verifications CASCADE;')
  console.log('   DROP TABLE IF EXISTS user_devices CASCADE;')
  console.log('   DROP TABLE IF EXISTS search_history CASCADE;')
  console.log('   DROP TABLE IF EXISTS user_downloads CASCADE;')
  console.log('   DROP TABLE IF EXISTS app_versions CASCADE;')
  console.log('   DROP TABLE IF EXISTS qr_codes CASCADE;')
  console.log('')
  console.log('   3. Then re-run this script to set up fresh schema')
  console.log('')
}

/**
 * Execute schema setup SQL
 */
async function setupSchema() {
  console.log('🏗️  Database schema setup required...')
  console.log('')
  console.log('📋 Manual Setup Instructions:')
  console.log('   1. Open Supabase Dashboard → SQL Editor')
  console.log('   2. Copy contents of ./scripts/part1-basic-tables.sql')
  console.log('   3. Paste and run in SQL Editor')
  console.log('   4. Copy contents of ./scripts/part2-content-tables.sql')
  console.log('   5. Paste and run in SQL Editor')
  console.log('   6. Re-run this seeding script')
  console.log('')
  console.log('💡 Use npm run copy-part1 and npm run copy-part2 for easy copying')
  console.log('')
  
  // Check if basic tables exist to determine if schema is already set up
  try {
    const { data, error } = await supabase
      .from('provinces')
      .select('count')
      .limit(1)
    
    if (!error) {
      console.log('✅ Schema appears to be already set up (provinces table exists)')
      return true
    }
  } catch (e) {
    // Table doesn't exist, schema setup needed
  }
  
  console.log('❌ Schema not found. Please run the manual setup first.')
  console.log('')
  console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql')
  
  return false
}

// Types for our data structures
interface Province {
  name_en: string
  name_ne: string
  code: string
}

interface District {
  province_code: string
  name_en: string
  name_ne: string
  code: string
}

interface Palika {
  district_code: string
  name_en: string
  name_ne: string
  type: 'municipality' | 'metropolitan' | 'sub_metropolitan'
  code: string
  total_wards: number
}

interface Role {
  name: string
  description: string
  description_ne: string
}

interface Permission {
  name: string
  description: string
  description_ne: string
  resource: string
  action: string
}

interface Category {
  entity_type: 'heritage_site' | 'event' | 'business' | 'blog_post'
  name_en: string
  name_ne: string
  slug: string
  display_order: number
}

// ==========================================
// REFERENCE DATA
// ==========================================

const PROVINCES: Province[] = [
  { name_en: 'Koshi Province', name_ne: 'कोशी प्रदेश', code: 'P1' },
  { name_en: 'Madhesh Province', name_ne: 'मधेश प्रदेश', code: 'P2' },
  { name_en: 'Bagmati Province', name_ne: 'बागमती प्रदेश', code: 'P3' },
  { name_en: 'Gandaki Province', name_ne: 'गण्डकी प्रदेश', code: 'P4' },
  { name_en: 'Lumbini Province', name_ne: 'लुम्बिनी प्रदेश', code: 'P5' },
  { name_en: 'Karnali Province', name_ne: 'कर्णाली प्रदेश', code: 'P6' },
  { name_en: 'Sudurpashchim Province', name_ne: 'सुदूरपश्चिम प्रदेश', code: 'P7' }
]

const MAJOR_DISTRICTS: District[] = [
  // Bagmati Province (P3) - Major districts
  { province_code: 'P3', name_en: 'Kathmandu', name_ne: 'काठमाडौं', code: 'D25', },
  { province_code: 'P3', name_en: 'Lalitpur', name_ne: 'ललितपुर', code: 'D26', },
  { province_code: 'P3', name_en: 'Bhaktapur', name_ne: 'भक्तपुर', code: 'D27', },
  
  // Gandaki Province (P4) - Major districts  
  { province_code: 'P4', name_en: 'Kaski', name_ne: 'कास्की', code: 'D33', },
  { province_code: 'P4', name_en: 'Gorkha', name_ne: 'गोरखा', code: 'D34', },
  
  // Koshi Province (P1) - Major districts
  { province_code: 'P1', name_en: 'Jhapa', name_ne: 'झापा', code: 'D01', },
  { province_code: 'P1', name_en: 'Morang', name_ne: 'मोरङ', code: 'D02', },
  
  // Lumbini Province (P5) - Major districts
  { province_code: 'P5', name_en: 'Rupandehi', name_ne: 'रुपन्देही', code: 'D43', },
  { province_code: 'P5', name_en: 'Chitwan', name_ne: 'चितवन', code: 'D44', }
]

const MAJOR_PALIKAS: Palika[] = [
  // Metropolitan Cities
  { district_code: 'D25', name_en: 'Kathmandu Metropolitan', name_ne: 'काठमाडौं महानगरपालिका', type: 'metropolitan', code: 'KTM-001', total_wards: 32 },
  { district_code: 'D33', name_en: 'Pokhara Metropolitan', name_ne: 'पोखरा महानगरपालिका', type: 'metropolitan', code: 'PKR-001', total_wards: 33 },
  { district_code: 'D26', name_en: 'Lalitpur Metropolitan', name_ne: 'ललितपुर महानगरपालिका', type: 'metropolitan', code: 'LTP-001', total_wards: 29 },
  { district_code: 'D27', name_en: 'Bhaktapur Municipality', name_ne: 'भक्तपुर नगरपालिका', type: 'municipality', code: 'BKT-001', total_wards: 10 },
  
  // Sub-Metropolitan Cities
  { district_code: 'D44', name_en: 'Bharatpur Metropolitan', name_ne: 'भरतपुर महानगरपालिका', type: 'metropolitan', code: 'BRT-001', total_wards: 29 },
  { district_code: 'D43', name_en: 'Butwal Sub-Metropolitan', name_ne: 'बुटवल उपमहानगरपालिका', type: 'sub_metropolitan', code: 'BTL-001', total_wards: 19 },
  
  // Major Municipalities
  { district_code: 'D01', name_en: 'Mechinagar Municipality', name_ne: 'मेचीनगर नगरपालिका', type: 'municipality', code: 'MCH-001', total_wards: 15 },
  { district_code: 'D02', name_en: 'Biratnagar Metropolitan', name_ne: 'विराटनगर महानगरपालिका', type: 'metropolitan', code: 'BRT-002', total_wards: 19 }
]

const ROLES: Role[] = [
  { 
    name: 'super_admin', 
    description: 'Full system access across all palikas', 
    description_ne: 'सम्पूर्ण प्रणाली पहुँच' 
  },
  { 
    name: 'palika_admin', 
    description: 'Full access within assigned palika', 
    description_ne: 'तोकिएको पालिका भित्र पूर्ण पहुँच' 
  },
  { 
    name: 'content_editor', 
    description: 'Can create and edit content', 
    description_ne: 'सामग्री सिर्जना र सम्पादन' 
  },
  { 
    name: 'content_reviewer', 
    description: 'Can review and approve content', 
    description_ne: 'सामग्री समीक्षा र अनुमोदन' 
  },
  { 
    name: 'support_agent', 
    description: 'Can handle support tickets', 
    description_ne: 'सहायता टिकट व्यवस्थापन' 
  },
  { 
    name: 'moderator', 
    description: 'Can moderate content and users', 
    description_ne: 'सामग्री र प्रयोगकर्ता नियन्त्रण' 
  }
]

const PERMISSIONS: Permission[] = [
  { name: 'manage_heritage_sites', description: 'Create, edit, delete heritage sites', description_ne: 'सम्पदा स्थल व्यवस्थापन', resource: 'heritage_site', action: 'manage' },
  { name: 'manage_events', description: 'Create, edit, delete events', description_ne: 'कार्यक्रम व्यवस्थापन', resource: 'event', action: 'manage' },
  { name: 'manage_businesses', description: 'Verify, edit, delete businesses', description_ne: 'व्यवसाय व्यवस्थापन', resource: 'business', action: 'manage' },
  { name: 'manage_blog_posts', description: 'Create, edit, delete blog posts', description_ne: 'ब्लग पोस्ट व्यवस्थापन', resource: 'blog_post', action: 'manage' },
  { name: 'manage_users', description: 'Create, edit, delete user accounts', description_ne: 'प्रयोगकर्ता व्यवस्थापन', resource: 'user', action: 'manage' },
  { name: 'manage_admins', description: 'Create, edit, delete admin accounts', description_ne: 'प्रशासक व्यवस्थापन', resource: 'admin', action: 'manage' },
  { name: 'manage_sos', description: 'Handle SOS requests and responses', description_ne: 'आपतकालीन अनुरोध व्यवस्थापन', resource: 'sos_request', action: 'manage' },
  { name: 'manage_support', description: 'Handle support tickets', description_ne: 'सहायता टिकट व्यवस्थापन', resource: 'support_ticket', action: 'manage' },
  { name: 'moderate_content', description: 'Review and approve content', description_ne: 'सामग्री समीक्षा र अनुमोदन', resource: 'content', action: 'moderate' },
  { name: 'view_analytics', description: 'Access analytics and reports', description_ne: 'विश्लेषण र रिपोर्ट हेर्ने', resource: 'analytics', action: 'view' },
  { name: 'manage_categories', description: 'Create and manage content categories', description_ne: 'सामग्री श्रेणी व्यवस्थापन', resource: 'category', action: 'manage' },
  { name: 'send_notifications', description: 'Send notifications to users', description_ne: 'प्रयोगकर्तालाई सूचना पठाउने', resource: 'notification', action: 'send' }
]

const CATEGORIES: Category[] = [
  // Heritage site categories
  { entity_type: 'heritage_site', name_en: 'Temple', name_ne: 'मन्दिर', slug: 'temple', display_order: 1 },
  { entity_type: 'heritage_site', name_en: 'Monastery', name_ne: 'गुम्बा', slug: 'monastery', display_order: 2 },
  { entity_type: 'heritage_site', name_en: 'Palace', name_ne: 'दरबार', slug: 'palace', display_order: 3 },
  { entity_type: 'heritage_site', name_en: 'Fort', name_ne: 'किल्ला', slug: 'fort', display_order: 4 },
  { entity_type: 'heritage_site', name_en: 'Museum', name_ne: 'संग्रहालय', slug: 'museum', display_order: 5 },
  { entity_type: 'heritage_site', name_en: 'Archaeological Site', name_ne: 'पुरातत्व स्थल', slug: 'archaeological', display_order: 6 },
  { entity_type: 'heritage_site', name_en: 'Natural Heritage', name_ne: 'प्राकृतिक सम्पदा', slug: 'natural', display_order: 7 },
  
  // Event categories
  { entity_type: 'event', name_en: 'Festival', name_ne: 'चाड पर्व', slug: 'festival', display_order: 1 },
  { entity_type: 'event', name_en: 'Cultural', name_ne: 'सांस्कृतिक', slug: 'cultural', display_order: 2 },
  { entity_type: 'event', name_en: 'Sports', name_ne: 'खेलकुद', slug: 'sports', display_order: 3 },
  { entity_type: 'event', name_en: 'Religious', name_ne: 'धार्मिक', slug: 'religious', display_order: 4 },
  { entity_type: 'event', name_en: 'Food', name_ne: 'खाना', slug: 'food', display_order: 5 },
  { entity_type: 'event', name_en: 'Music', name_ne: 'संगीत', slug: 'music', display_order: 6 },
  { entity_type: 'event', name_en: 'Educational', name_ne: 'शैक्षिक', slug: 'educational', display_order: 7 },
  
  // Business categories
  { entity_type: 'business', name_en: 'Accommodation', name_ne: 'बास स्थान', slug: 'accommodation', display_order: 1 },
  { entity_type: 'business', name_en: 'Restaurant', name_ne: 'रेस्टुरेन्ट', slug: 'restaurant', display_order: 2 },
  { entity_type: 'business', name_en: 'Tour Operator', name_ne: 'भ्रमण संचालक', slug: 'tour-operator', display_order: 3 },
  { entity_type: 'business', name_en: 'Transport', name_ne: 'यातायात', slug: 'transport', display_order: 4 },
  { entity_type: 'business', name_en: 'Shopping', name_ne: 'किनमेल', slug: 'shopping', display_order: 5 },
  { entity_type: 'business', name_en: 'Entertainment', name_ne: 'मनोरञ्जन', slug: 'entertainment', display_order: 6 },
  { entity_type: 'business', name_en: 'Emergency Services', name_ne: 'आपतकालीन सेवा', slug: 'emergency', display_order: 7 },
  { entity_type: 'business', name_en: 'Government Office', name_ne: 'सरकारी कार्यालय', slug: 'government', display_order: 8 },
  
  // Blog post categories
  { entity_type: 'blog_post', name_en: 'Tourism News', name_ne: 'पर्यटन समाचार', slug: 'tourism-news', display_order: 1 },
  { entity_type: 'blog_post', name_en: 'Cultural Stories', name_ne: 'सांस्कृतिक कथा', slug: 'cultural-stories', display_order: 2 },
  { entity_type: 'blog_post', name_en: 'Local Events', name_ne: 'स्थानीय कार्यक्रम', slug: 'local-events', display_order: 3 },
  { entity_type: 'blog_post', name_en: 'Heritage Updates', name_ne: 'सम्पदा अपडेट', slug: 'heritage-updates', display_order: 4 },
  { entity_type: 'blog_post', name_en: 'Community News', name_ne: 'समुदायिक समाचार', slug: 'community-news', display_order: 5 }
]

// Role-Permission mappings
const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  palika_admin: [
    'manage_heritage_sites', 'manage_events', 'manage_businesses', 
    'manage_blog_posts', 'manage_sos', 'manage_support', 
    'moderate_content', 'view_analytics', 'manage_categories', 
    'send_notifications'
  ],
  content_editor: ['manage_heritage_sites', 'manage_events', 'manage_blog_posts'],
  content_reviewer: ['moderate_content', 'view_analytics'],
  support_agent: ['manage_support', 'manage_sos'],
  moderator: ['moderate_content', 'manage_businesses']
}

// ==========================================
// SEEDING FUNCTIONS
// ==========================================

async function seedProvinces() {
  console.log('🏔️  Seeding provinces...')
  
  const { data, error } = await supabase
    .from('provinces')
    .upsert(PROVINCES, { onConflict: 'code' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding provinces:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} provinces`)
  return data
}

async function seedDistricts(provinces: any[]) {
  console.log('🏘️  Seeding districts...')
  
  // Map province codes to IDs
  const provinceMap = new Map(provinces.map(p => [p.code, p.id]))
  
  const districtsWithProvinceIds = MAJOR_DISTRICTS.map(district => {
    const { province_code, ...districtData } = district
    return {
      ...districtData,
      province_id: provinceMap.get(province_code)
    }
  })
  
  const { data, error } = await supabase
    .from('districts')
    .upsert(districtsWithProvinceIds, { onConflict: 'code' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding districts:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} districts`)
  return data
}

async function seedPalikas(districts: any[]) {
  console.log('🏛️  Seeding palikas...')
  
  // Map district codes to IDs
  const districtMap = new Map(districts.map(d => [d.code, d.id]))
  
  const palikasWithDistrictIds = MAJOR_PALIKAS.map(palika => {
    const { district_code, ...palikaData } = palika
    return {
      ...palikaData,
      district_id: districtMap.get(district_code)
    }
  })
  
  const { data, error } = await supabase
    .from('palikas')
    .upsert(palikasWithDistrictIds, { onConflict: 'code' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding palikas:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} palikas`)
  return data
}

async function seedRoles() {
  console.log('👥 Seeding roles...')
  
  // Check if roles already exist (from schema setup)
  const { data: existingRoles, error: checkError } = await supabase
    .from('roles')
    .select('count')
    .limit(1)
  
  if (checkError) {
    console.error('❌ Error checking existing roles:', checkError)
    throw checkError
  }
  
  // If roles already exist from schema setup, just return them
  if (existingRoles && existingRoles.length > 0) {
    const { data: allRoles, error } = await supabase
      .from('roles')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching existing roles:', error)
      throw error
    }
    
    console.log(`✅ Found ${allRoles.length} existing roles (from schema setup)`)
    return allRoles
  }
  
  // Otherwise, seed the roles
  const { data, error } = await supabase
    .from('roles')
    .upsert(ROLES, { onConflict: 'name' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding roles:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} roles`)
  return data
}

async function seedPermissions() {
  console.log('🔐 Seeding permissions...')
  
  // Check if permissions already exist (from schema setup)
  const { data: existingPermissions, error: checkError } = await supabase
    .from('permissions')
    .select('count')
    .limit(1)
  
  if (checkError) {
    console.error('❌ Error checking existing permissions:', checkError)
    throw checkError
  }
  
  // If permissions already exist from schema setup, just return them
  if (existingPermissions && existingPermissions.length > 0) {
    const { data: allPermissions, error } = await supabase
      .from('permissions')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching existing permissions:', error)
      throw error
    }
    
    console.log(`✅ Found ${allPermissions.length} existing permissions (from schema setup)`)
    return allPermissions
  }
  
  // Otherwise, seed the permissions
  const { data, error } = await supabase
    .from('permissions')
    .upsert(PERMISSIONS, { onConflict: 'name' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding permissions:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} permissions`)
  return data
}

async function seedRolePermissions(roles: any[], permissions: any[]) {
  console.log('🔗 Seeding role-permission mappings...')
  
  const roleMap = new Map(roles.map(r => [r.name, r.id]))
  const permissionMap = new Map(permissions.map(p => [p.name, p.id]))
  
  const rolePermissions = []
  
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName)
    if (!roleId) continue
    
    if (permissionNames.includes('*')) {
      // Super admin gets all permissions
      for (const permission of permissions) {
        rolePermissions.push({
          role_id: roleId,
          permission_id: permission.id
        })
      }
    } else {
      for (const permissionName of permissionNames) {
        const permissionId = permissionMap.get(permissionName)
        if (permissionId) {
          rolePermissions.push({
            role_id: roleId,
            permission_id: permissionId
          })
        }
      }
    }
  }
  
  const { data, error } = await supabase
    .from('role_permissions')
    .upsert(rolePermissions, { onConflict: 'role_id,permission_id' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding role permissions:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} role-permission mappings`)
  return data
}

async function seedCategories() {
  console.log('📂 Seeding categories...')
  
  // Check if categories already exist (from schema setup)
  const { data: existingCategories, error: checkError } = await supabase
    .from('categories')
    .select('count')
    .limit(1)
  
  if (checkError) {
    console.error('❌ Error checking existing categories:', checkError)
    throw checkError
  }
  
  // If categories already exist from schema setup, just return them
  if (existingCategories && existingCategories.length > 0) {
    const { data: allCategories, error } = await supabase
      .from('categories')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching existing categories:', error)
      throw error
    }
    
    console.log(`✅ Found ${allCategories.length} existing categories (from schema setup)`)
    return allCategories
  }
  
  // Otherwise, seed the categories
  const categoriesWithNullPalika = CATEGORIES.map(category => ({
    ...category,
    palika_id: null // Global categories
  }))
  
  const { data, error } = await supabase
    .from('categories')
    .upsert(categoriesWithNullPalika, { onConflict: 'entity_type,slug' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} categories`)
  return data
}

async function seedAppVersions() {
  console.log('📱 Seeding app versions...')
  
  const appVersions = [
    {
      version_name: '1.0.0',
      version_code: 1,
      platform: 'android',
      is_required: false,
      is_latest: true,
      release_notes: 'Initial release with core features: heritage sites, events, businesses, SOS system',
      min_supported_version: 1
    },
    {
      version_name: '1.0.0',
      version_code: 1,
      platform: 'ios',
      is_required: false,
      is_latest: true,
      release_notes: 'Initial release with core features: heritage sites, events, businesses, SOS system',
      min_supported_version: 1
    }
  ]
  
  const { data, error } = await supabase
    .from('app_versions')
    .upsert(appVersions, { onConflict: 'platform,version_code' })
    .select()
  
  if (error) {
    console.error('❌ Error seeding app versions:', error)
    throw error
  }
  
  console.log(`✅ Seeded ${data.length} app versions`)
  return data
}

// ==========================================
// MAIN SEEDING FUNCTION
// ==========================================

async function main() {
  console.log('🌱 Starting database seeding...')
  console.log('📍 Target:', supabaseUrl)
  
  if (shouldDropAll) {
    console.log('⚠️  Development mode: Will drop all tables first')
  }
  
  console.log('')
  
  try {
    // Step 1: Drop all tables if requested (development mode)
    if (shouldDropAll) {
      await dropAllTables()
      console.log('⏸️  Please manually drop tables in Supabase SQL Editor, then re-run without --drop-all')
      process.exit(0)
    }
    
    // Step 2: Setup database schema
    const schemaReady = await setupSchema()
    if (!schemaReady) {
      console.log('⏸️  Seeding paused. Please set up the schema first and re-run.')
      process.exit(0)
    }
    console.log('')
    
    // Step 3: Test connection
    console.log('🔗 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('provinces')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    console.log('')
    
    // Step 4: Seed geographical data (hierarchical)
    const provinces = await seedProvinces()
    const districts = await seedDistricts(provinces)
    const palikas = await seedPalikas(districts)
    
    // Seed system configuration
    const roles = await seedRoles()
    const permissions = await seedPermissions()
    await seedRolePermissions(roles, permissions)
    
    // Seed content structure
    await seedCategories()
    
    // Seed technical data
    await seedAppVersions()
    
    console.log('')
    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   • ${provinces.length} provinces`)
    console.log(`   • ${districts.length} districts`)
    console.log(`   • ${palikas.length} palikas`)
    console.log(`   • ${roles.length} roles`)
    console.log(`   • ${permissions.length} permissions`)
    console.log(`   • ${CATEGORIES.length} categories`)
    console.log(`   • 2 app versions`)
    console.log('')
    console.log('✅ System is ready for content creation!')
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  main()
}

export { main as seedDatabase }