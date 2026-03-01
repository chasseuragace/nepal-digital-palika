# Tier-Based Feature Architecture
## Subscription Tiers as Feature Gates for Workflow Decision Points

**Status:** Phase 3 Planning - Strategic Architecture
**Date:** 2026-03-01
**Insight:** The three decision points (business registration, contact model, QR distribution) are not independent technical choices—they are **feature tier gates** that unlock different workflow capabilities for Palikas.

---

## Executive Summary: The Core Reframing

### From "Technical Decisions" → "Tier-Based Features"

What we thought were three independent UI/UX decisions:
1. **Business Registration Model** (self-service vs. admin-created vs. hybrid)
2. **Contact Model** (direct contact vs. platform messaging)
3. **QR Code Distribution** (print vs. digital)

Are actually **feature tier gates** that determine:
- **Which Palikas get which workflows**
- **What capabilities are available at each subscription level**
- **How features scale from Basic → Tourism → Premium tiers**

---

## Part 1: The Business Model's Tier Definition

From **BUSINESS_MODEL.md**, the documented subscription tiers are:

| **Tier** | **Target Palikas** | **Primary Value** | **Key Features** |
|----------|------------------|-------------------|-----------------|
| **Basic Palika Digital Services** | Non-tourism, governance-focused | Citizen services, local governance | SOS, marketplace, notices, directory |
| **Tourism Bundle** | Tourism-focused destinations | Tourism promotion, heritage visibility | Heritage sites, events, QR discovery, media |
| **Premium Bundle** | Analytics-heavy, custom needs | Advanced analytics, integrations | Analytics dashboards, custom integrations |

### Critical Insight from Business Model
**Line 206-240:** "The Platform Unity Advantage"

> Both bundles share the same core platform. **Easy upgrade path between bundles. No system migration needed.**

**This means:**
- A Palika starting with **Basic** can upgrade to **Tourism**
- All existing content preserved
- UI/workflows unlock progressively

---

## Part 2: Decision Points as Tier-Feature Gates

### Decision 1: Business Registration Model → Feature Unlock

**Question:** How should businesses be registered?

The model chosen **determines which tier unlocks it:**

```
BASIC TIER (Non-Tourism Palikas):
├─ Self-Service ENABLED
│  └─ Local producers, artisans register directly
│  └─ Palika reviews from dashboard
│  └─ Market entry for ALL businesses
│
├─ Admin-Created ALWAYS AVAILABLE
│  └─ Palika staff can enter businesses on behalf
│  └─ For less tech-savvy owners
│
└─ Rationale: Basic tier serves governance + local economy
   Non-tourism Palikas need marketplace accessible to all

TOURISM TIER (Tourism-Focused Palikas):
├─ Self-Service ENABLED (inherited from Basic)
│
├─ Admin-Created ENABLED (inherited from Basic)
│
├─ **PLUS: Verification Workflow Feature**
│  └─ Quality gates for heritage/accommodation businesses
│  └─ Tourism officer approval required
│  └─ Featured/promoted listings
│
└─ Rationale: Tourism tier layers verification on top
   Ensures heritage sites, homestays meet tourism standards

PREMIUM TIER:
├─ All above
│
├─ **PLUS: Custom Verification Rules**
│  └─ Per-Palika verification workflows
│  └─ Custom approval chains
│  └─ Integration with external verification systems
│
└─ Rationale: Premium supports complex governance needs
```

### Decision 2: Contact Model → Feature Unlock

**Question:** How do tourists/customers contact businesses?

```
BASIC TIER:
├─ Direct Contact ENABLED
│  ├─ Phone button
│  ├─ Email button
│  ├─ WhatsApp button
│  └─ No commission (direct transaction)
│
└─ Rationale: Basic tier maximizes producer income
   No platform intermediary
   Governance goal = support local economy

TOURISM TIER:
├─ Direct Contact ENABLED (inherited)
│
├─ **PLUS: In-App Messaging (Optional)**
│  ├─ Optional secure messaging system
│  ├─ Tourism businesses may prefer protected inbox
│  ├─ Spam filtering included
│  ├─ Message history tracking
│  └─ Analytics on inquiry sources
│
└─ Rationale: Tourism tier adds safety/analytics
   Tourists feel safer with in-app vs. exposing phone
   Businesses get inquiry insights

PREMIUM TIER:
├─ All above
│
├─ **PLUS: Messaging with Commission Model**
│  ├─ Optional transaction facilitation
│  ├─ Booking integration with payment
│  ├─ Tiered commission (0-5%)
│  └─ Dispute resolution
│
└─ Rationale: Premium supports full-stack transactions
   For Palikas wanting to monetize platform
```

