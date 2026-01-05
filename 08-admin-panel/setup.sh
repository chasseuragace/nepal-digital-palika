#!/bin/bash

echo "🚀 Setting up Nepal Tourism Admin Panel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 08-admin-panel directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local from template"
    echo "📝 Please edit .env.local with your Supabase credentials before starting the server"
else
    echo "✅ Environment file already exists"
fi

# Check if database seeding is complete
echo "🗄️ Checking database setup..."
if [ -d "../07-database-seeding" ]; then
    echo "✅ Database seeding folder found"
    echo "📋 Make sure you have run the following commands in 07-database-seeding/:"
    echo "   npm run seed:all"
    echo "   npm run setup:temp-admin"
else
    echo "⚠️ Warning: Database seeding folder not found at ../07-database-seeding"
    echo "   Please ensure database is properly seeded before using the admin panel"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Ensure database is seeded (see 07-database-seeding/README.md)"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:3000"
echo ""
echo "Login credentials:"
echo "- Email: superadmin@nepal-tourism.gov.np"
echo "- Password: admin123"