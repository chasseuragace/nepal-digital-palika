#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
  console.log('\n🔍 CHECKING M-PLACE DATA REQUIREMENTS\n');
  console.log('='.repeat(70));

  try {
    // 1. Check subscription_tiers
    console.log('\n1️⃣  SUBSCRIPTION TIERS');
    const { data: tiers, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('*');

    if (tiersError) {
      console.log('   ❌ Error:', tiersError.message);
    } else {
      console.log(`   ✅ Found ${tiers?.length || 0} tiers`);
      tiers?.forEach(t => console.log(`      • ${t.name || t.display_name} (Level: ${t.tier_level})`));
    }

    // 2. Check marketplace_categories
    console.log('\n2️⃣  MARKETPLACE CATEGORIES');
    const { data: categories, error: categoriesError } = await supabase
      .from('marketplace_categories')
      .select('id, name, min_tier_level')
      .order('min_tier_level');

    if (categoriesError) {
      console.log('   ❌ Error:', categoriesError.message);
    } else {
      console.log(`   ✅ Found ${categories?.length || 0} categories`);
      if (categories && categories.length > 0) {
        const byTier = {
          1: categories.filter(c => c.min_tier_level === 1).length,
          2: categories.filter(c => c.min_tier_level === 2).length,
          3: categories.filter(c => c.min_tier_level === 3).length,
        };
        console.log(`      • Tier 1: ${byTier[1]} categories`);
        console.log(`      • Tier 2: ${byTier[2]} categories`);
        console.log(`      • Tier 3: ${byTier[3]} categories`);
      }
    }

    // 3. Check palikas with tier assignment
    console.log('\n3️⃣  PALIKAS WITH TIER ASSIGNMENT');
    const { data: palikas, error: palikaError } = await supabase
      .from('palikas')
      .select('id, name_en, subscription_tier_id')
      .limit(10)
      .order('id');

    if (palikaError) {
      console.log('   ❌ Error:', palikaError.message);
    } else {
      console.log(`   ✅ Found ${palikas?.length || 0} palikas (showing first 10)`);
      palikas?.slice(0, 4).forEach(p => console.log(`      • Palika ${p.id}: ${p.name_en} (Tier: ${p.subscription_tier_id || 'NOT SET'})`));
    }

    // 4. Check business_categories
    console.log('\n4️⃣  BUSINESS CATEGORIES');
    const { data: businessCats, error: businessCatError } = await supabase
      .from('business_categories')
      .select('*');

    if (businessCatError) {
      console.log('   ❌ Error:', businessCatError.message);
    } else {
      console.log(`   ✅ Found ${businessCats?.length || 0} business categories`);
      businessCats?.slice(0, 5).forEach(b => console.log(`      • ${b.name}`));
    }

    // 5. Check businesses (should have auto-created ones)
    console.log('\n5️⃣  BUSINESSES (auto-created)');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, palika_id, status')
      .limit(5);

    if (businessError) {
      console.log('   ⚠️  Error:', businessError.message);
    } else {
      console.log(`   ${businesses?.length > 0 ? '✅' : '⚠️ '} Found ${businesses?.length || 0} businesses`);
      businesses?.forEach(b => console.log(`      • ${b.name} (Palika: ${b.palika_id}, Status: ${b.status})`));
    }

    // 6. Check marketplace_products
    console.log('\n6️⃣  MARKETPLACE PRODUCTS');
    const { data: products, error: productError } = await supabase
      .from('marketplace_products')
      .select('id, name, category_id, palika_id')
      .limit(5);

    if (productError) {
      console.log('   ⚠️  Error:', productError.message);
    } else {
      console.log(`   ${products?.length > 0 ? '✅' : '⚠️ '} Found ${products?.length || 0} products`);
      products?.forEach(p => console.log(`      • ${p.name} (Category: ${p.category_id})`));
    }

    // 7. Check test/sample users
    console.log('\n7️⃣  USERS & PROFILES');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, default_palika_id')
      .limit(5);

    if (profileError) {
      console.log('   ⚠️  Error:', profileError.message);
    } else {
      console.log(`   ${profiles?.length > 0 ? '✅' : '⚠️ '} Found ${profiles?.length || 0} user profiles`);
      profiles?.forEach(p => console.log(`      • ${p.full_name} (Palika: ${p.default_palika_id})`));
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY OF DATA REQUIREMENTS\n');

    const checks = [
      { name: 'Subscription Tiers (3 required)', pass: tiers?.length === 3 },
      { name: 'Marketplace Categories (26 required)', pass: categories?.length === 26 },
      { name: 'Business Categories (8 required)', pass: businessCats?.length === 8 },
      { name: 'Palikas with Tier Assignment', pass: palikas?.some(p => p.subscription_tier_id) },
      { name: 'Test Businesses Created', pass: businesses?.length > 0 },
      { name: 'Test Products Created', pass: products?.length > 0 },
      { name: 'Test Users Created', pass: profiles?.length > 0 },
    ];

    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPass = checks.every(c => c.pass);
    console.log('\n' + '='.repeat(70));
    if (allPass) {
      console.log('\n🎉 ALL DATA REQUIREMENTS MET! Ready to start UI development.\n');
    } else {
      console.log('\n⚠️  SOME DATA IS MISSING. Run seeding scripts:\n');
      console.log('   ./database/scripts/deploy-infrastructure.sh\n');
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }

  process.exit(0);
}

verifyData();