### Decision 3: QR Code Distribution → Feature Unlock

**Question:** How are QR codes shared and printed?

```
BASIC TIER:
├─ Digital QR Codes ENABLED
│  ├─ Generate QR per business
│  ├─ Download as PNG
│  ├─ Email/WhatsApp share
│  └─ Embedded on business listing page
│
└─ Rationale: Basic tier supports digital discovery
   Low cost, instant distribution
   Works for producer markets, local shopping

TOURISM TIER:
├─ Digital QR ENABLED (inherited)
│
├─ **PLUS: Print Support & Physical Distribution**
│  ├─ Print-ready PDF generation
│  ├─ QR + branding/Palika logo
│  ├─ Poster templates (A3, A4, flyer sizes)
│  ├─ Bulk download for printing
│  ├─ Tourism board printing partnerships
│  └─ Physical signage at heritage sites
│
└─ Rationale: Tourism tier supports on-site discovery
   Tourists scan QR at heritage sites, hotels, restaurants
   Physical presence = tourism revenue

PREMIUM TIER:
├─ All above
│
├─ **PLUS: QR Code Analytics**
│  ├─ Track QR scans per location
│  ├─ Geographic heatmaps (where scanned)
│  ├─ Device/OS analytics
│  ├─ Time-of-day patterns
│  └─ Seasonal trending
│
└─ Rationale: Premium supports advanced analytics
   Tourism marketing insights
   Palika can optimize placement/timing
```

---

## Part 3: Tier Definition & Feature Mapping

### Complete Feature Matrix by Tier

| **Feature Category** | **Basic** | **Tourism** | **Premium** |
|---|:---:|:---:|:---:|
| **Business Registration** | | | |
| Self-service registration | ✅ | ✅ | ✅ |
| Admin-created on behalf | ✅ | ✅ | ✅ |
| Verification workflow | ❌ | ✅ | ✅ |
| Custom approval chains | ❌ | ❌ | ✅ |
| **Contact & Discovery** | | | |
| Direct contact (phone/email) | ✅ | ✅ | ✅ |
| In-app messaging | ❌ | ✅ | ✅ |
| Message analytics | ❌ | ✅ | ✅ |
| Payment integration | ❌ | ❌ | ✅ |
| **QR Codes** | | | |
| Digital QR generation | ✅ | ✅ | ✅ |
| Print-ready templates | ❌ | ✅ | ✅ |
| QR scan analytics | ❌ | ❌ | ✅ |
| **Content Management** | | | |
| Local businesses | ✅ | ✅ | ✅ |
| Heritage sites | ⚠️ Basic | ✅ Full | ✅ Full |
| Events calendar | ⚠️ Basic | ✅ Full | ✅ Full |
| Blog/narratives | ⚠️ Basic | ✅ Full | ✅ Full |
| **SOS/Emergency** | | | |
| SOS request system | ✅ | ✅ | ✅ |
| Service directory | ✅ | ✅ | ✅ |
| Hotline integration | ✅ | ✅ | ✅ |
| Advanced location search | ❌ | ✅ | ✅ |
| **Analytics** | | | |
| Basic view counts | ✅ | ✅ | ✅ |
| Palika-level dashboards | ❌ | ✅ | ✅ |
| National aggregation | ❌ | ✅ | ✅ |
| Custom reports | ❌ | ❌ | ✅ |
| **Admin Features** | | | |
| Palika staff management | ✅ | ✅ | ✅ |
| Approval workflows | ✅ | ✅ | ✅ |
| Audit logging | ✅ | ✅ | ✅ |
| Role-based access control | ✅ | ✅ | ✅ |

---

## Part 4: Database Schema for Tier & Feature Management

### New Tables Needed

```sql
-- Tier definitions
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'basic', 'tourism', 'premium'
  display_name VARCHAR(100) NOT NULL, -- "Basic Palika Digital Services"
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature definitions
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- 'self_service_registration', 'in_app_messaging', etc.
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'registration', 'contact', 'qr', 'content', 'analytics'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tier ↔ Feature mapping
CREATE TABLE IF NOT EXISTS public.tier_features (
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  unlocked_at_version VARCHAR(20), -- Which tier version unlocks this
  PRIMARY KEY (tier_id, feature_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Palika subscription assignment (updated)
ALTER TABLE public.palikas ADD COLUMN IF NOT EXISTS
  subscription_tier_id UUID REFERENCES public.subscription_tiers(id);

-- Tier assignment history (audit trail)
CREATE TABLE IF NOT EXISTS public.tier_assignment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palika_id UUID NOT NULL REFERENCES public.palikas(id),
  old_tier_id UUID REFERENCES public.subscription_tiers(id),
  new_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  assigned_by UUID REFERENCES public.admin_users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Palika Feature Access Function

```sql
-- Check if Palika has access to feature
CREATE OR REPLACE FUNCTION palika_has_feature(
  p_palika_id UUID,
  p_feature_code VARCHAR
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.tier_features tf
    JOIN public.features f ON tf.feature_id = f.id
    JOIN public.palikas p ON p.subscription_tier_id = tf.tier_id
    WHERE p.id = p_palika_id
      AND f.code = p_feature_code
      AND tf.enabled = true
      AND f.is_active = true
  ) INTO v_has_feature;

  RETURN COALESCE(v_has_feature, false);
