# Nepal Digital Tourism Platform - Setup & Seeding Guide

## Quick Start

```bash
# 1. Start Supabase
supabase start

# 2. Reset database (applies migrations and seeds)
supabase db reset

# 3. Run complete seeding pipeline
bash session-2026-03-21/run-seeds.sh

# 4. Verify setup
bash session-2026-03-21/verify-setup.sh
```

---

## Documentation

### Core Guides
- **[SEEDING_PIPELINE.md](./SEEDING_PIPELINE.md)** - 5-stage seeding pipeline overview
- **[SCRIPTS_REORGANIZATION.md](./SCRIPTS_REORGANIZATION.md)** - Before/after script organization
- **[USER_BUSINESS_CREATION_FLOW.md](./USER_BUSINESS_CREATION_FLOW.md)** - How users, businesses, and products are created
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Current setup status and credentials

### Verification
- **[verify-setup.sh](./verify-setup.sh)** - Verify all components are set up correctly
- **[run-seeds.sh](./run-seeds.sh)** - Run complete seeding pipeline

---

## 5-Stage Seeding Pipeline

### Stage 1: Infrastructure Setup
Creates core platform infrastructure (tiers, categories, features)

**Scripts**:
- `seed-subscription-tiers.ts` - 3 tiers with 27 features
- `seed-business-types.ts` - 96 business type categories
- `seed-business-categories-direct.ts` - 8 business categories
- `seed-marketplace-categories-direct.ts` - 26 marketplace categories

**Output**: Infrastructure ready for admins and users

---

### Stage 2: Admin Setup
Creates admin users for platform management

**Scripts**:
- `seed-admin-users.ts` - 5 admin users (super admin, palika admins, moderators)

**Admins**:
```
Super Admin: superadmin@nepaltourism.dev / SuperSecurePass123!
Kathmandu Admin: palika.admin@kathmandu.gov.np / KathmanduAdmin456!
Bhaktapur Admin: palika.admin@bhaktapur.gov.np / BhaktapurAdmin456!
```

---

### Stage 3: Palika Tier Assignment
Assigns subscription tiers to palikas

**Scripts**:
- `enroll-palikas-tiers.ts` - Assign tiers to 5 palikas

**Assignments**:
```
Palika 1 (Rajbiraj)   → Premium
Palika 2 (Kanyam)     → Tourism
Palika 3 (Tilawe)     → Tourism
Palika 4 (Itahari)    → Basic
Palika 10 (Bhaktapur) → Tourism
```

---

### Stage 4: Palika User Creation
Creates test users with business profiles

**Scripts**:
- `seed-marketplace-proper.ts` - 8 users with businesses and products

**Flow**:
```
Auth User → Profile (palika_id) → Business → Products
```

**Output**: 8 users, 8 businesses, 16 products across 3 tiers

---

### Stage 5: Marketplace Product Creation
Creates additional marketplace products and comments

**Scripts**:
- `seed-marketplace-test-data.ts` - Additional products and threaded comments

**Output**: Complete marketplace with products and user interactions

---

## Database Schema

### Key Tables

**Geographic Hierarchy**:
- `provinces` - 6 provinces
- `districts` - 6 districts
- `palikas` - 12 palikas (local government units)

**Subscription System**:
- `subscription_tiers` - 3 tiers (Basic, Tourism, Premium)
- `features` - 27 platform features
- `tier_features` - Feature mappings to tiers

**Categories**:
- `categories` - Business types (96 total, 8 per palika)
- `business_categories` - Business categories (8)
- `marketplace_categories` - Product categories (26, tier-gated)

**Users & Businesses**:
- `auth.users` - Supabase auth users
- `profiles` - User profiles with palika assignment
- `admin_users` - Admin user profiles
- `businesses` - Business profiles
- `marketplace_products` - Marketplace products
- `marketplace_product_comments` - Threaded comments

---

## Available Palikas

```
ID  Code    Name                Type
1   RAJ001  Rajbiraj            Municipality
2   KAN001  Kanyam              Rural Municipality
3   TIL001  Tilawe              Rural Municipality
4   ITA001  Itahari             Municipality
5   DHA001  Dharan              Municipality
6   INA001  Inaruwa             Municipality
7   KTM001  Kathmandu           Metropolitan
8   TOK001  Tokha               Municipality
9   BUD001  Budhanilkantha      Rural Municipality
10  BHK001  Bhaktapur           Municipality
11  MAD001  Madanpur            Rural Municipality
12  THI001  Thimi               Municipality
```

