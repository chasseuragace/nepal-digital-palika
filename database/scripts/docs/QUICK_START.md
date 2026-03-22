# Quick Start Guide

## Prerequisites

- Supabase CLI installed
- Node.js and npm installed
- Database migrations applied

## 5-Minute Setup

### 1. Start Supabase
```bash
supabase start
```

### 2. Reset Database
```bash
supabase db reset
```

### 3. Run Seeding Pipeline
```bash
bash session-2026-03-21/run-seeds.sh
```

### 4. Verify Setup
```bash
bash session-2026-03-21/verify-setup.sh
```

Done! Your database is now seeded with test data.

---

## What Gets Created

### Infrastructure
- 3 subscription tiers (Basic, Tourism, Premium)
- 27 platform features
- 96 business type categories
- 26 marketplace categories

### Admin Users
- 1 Super Admin
- 2 Palika Admins (Kathmandu, Bhaktapur)
- 2 Content Moderators

### Test Data
- 5 palikas with tier assignments
- 8 test users
- 8 businesses
- 16 marketplace products
- 24 threaded comments

---

## Test Credentials

```
Super Admin:
  Email: superadmin@nepaltourism.dev
  Password: SuperSecurePass123!

Kathmandu Admin:
  Email: palika.admin@kathmandu.gov.np
  Password: KathmanduAdmin456!

Bhaktapur Admin:
  Email: palika.admin@bhaktapur.gov.np
  Password: BhaktapurAdmin456!

Test Users:
  Email: [name]@test.com
  Password: TestPassword123!@#
```

---

## Next Steps

1. Start development servers:
   ```bash
   cd admin-panel && npm run dev
   cd m-place && npm run dev
   ```

2. Access applications:
   - Admin Panel: http://localhost:3000
   - Marketplace: http://localhost:3001
   - Supabase Studio: http://127.0.0.1:54323

3. Log in with test credentials

---

## Troubleshooting

### Supabase won't start
```bash
supabase stop
supabase start
```

### Database reset fails
```bash
supabase db reset --debug
```

### Seeding fails
```bash
cd database
npm install
npx ts-node scripts/seed-subscription-tiers.ts
```

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