END;
$$;
```

---

## Part 5: RLS Policies for Tier-Based Features

### Content Registration Policy

```sql
-- Heritage sites / Events / Businesses registration
-- Different rules based on tier

CREATE POLICY "tier_based_registration_create" ON public.heritage_sites
  FOR INSERT
  WITH CHECK (
    -- If Palika has 'self_service_registration' feature:
    CASE
      WHEN palika_has_feature(palika_id, 'self_service_registration')
        THEN auth.uid() = created_by  -- Citizen can create own
      ELSE
        auth.uid() IN (  -- Only Palika staff can create
          SELECT id FROM public.admin_users
          WHERE palika_id = heritage_sites.palika_id
        )
    END
  );
```

### Contact Model Policy

```sql
-- Routes inquiry through messaging or direct contact
-- Based on tier

CREATE POLICY "contact_routing" ON public.businesses
  FOR SELECT
  USING (
    status = 'published' AND (
      CASE
        WHEN palika_has_feature(palika_id, 'in_app_messaging')
          THEN TRUE  -- Show messaging UI
        ELSE
          TRUE  -- Show direct contact buttons
      END
    )
  );
```

### QR Code Generation Policy

```sql
-- Generates QR codes in print format if tier supports it
-- Function-level enforcement

CREATE OR REPLACE FUNCTION generate_business_qr(
  p_business_id UUID,
  p_format VARCHAR -- 'digital' | 'print_poster' | 'print_card'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_palika_id UUID;
  v_feature_required VARCHAR;
BEGIN
  SELECT palika_id INTO v_palika_id FROM public.businesses WHERE id = p_business_id;

  v_feature_required := CASE p_format
    WHEN 'digital' THEN 'qr_digital_generation'
    WHEN 'print_poster' THEN 'qr_print_support'
    WHEN 'print_card' THEN 'qr_print_support'
    ELSE 'qr_digital_generation'
  END;

  IF NOT palika_has_feature(v_palika_id, v_feature_required) THEN
    RAISE EXCEPTION 'Tier does not support % format', p_format;
  END IF;

  -- Generate QR...
END;
$$;
```

---

## Part 6: Domains of Concern Evolution

Looking at **mindstate.json** and project evolution:

### Phase 1: Admin Infrastructure (Completed)
**Domain of Concern:** Geographic hierarchy, role-based access control
- **Focus:** How to enable hierarchical admins (National→Province→District→Palika)
- **Problem:** Row-Level Security policies, audit logging, permission inheritance
- **Result:** 17 migrations, 250/255 tests passing, fully deterministic access control

### Phase 2: Business Concern Validation (Completed)
**Domain of Concern:** Business model fulfillment, feature completeness
- **Focus:** Do we fulfill the stated business requirements?
- **Problem:** Subscription tiers vs. feature sets, multi-tenant isolation, cost justification
- **Result:** 216 acceptance tests (all passing), business model mapped to database

### Phase 3: User Workflow Implementation (Starting)
**Domain of Concern:** Citizen/user experience, feature tier gates
- **Focus:** **Which workflows apply to which tier?**
- **Problem:** How do decision points become feature unlocks?
- **Bridge:** Tier definitions map business strategy to technical implementation
- **Upcoming:** UI tier assignment, feature-gated workflows, tiered pricing dashboards

### Phase 3+: Operations & Monetization (Future)
**Domain of Concern:** Subscription lifecycle, tier upgrades, analytics
- **Focus:** How do Palikas upgrade? How do we manage lifecycle?
- **Problem:** Tier transitions, data migration, billing integration
- **Requirement:** Tier assignment UI, upgrade workflows, cost tracking

---

## Part 7: Strategic UI for Tier Management

### Critical Requirement: Tier Assignment Dashboard

This is the **single point of control** for enabling/disabling features across the system:

```
SUPER ADMIN INTERFACE
═══════════════════════

1. Tier Management Screen
   ├─ View all tiers (Basic, Tourism, Premium)
   ├─ Edit tier definitions
   ├─ Manage features in each tier
   └─ View tier adoption stats (X Palikas on Basic, Y on Tourism)

2. Palika Assignment Screen
   ├─ List all 753 Palikas
   ├─ Column: Current Tier (dropdown)
   ├─ Column: Assigned Date
   ├─ Bulk assign tiers to multiple Palikas
   ├─ Filter by tier, region, province
   └─ See tier upgrade path (Basic → Tourism option available)

3. Feature Visibility Screen
   ├─ View which features are enabled per tier
   ├─ Enable/disable features without rebuilding code
   ├─ See feature impact (X Palikas affected)
   └─ Feature rollout timeline (beta features)

4. Tier Analytics Screen
   ├─ Adoption curve (how many Palikas per tier over time)
   ├─ Feature usage by tier
   ├─ Cost per tier model
   └─ Revenue forecasting
```

### UI Flow: Assigning Tier to Palika

```
1. Open "Palikas" admin section
2. Find "Kathmandu Metropolitan"
3. Click "Edit"
4. Current: Basic Palika Digital Services
5. Change to: Tourism Bundle
6. System shows:
   ✅ Features that will be unlocked:
   - Verification workflow for heritage sites
   - In-app messaging (optional)
   - Print-ready QR codes
   - Tourism content management (enhanced)

7. Show upgrade cost:
   Current: NPR 50,000/year
   New: NPR 150,000/year

8. Save & log to tier_assignment_log
9. Trigger tier migration:
   - Update subscription_tier_id
   - Enable new features in UI
   - Run onboarding for new features
   - Notify Palika staff
```

---

## Part 8: Implementation Roadmap

### Week 1: Schema & Tier Definition
- [ ] Create subscription_tiers table
- [ ] Create features table
- [ ] Create tier_features mapping table
- [ ] Create tier_assignment_log
- [ ] Seed basic/tourism/premium tier definitions
- [ ] Seed all 40+ features with categories

### Week 2: RLS & Feature Enforcement
- [ ] Create palika_has_feature() function
- [ ] Update all content policies to check tiers
- [ ] Update contact routing policies
- [ ] Update QR code generation to check tiers
- [ ] Write 30+ tests for tier-based access

### Week 3: Tier Management UI
- [ ] Build tier assignment dashboard
- [ ] Build feature management interface
- [ ] Build tier analytics dashboard
- [ ] Implement bulk tier assignment
- [ ] Add tier upgrade notifications

### Week 4: Feature UI Gating
- [ ] Business registration form shows/hides based on tier
- [ ] Contact section shows messaging only if tier enables
- [ ] QR generation offers print only if tier enables
- [ ] Analytics dashboard has tier-specific views

---

## Part 9: Key Questions Answered

### Q1: "Does the business document talk about subscription tiers?"
✅ **YES** - Sections 4-8 of BUSINESS_MODEL.md:
- Basic Palika Digital Services Bundle
- Tourism Portal Bundle
- Premium Bundle (conceptual)
- Each with clearly defined features

### Q2: "Do they align with the thought process we're in right now?"
✅ **PERFECTLY** - The three decision points map exactly:
- **Business Registration Model** → Authentication/verification tier gate
- **Contact Model** → Messaging infrastructure tier gate
- **QR Distribution** → Print support tier gate

### Q3: "What about multi-tenancy and hierarchy?"
✅ **TIER APPLIES TO PALIKA LEVEL:**
- National admin assigns tier to each Palika
- Palika staff can't change their own tier
- Tier determines what features are available
- RLS policies enforce tier-based access at database level
- Hierarchical admins (district, province) can view/analyze but not override tier

### Q4: "Who does the tier apply to?"
**Multi-layered:**
1. **Palika receives tier subscription** - determines budget, features available
2. **Palika staff get tier-unlocked workflows** - what they can do (verification, approval)
3. **Citizens/business owners get tier-unlocked capabilities** - can they self-register, use messaging
4. **Tourists/public get tier-unlocked discovery** - can they see QR codes, use messaging

---

## Conclusion

The three decision points are not independent UI choices. They are **strategic feature gates** that operationalize the business model.

**By implementing tier-based feature architecture, we:**
1. ✅ Align technical implementation with business strategy
2. ✅ Create clear upgrade paths for Palikas (Basic → Tourism → Premium)
3. ✅ Enable transparent, auditable feature delivery
4. ✅ Support both tourism and non-tourism Palikas effectively
5. ✅ Create a monetization framework (different tier pricing)
6. ✅ Make feature rollout non-destructive (disable without code changes)

**Next Step:** Build tier assignment UI first, then gate features behind tier checks.

