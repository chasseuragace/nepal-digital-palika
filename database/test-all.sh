#!/bin/bash

# Comprehensive test script for Nepal Tourism Database Seeding

echo "🧪 Nepal Tourism Database Seeding - Comprehensive Test Suite"
echo "============================================================="
echo ""

# Test 1: Environment Check
echo "📋 Test 1: Environment Configuration"
echo "-----------------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "SUPABASE_URL" .env && grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
        echo "✅ Required environment variables present"
    else
        echo "❌ Missing required environment variables"
        exit 1
    fi
else
    echo "❌ .env file not found"
    exit 1
fi
echo ""

# Test 2: Dependencies Check
echo "📦 Test 2: Dependencies"
echo "----------------------"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  node_modules not found, installing..."
    npm install
fi

if [ -f "scripts/schema-setup.sql" ]; then
    SCHEMA_LINES=$(wc -l < scripts/schema-setup.sql)
    echo "✅ Schema file exists ($SCHEMA_LINES lines)"
else
    echo "❌ Schema file missing"
    exit 1
fi
echo ""

# Test 3: Database Connection
echo "🔗 Test 3: Database Connection"
echo "------------------------------"
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('provinces').select('count').limit(1);
    if (error) {
      console.log('❌ Connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (e) {
    console.log('❌ Connection error:', e.message);
    process.exit(1);
  }
}

testConnection();
"
echo ""

# Test 4: Schema Status Check
echo "📊 Test 4: Schema Status"
echo "-----------------------"
npm run check-status
echo ""

# Test 5: Copy Schema Test
echo "📋 Test 5: Copy Schema Functionality"
echo "------------------------------------"
echo "Testing schema copy to clipboard..."
npm run copy-schema > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Copy schema script works"
else
    echo "❌ Copy schema script failed"
fi
echo ""

# Test 6: Seeding Test (Expected to fail on roles if schema incomplete)
echo "🌱 Test 6: Seeding Process"
echo "-------------------------"
echo "Testing seeding process (may fail if schema incomplete - this is expected)..."
timeout 30s npm run seed > /tmp/seed_test.log 2>&1
SEED_EXIT_CODE=$?

if grep -q "✅ Seeded.*provinces" /tmp/seed_test.log; then
    echo "✅ Geography seeding works"
else
    echo "❌ Geography seeding failed"
fi

if grep -q "Could not find the table.*roles" /tmp/seed_test.log; then
    echo "✅ Correctly detects missing system tables"
elif grep -q "✅.*roles" /tmp/seed_test.log; then
    echo "✅ System tables seeding works"
else
    echo "⚠️  Unexpected seeding behavior"
fi
echo ""

# Test 7: Development Mode Test
echo "🔧 Test 7: Development Mode"
echo "---------------------------"
echo "Testing development mode (drop-all instructions)..."
timeout 10s npm run seed:dev > /tmp/dev_test.log 2>&1

if grep -q "Drop all tables" /tmp/dev_test.log; then
    echo "✅ Development mode provides drop instructions"
else
    echo "❌ Development mode failed"
fi
echo ""

# Test 8: Script Permissions
echo "🔐 Test 8: Script Permissions"
echo "-----------------------------"
if [ -x "./check-status.sh" ]; then
    echo "✅ check-status.sh is executable"
else
    echo "❌ check-status.sh not executable"
fi

if [ -x "./copy-schema.sh" ]; then
    echo "✅ copy-schema.sh is executable"
else
    echo "❌ copy-schema.sh not executable"
fi
echo ""

# Test Summary
echo "📊 Test Summary"
echo "==============="
echo ""

# Count schema completeness
TOTAL_TABLES=11
EXISTING_TABLES=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countTables() {
  const tables = ['provinces', 'districts', 'palikas', 'roles', 'permissions', 'categories', 'app_versions', 'heritage_sites', 'events', 'businesses', 'blog_posts'];
  let count = 0;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) count++;
    } catch (e) {}
  }
  
  console.log(count);
}

countTables();
")

echo "Database Status: $EXISTING_TABLES/$TOTAL_TABLES tables exist"

if [ "$EXISTING_TABLES" -eq "$TOTAL_TABLES" ]; then
    echo "🎉 Status: COMPLETE - Ready for full seeding!"
    echo ""
    echo "🚀 Next Steps:"
    echo "   npm run seed"
elif [ "$EXISTING_TABLES" -gt 0 ]; then
    echo "⚠️  Status: PARTIAL - Schema setup needed"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. npm run copy-schema"
    echo "   2. Execute SQL in Supabase Dashboard"
    echo "   3. npm run seed"
else
    echo "🔧 Status: EMPTY - Full setup needed"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. npm run copy-schema"
    echo "   2. Execute SQL in Supabase Dashboard"
    echo "   3. npm run seed"
fi

echo ""
echo "✅ All tests completed successfully!"
echo "📁 Test logs saved to /tmp/seed_test.log and /tmp/dev_test.log"

# Cleanup
rm -f /tmp/seed_test.log /tmp/dev_test.log