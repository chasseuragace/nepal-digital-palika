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

async function enrollPalikas() {
  try {
    console.log('📍 Checking subscription tiers...\n')

    // Get subscription tiers
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('id, name, display_name')

    if (tiersError) throw tiersError

    if (!tiers || tiers.length === 0) {
      console.log('❌ No subscription tiers found. Run seed-subscription-tiers.ts first.')
      process.exit(1)
    }

    console.log('✅ Found subscription tiers:')
    tiers.forEach((t) => console.log(`   - ID ${t.id}: ${t.display_name}`))
    console.log()

    // Get tier IDs by name
    const basicTier = tiers.find((t) => t.name === 'basic')
    const tourismTier = tiers.find((t) => t.name === 'tourism')
    const premiumTier = tiers.find((t) => t.name === 'premium')

    if (!basicTier || !tourismTier || !premiumTier) {
      console.log('❌ Missing subscription tiers. Expected basic, tourism, and premium tiers.')
      process.exit(1)
    }

    console.log('🔄 Enrolling palikas into tiers...\n')

    // Palika 1 -> Premium (Tier 3)
    let { error: error1 } = await supabaseAdmin
      .from('palikas')
      .update({ subscription_tier_id: premiumTier.id })
      .eq('id', 1)

    if (error1) throw error1
    console.log(`✅ Palika 1 → ${premiumTier.display_name}`)

    // Palika 2 -> Tourism
    let { error: error2 } = await supabaseAdmin
      .from('palikas')
      .update({ subscription_tier_id: tourismTier.id })
      .eq('id', 2)

    if (error2) throw error2
    console.log(`✅ Palika 2 → ${tourismTier.display_name}`)

    // Palika 3 -> Tourism
    let { error: error3 } = await supabaseAdmin
      .from('palikas')
      .update({ subscription_tier_id: tourismTier.id })
      .eq('id', 3)

    if (error3) throw error3
    console.log(`✅ Palika 3 → ${tourismTier.display_name}`)

    // Palika 4 -> Basic
    let { error: error4 } = await supabaseAdmin
      .from('palikas')
      .update({ subscription_tier_id: basicTier.id })
      .eq('id', 4)

    if (error4) throw error4
    console.log(`✅ Palika 4 → ${basicTier.display_name}`)

    // Verify enrollment
    console.log('\n🔍 Verifying tier enrollment...\n')
    const { data: palikas } = await supabaseAdmin
      .from('palikas')
      .select('id, name_en, subscription_tier_id')
      .in('id', [1, 2, 3, 4])

    palikas?.forEach((p) => {
      const tier = tiers.find((t) => t.id === p.subscription_tier_id)
      console.log(`   ${p.name_en} (Palika ${p.id}): ${tier?.display_name || 'No tier'}`)
    })

    console.log('\n✨ Palika tier enrollment complete!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

enrollPalikas()
