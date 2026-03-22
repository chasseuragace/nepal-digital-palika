import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function seedAdminUsers() {
  console.log('🔐 Starting admin user seeding (using service role key)...');

  // 1. Get the correct Kathmandu palika ID
  const { data: kathmanduData, error: kathmanduError } = await supabaseAdmin
    .from('palikas')
    .select('id, name_en')
    .eq('code', 'KTM001')
    .single();

  if (kathmanduError || !kathmanduData) {
    console.error('❌ Could not find Kathmandu palika (KTM001). Run geographic seeding first.');
    return;
  }

  const kathmanduPalikaId = kathmanduData.id;
  console.log(`📍 Found Kathmandu palika: ${kathmanduData.name_en} (ID: ${kathmanduPalikaId})`);

  // 2. Get the correct Bhaktapur palika ID
  const { data: bhaktapurData, error: bhaktapurError } = await supabaseAdmin
    .from('palikas')
    .select('id, name_en')
    .eq('code', 'BHK001')
    .single();

  if (bhaktapurError || !bhaktapurData) {
    console.error('❌ Could not find Bhaktapur palika (BHK001). Run geographic seeding first.');
    return;
  }

  const bhaktapurPalikaId = bhaktapurData.id;
  console.log(`📍 Found Bhaktapur palika: ${bhaktapurData.name_en} (ID: ${bhaktapurPalikaId})`);

  // Using simpler, valid email formats
  const defaultUsers = [
    {
      email: 'superadmin@nepaltourism.dev',
      password: 'SuperSecurePass123!',
      role: 'super_admin' as const,
      full_name: 'Super Administrator',
      palika_id: null,
    },
    {
      email: 'palika.admin@kathmandu.gov.np',
      password: 'KathmanduAdmin456!',
      role: 'palika_admin' as const,
      full_name: 'Kathmandu Palika Admin',
      palika_id: kathmanduPalikaId,
    },
    {
      email: 'content.moderator@kathmandu.gov.np',
      password: 'ModeratorSecure789!',
      role: 'moderator' as const,
      full_name: 'Kathmandu Content Moderator',
      palika_id: kathmanduPalikaId,
    },
    {
      email: 'palika.admin@bhaktapur.gov.np',
      password: 'BhaktapurAdmin456!',
      role: 'palika_admin' as const,
      full_name: 'Bhaktapur Palika Admin',
      palika_id: bhaktapurPalikaId,
    },
    {
      email: 'content.moderator@bhaktapur.gov.np',
      password: 'BhaktapurModerator789!',
      role: 'moderator' as const,
      full_name: 'Bhaktapur Content Moderator',
      palika_id: bhaktapurPalikaId,
    },
  ];

  for (const user of defaultUsers) {
    console.log(`\n👤 Processing: ${user.email}`);

    try {
      // Try to create user using admin API if available
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });

      if (authError) {
        // If admin.createUser fails, try regular signUp with service key
        console.log(`   ⚠️  Admin API failed, trying regular signUp: ${authError.message}`);
        
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: { full_name: user.full_name },
          },
        });

        if (signUpError) {
          console.error(`   ❌ Auth creation error for ${user.email}:`, signUpError.message);
          continue;
        }

        if (!signUpData?.user) {
          console.error(`   ❌ No user data returned for ${user.email}`);
          continue;
        }

        console.log(`   ✅ Auth user created via signUp: ${signUpData.user.id}`);
        await createAdminProfile(signUpData.user.id, user);
      } else {
        console.log(`   ✅ Auth user created via admin API: ${authData.user.id}`);
        await createAdminProfile(authData.user.id, user);
      }
    } catch (error: any) {
      console.error(`   ❌ Unexpected error for ${user.email}:`, error.message);
    }
  }

  console.log('\n✨ Admin user seeding attempt complete.');
  console.log('📋 Credentials:');
  defaultUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password}`);
  });
}

async function createAdminProfile(userId: string, userData: any) {
  const { error: profileError } = await supabaseAdmin
    .from('admin_users')
    .upsert({
      id: userId,
      full_name: userData.full_name,
      role: userData.role,
      palika_id: userData.palika_id,
      is_active: true,
    }, {
      onConflict: 'id',
    });

  if (profileError) {
    console.error(`   ❌ Admin profile error for ${userData.email}:`, profileError.message);
  } else {
    console.log(`   ✅ Admin profile upserted for ${userData.email}`);
  }
}

seedAdminUsers().catch(console.error);

export { seedAdminUsers };