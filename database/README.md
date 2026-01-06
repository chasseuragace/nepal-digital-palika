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
cd 07-database-seeding
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

#### Step 1: Create Foundation Tables
```bash
# Copy Part 1 schema to clipboard
npm run copy-part1

# Then paste and run in Supabase SQL Editor
# This creates: provinces, districts, palikas, roles, permissions, categories, app_versions
```

#### Step 2: Create Content Tables
```bash
# Copy Part 2 schema to clipboard  
npm run copy-part2

# Then paste and run in Supabase SQL Editor
# This creates: heritage_sites, events, businesses, blog_posts, etc.
```

#### Step 3: Seed Reference Data
```bash
# Seed essential reference data
npm run seed
```

### 4. Seed Content (Optional)
```bash
# Seed sample tourism content
npm run seed:content

# Or seed everything at once (reference + content)
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
# Check database status and table counts
npm run check-status

# Copy Part 1 schema (foundation tables)
npm run copy-part1

# Copy Part 2 schema (content tables)  
npm run copy-part2

# Seed reference data only
npm run seed

# Seed sample content only (heritage sites + events)
npm run seed:content

# Seed everything (reference + content)
npm run seed:all

# Setup production Supabase Auth admin users
npm run setup:auth-admin

# Development mode (shows drop instructions)
npm run seed:dev

# Comprehensive test suite
npm run test-all
```

## 🏗️ Database Setup Process

The database setup uses a **two-part approach** to avoid dependency issues:

### **Part 1: Foundation Tables**
- Geographic hierarchy (provinces, districts, palikas)
- System tables (roles, permissions, categories, app_versions)
- Initial reference data
- **Run first** - creates the foundation

### **Part 2: Content Tables**  
- User tables (profiles, admin_users)
- Content tables (heritage_sites, events, businesses, blog_posts)
- Operational tables (inquiries, reviews, sos_requests, favorites)
- **Run second** - depends on Part 1 tables

### **Part 3: Data Seeding**
- Seeds essential reference data into foundation tables
- Uses upsert operations (safe to run multiple times)
- **Run last** - populates the database

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

**Schema Not Found:**
```
❌ relation "provinces" does not exist
```
- Run the SQL schema setup first (Part 1 and Part 2)
- Use `npm run copy-part1` and `npm run copy-part2` to get the SQL

**Content Seeding Errors:**
```
❌ Category 'Temple' for entity type 'heritage_site' not found
```
- Ensure reference data is seeded first: `npm run seed`
- Check that all required categories exist in the database

### Re-running Seeding
The script uses `upsert` operations, so it's safe to run multiple times:
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
