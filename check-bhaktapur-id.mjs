import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Find Bhaktapur
const { data: bhaktapur } = await supabase
  .from('palikas')
  .select('id, name_en, district_id')
  .ilike('name_en', '%bhaktapur%');

console.log('Bhaktapur palikas:', bhaktapur);

// Check all products
const { data: allProducts } = await supabase
  .from('marketplace_products')
  .select('id, name_en, palika_id, businesses(business_name)');

console.log(`\nTotal products: ${allProducts?.length || 0}`);
allProducts?.forEach(p => {
  console.log(`  - ${p.name_en} (Palika ID: ${p.palika_id}, Business: ${p.businesses?.business_name})`);
});

// Check all businesses
const { data: allBusinesses } = await supabase
  .from('businesses')
  .select('id, business_name, palika_id');

console.log(`\nTotal businesses: ${allBusinesses?.length || 0}`);
allBusinesses?.forEach(b => {
  console.log(`  - ${b.business_name} (Palika ID: ${b.palika_id})`);
});
