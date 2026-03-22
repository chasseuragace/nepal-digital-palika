# Infrastructure Seeding Overview

**Status:** 🟢 Ready for Production
**Last Updated:** March 18, 2026

---

## What is "Infrastructure"?

**Infrastructure** = The foundational data that the platform NEEDS to operate:
- ✅ Geographic hierarchy (provinces → districts → palikas)
- ✅ Subscription tiers and feature mappings
- ✅ Product category structures
- ✅ Admin user roles and permissions
- ✅ Palika-to-tier assignments

**NOT Infrastructure** = Optional data for testing/visibility:
- ❌ Heritage site content
- ❌ Events and festivals
- ❌ Blog posts
- ❌ Test users and products
- ❌ Comments and interactions

---

## Quick Deploy

```bash
# One-command full platform setup (10-15 min)
./database/scripts/deploy-infrastructure.sh

# Infrastructure only, no demo content (5-7 min)
./database/scripts/deploy-infrastructure.sh --minimal

# Full setup + test data for QA (15-25 min)
./database/scripts/deploy-infrastructure.sh --dev
```

---

## What Gets Seeded

### Phase 1: Geographic Foundation
**Script:** `seed-database.ts`
**Time:** 2-3 minutes
**Data:**
- 7 Provinces (Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim)
- 77 Districts (all Nepal districts with codes)
- 753 Palikas (6 metropolitan, 11 sub-metropolitan, 276 municipalities, 460 rural municipalities)

**Why first:** All other data references palikas. Without this, the system can't function.

### Phase 2: Subscription Tiers & Features
**Script:** `seed-subscription-tiers.ts`
**Time:** 1-2 minutes
**Data:**
- 3 Subscription Tiers (Basic/Tier 1, Tourism/Tier 2, Premium/Tier 3)
- 27 Features mapped to tiers:
  - Registration (self-service, admin creation, verification, custom rules)
  - Contact (direct contact, in-app messaging, analytics, payment integration)
  - QR (digital, print support, analytics)
  - Content (heritage, events, blog, business directory)
  - Emergency (SOS system, service directory, hotline, location search)
  - Analytics (view analytics, dashboard, national aggregation, custom reports)
  - Admin (staff management, approval workflows, audit logging, RBAC)

**Why this matters:** Features are gate-kept by tier. Palikas on Tier 1 see fewer features than Tier 3.

### Phase 3: Category Structures
**Scripts:** `seed-business-categories-direct.ts` + `seed-marketplace-categories-direct.ts`
**Time:** 1-2 minutes
**Data:**
- 8 Business Categories (all tiers):
  - Accommodation, Food & Beverage, Producer, Tour Guide, Professional Service, Artisan Workshop, Transportation, Retail Shop
- 26 Marketplace Categories (tier-gated):
  - Tier 1 (9): Agriculture, Honey, Tea, Dairy, Nuts, Animal Products, Grains, Essentials, Oils
  - Tier 2 (+8): Textiles, Handicrafts, Clothing, Electronics, Beauty, Household, Sports, Books
  - Tier 3 (+9): Luxury, Jewelry, Premium Crafts, Fashion, Art, Consulting, Travel, Wellness, Gourmet

**Why this matters:** Users can only post products in categories their tier allows.

### Phase 4: Admin Users
**Script:** `seed-admin-users.ts`
**Time:** 1 minute
**Data:**
- 1 Super Admin (manages everything)
- 1 Palika Admin (Kathmandu-specific)
- 1 Content Moderator (Kathmandu-specific)

**Why this matters:** Someone needs to be able to create content, moderate discussions, manage approvals.

### Phase 5: Palika-Tier Assignment
**Script:** `enroll-palikas-tiers.ts`
**Time:** < 1 minute
**Data:**
- Palika 1 → Premium (Tier 3)
- Palika 2 → Tourism (Tier 2)
- Palika 3 → Tourism (Tier 2)
- Palika 4 → Basic (Tier 1)

