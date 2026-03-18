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

async function seedCategories() {
  console.log('🛍️  Seeding marketplace categories...\n')

  try {
    // Tier 1 categories (9 total)
    const tier1Categories = [
      {
        name_en: 'Agriculture & Vegetables',
        name_ne: 'कृषि र सब्जीहरु',
        slug: 'agriculture_vegetables',
        min_tier_level: 1,
        display_order: 1,
      },
      {
        name_en: 'Honey & Bee Products',
        name_ne: 'मधु र मधु उत्पादन',
        slug: 'honey_products',
        min_tier_level: 1,
        display_order: 2,
      },
      {
        name_en: 'Tea & Spices',
        name_ne: 'चिया र मसलाहरु',
        slug: 'tea_spices',
        min_tier_level: 1,
        display_order: 3,
      },
      {
        name_en: 'Dairy & Milk Products',
        name_ne: 'दुग्ध र दुग्ध उत्पाद',
        slug: 'dairy_products',
        min_tier_level: 1,
        display_order: 4,
      },
      {
        name_en: 'Nuts & Seeds',
        name_ne: 'नट र बीजहरु',
        slug: 'nuts_seeds',
        min_tier_level: 1,
        display_order: 5,
      },
      {
        name_en: 'Animal Products',
        name_ne: 'पशु उत्पाद',
        slug: 'animal_products',
        min_tier_level: 1,
        display_order: 6,
      },
      {
        name_en: 'Grains & Cereals',
        name_ne: 'अनाज र सिरियल',
        slug: 'grains_cereals',
        min_tier_level: 1,
        display_order: 7,
      },
      {
        name_en: 'Essential Goods',
        name_ne: 'आवश्यक सामान',
        slug: 'essential_goods',
        min_tier_level: 1,
        display_order: 8,
      },
      {
        name_en: 'Oils & Fats',
        name_ne: 'तेल र वसा',
        slug: 'oils_fats',
        min_tier_level: 1,
        display_order: 9,
      },
    ]

    // Tier 2 categories (8 additional)
    const tier2Categories = [
      {
        name_en: 'Textiles & Fabrics',
        name_ne: 'कपड़े र कपड़े',
        slug: 'textiles_fabrics',
        min_tier_level: 2,
        display_order: 10,
      },
      {
        name_en: 'Handicrafts',
        name_ne: 'हस्तकला',
        slug: 'handicrafts',
        min_tier_level: 2,
        display_order: 11,
      },
      {
        name_en: 'Clothing & Fashion',
        name_ne: 'कपड़े र फैशन',
        slug: 'clothing_fashion',
        min_tier_level: 2,
        display_order: 12,
      },
      {
        name_en: 'Electronics & Gadgets',
        name_ne: 'इलेक्ट्रॉनिक्स र गैजेट',
        slug: 'electronics_gadgets',
        min_tier_level: 2,
        display_order: 13,
      },
      {
        name_en: 'Beauty & Wellness',
        name_ne: 'सौंदर्य र कल्याण',
        slug: 'beauty_wellness',
        min_tier_level: 2,
        display_order: 14,
      },
      {
        name_en: 'Household Goods',
        name_ne: 'घरेलू सामान',
        slug: 'household_goods',
        min_tier_level: 2,
        display_order: 15,
      },
      {
        name_en: 'Sports & Outdoor',
        name_ne: 'खेल र बाहिरी',
        slug: 'sports_outdoor',
        min_tier_level: 2,
        display_order: 16,
      },
      {
        name_en: 'Books & Educational',
        name_ne: 'किताब र शिक्षाप्रद',
        slug: 'books_educational',
        min_tier_level: 2,
        display_order: 17,
      },
    ]

    // Tier 3 categories (9 additional)
    const tier3Categories = [
      {
        name_en: 'Luxury Goods',
        name_ne: 'विलासवान सामान',
        slug: 'luxury_goods',
        min_tier_level: 3,
        display_order: 18,
      },
      {
        name_en: 'Jewelry & Gems',
        name_ne: 'गहना र रत्न',
        slug: 'jewelry_gems',
        min_tier_level: 3,
        display_order: 19,
      },
      {
        name_en: 'Premium Crafts',
        name_ne: 'प्रीमियम हस्तकला',
        slug: 'premium_crafts',
        min_tier_level: 3,
        display_order: 20,
      },
      {
        name_en: 'Premium Fashion',
        name_ne: 'प्रीमियम फैशन',
        slug: 'premium_fashion',
        min_tier_level: 3,
        display_order: 21,
      },
      {
        name_en: 'Art & Antiques',
        name_ne: 'कला र प्राचीन वस्तु',
        slug: 'art_antiques',
        min_tier_level: 3,
        display_order: 22,
      },
      {
        name_en: 'Consulting Services',
        name_ne: 'परामर्श सेवा',
        slug: 'consulting_services',
        min_tier_level: 3,
        display_order: 23,
      },
      {
        name_en: 'Premium Travel',
        name_ne: 'प्रीमियम यात्रा',
        slug: 'premium_travel',
        min_tier_level: 3,
        display_order: 24,
      },
      {
        name_en: 'Wellness Services',
        name_ne: 'स्वास्थ्य सेवा',
        slug: 'wellness_services',
        min_tier_level: 3,
        display_order: 25,
      },
      {
        name_en: 'Gourmet Food',
        name_ne: 'उच्च मानक भोजन',
        slug: 'gourmet_food',
        min_tier_level: 3,
        display_order: 26,
      },
    ]

    const allCategories = [...tier1Categories, ...tier2Categories, ...tier3Categories]

    // Insert in batches
    const batchSize = 10
    let inserted = 0

    for (let i = 0; i < allCategories.length; i += batchSize) {
      const batch = allCategories.slice(i, i + batchSize)
      const { error } = await supabaseAdmin
        .from('marketplace_categories')
        .insert(batch)

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
      } else {
        inserted += batch.length
        console.log(`✅ Inserted ${batch.length} categories (total: ${inserted})`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Tier 1: ${tier1Categories.length} categories`)
    console.log(`   ✅ Tier 2: ${tier2Categories.length} categories`)
    console.log(`   ✅ Tier 3: ${tier3Categories.length} categories`)
    console.log(`   ✅ Total: ${inserted} categories seeded`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedCategories()
