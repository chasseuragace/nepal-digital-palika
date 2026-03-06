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

async function seedSubscriptionTiers() {
  console.log('🎯 Seeding subscription tiers...')

  try {
    // 1. Seed tiers
    const tiers = [
      {
        name: 'basic',
        display_name: 'Basic',
        cost_per_year: 500000,
        description: 'Basic tier for local services and governance',
      },
      {
        name: 'tourism',
        display_name: 'Tourism',
        cost_per_year: 150000,
        description: 'Tourism-focused tier for heritage and tourism discovery',
      },
      {
        name: 'premium',
        display_name: 'Premium',
        cost_per_year: 250000,
        description: 'Premium tier with custom analytics and integrations',
      },
    ]

    console.log('\n📊 Seeding subscription tiers...')
    for (const tier of tiers) {
      const { error } = await supabaseAdmin
        .from('subscription_tiers')
        .upsert(tier, { onConflict: 'name' })

      if (error) {
        console.error(`❌ Error seeding tier ${tier.name}:`, error)
      } else {
        console.log(`✅ Seeded tier: ${tier.display_name}`)
      }
    }

    // 2. Seed features
    const features = [
      // Registration features
      {
        code: 'self_service_registration',
        display_name: 'Self-Service Registration',
        category: 'registration',
      },
      {
        code: 'admin_creation',
        display_name: 'Admin User Creation',
        category: 'registration',
      },
      {
        code: 'verification_workflow',
        display_name: 'Verification Workflow',
        category: 'registration',
      },
      { code: 'custom_rules', display_name: 'Custom Rules', category: 'registration' },

      // Contact features
      { code: 'direct_contact', display_name: 'Direct Contact', category: 'contact' },
      {
        code: 'in_app_messaging',
        display_name: 'In-App Messaging',
        category: 'contact',
      },
      {
        code: 'message_analytics',
        display_name: 'Message Analytics',
        category: 'contact',
      },
      {
        code: 'payment_integration',
        display_name: 'Payment Integration',
        category: 'contact',
      },

      // QR features
      { code: 'digital_qr', display_name: 'Digital QR', category: 'qr' },
      { code: 'qr_print_support', display_name: 'Print Support', category: 'qr' },
      { code: 'qr_analytics', display_name: 'QR Analytics', category: 'qr' },

      // Content features
      { code: 'heritage_content', display_name: 'Heritage Sites', category: 'content' },
      { code: 'events_content', display_name: 'Events', category: 'content' },
      { code: 'blog_content', display_name: 'Blog', category: 'content' },
      {
        code: 'business_directory',
        display_name: 'Business Directory',
        category: 'content',
      },

      // Emergency features
      { code: 'sos_system', display_name: 'SOS System', category: 'emergency' },
      {
        code: 'service_directory',
        display_name: 'Service Directory',
        category: 'emergency',
      },
      { code: 'hotline_support', display_name: 'Hotline Support', category: 'emergency' },
      {
        code: 'location_search',
        display_name: 'Location Search',
        category: 'emergency',
      },

      // Analytics features
      { code: 'view_analytics', display_name: 'View Analytics', category: 'analytics' },
      {
        code: 'dashboard_analytics',
        display_name: 'Palika Dashboard',
        category: 'analytics',
      },
      {
        code: 'national_aggregation',
        display_name: 'National Aggregation',
        category: 'analytics',
      },
      { code: 'custom_reports', display_name: 'Custom Reports', category: 'analytics' },

      // Admin features
      {
        code: 'staff_management',
        display_name: 'Staff Management',
        category: 'admin',
      },
      {
        code: 'approval_workflows',
        display_name: 'Approval Workflows',
        category: 'admin',
      },
      { code: 'audit_logging', display_name: 'Audit Logging', category: 'admin' },
      {
        code: 'rbac_management',
        display_name: 'RBAC Management',
        category: 'admin',
      },
    ]

    console.log('\n🎁 Seeding features...')
    const { data: featureData, error: featureError } = await supabaseAdmin
      .from('features')
      .upsert(features, { onConflict: 'code' })

    if (featureError) {
      console.error('❌ Error seeding features:', featureError)
    } else {
      console.log(`✅ Seeded ${features.length} features`)
    }

    // 3. Get tier and feature IDs for mapping
    console.log('\n🔗 Mapping features to tiers...')
    const { data: tiersData } = await supabaseAdmin.from('subscription_tiers').select('id, name')
    const { data: featuresData } = await supabaseAdmin.from('features').select('id, code')

    const tierMap = Object.fromEntries(tiersData?.map((t: any) => [t.name, t.id]) || [])
    const featureMap = Object.fromEntries(featuresData?.map((f: any) => [f.code, f.id]) || [])

    // Feature mappings
    const tierFeatureMappings = {
      basic: [
        'self_service_registration',
        'admin_creation',
        'direct_contact',
        'digital_qr',
        'heritage_content',
        'events_content',
        'blog_content',
        'business_directory',
        'view_analytics',
        'staff_management',
      ],
      tourism: [
        'self_service_registration',
        'admin_creation',
        'verification_workflow',
        'direct_contact',
        'in_app_messaging',
        'digital_qr',
        'qr_print_support',
        'heritage_content',
        'events_content',
        'blog_content',
        'business_directory',
        'sos_system',
        'service_directory',
        'hotline_support',
        'view_analytics',
        'dashboard_analytics',
        'staff_management',
        'approval_workflows',
        'audit_logging',
        'rbac_management',
      ],
      premium: Object.keys(featureMap),
    }

    for (const [tierName, featureCodes] of Object.entries(tierFeatureMappings)) {
      const tierId = tierMap[tierName]
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
          console.log(`✅ Mapped ${mappings.length} features for tier: ${tierName}`)
        }
      }
    }

    console.log('\n✨ Subscription tier seeding complete!')
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message)
  }
}

seedSubscriptionTiers().catch(console.error)
