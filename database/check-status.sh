#!/bin/bash

# Quick status check script

echo "🔍 Nepal Tourism Database Status Check"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "💡 Copy config/.env.example to .env and configure"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Check database tables
echo "📊 Checking database tables..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
  const coreGeography = ['provinces', 'districts', 'palikas'];
  const coreSystem = ['roles', 'permissions', 'categories', 'app_versions'];
  const contentTables = ['heritage_sites', 'events', 'businesses', 'blog_posts'];
  
  let geographyCount = 0;
  let systemCount = 0;
  let contentCount = 0;
  
  console.log('📍 Geography Tables:');
  for (const table of coreGeography) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        console.log(\`   ✅ \${table}\`);
        geographyCount++;
      } else {
        console.log(\`   ❌ \${table}\`);
      }
    } catch (e) {
      console.log(\`   ❌ \${table}\`);
    }
  }
  
  console.log('');
  console.log('⚙️  System Tables:');
  for (const table of coreSystem) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        console.log(\`   ✅ \${table}\`);
        systemCount++;
      } else {
        console.log(\`   ❌ \${table}\`);
      }
    } catch (e) {
      console.log(\`   ❌ \${table}\`);
    }
  }
  
  console.log('');
  console.log('📝 Content Tables:');
  for (const table of contentTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        console.log(\`   ✅ \${table}\`);
        contentCount++;
      } else {
        console.log(\`   ❌ \${table}\`);
      }
    } catch (e) {
      console.log(\`   ❌ \${table}\`);
    }
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log(\`   Geography: \${geographyCount}/\${coreGeography.length} tables\`);
  console.log(\`   System: \${systemCount}/\${coreSystem.length} tables\`);
  console.log(\`   Content: \${contentCount}/\${contentTables.length} tables\`);
  
  const total = geographyCount + systemCount + contentCount;
  const maxTotal = coreGeography.length + coreSystem.length + contentTables.length;
  
  console.log(\`   Total: \${total}/\${maxTotal} tables exist\`);
  
  if (total === 0) {
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: ./copy-schema.sh');
    console.log('   2. Execute SQL in Supabase Dashboard');
    console.log('   3. Run: npm run seed');
  } else if (geographyCount === 3 && systemCount === 0) {
    console.log('');
    console.log('⚠️  Partial Setup Detected:');
    console.log('   - Geography tables exist (good!)');
    console.log('   - System tables missing (need full schema)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: ./copy-schema.sh');
    console.log('   2. Execute FULL schema in Supabase Dashboard');
    console.log('   3. Run: npm run seed');
  } else if (total === maxTotal) {
    console.log('');
    console.log('✅ Schema Complete! Ready for seeding:');
    console.log('   npm run seed');
  } else {
    console.log('');
    console.log('⚠️  Incomplete Setup:');
    console.log('   Run full schema setup in Supabase Dashboard');
  }
}

checkStatus().catch(console.error);
"

echo ""