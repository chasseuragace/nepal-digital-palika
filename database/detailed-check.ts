import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

async function check() {
  console.log('\n📊 DETAILED DATA CHECK (Service Role)\n');

  // Profiles
  const { data: profiles, count: profileCount } = await supabase
    .from('profiles')
    .select('id, name, default_palika_id', { count: 'exact' });

  console.log(`✅ Profiles: ${profileCount}`);

  // Businesses
  const { data: businesses, count: businessCount, error: businessError } = await supabase
    .from('businesses')
    .select('id, business_name, palika_id', { count: 'exact' });

  if (businessError) {
    console.log(`❌ Businesses error: ${businessError.message}`);
  } else {
    console.log(`✅ Businesses: ${businessCount}`);
    businesses?.slice(0, 5).forEach((b: any) => {
      console.log(`   - ${b.business_name} (Palika: ${b.palika_id})`);
    });
  }

  // Products
  const { data: products, count: productCount } = await supabase
    .from('marketplace_products')
    .select('id, name_en, business_id', { count: 'exact' });

  console.log(`✅ Products: ${productCount}`);
  if (products && products.length > 0) {
    products.slice(0, 3).forEach((p: any) => {
      console.log(`   - ${p.name_en}`);
    });
  }

  // Comments
  const { data: comments, count: commentCount } = await supabase
    .from('marketplace_product_comments')
    .select('id, user_id', { count: 'exact' });

  console.log(`✅ Comments: ${commentCount}`);

  console.log('\n='.repeat(70) + '\n');
}

check();
