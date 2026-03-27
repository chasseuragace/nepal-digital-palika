import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Direct PostgreSQL connection for PostGIS
const pgClient = new pg.Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

console.log('🌱 Seeding Marketplace with Sample Data\n');

async function seedMarketplace() {
  try {
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Get Bhaktapur palika
    const { data: bhaktapur } = await supabase
      .from('palikas')
      .select('id')
      .eq('name_en', 'Bhaktapur Municipality')
      .single();

    if (!bhaktapur) {
      console.error('❌ Bhaktapur not found');
      return;
    }

    console.log(`✅ Found Bhaktapur (ID: ${bhaktapur.id})\n`);

    // Try to find an existing user or create a simple one
    const dummyUserId = '00000000-0000-0000-0000-000000000001';
    const dummyEmail = 'ayush@test.com';
    
    console.log('👤 Checking for existing auth users...');
    const existingUsers = await pgClient.query('SELECT id, email FROM auth.users LIMIT 5');
    console.log(`Found ${existingUsers.rows.length} existing users`);
    
    if (existingUsers.rows.length > 0) {
      console.log('Using first existing user:', existingUsers.rows[0].email);
      const actualUserId = existingUsers.rows[0].id;
      
      // Check if profile exists
      const profileCheck = await pgClient.query('SELECT id FROM profiles WHERE id = $1', [actualUserId]);
      if (profileCheck.rows.length === 0) {
        console.log('Creating profile for existing user...');
        await pgClient.query(`
          INSERT INTO profiles (id, name, phone, user_type, default_palika_id)
          VALUES ($1, $2, $3, $4, $5);
        `, [actualUserId, 'Ayush Test User', '+977-9841234567', 'business_owner', bhaktapur.id]);
      }
      
      var userId = actualUserId;
    } else {
      console.log('⚠️  No existing users found. You need to register an account first.');
      console.log('Please:');
      console.log('1. Go to http://localhost:8080');
      console.log('2. Register an account');
      console.log('3. Run this script again');
      await pgClient.end();
      return;
    }
    
    console.log('✅ User ready\n');

    // Create business using direct SQL to handle PostGIS location field
    console.log('🏢 Creating sample business...');
    const businessResult = await pgClient.query(`
      INSERT INTO businesses (
        owner_user_id, palika_id, business_name, slug, business_type_id,
        email, phone, address, ward_number, location, description,
        status, is_published, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        ST_GeomFromText('POINT(85.4298 27.6710)', 4326),
        $10, $11, $12, $13
      )
      RETURNING *;
    `, [
      userId,
      bhaktapur.id,
      "Ayush's Store",
      'ayush-store',
      16,
      'ayush@test.com',
      '+977-9841234567',
      'Bhaktapur Durbar Square',
      1,
      'Traditional crafts and souvenirs from Bhaktapur',
      'approved',
      true,
      true
    ]);

    const business = businessResult.rows[0];
    console.log(`✅ Business created: ${business.business_name} (ID: ${business.id})\n`);

    // Get marketplace categories
    const { data: categories } = await supabase
      .from('marketplace_categories')
      .select('id, name_en')
      .limit(5);

    // Create products
    console.log('📦 Creating sample products...');
    const products = [
      {
        name_en: 'Ayush',
        slug: 'ayush-test-product',
        marketplace_category_id: categories[0].id,
        short_description: 'Ayush test product',
        full_description: 'Ayush test Ayush Test',
        price: 852582,
        featured_image: 'https://via.placeholder.com/400',
        images: JSON.stringify(['https://via.placeholder.com/400']),
        business_id: business.id,
        palika_id: bhaktapur.id,
        created_by: userId,
        status: 'published',
        is_approved: true,
        is_in_stock: true,
      },
      {
        name_en: 'Traditional Pottery',
        slug: 'traditional-pottery',
        marketplace_category_id: categories[1]?.id || categories[0].id,
        short_description: 'Handmade pottery from Bhaktapur',
        full_description: 'Beautiful handcrafted pottery made by local artisans',
        price: 1500,
        featured_image: 'https://via.placeholder.com/400',
        images: JSON.stringify(['https://via.placeholder.com/400']),
        business_id: business.id,
        palika_id: bhaktapur.id,
        created_by: userId,
        status: 'published',
        is_approved: true,
        is_in_stock: true,
      },
    ];

    for (const product of products) {
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert(product)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create ${product.name_en}:`, error.message);
      } else {
        console.log(`✅ Created product: ${data.name_en} (ID: ${data.id})`);
      }
    }

    console.log('\n✨ Marketplace seeding complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Register an account at http://localhost:8080');
    console.log('2. Your products will be visible');
    console.log('3. Seller information will show for all users');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pgClient.end();
  }
}

seedMarketplace();
