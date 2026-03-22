
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

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

async function seedCompleteFlow() {
  console.log('🚀 COMPLETE FLOW: User → Business → Products\n')

  try {
    // Step 1: Get categories
    console.log('📋 Fetching marketplace categories...')
    const { data: categories } = await supabaseAdmin
      .from('marketplace_categories')
      .select('id, name_en, min_tier_level')
      .eq('is_active', true)
      .order('id')

    if (!categories || categories.length === 0) {
      throw new Error('No marketplace categories found! Run seed-marketplace-categories-direct.ts first.')
    }
    console.log(`✅ Found ${categories.length} categories\n`)

    // Step 2: Create test user in auth
    console.log('👤 Creating test user in auth...')
    const testEmail = `seller-${Date.now()}@test.com`
    const testPassword = 'TestPassword123!'

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`)
    }

    const userId = authUser.user!.id
    console.log(`✅ Auth user created: ${testEmail}\n`)

    // Step 3: Create user profile
    console.log('👥 Creating user profile...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: 'Test Seller ' + Date.now(),
        phone: '+977-9841234567',
        default_palika_id: 1,
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    console.log(`✅ Profile created with palika_id: 1\n`)

    // Step 4: Create business in palika
    console.log('🏢 Creating business in palika...')
    const businessName = 'Test Shop ' + Date.now()
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        owner_user_id: userId,
        palika_id: 1,
        business_name: businessName,
        slug: businessName.toLowerCase().replace(/\s+/g, '-'),
        business_category_id: 1,
        business_type_id: 3,
        email: testEmail,
        phone: '+977-9841234567',
        address: 'Test Address, Palika 1',
        location: 'POINT(85.3240 27.7172)',
        ward_number: 1,
        description: 'A test business for marketplace',
        status: 'published',
        is_active: true,
      })
      .select()
      .single()

    if (businessError) {
      throw new Error(`Business creation failed: ${businessError.message}`)
    }

    console.log(`✅ Business created: ${businessName}\n`)

    // Step 5: Create products in available categories
    console.log('📦 Creating products in available categories...')

    const productsList = categories.slice(0, 5).map((cat, idx) => ({
      business_id: business.id,
      palika_id: 1,
      name_en: `Product ${idx + 1} - ${cat.name_en}`,
      name_ne: `उत्पाद ${idx + 1}`,
      slug: `product-${idx + 1}`,
      marketplace_category_id: cat.id,
      price: (100 + (idx + 1) * 50).toFixed(2),
      currency: 'NPR',
      unit: 'piece',
      quantity_available: 10 + idx,
      is_in_stock: true,
      status: 'published',
      is_approved: true,
      requires_approval: false,
      created_by: userId,
      updated_by: userId,
    }))

    const { error: productsError } = await supabaseAdmin
      .from('marketplace_products')
      .insert(productsList)

    if (productsError) {
      throw new Error(`Products creation failed: ${productsError.message}`)
    }

    console.log(`✅ Created ${productsList.length} products\n`)

    // Step 6: Summary
    console.log('═══════════════════════════════════════════════')
    console.log('✨ COMPLETE FLOW SEEDED SUCCESSFULLY!\n')
    console.log('📊 Summary:')
    console.log(`   👤 User: ${testEmail}`)
    console.log(`   🏢 Business: ${businessName}`)
    console.log(`   📦 Products: ${productsList.length}`)
    console.log(`   📍 Palika: Kathmandu Metropolitan (ID: 1)\n`)
    console.log('🔐 Test Credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}\n`)
    console.log('✅ Ready to test marketplace!\n')
    console.log('═══════════════════════════════════════════════')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

seedCompleteFlow()
