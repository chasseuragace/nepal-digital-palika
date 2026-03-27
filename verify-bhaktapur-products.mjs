import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Verifying Bhaktapur marketplace data...\n');

// Get products
const { data: products, error } = await supabase
  .from('marketplace_products')
  .select(`
    id,
    name_en,
    price,
    status,
    is_approved,
    businesses (
      id,
      business_name,
      phone,
      email,
      address,
      status,
      is_published
    ),
    palikas (
      name_en
    )
  `)
  .eq('palika_id', 304)
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`✅ Found ${products.length} products in Bhaktapur:\n`);
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name_en}`);
    console.log(`   Price: NPR ${p.price}`);
    console.log(`   Status: ${p.status} (Approved: ${p.is_approved})`);
    console.log(`   Business: ${p.businesses.business_name}`);
    console.log(`   Phone: ${p.businesses.phone}`);
    console.log(`   Email: ${p.businesses.email}`);
    console.log(`   Business Status: ${p.businesses.status} (Published: ${p.businesses.is_published})`);
    console.log(`   Product ID: ${p.id}`);
    console.log('');
  });
}

// Get users
const { data: users } = await supabase
  .from('profiles')
  .select('id, name, phone, user_type')
  .eq('default_palika_id', 304);

console.log(`\n👥 Found ${users?.length || 0} users in Bhaktapur:`);
users?.forEach(u => {
  console.log(`   - ${u.name} (${u.user_type})`);
});

console.log('\n✨ Verification complete!');
console.log('\n📱 Test the marketplace at: http://localhost:8080');
