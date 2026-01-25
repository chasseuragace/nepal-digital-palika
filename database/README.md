# Database Seeding

Complete database seeding solution for Nepal Digital Tourism Infrastructure.

## 📁 Folder Structure

```
07-database-seeding/
├── scripts/
│   ├── part1-basic-tables.sql   # Foundation tables SQL
│   ├── part2-content-tables.sql # Content tables SQL
│   └── seed-database.ts         # Main seeding script
├── config/
│   └── .env.example             # Environment configuration template
├── docs/
│   └── SEEDING-SUMMARY.md       # Implementation details and summary
├── check-status.sh              # Database status checker
├── test-all.sh                  # Comprehensive test suite
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd database
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp config/.env.example .env

# Edit .env with your Supabase credentials
nano .env
```

### 3. Database Setup

#### Step 1: Apply Schema Migrations
```bash
# From the root directory
supabase db reset
```
This automatically applies all migrations from `supabase/migrations/` and enables RLS policies.

#### Step 2: Seed Reference Data
```bash
# From the database directory
npm run seed
```
This seeds: provinces, districts, palikas, roles, permissions, categories, app_versions, and admin users.

#### Step 3: Seed Content (Optional)
```bash
# Seed sample tourism content
npm run seed:content

# Or seed everything at once
npm run seed:all
```

### 5. Verify Setup
```bash
# Check database status
npm run check-status

# Should show: Total: 11/11 tables exist
```

## 📊 What Gets Seeded

### Essential Reference Data (npm run seed):
- ✅ **7 Provinces** - All Nepal provinces with Nepali names
- ✅ **9 Major Districts** - Key districts (Kathmandu, Kaski, etc.)
- ✅ **8 Major Palikas** - Metropolitan and major municipalities
- ✅ **6 User Roles** - Complete RBAC system
- ✅ **12 Permissions** - Granular access control
- ✅ **27 Categories** - Content taxonomy (heritage, events, business, blog)
- ✅ **2 App Versions** - Initial Android/iOS versions

### Sample Tourism Content (npm run seed:content):
- ✅ **8 Heritage Sites** - Complete UNESCO World Heritage sites with real data
- ✅ **8 Events** - Major Nepal festivals and cultural events throughout the year
- ✅ **6 Blog Posts** - Comprehensive tourism information and guides
- ❌ **Businesses** - Requires user authentication (coming soon)



**Note:** Part 1 creates 12 basic categories, but the seeding script adds the complete set of 27 categories.

### What's NOT Seeded:
- ❌ User accounts (created during registration)
- ❌ Business listings (requires user authentication)
- ❌ Blog posts (requires admin authentication)  
- ❌ Admin users (requires Supabase Auth setup)
- ❌ All 753 palikas (only major ones for demo)
- ❌ Sample/demo data beyond heritage sites and events

## ⚙️ Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NODE_ENV=development
```

### Getting Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** → `SUPABASE_URL`
4. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security Warning:** The service role key has admin access. Keep it secret!

## 🔧 Available Scripts

```bash
# Seed reference data (provinces, districts, palikas, roles, permissions, categories, app_versions, admin users)
npm run seed

# Seed sample content (heritage sites, events, blog posts)
npm run seed:content

# Seed everything at once
npm run seed:all

# Setup Supabase Auth admin users
npm run setup:auth-admin

# Complete setup
npm run setup:complete

# Check database status and table counts
npm run check-status

# Comprehensive test suite
npm run test-all
```

**Note:** Schema migrations are applied automatically via `supabase db reset` from the root directory.

## 🏗️ Database Setup Process

The database setup uses a **three-part approach** with Supabase native migrations and TypeScript seeding:

### **Part 1: Schema Migrations**
- Located in `supabase/migrations/`
- Applied automatically via `supabase db reset`
- Creates all table structures with proper constraints and indexes
- Enables RLS policies for security

### **Part 2: Reference Data Seeding**
- Handled by `database/scripts/seed-database.ts`
- Seeds: provinces, districts, palikas, roles, permissions, categories, app_versions, admin users
- Run via `npm run seed`

### **Part 3: Content Seeding**
- Handled by `database/scripts/seed-content.ts`
- Seeds: heritage sites, events, blog posts
- Run via `npm run seed:content`

## 📋 Verification

After seeding, verify in Supabase dashboard:
1. Go to **Table Editor**
2. Check these tables have data:
   
   **Reference Data:**
   - `provinces` (7 rows)
   - `districts` (9 rows)  
   - `palikas` (8 rows)
   - `roles` (6 rows)
   - `permissions` (12 rows)
   - `categories` (27 rows)
   - `app_versions` (2 rows)
   
   **Content Data (if seeded):**
   - `heritage_sites` (8 rows)
   - `events` (8 rows)
   - `blog_posts` (0 rows - requires admin auth setup)
   - `businesses` (0 rows - requires user auth setup)

## 🐛 Troubleshooting

### Common Issues

**Connection Error:**
```
❌ Failed to connect to Supabase
```
- Check your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure your Supabase project is active

**Permission Error:**
```
❌ Error seeding: insufficient_privilege
```
- Make sure you're using the `service_role` key, not the `anon` key
- Check that RLS policies allow service role access

**Migration Failed:**
```
❌ Error applying migration
```
- Ensure `supabase db reset` completes successfully first
- Check that all migrations in `supabase/migrations/` are valid SQL

**Content Seeding Errors:**
```
❌ Category 'X' for entity type 'Y' not found
```
- Ensure reference data is seeded first: `npm run seed`
- Check that all required categories exist in the database

### Re-running Seeding
The scripts use `upsert` operations, so it's safe to run multiple times:
- Existing data won't be duplicated
- New data will be added
- Changed data will be updated

## 📝 Next Steps

After seeding:
1. ✅ **Test the system** - Verify reference data is properly loaded
2. ✅ **Add sample content** - Run `npm run seed:content` for demo data
3. ✅ **Setup admin users** - Run `npm run setup:auth-admin` for content management
4. ✅ **Verify in Supabase** - Check tables have expected data counts
5. ✅ **Test mobile app** - Verify heritage sites and events display correctly
6. ✅ **Build content management** - Admin interface for creating/editing content

## 🔗 Related Documentation

- [Database Schema](../03-technical-architecture/sipabase_sql.md)
- [Mobile App Specification](../03-technical-architecture/MOBILE_APP_SPECIFICATION.md)
- [System Operations](../05-operations/SYSTEM_OPERATIONS%20copy.md)
- [Implementation Details](docs/SEEDING-SUMMARY.md)
- [Content Seeding Plan](docs/CONTENT-SEEDING-PLAN.md)
- [Admin Setup Guide](docs/ADMIN-SETUP-GUIDE.md) - **Start here for content management**

## 🎯 Target Audience

- Database administrators
- DevOps engineers  
- Development team leads
- System integrators
