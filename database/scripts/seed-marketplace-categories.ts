
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

async function seedMarketplaceCategories() {
  console.log('🛍️  Seeding marketplace categories...\n')

  try {
    // 1. Seed Business Categories
    console.log('📁 Seeding business categories...')
    const businessCategories = [
      {
        name_en: 'Accommodation',
        name_ne: 'आवास',
        slug: 'accommodation',
        description: 'Hotels, homestays, guest houses, hostels',
        icon_url: '/icons/accommodation.svg',
      },
      {
        name_en: 'Food & Beverage',
        name_ne: 'खाना र पेय',
        slug: 'food_beverage',
        description: 'Restaurants, cafes, local eateries, street food',
        icon_url: '/icons/food.svg',
      },
      {
        name_en: 'Producer',
        name_ne: 'उत्पादक',
        slug: 'producer',
        description: 'Farmers, honey producers, tea gardens, organic farms',
        icon_url: '/icons/producer.svg',
      },
      {
        name_en: 'Tour Guide & Activities',
        name_ne: 'पर्यटन गाइड',
        slug: 'tour_guide',
        description: 'Tour guides, trekking, activities, experiences',
        icon_url: '/icons/tour-guide.svg',
      },
      {
        name_en: 'Professional Service',
        name_ne: 'पेशेवर सेवा',
        slug: 'professional_service',
        description: 'Lawyers, accountants, consultants, IT services',
        icon_url: '/icons/professional.svg',
      },
      {
        name_en: 'Artisan Workshop',
        name_ne: 'कारिगर कार्यशाला',
        slug: 'artisan_workshop',
        description: 'Handcrafts, traditional crafts, artisan workshops',
        icon_url: '/icons/artisan.svg',
      },
      {
        name_en: 'Transportation',
        name_ne: 'यातायात',
        slug: 'transportation',
        description: 'Taxi, bus, car rental, delivery services',
        icon_url: '/icons/transportation.svg',
      },
      {
        name_en: 'Retail Shop',
        name_ne: 'खुद्रा दुकान',
        slug: 'retail_shop',
        description: 'General store, grocery, shopping, retail',
        icon_url: '/icons/retail.svg',
      },
    ]

    for (const category of businessCategories) {
      const { error } = await supabaseAdmin
        .from('business_categories')
        .upsert(category, { onConflict: 'slug' })

      if (error) {
        console.error(`❌ Error seeding business category ${category.slug}:`, error)
      } else {
        console.log(`✅ Seeded business category: ${category.name_en}`)
      }
    }

    // 2. Seed Marketplace Categories
    console.log('\n🏪 Seeding marketplace categories...')

    const marketplaceCategories = [
      // TIER 1: Basic goods (Agriculture, animal products, essentials)
      {
        name_en: 'Agriculture Products',
        name_ne: 'कृषि उत्पादन',
        slug: 'agriculture',
        min_tier_level: 1,
        description: 'Grains, vegetables, crops',
        icon_url: '/icons/agriculture.svg',
        display_order: 1,
      },
      {
        name_en: 'Animal Products',
        name_ne: 'पशु उत्पादन',
        slug: 'animal_products',
        min_tier_level: 1,
        description: 'Meat, eggs, animal-derived products',
        icon_url: '/icons/animal.svg',
        display_order: 2,
      },
      {
        name_en: 'Essential Daily Items',
        name_ne: 'दैनिक आवश्यक वस्तु',
        slug: 'essentials',
        min_tier_level: 1,
        description: 'Daily essentials, basic items',
        icon_url: '/icons/essentials.svg',
        display_order: 3,
      },
      {
        name_en: 'Vegetables & Fruits',
        name_ne: 'तरकारी र फल',
        slug: 'vegetables',
        min_tier_level: 1,
        description: 'Fresh vegetables and seasonal fruits',
        icon_url: '/icons/vegetables.svg',
        display_order: 4,
      },
      {
        name_en: 'Honey & Bee Products',
        name_ne: 'मह र मधु उत्पादन',
        slug: 'honey',
        min_tier_level: 1,
        description: 'Honey, beeswax, bee-related products',
        icon_url: '/icons/honey.svg',
        display_order: 5,
      },
      {
        name_en: 'Tea & Coffee',
        name_ne: 'चिया र कफी',
        slug: 'tea_coffee',
        min_tier_level: 1,
        description: 'Tea, coffee, herbal beverages',
        icon_url: '/icons/tea.svg',
        display_order: 6,
      },
      {
        name_en: 'Dairy Products',
        name_ne: 'दुग्ध उत्पादन',
        slug: 'dairy',
        min_tier_level: 1,
        description: 'Milk, cheese, yogurt, dairy items',
        icon_url: '/icons/dairy.svg',
        display_order: 7,
      },
      {
        name_en: 'Spices & Herbs',
        name_ne: 'मसला र जडिबुटी',
        slug: 'spices',
        min_tier_level: 1,
        description: 'Spices, herbs, seasonings',
        icon_url: '/icons/spices.svg',
        display_order: 8,
      },
      {
        name_en: 'Nuts & Seeds',
        name_ne: 'नट र बीज',
        slug: 'nuts',
        min_tier_level: 1,
        description: 'Nuts, seeds, dried fruits',
        icon_url: '/icons/nuts.svg',
        display_order: 9,
      },

      // TIER 2: Manufactured, specialized goods
      {
        name_en: 'Handwoven Textiles',
        name_ne: 'हातको कपडा',
        slug: 'textiles',
        min_tier_level: 2,
        description: 'Handwoven fabrics, textiles, traditional weaving',
        icon_url: '/icons/textiles.svg',
        display_order: 10,
      },
      {
        name_en: 'Traditional Crafts',
        name_ne: 'परम्परागत कला',
        slug: 'crafts',
        min_tier_level: 2,
        description: 'Handmade crafts, traditional items, artisan work',
        icon_url: '/icons/crafts.svg',
        display_order: 11,
      },
      {
        name_en: 'Clothing & Apparel',
        name_ne: 'कपडा र परिधान',
        slug: 'clothing',
        min_tier_level: 2,
        description: 'Clothing, apparel, fashion items',
        icon_url: '/icons/clothing.svg',
        display_order: 12,
      },
      {
        name_en: 'Footwear',
        name_ne: 'जुत्ता',
        slug: 'footwear',
        min_tier_level: 2,
        description: 'Shoes, boots, footwear',
        icon_url: '/icons/footwear.svg',
        display_order: 13,
      },
      {
        name_en: 'Household Goods',
        name_ne: 'घरको सामान',
        slug: 'household',
        min_tier_level: 2,
        description: 'Household items, kitchenware, home goods',
        icon_url: '/icons/household.svg',
        display_order: 14,
      },
      {
        name_en: 'Electronics & Accessories',
        name_ne: 'इलेक्ट्रोनिक्स',
        slug: 'electronics',
        min_tier_level: 2,
        description: 'Electronics, gadgets, accessories',
        icon_url: '/icons/electronics.svg',
        display_order: 15,
      },
      {
        name_en: 'Beauty & Personal Care',
        name_ne: 'सौन्दर्य उत्पादन',
        slug: 'beauty',
        min_tier_level: 2,
        description: 'Beauty products, personal care items',
        icon_url: '/icons/beauty.svg',
        display_order: 16,
      },
      {
        name_en: 'Sports Equipment',
        name_ne: 'खेलकुद उपकरण',
        slug: 'sports',
        min_tier_level: 2,
        description: 'Sports gear, equipment, outdoor items',
        icon_url: '/icons/sports.svg',
        display_order: 17,
      },

      // TIER 3: Premium, specialized services
      {
        name_en: 'Luxury Items',
        name_ne: 'विलासी वस्तु',
        slug: 'luxury',
        min_tier_level: 3,
        description: 'Premium luxury goods, high-end items',
        icon_url: '/icons/luxury.svg',
        display_order: 18,
      },
      {
        name_en: 'Premium Jewelry',
        name_ne: 'प्रीमियम गहना',
        slug: 'jewelry',
        min_tier_level: 3,
        description: 'Premium jewelry, precious items',
        icon_url: '/icons/jewelry.svg',
        display_order: 19,
      },
      {
        name_en: 'Premium Crafts',
        name_ne: 'प्रीमियम कला',
        slug: 'premium_crafts',
        min_tier_level: 3,
        description: 'Exclusive artisan crafts, high-end designs',
        icon_url: '/icons/premium-crafts.svg',
        display_order: 20,
      },
      {
        name_en: 'High-End Fashion',
        name_ne: 'उच्च स्तरीय फ्यासन',
        slug: 'fashion_premium',
        min_tier_level: 3,
        description: 'Premium fashion, designer clothing',
        icon_url: '/icons/fashion-premium.svg',
        display_order: 21,
      },
      {
        name_en: 'Specialized Services',
        name_ne: 'विशेषीकृत सेवा',
        slug: 'specialized_services',
        min_tier_level: 3,
        description: 'Specialized professional services',
        icon_url: '/icons/services.svg',
        display_order: 22,
      },
      {
        name_en: 'Consulting & Expert Services',
        name_ne: 'सलाह सेवा',
        slug: 'consulting',
        min_tier_level: 3,
        description: 'Expert consulting, professional advice',
        icon_url: '/icons/consulting.svg',
        display_order: 23,
      },
      {
        name_en: 'Premium Accommodation Experiences',
        name_ne: 'प्रीमियम आवास',
        slug: 'premium_accommodation',
        min_tier_level: 3,
        description: 'Exclusive accommodation experiences',
        icon_url: '/icons/premium-accommodation.svg',
        display_order: 24,
      },
      {
        name_en: 'Exclusive Tours & Experiences',
        name_ne: 'एक्सक्लुसिभ भ्रमण',
        slug: 'exclusive_tours',
        min_tier_level: 3,
        description: 'Premium tours, exclusive experiences',
        icon_url: '/icons/exclusive-tours.svg',
        display_order: 25,
      },
    ]

    for (const category of marketplaceCategories) {
      const { error } = await supabaseAdmin
        .from('marketplace_categories')
        .upsert(category, { onConflict: 'slug' })

      if (error) {
        console.error(`❌ Error seeding marketplace category ${category.slug}:`, error)
      } else {
        const tierLabel = `Tier ${category.min_tier_level}`
        console.log(`✅ Seeded marketplace category: ${category.name_en} (${tierLabel})`)
      }
    }

    // 3. Optionally: Seed marketplace features and tier mappings
    console.log('\n🎁 Seeding marketplace features and tier mappings...')

    const marketplaceFeatures = [
      {
        code: 'marketplace_listing',
        display_name: 'Marketplace Product Listing',
        category: 'marketplace',
        description: 'Ability to list products in marketplace',
      },
      {
        code: 'marketplace_approval_workflow',
        display_name: 'Marketplace Approval Workflow',
        category: 'marketplace',
        description: 'Optional approval workflow for marketplace products',
      },
      {
        code: 'marketplace_comments',
        display_name: 'Marketplace Product Comments',
        category: 'marketplace',
        description: 'Threaded comments on marketplace products',
      },
      {
        code: 'marketplace_analytics',
        display_name: 'Marketplace Analytics',
        category: 'marketplace',
        description: 'Analytics for marketplace products and sales',
      },
    ]

    const { data: featureData, error: featureError } = await supabaseAdmin
      .from('features')
      .upsert(marketplaceFeatures, { onConflict: 'code' })

    if (featureError) {
      console.error('❌ Error seeding marketplace features:', featureError)
    } else {
      console.log(`✅ Seeded ${marketplaceFeatures.length} marketplace features`)
    }

    // 4. Map features to tiers
    console.log('\n🔗 Mapping marketplace features to tiers...')
    const { data: tiersData } = await supabaseAdmin
      .from('subscription_tiers')
      .select('id, name')
    const { data: featuresData } = await supabaseAdmin
      .from('features')
      .select('id, code')
      .in('code', ['marketplace_listing', 'marketplace_approval_workflow', 'marketplace_comments', 'marketplace_analytics'])

    const tierMap = Object.fromEntries(tiersData?.map((t: any) => [t.name, t.id]) || [])
    const featureMap = Object.fromEntries(featuresData?.map((f: any) => [f.code, f.id]) || [])

    const tierFeatureMappings = {
      basic: [
        // Tier 1: No marketplace
      ],
      tourism: [
        // Tier 2: Basic marketplace
        'marketplace_listing',
        'marketplace_comments',
      ],
      premium: [
        // Tier 3: Full marketplace
        'marketplace_listing',
        'marketplace_approval_workflow',
        'marketplace_comments',
        'marketplace_analytics',
      ],
    }

    for (const [tierName, featureCodes] of Object.entries(tierFeatureMappings)) {
      const tierId = tierMap[tierName]
      if (!tierId) {
        console.warn(`⚠️  Tier ${tierName} not found, skipping feature mapping`)
        continue
      }

      const mappings = featureCodes
        .map((code) => ({
          tier_id: tierId,
          feature_id: featureMap[code],
          enabled: true,
        }))
        .filter((m: any) => m.feature_id)

      if (mappings.length > 0) {
        const { error: mappingError } = await supabaseAdmin
          .from('tier_features')
          .upsert(mappings, { onConflict: 'tier_id,feature_id' })

        if (mappingError) {
          console.error(`❌ Error mapping features for tier ${tierName}:`, mappingError)
        } else {
          console.log(`✅ Mapped ${mappings.length} marketplace features for tier: ${tierName}`)
        }
      }
    }

    console.log('\n✨ Marketplace category seeding complete!')
    console.log('\n📊 Summary:')
    console.log(`   ✅ Business Categories: 8`)
    console.log(`   ✅ Marketplace Categories: 26 (Tier 1: 9, Tier 2: 8, Tier 3: 9)`)
    console.log(`   ✅ Marketplace Features: 4`)
    console.log(`   ✅ Tier-Feature Mappings: Tourism + Premium`)
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedMarketplaceCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
