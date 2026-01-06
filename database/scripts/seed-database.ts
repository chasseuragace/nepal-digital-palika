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
import { seedAdminUsers } from './seed-admin-users'

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
const args = process.argv.slice(2);

/**
 * Guide the user to set up the database schema manually.
 */
async function setupSchema() {
  console.log('🏗️  Database schema setup required...');
  console.log('');
  console.log('📋 Manual Setup Instructions:');
  console.log('   1. Open your Supabase Project Dashboard → SQL Editor.');
  console.log('   2. Execute the SQL scripts in the following order:');
  console.log('');
  console.log('   STEP 1: Basic Tables');
  console.log("   - Run `npm run copy-part1` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   STEP 2: Content Tables');
  console.log("   - Run `npm run copy-part2` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   STEP 3: RLS Policies');
  console.log("   - Run `npm run db:copy-rls` to copy the SQL to your clipboard.");
  console.log('   - Paste and run in the SQL Editor.');
  console.log('');
  console.log('   4. After all scripts have been executed successfully, re-run this seeding script.');
  console.log('');
  
  // Check if basic tables exist to determine if schema is already set up
  try {
    const { data, error } = await supabase
      .from('provinces')
      .select('count')
      .limit(1);
    
    if (!error && data) {
      console.log('✅ Schema appears to be already set up (provinces table exists).');
      return true;
    }
  } catch (e) {
    // Table doesn't exist, schema setup needed
  }
  
  console.log('❌ Schema not found. Please follow the manual setup instructions above.');
  console.log('');
  
  return false;
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
  { province_code: 'P3', name_en: 'Kathmandu', name_ne: 'काठमाडौं', code: 'D25' },
  { province_code: 'P3', name_en: 'Lalitpur', name_ne: 'ललितपुर', code: 'D26' },
  { province_code: 'P3', name_en: 'Bhaktapur', name_ne: 'भक्तपुर', code: 'D27' },
  
  // Gandaki Province (P4) - Major districts  
  { province_code: 'P4', name_en: 'Kaski', name_ne: 'कास्की', code: 'D33' },
  { province_code: 'P4', name_en: 'Gorkha', name_ne: 'गोरखा', code: 'D34' },
  
  // Koshi Province (P1) - Major districts
  { province_code: 'P1', name_en: 'Jhapa', name_ne: 'झापा', code: 'D01' },
  { province_code: 'P1', name_en: 'Morang', name_ne: 'मोरङ', code: 'D02' },
  
  // Lumbini Province (P5) - Major districts
  { province_code: 'P5', name_en: 'Rupandehi', name_ne: 'रुपन्देही', code: 'D43' },
  { province_code: 'P5', name_en: 'Chitwan', name_ne: 'चितवन', code: 'D44' }
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

// ==========================================
// SEEDING FUNCTIONS
// ==========================================

async function seedProvinces() {
  console.log('🗺️  Seeding provinces...');
  
  const insertedProvinces = [];
  for (const province of PROVINCES) {
    const { data, error } = await supabase
      .from('provinces')
      .upsert({
        name_en: province.name_en,
        name_ne: province.name_ne,
        code: province.code
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting province ${province.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted province: ${province.name_en}`);
    insertedProvinces.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedProvinces.length} provinces.`);
  return insertedProvinces;
}

async function seedDistricts(provinces: any[]) {
  console.log('🗺️  Seeding districts...');
  
  // Create a map from province code to province id
  const provinceCodeToId = new Map();
  provinces.forEach(province => {
    provinceCodeToId.set(province.code, province.id);
  });
  
  const insertedDistricts = [];
  for (const district of MAJOR_DISTRICTS) {
    const provinceId = provinceCodeToId.get(district.province_code);
    if (!provinceId) {
      console.error(`❌ Province code ${district.province_code} not found for district ${district.name_en}`);
      throw new Error(`Province code ${district.province_code} not found`);
    }
    
    const { data, error } = await supabase
      .from('districts')
      .upsert({
        province_id: provinceId,
        name_en: district.name_en,
        name_ne: district.name_ne,
        code: district.code
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting district ${district.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted district: ${district.name_en}`);
    insertedDistricts.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedDistricts.length} districts.`);
  return insertedDistricts;
}

async function seedPalikas(districts: any[]) {
  console.log('🗺️  Seeding palikas...');
  
  // Create a map from district code to district id
  const districtCodeToId = new Map();
  districts.forEach(district => {
    districtCodeToId.set(district.code, district.id);
  });
  
  const insertedPalikas = [];
  for (const palika of MAJOR_PALIKAS) {
    const districtId = districtCodeToId.get(palika.district_code);
    if (!districtId) {
      console.error(`❌ District code ${palika.district_code} not found for palika ${palika.name_en}`);
      throw new Error(`District code ${palika.district_code} not found`);
    }
    
    const { data, error } = await supabase
      .from('palikas')
      .upsert({
        district_id: districtId,
        name_en: palika.name_en,
        name_ne: palika.name_ne,
        type: palika.type,
        code: palika.code,
        total_wards: palika.total_wards
      }, {
        onConflict: 'code'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error upserting palika ${palika.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted palika: ${palika.name_en}`);
    insertedPalikas.push(data);
  }
  
  console.log(`✅ Completed seeding ${insertedPalikas.length} palikas.`);
  return insertedPalikas;
}

async function seedCategories() {
  console.log('🗂️  Seeding categories...');
  
  for (const category of CATEGORIES) {
    const { error } = await supabase
      .from('categories')
      .upsert({
        entity_type: category.entity_type,
        name_en: category.name_en,
        name_ne: category.name_ne,
        slug: category.slug,
        display_order: category.display_order
      }, {
        onConflict: 'palika_id,entity_type,slug'
      });
    
    if (error) {
      console.error(`❌ Error upserting category ${category.name_en}:`, error);
      throw error;
    }
    
    console.log(`✅ Upserted category: ${category.name_en}`);
  }
  
  console.log(`✅ Completed seeding ${CATEGORIES.length} categories.`);
}

async function seedAppVersions() {
  console.log('📱 Seeding app versions...');
  
  const { error } = await supabase
    .from('app_versions')
    .upsert([
      {
        version_name: '1.0.0',
        version_code: 1,
        platform: 'android',
        is_latest: true,
        release_notes: 'Initial release',
        released_at: new Date().toISOString()
      },
      {
        version_name: '1.0.0',
        version_code: 1,
        platform: 'ios',
        is_latest: true,
        release_notes: 'Initial release',
        released_at: new Date().toISOString()
      }
    ], {
      onConflict: 'platform,version_code'
    });
  
  if (error) {
    console.error('❌ Error upserting app version:', error);
    throw error;
  }
  
  console.log('✅ Upserted app versions.');
}

// ==========================================
// MAIN SEEDING FUNCTION
// ==========================================

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('📍 Target:', supabaseUrl);
  
  try {
    // Step 1: Check for schema and guide user if not set up
    const schemaReady = await setupSchema();
    if (!schemaReady) {
      console.log('⏸️  Seeding paused. Please set up the schema first and re-run.');
      process.exit(0);
    }
    console.log('');
    
    // Step 2: Test connection
    console.log('🔗 Testing database connection...');
    const { error: testError } = await supabase
      .from('provinces')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    console.log('');
    
    // Step 3: Seed geographical and core data
    const provinces = await seedProvinces();
    const districts = await seedDistricts(provinces);
    const palikas = await seedPalikas(districts);
    await seedCategories();
    await seedAppVersions();

    // Step 4: Seed the production-ready admin users
    await seedAdminUsers();
    
    console.log('');
    console.log('🎉 Database data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${provinces.length} provinces`);
    console.log(`   • ${districts.length} districts`);
    console.log(`   • ${palikas.length} palikas`);
    console.log(`   • ${CATEGORIES.length} categories`);
    console.log(`   • Seeded default admin users`);
    console.log('');
    console.log('✅ System is ready for use!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  main()
}

export { main as seedDatabase }