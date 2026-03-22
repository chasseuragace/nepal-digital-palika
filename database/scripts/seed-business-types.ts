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

async function seedBusinessTypes() {
  console.log('🏢 Seeding business types (categories)...\n')

  try {
    // Get all palikas
    const { data: palikas, error: palikaError } = await supabaseAdmin
      .from('palikas')
      .select('id')

    if (palikaError) {
      console.error('❌ Error fetching palikas:', palikaError)
      process.exit(1)
    }

    if (!palikas || palikas.length === 0) {
      console.error('❌ No palikas found. Run geographic seeding first.')
      process.exit(1)
    }

    const businessTypes = [
      {
        name_en: 'Accommodation',
        name_ne: 'आवास',
        slug: 'accommodation',
        description: 'Hotels, lodges, guest houses, and other lodging facilities',
        display_order: 1,
      },
      {
        name_en: 'Food & Beverage',
        name_ne: 'खाना र पेय',
        slug: 'food_beverage',
        description: 'Restaurants, cafes, bars, and food services',
        display_order: 2,
      },
      {
        name_en: 'Producer',
        name_ne: 'उत्पादक',
        slug: 'producer',
        description: 'Agricultural producers and food manufacturers',
        display_order: 3,
      },
      {
        name_en: 'Tour Guide',
        name_ne: 'भ्रमण गाइड',
        slug: 'tour_guide',
        description: 'Tour operators and professional guides',
        display_order: 4,
      },
      {
        name_en: 'Professional Service',
        name_ne: 'पेशेवर सेवा',
        slug: 'professional_service',
        description: 'Consulting, planning, and professional services',
        display_order: 5,
      },
      {
        name_en: 'Artisan Workshop',
        name_ne: 'शिल्पी कार्यशाला',
        slug: 'artisan_workshop',
        description: 'Craft studios and artisan producers',
        display_order: 6,
      },
      {
        name_en: 'Transportation',
        name_ne: 'परिवहन',
        slug: 'transportation',
        description: 'Transportation and logistics services',
        display_order: 7,
      },
      {
        name_en: 'Retail Shop',
        name_ne: 'खुद्रा दोकान',
        slug: 'retail_shop',
        description: 'Retail stores and shopping services',
        display_order: 8,
      },
    ]

    // Insert business types for each palika
    let totalInserted = 0
    for (const palika of palikas) {
      const categoriesToInsert = businessTypes.map((type) => ({
        palika_id: palika.id,
        entity_type: 'business',
        ...type,
      }))

      const { error } = await supabaseAdmin
        .from('categories')
        .insert(categoriesToInsert)

      if (error) {
        // Ignore duplicate key errors (categories may already exist)
        if (error.code !== '23505') {
          console.error(`❌ Error seeding business types for palika ${palika.id}:`, error)
        }
      } else {
        totalInserted += categoriesToInsert.length
      }
    }

    console.log(`✅ Successfully seeded business types for ${palikas.length} palikas`)
    console.log(`   Total categories inserted: ${totalInserted}`)
    console.log('\nBusiness Types:')
    businessTypes.forEach((type) => console.log(`  - ${type.name_en}`))
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedBusinessTypes()
