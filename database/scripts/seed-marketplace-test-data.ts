
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { randomUUID } from 'crypto'

config({ path: '.env' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

interface TestUser {
  id: string
  email: string
  phone: string
  name: string
  palika_id: number
  tier_level: number
  business_type: string
}

interface TestBusiness {
  id: string
  owner_user_id: string
  palika_id: number
  business_name: string
  business_category_id: number
  address: string
}

interface TestProduct {
  id: string
  business_id: string
  palika_id: number
  name: string
  marketplace_category_id: number
  price: number
  unit: string
  tier_level: number
}

const testUsers: TestUser[] = [
  // Palika 1 (Tier 3 - Premium)
  {
    id: 'user-1a-' + Date.now(),
    email: 'ramesh.sharma@test.com',
    phone: '+977-9841000001',
    name: 'Ramesh Sharma',
    palika_id: 1,
    tier_level: 3,
    business_type: 'Accommodation',
  },
  {
    id: 'user-1b-' + Date.now(),
    email: 'sita.poudel@test.com',
    phone: '+977-9841000002',
    name: 'Sita Poudel',
    palika_id: 1,
    tier_level: 3,
    business_type: 'Producer',
  },
  // Palika 2 (Tier 2 - Tourism)
  {
    id: 'user-2a-' + Date.now(),
    email: 'deepak.niroula@test.com',
    phone: '+977-9841000003',
    name: 'Deepak Niroula',
    palika_id: 2,
    tier_level: 2,
    business_type: 'Tour Guide & Activities',
  },
  {
    id: 'user-2b-' + Date.now(),
    email: 'maya.gurung@test.com',
    phone: '+977-9841000004',
    name: 'Maya Gurung',
    palika_id: 2,
    tier_level: 2,
    business_type: 'Artisan Workshop',
  },
  // Palika 3 (Tier 2 - Tourism)
  {
    id: 'user-3a-' + Date.now(),
    email: 'pradeep.singh@test.com',
    phone: '+977-9841000005',
    name: 'Pradeep Singh',
    palika_id: 3,
    tier_level: 2,
    business_type: 'Food & Beverage',
  },
  {
    id: 'user-3b-' + Date.now(),
    email: 'anita.rai@test.com',
    phone: '+977-9841000006',
    name: 'Anita Rai',
    palika_id: 3,
    tier_level: 2,
    business_type: 'Artisan Workshop',
  },
  // Palika 4 (Tier 1 - Basic)
  {
    id: 'user-4a-' + Date.now(),
    email: 'keshav.prasad@test.com',
    phone: '+977-9841000007',
    name: 'Keshav Prasad',
    palika_id: 4,
    tier_level: 1,
    business_type: 'Producer',
  },
  {
    id: 'user-4b-' + Date.now(),
    email: 'bishnu.lamsal@test.com',
    phone: '+977-9841000008',
    name: 'Bishnu Lamsal',
    palika_id: 4,
    tier_level: 1,
    business_type: 'Retail Shop',
  },
]

async function seedMarketplaceTestData() {
  console.log('🧪 Seeding marketplace test data...\n')

  try {
    // 1. Create auth users
    console.log('👤 Creating test users in auth...')
    const createdUsers: any[] = []

    for (const testUser of testUsers) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: 'TestPassword123!@#',
        email_confirm: true,
        user_metadata: {
          full_name: testUser.name,
          phone: testUser.phone,
        },
      })

      if (error) {
        console.error(`❌ Error creating auth user ${testUser.email}:`, error)
        continue
      }

      createdUsers.push({ ...testUser, auth_id: data.user.id })
      console.log(`✅ Created auth user: ${testUser.name}`)
    }

    // 2. Create profiles
    console.log('\n📋 Creating user profiles...')
    const profileInserts = createdUsers.map((user) => ({
      id: user.auth_id,
      name: user.name,
      phone: user.phone,
      user_type: 'business_owner',
      default_palika_id: user.palika_id,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    }))

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileInserts, { onConflict: 'id' })

    if (profileError) {
      console.error('❌ Error creating profiles:', profileError)
      return
    }
    console.log(`✅ Created ${createdUsers.length} user profiles`)

    // 3. Get business categories
    console.log('\n🏪 Fetching business categories...')
    const { data: categories } = await supabaseAdmin
      .from('business_categories')
      .select('id, slug')

    const categoryMap = Object.fromEntries(
      categories?.map((c: any) => [c.slug, c.id]) || []
    )

    // 4. Create businesses
    console.log('\n🏢 Creating test businesses...')
    const businessInserts: any[] = []

    const businessCategoryMap: Record<string, string> = {
      'Accommodation': 'accommodation',
      'Food & Beverage': 'food_beverage',
      'Producer': 'producer',
      'Tour Guide & Activities': 'tour_guide',
      'Artisan Workshop': 'artisan_workshop',
      'Retail Shop': 'retail_shop',
    }

    for (const user of createdUsers) {
      const businessCategorySlug = businessCategoryMap[user.business_type] || 'retail_shop'
      const businessCategoryId = categoryMap[businessCategorySlug]

      businessInserts.push({
        id: randomUUID(),
        palika_id: user.palika_id,
        owner_user_id: user.auth_id,
        business_name: `${user.name}'s ${user.business_type}`,
        business_category_id: businessCategoryId,
        slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-${user.auth_id.substring(0, 8)}`,
        phone: user.phone,
        ward_number: Math.floor(Math.random() * 35) + 1,
        address: `Ward ${Math.floor(Math.random() * 35) + 1}, Palika ${user.palika_id}`,
        location: 'SRID=4326;POINT(85.3240 27.7172)',
        description: `Test business for ${user.name}`,
        is_active: true,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      })
    }

    const { error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert(businessInserts)

    if (businessError) {
      console.error('❌ Error creating businesses:', businessError)
      return
    }
    console.log(`✅ Created ${businessInserts.length} test businesses`)

    // 5. Get marketplace categories
    console.log('\n🛍️  Fetching marketplace categories...')
    const { data: marketplaceCategories } = await supabaseAdmin
      .from('marketplace_categories')
      .select('id, slug, min_tier_level')
      .order('min_tier_level', { ascending: true })

    const markcatMap = Object.fromEntries(
      marketplaceCategories?.map((c: any) => [c.slug, c]) || []
    )

    // 6. Create test products
    console.log('\n📦 Creating test products (respecting tier constraints)...')
    const productInserts: any[] = []

    // Product mapping: business type → product categories (respecting tier)
    const productCategoryMap: Record<string, string[]> = {
      // Tier 1 only
      'Producer': ['honey', 'tea_coffee', 'agriculture'],
      'Retail Shop': ['essentials', 'vegetables', 'spices'],

      // Tier 2+ (for Tier 2 palikas use Tier 1-2, for Tier 3 use all)
      'Tour Guide & Activities': ['adventure_services', 'exclusive_tours'],
      'Artisan Workshop': ['textiles', 'crafts', 'traditional_crafts'],
      'Food & Beverage': ['specialty_foods', 'beverages'],
      'Accommodation': ['premium_accommodation'],
    }

    let productCount = 0
    for (const user of createdUsers) {
      const categoryKeys = productCategoryMap[user.business_type] || ['agriculture']

      // Create 2 products per business
      for (let i = 0; i < 2; i++) {
        const categorySlug = categoryKeys[i % categoryKeys.length]
        const category = markcatMap[categorySlug]

        if (!category) {
          console.warn(
            `⚠️  Category ${categorySlug} not found for ${user.business_type}`
          )
          continue
        }

        // Check tier constraint
        if (category.min_tier_level > user.tier_level) {
          console.warn(
            `⚠️  Skipping product in tier ${category.min_tier_level} for tier ${user.tier_level} user`
          )
          continue
        }

        const business = businessInserts.find((b) => b.owner_user_id === user.auth_id)

        productInserts.push({
          id: randomUUID(),
          business_id: business?.id,
          palika_id: user.palika_id,
          name: `${user.name}'s ${user.business_type} Product ${i + 1}`,
          marketplace_category_id: category.id,
          slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-product-${i + 1}`,
          price: Math.floor(Math.random() * 5000) + 100,
          currency: 'NPR',
          unit: 'per item',
          short_description: `Test product from ${user.name}`,
          full_description: `This is a test marketplace product created for testing tier constraints and validation.`,
          quantity_available: Math.floor(Math.random() * 100) + 10,
          unit_of_measurement: 'pieces',
          status: 'published', // Will be set correctly by trigger
          is_approved: true,
          is_featured: false,
          created_by: user.auth_id,
          details: { tier_level: user.tier_level, test_data: true },
        })

        productCount++
      }
    }

    if (productInserts.length > 0) {
      const { error: productError } = await supabaseAdmin
        .from('marketplace_products')
        .insert(productInserts)

      if (productError) {
        console.error('❌ Error creating products:', productError)
      } else {
        console.log(`✅ Created ${productInserts.length} test products (respecting tier constraints)`)
      }
    }

    // 7. Create test comments
    console.log('\n💬 Creating test comments (threaded)...')
    if (productInserts.length > 0 && createdUsers.length > 0) {
      const commentInserts: any[] = []

      // Create 2-3 comments per product
      for (let i = 0; i < Math.min(productInserts.length, 5); i++) {
        const product = productInserts[i]
        const commenter = createdUsers[i % createdUsers.length]

        // Top-level comment
        const topComment = {
          id: `comment-${Date.now()}-${i}-0`,
          product_id: product.id,
          palika_id: product.palika_id,
          user_id: commenter.auth_id,
          user_name: commenter.name,
          comment_text: `This is a test comment from ${commenter.name}. Great product!`,
          parent_comment_id: null,
          is_owner_reply: false,
          is_approved: true,
          is_hidden: false,
          helpful_count: 0,
          unhelpful_count: 0,
          is_edited: false,
          created_at: new Date().toISOString(),
        }
        commentInserts.push(topComment)

        // Business owner reply
        const owner = createdUsers.find((u) => businessInserts.some((b) => b.owner_user_id === u.auth_id && b.id === product.business_id))
        if (owner) {
          const replyComment = {
            id: `comment-${Date.now()}-${i}-1`,
            product_id: product.id,
            palika_id: product.palika_id,
            user_id: owner.auth_id,
            user_name: owner.name,
            comment_text: `Thank you for your interest! ${owner.name} here. This product is high quality.`,
            parent_comment_id: topComment.id,
            is_owner_reply: true,
            is_approved: true,
            is_hidden: false,
            helpful_count: 0,
            unhelpful_count: 0,
            is_edited: false,
            created_at: new Date(Date.now() + 1000).toISOString(),
          }
          commentInserts.push(replyComment)
        }

        // Another user's comment
        const otherCommenter = createdUsers[(i + 1) % createdUsers.length]
        const anotherComment = {
          id: `comment-${Date.now()}-${i}-2`,
          product_id: product.id,
          palika_id: product.palika_id,
          user_id: otherCommenter.auth_id,
          user_name: otherCommenter.name,
          comment_text: `I'm also interested in this. How can I order?`,
          parent_comment_id: topComment.id,
          is_owner_reply: false,
          is_approved: true,
          is_hidden: false,
          helpful_count: 0,
          unhelpful_count: 0,
          is_edited: false,
          created_at: new Date(Date.now() + 2000).toISOString(),
        }
        commentInserts.push(anotherComment)
      }

      if (commentInserts.length > 0) {
        const { error: commentError } = await supabaseAdmin
          .from('marketplace_product_comments')
          .insert(commentInserts)

        if (commentError) {
          console.error('❌ Error creating comments:', commentError)
        } else {
          console.log(`✅ Created ${commentInserts.length} test comments (threaded)`)
        }
      }
    }

    // 8. Summary
    console.log('\n✨ Marketplace test data seeding complete!')
    console.log('\n📊 Summary:')
    console.log(`   ✅ Auth Users: ${createdUsers.length}`)
    console.log(`   ✅ User Profiles: ${createdUsers.length}`)
    console.log(`   ✅ Businesses: ${businessInserts.length}`)
    console.log(`   ✅ Products: ${productInserts.length}`)
    console.log(`   ✅ Comments: Threaded comments created`)
    console.log('\n🎯 Test Data Distribution:')
    console.log(`   - Tier 1 (Basic): 2 users, 2 businesses, 2-4 products`)
    console.log(`   - Tier 2 (Tourism): 4 users, 4 businesses, 8 products`)
    console.log(`   - Tier 3 (Premium): 2 users, 2 businesses, 4 products`)
    console.log('\n🚀 Next: Run MARKETPLACE_TESTING_STRATEGY tests')
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedMarketplaceTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