---

## Test Credentials

### Admin Users
```
Super Admin:
  Email: superadmin@nepaltourism.dev
  Password: SuperSecurePass123!

Kathmandu Palika Admin:
  Email: palika.admin@kathmandu.gov.np
  Password: KathmanduAdmin456!

Kathmandu Moderator:
  Email: content.moderator@kathmandu.gov.np
  Password: ModeratorSecure789!

Bhaktapur Palika Admin:
  Email: palika.admin@bhaktapur.gov.np
  Password: BhaktapurAdmin456!

Bhaktapur Moderator:
  Email: content.moderator@bhaktapur.gov.np
  Password: BhaktapurModerator789!
```

### Test Users
Generated during seeding with format:
```
Email: [name]@test.com
Password: TestPassword123!@#
```

---

## Supabase Services

- **API**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323
- **MCP Endpoint**: http://127.0.0.1:54321/mcp
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

---

## Running the Pipeline

### Complete Pipeline (All Stages)
```bash
bash session-2026-03-21/run-seeds.sh
```

### Individual Stages
```bash
cd database

# Stage 1: Infrastructure
npx ts-node scripts/seed-subscription-tiers.ts
npx ts-node scripts/seed-business-types.ts
npx ts-node scripts/seed-business-categories-direct.ts
npx ts-node scripts/seed-marketplace-categories-direct.ts

# Stage 2: Admin
npx ts-node scripts/seed-admin-users.ts

# Stage 3: Tier Assignment
npx ts-node scripts/enroll-palikas-tiers.ts

# Stage 4: User Creation
npx ts-node scripts/seed-marketplace-proper.ts

# Stage 5: Products
npx ts-node scripts/seed-marketplace-test-data.ts
```

### Quick Test (Single User)
```bash
cd database
npx ts-node scripts/seed-complete-flow.ts
```

---

## Verification

### Check Setup Status
```bash
bash session-2026-03-21/verify-setup.sh
```

### Check Database State
```bash
# Using Supabase MCP
mcp_supabase_execute_sql "SELECT COUNT(*) FROM subscription_tiers;"
mcp_supabase_execute_sql "SELECT COUNT(*) FROM admin_users;"
mcp_supabase_execute_sql "SELECT COUNT(*) FROM profiles;"
mcp_supabase_execute_sql "SELECT COUNT(*) FROM businesses;"
```

---

## Troubleshooting

### Supabase Won't Start
```bash
# Check if containers are running
docker ps | grep supabase

# Check logs
supabase status

# Reset if needed
supabase stop
supabase start
```

### Database Reset Fails
```bash
# Check migrations
supabase db pull

# Check for syntax errors
supabase db reset --debug
```

### Seeding Fails
```bash
# Check dependencies
cd database
npm install

# Run individual script with debug
npx ts-node scripts/seed-subscription-tiers.ts
```

### MCP Connection Issues
```bash
# Check endpoint
curl http://localhost:54321/mcp

# Verify configuration
cat .kiro/settings/mcp.json

# Reconnect MCP server
# (Use Kiro UI to reconnect)
```

---

## Next Steps

1. ✅ Start Supabase: `supabase start`
2. ✅ Reset database: `supabase db reset`
3. ✅ Run seeds: `bash session-2026-03-21/run-seeds.sh`
4. ✅ Verify setup: `bash session-2026-03-21/verify-setup.sh`
5. ✅ Start development servers:
   ```bash
   # Terminal 1: Admin Panel
   cd admin-panel && npm run dev
   
   # Terminal 2: Marketplace
   cd m-place && npm run dev
   ```
6. ✅ Access applications:
   - Admin Panel: http://localhost:3000
   - Marketplace: http://localhost:3001
   - Supabase Studio: http://127.0.0.1:54323

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [MCP Configuration](https://supabase.com/docs/guides/getting-started/mcp)
- [Database Schema](../database/docs/schema.md)
- [RLS Policies](../database/docs/rls-policies.md)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the detailed guides in this directory
3. Check Supabase logs: `supabase logs`
4. Check MCP logs in Kiro UI
