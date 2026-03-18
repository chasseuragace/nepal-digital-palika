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

async function check() {
  console.log('Checking marketplace tables...\n')

  try {
    // Check marketplace_products table
    const { error: mpErr } = await supabaseAdmin
      .from('marketplace_products')
      .select('id')
      .limit(1)
    console.log(mpErr ? `❌ marketplace_products: ${mpErr.message}` : '✅ marketplace_products exists')

    // Check marketplace_categories
    const { data: mc, error: mcErr } = await supabaseAdmin
      .from('marketplace_categories')
      .select('*')
    const mcCount = mc?.length || 0
    console.log(mcErr ? `❌ marketplace_categories: ${mcErr.message}` : `✅ marketplace_categories: ${mcCount} records`)

    // Check business_categories
    const { data: bc, error: bcErr } = await supabaseAdmin
      .from('business_categories')
      .select('*')
    const bcCount = bc?.length || 0
    console.log(bcErr ? `❌ business_categories: ${bcErr.message}` : `✅ business_categories: ${bcCount} records`)

    // Check marketplace_product_comments
    const { error: mpcErr } = await supabaseAdmin
      .from('marketplace_product_comments')
      .select('id')
      .limit(1)
    console.log(mpcErr ? `❌ marketplace_product_comments: ${mpcErr.message}` : '✅ marketplace_product_comments exists')

  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

check()
