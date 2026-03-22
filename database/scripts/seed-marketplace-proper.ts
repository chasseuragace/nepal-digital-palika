#!/usr/bin/env node

/**
 * M-Place Proper Test Data Seeding Script
 *
 * Creates:
 * - 8 test users (2 per tier across palikas)
 * - 8 test businesses (1 per user)
 * - 16 test products (2 per business, respecting tier constraints)
 * - Threaded comments on products
 *
 * Uses correct column names and schema alignment for actual database
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load .env file
config();

// Use service role key for seeding (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('Make sure .env file is loaded with: SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

// Use service role key for all operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

interface TestUser {
  id: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  palika_id: number;
  tier_level: number;
  business_type: string;
}

// Test users: 2 per tier, spread across palikas (using UUIDs for profile IDs)
const testUsers: TestUser[] = [
  // Palika 1 (Tier 3 - Premium)
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ramesh.sharma@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000001',
    name: 'Ramesh Sharma',
    palika_id: 1,
    tier_level: 3,
    business_type: 'accommodation',
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    email: 'sita.poudel@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000002',
    name: 'Sita Poudel',
    palika_id: 1,
    tier_level: 3,
    business_type: 'producer',
  },
  // Palika 2 (Tier 2 - Tourism)
  {
    id: '22222222-2222-2222-2222-222222222221',
    email: 'deepak.niroula@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000003',
    name: 'Deepak Niroula',
    palika_id: 2,
    tier_level: 2,
    business_type: 'tour_guide',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'maya.gurung@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000004',
    name: 'Maya Gurung',
    palika_id: 2,
    tier_level: 2,
    business_type: 'artisan_workshop',
  },
  // Palika 3 (Tier 2 - Tourism)
  {
    id: '33333333-3333-3333-3333-333333333331',
    email: 'pradeep.singh@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000005',
    name: 'Pradeep Singh',
    palika_id: 3,
    tier_level: 2,
    business_type: 'food_beverage',
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    email: 'anita.rai@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000006',
    name: 'Anita Rai',
    palika_id: 3,
    tier_level: 2,
    business_type: 'artisan_workshop',
  },
  // Palika 4 (Tier 1 - Basic)
  {
    id: '44444444-4444-4444-4444-444444444441',
    email: 'keshav.prasad@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000007',
    name: 'Keshav Prasad',
    palika_id: 4,
    tier_level: 1,
    business_type: 'producer',
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    email: 'bishnu.lamsal@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000008',
    name: 'Bishnu Lamsal',
    palika_id: 4,
    tier_level: 1,
    business_type: 'retail_shop',
  },
];

// Product category mapping by tier (using actual slug names)
const productCategoryMap: Record<string, Record<number, string[]>> = {
  producer: {
    1: ['agriculture_vegetables', 'honey_products'],
    2: ['agriculture_vegetables', 'textiles_fabrics'],
    3: ['agriculture_vegetables', 'premium_crafts'],
  },
  retail_shop: {
    1: ['essential_goods', 'oils_fats'],
    2: ['household_goods', 'books_educational'],
    3: ['luxury_goods', 'jewelry_gems'],
  },
  food_beverage: {
    1: ['agriculture_vegetables', 'dairy_products'],
    2: ['textiles_fabrics', 'books_educational'],
    3: ['gourmet_food', 'wellness_services'],
  },
  accommodation: {
    2: ['textiles_fabrics', 'handicrafts'],
    3: ['premium_travel', 'premium_crafts'],
  },
  artisan_workshop: {
    2: ['handicrafts', 'textiles_fabrics'],
    3: ['premium_crafts', 'art_antiques'],
  },
  tour_guide: {
    2: ['books_educational', 'sports_outdoor'],
    3: ['premium_travel', 'consulting_services'],
  },
};

async function seedMarketplaceData() {
  console.log('\n🌱 M-PLACE PROPER TEST DATA SEEDING\n');
  console.log('='.repeat(75));

  try {
    // 1. Fetch marketplace categories
    console.log('\n📋 Fetching marketplace categories...');
    const { data: marketplaceCategories } = await supabase
      .from('marketplace_categories')
      .select('id, slug, min_tier_level')
      .eq('is_active', true)
      .order('min_tier_level');

    const categoryMap = Object.fromEntries(
      marketplaceCategories?.map((c: any) => [c.slug, c]) || []
    );
    console.log(`   ✅ Loaded ${marketplaceCategories?.length} categories`);

    // 2. Fetch business categories
    console.log('\n📋 Fetching business categories...');
    const { data: businessCategories } = await supabase
      .from('business_categories')
      .select('id, slug')
      .eq('is_active', true);

    const businessCatMap = Object.fromEntries(
      businessCategories?.map((c: any) => [c.slug, c.id]) || []
    );
    console.log(`   ✅ Loaded ${businessCategories?.length} business categories`);

    // 3. Create auth users first
    console.log('\n👤 Creating test users in auth...');
    const createdAuthUsers: any[] = [];

    for (const user of testUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          phone: user.phone,
        },
      });

      if (error) {
        console.log(`   ⚠️  ${user.email}: ${error.message} (continuing...)`);
        continue;
      }

      createdAuthUsers.push({
        auth_id: data.user!.id,
        ...user,
      });
      console.log(`   ✅ Created: ${user.email}`);
    }

    console.log(`   ✅ Created ${createdAuthUsers.length} auth users\n`);

    // 4. Create test user profiles
    console.log('👤 Creating user profiles...');
    const profileInserts = createdAuthUsers.map((user) => ({
      id: user.auth_id,
      name: user.name,
      phone: user.phone,
      user_type: 'business_owner',
      default_palika_id: user.palika_id,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    }));

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileInserts, { onConflict: 'id' });

    if (profileError) {
      console.log(`   ❌ Error: ${profileError.message}`);
      throw profileError;
    }
    console.log(`   ✅ Created ${profileInserts.length} user profiles`);

    // 5. Create businesses
    console.log('\n🏢 Creating test businesses...');
    const businessInserts: any[] = [];

    for (const user of createdAuthUsers) {
      const businessCategoryId = businessCatMap[user.business_type];
      if (!businessCategoryId) {
        console.warn(`   ⚠️  Business type ${user.business_type} not found`);
        continue;
      }

      const businessId = randomUUID();
      businessInserts.push({
        id: businessId,
        palika_id: user.palika_id,
        owner_user_id: user.auth_id,
        business_name: `${user.name}'s ${user.business_type.replace(/_/g, ' ')}`,
        business_name_ne: `${user.name}को ${user.business_type.replace(/_/g, ' ')}`,
        slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        business_type_id: businessCategoryId,
        phone: user.phone,
        ward_number: Math.floor(Math.random() * 35) + 1,
        address: `Ward ${Math.floor(Math.random() * 35) + 1}, Palika ${user.palika_id}, Nepal`,
        location: 'SRID=4326;POINT(85.3240 27.7172)',
        description: `Test business for ${user.name}. This is a sample business created for testing the M-Place marketplace.`,
        is_active: true,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      });
    }

    const { error: businessError } = await supabase
      .from('businesses')
      .insert(businessInserts);

    if (businessError) {
      console.log(`   ❌ Error: ${businessError.message}`);
      throw businessError;
    }
    console.log(`   ✅ Created ${businessInserts.length} test businesses`);

    // 6. Create marketplace products
    console.log('\n📦 Creating test marketplace products...');
    const productInserts: any[] = [];

    for (let i = 0; i < createdAuthUsers.length; i++) {
      const user = createdAuthUsers[i];
      const business = businessInserts[i];

      // Get allowed product categories for this user's tier
      const businessType = user.business_type;
      const allowedSlugs = productCategoryMap[businessType]?.[user.tier_level] || [];

      if (allowedSlugs.length === 0) {
        console.warn(`   ⚠️  No product categories found for ${businessType} tier ${user.tier_level}`);
        continue;
      }

      // Create 2 products per business
      for (let j = 0; j < 2; j++) {
        const categorySlug = allowedSlugs[j % allowedSlugs.length];
        const category = categoryMap[categorySlug];

        if (!category) {
          console.warn(`   ⚠️  Category ${categorySlug} not found`);
          continue;
        }

        // Verify tier constraint
        if (category.min_tier_level > user.tier_level) {
          console.warn(
            `   ⚠️  Skipping: User tier ${user.tier_level} < Category tier ${category.min_tier_level}`
          );
          continue;
        }

        productInserts.push({
          id: randomUUID(),
          business_id: business.id,
          palika_id: user.palika_id,
          name_en: `${user.name}'s Product ${j + 1}`,
          name_ne: `${user.name}को उत्पादन ${j + 1}`,
          slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-product-${j + 1}-${Date.now()}`,
          marketplace_category_id: category.id,
          short_description: `Test product from ${user.name}`,
          short_description_ne: `${user.name}बाट परीक्षण उत्पादन`,
          full_description: `This is a test marketplace product created for testing tier constraints, product listings, and seller information display in the M-Place marketplace.`,
          full_description_ne: `यो M-Place बजारमा स्तर बाध्यताहरू, उत्पाद सूचीहरू, र विक्रेता जानकारी प्रदर्शन परीक्षणको लागि बनाएको परीक्षण बजार उत्पादन हो।`,
          featured_image: null,
          images: JSON.stringify([]),
          price: Math.floor(Math.random() * 5000) + 100,
          currency: 'NPR',
          unit: 'per item',
          quantity_available: Math.floor(Math.random() * 100) + 10,
          unit_of_measurement: 'pieces',
          status: 'published',
          is_featured: false,
          requires_approval: user.tier_level === 1 ? false : false, // Auto-publish for now
          is_approved: true, // Tier 1 always approved, Tier 2+ depends on palika config
          created_by: user.auth_id,
          details: JSON.stringify({ tier_level: user.tier_level, test_data: true }),
        });
      }
    }

    const { error: productError } = await supabase
      .from('marketplace_products')
      .insert(productInserts);

    if (productError) {
      console.log(`   ❌ Error: ${productError.message}`);
      throw productError;
    }
    console.log(`   ✅ Created ${productInserts.length} test products`);

    // 7. Create threaded comments
    console.log('\n💬 Creating test comments (threaded)...');
    const commentInserts: any[] = [];

    // Create comments on first 5 products
    for (let i = 0; i < Math.min(5, productInserts.length); i++) {
      const product = productInserts[i];
      const commenter = createdAuthUsers[i % createdAuthUsers.length];

      // Top-level comment
      const topCommentId = randomUUID();
      commentInserts.push({
        id: topCommentId,
        product_id: product.id,
        palika_id: product.palika_id,
        user_id: commenter.auth_id,
        user_name: commenter.name,
        comment_text: `Great product! I'm interested in this. ${commenter.name} here.`,
        parent_comment_id: null,
        is_owner_reply: false,
        is_approved: true,
        is_hidden: false,
        helpful_count: 0,
        unhelpful_count: 0,
        is_edited: false,
      });

      // Business owner reply
      const ownerUser = createdAuthUsers[i];
      commentInserts.push({
        id: randomUUID(),
        product_id: product.id,
        palika_id: product.palika_id,
        user_id: ownerUser.auth_id,
        user_name: ownerUser.name,
        comment_text: `Thank you for your interest! ${ownerUser.name} here. This is high quality. DM me for bulk orders!`,
        parent_comment_id: topCommentId,
        is_owner_reply: true,
        is_approved: true,
        is_hidden: false,
        helpful_count: 1,
        unhelpful_count: 0,
        is_edited: false,
      });

      // Another user's reply
      const otherUser = createdAuthUsers[(i + 2) % createdAuthUsers.length];
      commentInserts.push({
        id: randomUUID(),
        product_id: product.id,
        palika_id: product.palika_id,
        user_id: otherUser.auth_id,
        user_name: otherUser.name,
        comment_text: `How much is the bulk price? I might be interested too.`,
        parent_comment_id: topCommentId,
        is_owner_reply: false,
        is_approved: true,
        is_hidden: false,
        helpful_count: 0,
        unhelpful_count: 0,
        is_edited: false,
      });
    }

    const { error: commentError } = await supabase
      .from('marketplace_product_comments')
      .insert(commentInserts);

    if (commentError) {
      console.log(`   ❌ Error: ${commentError.message}`);
      throw commentError;
    }
    console.log(`   ✅ Created ${commentInserts.length} test comments`);

    // Summary
    console.log('\n' + '='.repeat(75));
    console.log('\n✨ TEST DATA SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   • Auth Users: ${createdAuthUsers.length}`);
    console.log(`   • User Profiles: ${profileInserts.length}`);
    console.log(`   • Businesses: ${businessInserts.length}`);
    console.log(`   • Products: ${productInserts.length}`);
    console.log(`   • Comments: ${commentInserts.length} (threaded)`);

    console.log('\n📈 Distribution:');
    console.log(`   • Tier 1 (Itahari): 2 users, 2 businesses, 4 products`);
    console.log(`   • Tier 2 (Kanyam/Tilawe): 4 users, 4 businesses, 8 products`);
    console.log(`   • Tier 3 (Rajbiraj): 2 users, 2 businesses, 4 products`);

    console.log('\n🚀 Ready to test marketplace!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

seedMarketplaceData().then(() => process.exit(0));
