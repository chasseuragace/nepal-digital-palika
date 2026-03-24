#!/usr/bin/env node

/**
 * Bhaktapur Test Users Seeding Script
 *
 * Creates test users specifically for Bhaktapur (Palika 10)
 * - 2 test users for Bhaktapur (Tourism tier)
 * - 2 test businesses
 * - 4 test marketplace products
 * - Threaded comments
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

// Bhaktapur test users (Tier 2 - Tourism)
const bhaktapurUsers: TestUser[] = [
  {
    id: '55555555-5555-5555-5555-555555555551',
    email: 'rajesh.bhaktapur@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000009',
    name: 'Rajesh Bhaktapur',
    palika_id: 10,
    tier_level: 2,
    business_type: 'accommodation',
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    email: 'neha.bhaktapur@test.com',
    password: 'TestPass@123',
    phone: '+977-9841000010',
    name: 'Neha Bhaktapur',
    palika_id: 10,
    tier_level: 2,
    business_type: 'tour_guide',
  },
];

// Product category mapping by tier
const productCategoryMap: Record<string, Record<number, string[]>> = {
  accommodation: {
    2: ['textiles_fabrics', 'handicrafts'],
    3: ['premium_travel', 'premium_crafts'],
  },
  tour_guide: {
    2: ['books_educational', 'sports_outdoor'],
    3: ['premium_travel', 'consulting_services'],
  },
};

async function seedBhaktapurUsers() {
  console.log('\n🌱 BHAKTAPUR TEST USERS SEEDING\n');
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

    // 3. Create auth users
    console.log('\n👤 Creating Bhaktapur test users in auth...');
    const createdAuthUsers: any[] = [];

    for (const user of bhaktapurUsers) {
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

    // 4. Create user profiles
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
    console.log('\n🏢 Creating Bhaktapur test businesses...');
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
        ward_number: Math.floor(Math.random() * 10) + 1,
        address: `Ward ${Math.floor(Math.random() * 10) + 1}, Bhaktapur, Nepal`,
        location: 'SRID=4326;POINT(85.4298 27.6710)',
        description: `Test business for ${user.name}. This is a sample business created for testing the M-Place marketplace in Bhaktapur.`,
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
    console.log('\n📦 Creating Bhaktapur test marketplace products...');
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
          name_en: `${user.name}'s Bhaktapur Product ${j + 1}`,
          name_ne: `${user.name}को भक्तपुर उत्पादन ${j + 1}`,
          slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-bhaktapur-product-${j + 1}-${Date.now()}`,
          marketplace_category_id: category.id,
          short_description: `Test product from ${user.name} in Bhaktapur`,
          short_description_ne: `भक्तपुरमा ${user.name}बाट परीक्षण उत्पादन`,
          full_description: `This is a test marketplace product created for testing tier constraints, product listings, and seller information display in the M-Place marketplace for Bhaktapur.`,
          full_description_ne: `यो भक्तपुरको लागि M-Place बजारमा स्तर बाध्यताहरू, उत्पाद सूचीहरू, र विक्रेता जानकारी प्रदर्शन परीक्षणको लागि बनाएको परीक्षण बजार उत्पादन हो।`,
          featured_image: null,
          images: JSON.stringify([]),
          price: Math.floor(Math.random() * 5000) + 100,
          currency: 'NPR',
          unit: 'per item',
          quantity_available: Math.floor(Math.random() * 100) + 10,
          unit_of_measurement: 'pieces',
          status: 'published',
          is_featured: false,
          requires_approval: false,
          is_approved: true,
          created_by: user.auth_id,
          details: JSON.stringify({ tier_level: user.tier_level, test_data: true, palika: 'Bhaktapur' }),
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
    console.log('\n💬 Creating Bhaktapur test comments (threaded)...');
    const commentInserts: any[] = [];

    // Create comments on products
    for (let i = 0; i < Math.min(productInserts.length, 2); i++) {
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
        comment_text: `Great Bhaktapur product! I'm interested in this. ${commenter.name} here.`,
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
        comment_text: `Thank you for your interest! ${ownerUser.name} here from Bhaktapur. This is high quality. DM me for bulk orders!`,
        parent_comment_id: topCommentId,
        is_owner_reply: true,
        is_approved: true,
        is_hidden: false,
        helpful_count: 1,
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
    console.log('\n✨ BHAKTAPUR TEST DATA SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   • Auth Users: ${createdAuthUsers.length}`);
    console.log(`   • User Profiles: ${profileInserts.length}`);
    console.log(`   • Businesses: ${businessInserts.length}`);
    console.log(`   • Products: ${productInserts.length}`);
    console.log(`   • Comments: ${commentInserts.length} (threaded)`);

    console.log('\n📍 Bhaktapur Details:');
    console.log(`   • Palika ID: 10`);
    console.log(`   • Tier: Tourism (Tier 2)`);
    console.log(`   • Test Users: ${createdAuthUsers.map(u => u.email).join(', ')}`);

    console.log('\n🚀 Bhaktapur marketplace is ready to test!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

seedBhaktapurUsers().then(() => process.exit(0));
