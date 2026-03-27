import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔧 Updating ward counts for palikas without them...\n');

// Default ward counts based on palika type
const defaultWards = {
  'metropolitan': 32,
  'sub_metropolitan': 19,
  'municipality': 12,
  'rural_municipality': 9
};

// Get palikas without ward counts (0 or null)
const { data: palikas, error } = await supabase
  .from('palikas')
  .select('id, name_en, type, total_wards')
  .or('total_wards.is.null,total_wards.eq.0');

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`Found ${palikas.length} palikas without ward counts\n`);

// Update each palika with default ward count based on type
for (const palika of palikas) {
  const wards = defaultWards[palika.type] || 10;
  
  const { error: updateError } = await supabase
    .from('palikas')
    .update({ total_wards: wards })
    .eq('id', palika.id);
  
  if (updateError) {
    console.error(`❌ Error updating ${palika.name_en}:`, updateError.message);
  } else {
    console.log(`✅ ${palika.name_en} (${palika.type}) → ${wards} wards`);
  }
}

console.log(`\n✨ Updated ${palikas.length} palikas with ward counts`);

// Verify
const { data: updated } = await supabase
  .from('palikas')
  .select('id, name_en, total_wards')
  .is('total_wards', null);

console.log(`\n📊 Remaining palikas without wards: ${updated?.length || 0}`);
