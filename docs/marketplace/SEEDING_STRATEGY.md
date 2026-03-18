# Database Seeding Strategy - First-Time Platform Startup

**Status:** 🟢 Complete & Ready for Production
**Last Updated:** March 18, 2026
**Applies To:** Nepal Digital Tourism Platform v1.0+

---

## Executive Summary

This guide shows exactly which seed scripts to run, in what order, and why. The platform requires **3 critical seed scripts** to function, plus 1 optional content script and 1 test-only script.

**Total execution time:** ~12-20 minutes depending on data volume

---

## 📋 All Seed Scripts Summary

| Script | Purpose | Priority | Status | Run When | Dependencies |
|--------|---------|----------|--------|----------|--------------|
| **seed-subscription-tiers.ts** | Seeds 3 tiers + 27 features | 🔴 CRITICAL | ✅ Working | First | None |
| **seed-business-categories-direct.ts** | Seeds 8 business categories | 🔴 CRITICAL | ✅ Working | First | None |
| **seed-marketplace-categories-direct.ts** | Seeds 26 marketplace categories | 🔴 CRITICAL | ✅ Working | First | subscription_tiers |
| **seed-admin-users.ts** | Seeds 3 admin users | 🟠 IMPORTANT | ✅ Working | Second | palikas table (migrations) |
| **seed-content.ts** | Seeds heritage sites + events + blogs | 🟠 IMPORTANT | ✅ Working | Third | admin_users + categories |
| **seed-marketplace-test-data.ts** | Seeds test users/businesses/products | 🟢 TEST-ONLY | ✅ Working | Last (QA only) | Auth system + all seeds |
| **seed-database.ts** | Master orchestrator (guidance script) | 🟡 INFORMATIONAL | ✅ Complete | Manual | Schema setup guidance |
| **seed-marketplace-categories.ts** | Original version (BROKEN) | 🔵 DEPRECATED | ❌ Broken | NEVER | Use -direct version |

---

## 🚀 Phase 1: Foundation Tiers & Categories (Run First)

### What to Run
```bash
npm run seed:tiers
npm run seed:business-categories
npm run seed:marketplace-categories
```

### What Gets Created

#### 1. Subscription Tiers (3 total)
| Tier | Display Name | Annual Cost | Primary Use Case |
|------|-------------|-------------|-----------------|
| basic | Basic | 500,000 NPR | Local government + small businesses |
| tourism | Tourism | 150,000 NPR | Heritage sites + tourism businesses |
| premium | Premium | 250,000 NPR | Large enterprises + analytics |

#### 2. Features (27 total, mapped by tier)

**Tier 1 (Basic): 10 Features**
- self_service_registration
- admin_creation
- direct_contact
- digital_qr
- heritage_content
- events_content
- blog_content
- business_directory
- view_analytics
- staff_management

**Tier 2 (Tourism): +9 Additional Features**
- verification_workflow
- in_app_messaging
- message_analytics
- payment_integration
- qr_print_support
- qr_analytics
- sos_system
- service_directory
- hotline_support
- dashboard_analytics
- approval_workflows
- audit_logging
- rbac_management
- location_search
- custom_rules

**Tier 3 (Premium): All 27 Features**
- All of above +
- national_aggregation
- custom_reports

#### 3. Business Categories (8 total)
```
1. Accommodation          5. Professional Service
2. Food & Beverage       6. Artisan Workshop
3. Producer              7. Transportation
4. Tour Guide            8. Retail Shop
```

#### 4. Marketplace Categories (26 total, tier-gated)

**Tier 1: 9 Categories**
- Agriculture & Vegetables
- Honey & Bee Products
- Tea & Spices
- Dairy & Milk Products
- Nuts & Seeds
- Animal Products
- Grains & Cereals
- Essential Goods
- Oils & Fats

**Tier 2: +8 Additional Categories**
- Textiles & Fabrics
- Handicrafts
- Clothing & Fashion
- Electronics & Gadgets
- Beauty & Wellness
- Household Goods
- Sports & Outdoor
- Books & Educational

**Tier 3: +9 Additional Categories**
- Luxury Goods
- Jewelry & Gems
- Premium Crafts
- Premium Fashion
- Art & Antiques
- Consulting Services
- Premium Travel
- Wellness Services
- Gourmet Food

### Why This Order?
- No database dependencies - all can run simultaneously if needed
- Establishes foundation for tier-based feature gating
- Business categories needed for `/businesses` endpoints
- Marketplace categories needed for product listing
- Tier architecture is prerequisite for all other seeding

### Idempotency
✅ **Fully idempotent** - Safe to re-run multiple times
- Uses `.upsert(..., { onConflict: 'name' })`
- Duplicate seeds will update existing records
- No data loss on re-run

---

## 🔐 Phase 2: Administrative Users (Run Second)

### What to Run
```bash
npm run seed:admin-users
```

### What Gets Created
| Email | Role | Password | Access | Palika |
|-------|------|----------|--------|--------|
| superadmin@nepaltourism.dev | super_admin | SuperSecurePass123! | All features, all palikas | — |
| palika.admin@kathmandu.gov.np | palika_admin | KathmanduAdmin456! | Kathmandu palika only | Kathmandu |
| content.moderator@kathmandu.gov.np | moderator | ModeratorSecure789! | Content moderation only | Kathmandu |

