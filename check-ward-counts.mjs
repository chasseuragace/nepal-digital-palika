import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Checking ward counts in palikas...\n');

// Get sample palikas with ward counts
const { data: palikas, error } = await supabase
  .from('palikas')
  .select('id, name_en, type, total_wards')
  .order('id')
  .limit(20);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`✅ Found ${palikas.length} palikas (showing first 20):\n`);
  
  let withWards = 0;
  let withoutWards = 0;
  
  palikas.forEach((p, i) => {
    const wardsInfo = p.total_wards ? `${p.total_wards} wards` : '❌ NO WARDS';
    console.log(`${i + 1}. ${p.name_en} (${p.type})`);
    console.log(`   ${wardsInfo}`);
    
    if (p.total_wards) withWards++;
    else withoutWards++;
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ With ward counts: ${withWards}`);
  console.log(`   ❌ Without ward counts: ${withoutWards}`);
  
  // Check Bhaktapur specifically
  const { data: bhaktapur } = await supabase
    .from('palikas')
    .select('id, name_en, total_wards')
    .eq('id', 10)
    .single();
  
  if (bhaktapur) {
    console.log(`\n🏛️  Bhaktapur Municipality:`);
    console.log(`   ID: ${bhaktapur.id}`);
    console.log(`   Name: ${bhaktapur.name_en}`);
    console.log(`   Total Wards: ${bhaktapur.total_wards || 'NOT SET'}`);
  }
}