**Why this matters:** Without tier assignments, palikas can't use their features. API enforces tier constraints in RLS.

---

## Optional: Demo Content & Test Data

### Demo Content (Tourism Data)
**Script:** `seed-content.ts`
**When to run:** After Phase 1-5, when you want the platform to look like something
**Time:** 2-3 minutes
**Data:**
- 8 UNESCO World Heritage Sites (Pashupatinath, Boudhanath, Swayambhunath, etc.)
- 8 Major Festivals (Dashain, Tihar, Holi, Buddha Jayanti, etc.)
- 6 Tourism Blog Posts (heritage guide, seasons, festivals, trekking safety, food, sustainability)

**Why optional:** System works without this. But users see empty pages without content.

### Test Data (QA Only)
**Script:** `seed-marketplace-test-data.ts`
**When to run:** In dev/QA environment for testing marketplace features
**Time:** 5-10 minutes
**Data:**
- 8 Test Users (across 4 palikas, different tiers)
- 8 Test Businesses (respecting tier constraints)
- 16 Test Products (marketplace products in valid categories)
- 15 Test Comments (threaded comments with owner replies)

**Why optional & dev-only:** This is synthetic data for QA. Never in production.

---

## Execution Matrix

| Goal | Command | Time | Result |
|------|---------|------|--------|
| **Bare minimum** | `deploy-infrastructure.sh --minimal` | 5-7 min | Deployable platform (no content) |
| **Production ready** | `deploy-infrastructure.sh` | 10-15 min | Deployable with demo content |
| **Development** | `deploy-infrastructure.sh --dev` | 15-25 min | Full setup with test data for QA |
| **Manual control** | Run scripts individually (see below) | Varies | Full control over each phase |

---

## Manual Execution (if preferred)

```bash
# Prerequisites: migrations must be run first
supabase db push

# Phase 1: Geographic Foundation (must run first)
npm run seed:database

# Phase 2: Tiers & Features
npm run seed:tiers

# Phase 3: Categories
npm run seed:business-categories
npm run seed:marketplace-categories

# Phase 4: Admin Users
npm run seed:admin-users

# Phase 5: Palika Tier Assignment
npm run enroll:palikas

# Phase 6 (Optional): Demo Content
npm run seed:content

# Phase 7 (Optional, Dev Only): Test Data
npm run seed:marketplace-test-data
```

---

## What Happens At Each Stage

### After Phase 1 (Geographic)
- ✅ Palikas table is populated
- ❌ Can't assign tiers (tiers don't exist)
- ❌ Can't create admins properly
- ❌ Platform shows "no data" errors