### Dependencies
- ✅ Palikas table must exist (created by migrations)
- ✅ Subscription tiers optional (used for feature visibility)

### Important Notes
- ⚠️ Credentials are printed to console - **SAVE THEM**
- ⚠️ Currently hardcoded to create only in Kathmandu palika
- 💡 For multi-palika admin setup, use platform admin panel instead

### Idempotency
✅ **Fully idempotent** - Uses `.upsert(..., { onConflict: 'id' })`
- Re-running updates existing admin profiles
- Safe to run multiple times

---

## 📝 Phase 3: Demo Content (Run Third - Recommended)

### What to Run
```bash
npm run seed:content
```

### What Gets Created

#### 8 Heritage Sites
1. Pashupatinath Temple (Sacred Hindu temple)
2. Boudhanath Stupa (Buddhist pilgrimage)
3. Swayambhunath/Monkey Temple (Ancient complex)
4. Kathmandu Durbar Square (Royal palace)
5. Patan Durbar Square (Medieval architecture)
6. Bhaktapur Durbar Square (Living museum)
7. Lumbini (Buddha's birthplace)
8. Changu Narayan Temple (Oldest Hindu temple)

#### 8 Major Events/Festivals
1. Dashain Festival (Oct, 15 days)
2. Tihar Festival (Nov, 5 days)
3. Buddha Jayanti (May)
4. Holi Festival (Mar, 2 days)
5. Indra Jatra (Sep, 8 days)
6. Everest Marathon (May)
7. Pokhara Street Festival (Dec, 3 days)
8. Nepal Food Festival (Jan, 5 days)

#### 6 Blog Posts
1. Ultimate Guide to Nepal's World Heritage Sites
2. Best Time to Visit Nepal: Season by Season Guide
3. Nepal Festival Calendar 2025-2026
4. Trekking Safety in Nepal: Essential Tips
5. Taste of Nepal: Traditional Food Guide
6. Sustainable Tourism in Nepal

### Dependencies
- ✅ Admin users must exist (as author of blog posts)
- ✅ Categories table must exist
- ✅ Palikas table must exist

### Important Notes
- Blog posts use the first available admin user as author
- Content available in both English (name_en) and Nepali (name_ne)
- All content marked as published (status: 'published')

### Why This Is Important (But Optional)
- ✅ Makes platform useful to demo to stakeholders
- ✅ Provides example tourism content for UI testing
- ✅ System functions without it (shows empty pages)
- ⚠️ Can be skipped in development to speed setup

### Idempotency
✅ **Fully idempotent** - Uses `.upsert(..., { onConflict: 'slug' })`
- Re-running updates existing content
- Safe to run multiple times

---

## 🧪 Phase 4: Test Data (Run Last - Development/QA Only)

### ⚠️ DO NOT RUN IN PRODUCTION

### What to Run
```bash
npm run seed:marketplace-test-data
```

### What Gets Created

#### 8 Test Users Across 4 Palikas
| Palika | Tier | Users | Business Type |
|--------|------|-------|---------------|
| Palika 1 | Tier 3 (Premium) | 2 | Accommodation, Producer |
| Palika 2 | Tier 2 (Tourism) | 2 | Tour Guide, Artisan |
| Palika 3 | Tier 2 (Tourism) | 2 | Food & Beverage, Artisan |
| Palika 4 | Tier 1 (Basic) | 2 | Producer, Retail |

#### 8 Test Businesses
- 1 per user
- Respecting business category constraints
- Pre-verified and active

#### 16 Test Products
- 2 per business
- Respecting tier-gated category constraints
- All published status

#### 15 Threaded Comments
- 3-5 products have comments
- Include owner replies (is_owner_reply: true)
- Show nested threading (parent_comment_id)

### Dependencies
- ✅ All Phase 1-3 seeds must complete first
- ✅ Auth system must be accessible
- ✅ Profiles table must exist

### Important Notes
- Uses auth.admin.createUser() for auth users
- Handles existing users gracefully (continues if already exists)
- Uses randomUUID() for business/product IDs
- Tier constraints are validated (won't create Tier 3 products for Tier 1 users)

### Idempotency
❌ **NOT idempotent** - Uses `.insert()` with unique IDs
- Re-running will fail with duplicate key errors
- For reset: Drop and recreate database, then re-run Phase 1-3

---

## 🔄 Complete Execution Sequence

### For Fresh Development Environment
```bash
# 1. Ensure migrations have run
supabase db push

# 2. Phase 1: Foundation (5 minutes)
npm run seed:tiers
npm run seed:business-categories
npm run seed:marketplace-categories

# 3. Phase 2: Admin Users (2 minutes)
npm run seed:admin-users
# ⚠️ SAVE THE PRINTED CREDENTIALS

# 4. Phase 3: Content (3 minutes)
npm run seed:content

# 5. (Optional) Verify setup
npm run test:rls-policies
npm run verify:marketplace-setup

# Total: ~10 minutes
```

### For Development with Test Data
```bash
# Steps 1-4 above, then:

# 6. Phase 4: Test Data (5 minutes)
npm run seed:marketplace-test-data

# 7. Verify test data
npm run test:rls-policies

# Total: ~15 minutes
```

### For Production Deployment
```bash
# Steps 1-3 above ONLY
# SKIP Phase 3 (content) if not needed
# NEVER run Phase 4 (test data)

# Total: ~5-7 minutes
```

---

## ✅ Verification After Seeding

### Quick Health Check
```bash
npm run verify:marketplace-setup
```

Should show:
- ✅ 3 subscription tiers
- ✅ 8 business categories
- ✅ 26 marketplace categories
- ✅ 4 palikas enrolled in tiers
- ✅ RLS policies enabled

### Test RLS Policies
```bash
npm run test:rls-policies
```

Should pass 10/10 tests:
- ✅ Tier access validation
- ✅ Palika immutability
- ✅ RLS policies enabled
- ✅ Subscription tier mapping

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module 'seed-admin-users'"
**Cause:** seed-database.ts imports seedAdminUsers but it's not exported
**Fix:** Run `npm run seed:admin-users` directly instead of via seed-database.ts

### Issue: "ON CONFLICT constraint mismatch" when seeding categories
**Cause:** Using old seed-marketplace-categories.ts instead of -direct version
**Fix:** NEVER run seed-marketplace-categories.ts
```bash
# ❌ WRONG
npm run seed:categories

# ✅ RIGHT
npm run seed:marketplace-categories  # This runs the -direct version
```

### Issue: "Palika not found" when seeding admin users
**Cause:** Geographic data not seeded (palikas table empty)
**Fix:** Ensure migrations have run: `supabase db push`

### Issue: "No admin users found" when seeding content
**Cause:** Phase 2 skipped or failed
**Fix:** Re-run `npm run seed:admin-users` before seeding content

### Issue: "User with this email already exists" with test data
**Cause:** Test data script ran twice, or auth users already exist
**Fix:** This is normal - script continues gracefully. No action needed.

### Issue: Test data products show fewer than expected
**Cause:** Tier constraint validation skipped products
**Fix:** Verify tier mappings are correct in seed script

---

## 📊 Database State After Each Phase

| Component | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-----------|---------|---------|---------|---------|
| Subscription Tiers | ✅ 3 | ✅ 3 | ✅ 3 | ✅ 3 |
| Features | ✅ 27 | ✅ 27 | ✅ 27 | ✅ 27 |
| Tier→Feature Maps | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Business Categories | ✅ 8 | ✅ 8 | ✅ 8 | ✅ 8 |
| Marketplace Categories | ✅ 26 | ✅ 26 | ✅ 26 | ✅ 26 |
| Admin Users | ❌ No | ✅ 3 | ✅ 3 | ✅ 3 |
| Heritage Sites | ❌ No | ❌ No | ✅ 8 | ✅ 8 |
| Events | ❌ No | ❌ No | ✅ 8 | ✅ 8 |
| Blog Posts | ❌ No | ❌ No | ✅ 6 | ✅ 6 |
| Test Users | ❌ No | ❌ No | ❌ No | ✅ 8 |
| Test Businesses | ❌ No | ❌ No | ❌ No | ✅ 8 |
| Test Products | ❌ No | ❌ No | ❌ No | ✅ 16 |
| Test Comments | ❌ No | ❌ No | ❌ No | ✅ 15 |

---

## 🔒 Security Notes

### For Development
- All default passwords printed to console
- OK for dev/staging
- Change immediately before production

### For Production
- Use strong, unique admin passwords
- Store credentials in secure vault (not console)
- Consider environment variables: `.env.local`
- Audit who has super_admin access
- Implement SSO/OAuth if possible

---

## 📚 Related Documentation

- **MARKETPLACE_PRODUCT_SCHEMA.md** - Database schema details
- **MARKETPLACE_READY_FOR_API.md** - API implementation guide
- **TESTING_CHECKLIST.md** - Validation procedures
- **MARKETPLACE_TECHNICAL_DEBT.md** - Future enhancements

---

## ✨ Summary

**Minimum viable startup:**
```bash
npm run seed:tiers && npm run seed:business-categories && npm run seed:marketplace-categories && npm run seed:admin-users
```
**Time:** ~5 minutes
**Result:** Fully functional platform ready for API development

**Recommended startup (with demo content):**
```bash
npm run seed:tiers && npm run seed:business-categories && npm run seed:marketplace-categories && npm run seed:admin-users && npm run seed:content
```
**Time:** ~10 minutes
**Result:** Fully functional platform with demo content for stakeholders

**Full development setup (with test data):**
```bash
npm run seed:tiers && npm run seed:business-categories && npm run seed:marketplace-categories && npm run seed:admin-users && npm run seed:content && npm run seed:marketplace-test-data
```
**Time:** ~15-20 minutes
**Result:** Full platform with test data ready for QA

---

**Last Updated:** March 18, 2026
**Next Review:** After API development phase completes