### After Phase 2 (Tiers)
- ✅ Tiers and features defined
- ✅ Feature mapping complete
- ❌ No businesses/products (categories don't exist)
- ❌ Admins can't manage features

### After Phase 3 (Categories)
- ✅ Business directory has categories
- ✅ Marketplace has product categories
- ❌ No one to post content (no admins)
- ❌ Categories not gated by tier

### After Phase 4 (Admin Users)
- ✅ Someone can create content
- ✅ Someone can moderate
- ❌ Admins have no tier limits (tiers not assigned to palikas)

### After Phase 5 (Tier Assignment)
- ✅ RLS policies can enforce tier constraints
- ✅ API can validate "is this user's tier allowed this?"
- ✅ Platform is fully functional
- ❌ Shows empty pages (no content)

### After Phase 6 (Demo Content)
- ✅ Heritage sites visible
- ✅ Events/festivals listed
- ✅ Blog posts available
- ✅ Platform looks complete for demo/stakeholders

### After Phase 7 (Test Data)
- ✅ Marketplace has test products
- ✅ Can test tier constraints
- ✅ Can test tier-gating
- ✅ Ready for QA testing

---

## Infrastructure Checklist

Use this to verify your deployment:

```
Phase 1: Geographic
☐ 7 provinces seeded
☐ 77 districts seeded
☐ 753 palikas seeded

Phase 2: Tiers
☐ 3 subscription tiers seeded
☐ 27 features seeded
☐ Tier-feature mappings created

Phase 3: Categories
☐ 8 business categories seeded
☐ 26 marketplace categories seeded
☐ Marketplace categories have min_tier_level set

Phase 4: Admins
☐ super_admin created and verified
☐ palika_admin created for Kathmandu
☐ moderator created for Kathmandu

Phase 5: Tier Assignment
☐ Palika 1 enrolled in Premium tier
☐ Palika 2 enrolled in Tourism tier
☐ Palika 3 enrolled in Tourism tier
☐ Palika 4 enrolled in Basic tier

Verification
☐ RLS policies enabled and working
☐ Tier constraints enforced
☐ Geographic hierarchy intact
☐ No errors in logs
```

---

## Environment Variables Required

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

These should be in your `.env` file or set as environment variables before running the deploy script.

---

## Troubleshooting

### Error: "Palika not found"
**Cause:** Phase 1 didn't run, or palikas table is empty
**Fix:** Run `npm run seed:database` before other phases

### Error: "Cannot find tier with code 'basic'"
**Cause:** Phase 2 didn't run, or tiers table is empty
**Fix:** Run `npm run seed:tiers` and re-run failing script

### Error: "Cannot find category with slug X"
**Cause:** Phase 3 didn't run
**Fix:** Run both category seeds before proceeding

### Error: "User with email already exists"
**Cause:** Phase 4 ran twice, or admin already exists
**Fix:** This is OK - scripts are idempotent, just re-run. If real issue, delete admin_users row and try again

### Admin users not showing up in platform-admin-panel
**Cause:** User needs to be created in auth.users first (seed-admin-users does this)
**Fix:** Verify admin_users table has entries. If it does but UI shows nothing, check RLS policies

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Run migrations: `supabase db push`
- [ ] Run infrastructure: `./database/scripts/deploy-infrastructure.sh`
- [ ] Verify all phases completed without errors
- [ ] Run RLS validation: `npm run test:rls-policies`
- [ ] Check admin users can log in
- [ ] Verify tier constraints working (try creating product in non-allowed category)
- [ ] Test data should NOT be seeded in production
- [ ] Demo content is optional (recommended for launch)
- [ ] Backup database before production use

---

## Seed Script Reference

| Script | Purpose | Phase | Required | Time |
|--------|---------|-------|----------|------|
| seed-database.ts | Geographic data | 1 | ✅ Yes | 2-3 min |
| seed-subscription-tiers.ts | Tiers + features | 2 | ✅ Yes | 1-2 min |
| seed-business-categories-direct.ts | Business categories | 3 | ✅ Yes | <1 min |
| seed-marketplace-categories-direct.ts | Marketplace categories | 3 | ✅ Yes | <1 min |
| seed-admin-users.ts | Admin users | 4 | ✅ Yes | 1 min |
| enroll-palikas-tiers.ts | Tier assignment | 5 | ✅ Yes | <1 min |
| seed-content.ts | Tourism content | 6 | 🟡 Optional | 2-3 min |
| seed-marketplace-test-data.ts | Test data | 7 | 🔴 Dev only | 5-10 min |
| deploy-infrastructure.sh | Master orchestrator | All | ✅ Recommended | 5-25 min |

---

## Related Documentation

- **SEEDING_STRATEGY.md** - Detailed seeding guide
- **MARKETPLACE_PRODUCT_SCHEMA.md** - Database schema
- **MARKETPLACE_READY_FOR_API.md** - API requirements
- **TESTING_CHECKLIST.md** - Validation procedures

---

**Next Steps:**
1. Review this document
2. Run: `./database/scripts/deploy-infrastructure.sh`
3. Verify with: `npm run test:rls-policies`
4. Start API development!
