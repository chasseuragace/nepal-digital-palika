-- Seed: Subscription Tiers and Feature Definitions
-- Created: 2026-03-01
-- Purpose: Define the feature tiers and map features to each tier

-- ============================================================
-- TIER DEFINITIONS
-- ============================================================

-- Delete existing if reseeding
DELETE FROM public.tier_features;
DELETE FROM public.features;
DELETE FROM public.subscription_tiers;

-- Insert subscription tiers
INSERT INTO public.subscription_tiers (
  name,
  display_name,
  description,
  sort_order,
  cost_per_month,
  cost_per_year,
  is_active
) VALUES
  (
    'basic',
    'Basic Palika Digital Services',
    'Citizen services, local governance, and local marketplace. For non-tourism or emerging Palikas.',
    1,
    4166.67,  -- ~NPR 500,000/year
    50000.00,
    true
  ),
  (
    'tourism',
    'Tourism Portal Bundle',
    'Heritage sites, tourism content, QR discovery, and enhanced features. For tourism-focused Palikas.',
    2,
    12500.00,  -- ~NPR 150,000/year
    150000.00,
    true
  ),
  (
    'premium',
    'Premium Bundle',
    'Advanced analytics, custom integrations, and enterprise features. For analytics-heavy and custom needs.',
    3,
    20833.33,  -- ~NPR 250,000/year
    250000.00,
    true
  );

-- ============================================================
-- FEATURE DEFINITIONS
-- ============================================================

-- Registration Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'self_service_registration',
    'Self-Service Business Registration',
    'Allows business owners to register themselves without Palika staff intervention',
    'registration',
    true
  ),
  (
    'admin_business_creation',
    'Admin-Created Business Listings',
    'Allows Palika staff to create business listings on behalf of owners',
    'registration',
    true
  ),
  (
    'verification_workflow',
    'Business Verification Workflow',
    'Adds approval/review step before business becomes visible to public',
    'registration',
    true
  ),
  (
    'custom_verification_rules',
    'Custom Verification Rules',
    'Allows Palika to define custom approval chains and verification requirements',
    'registration',
    true
  );

-- Contact & Communication Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'direct_contact_buttons',
    'Direct Contact (Phone/Email)',
    'Display phone, email, and WhatsApp buttons for direct citizen contact',
    'contact',
    true
  ),
  (
    'in_app_messaging',
    'In-App Messaging System',
    'Secure messaging platform between tourists/citizens and business owners',
    'contact',
    true
  ),
  (
    'message_analytics',
    'Messaging Analytics',
    'Track message sources, response times, and inquiry patterns',
    'contact',
    true
  ),
  (
    'payment_integration',
    'Payment Integration',
    'Support for bookings and transactions through platform',
    'contact',
    true
  );

-- QR Code Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'qr_digital_generation',
    'Digital QR Code Generation',
    'Generate and download QR codes as PNG files',
    'qr',
    true
  ),
  (
    'qr_print_support',
    'Print-Ready QR Code Templates',
    'Generate print-ready PDFs with branding, posters, and signage templates',
    'qr',
    true
  ),
  (
    'qr_scan_analytics',
    'QR Scan Analytics',
    'Track QR code scans, locations, devices, and geographic heatmaps',
    'qr',
    true
  );

-- Content Management Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'heritage_site_management',
    'Heritage Site Management',
    'Create, edit, and manage heritage site listings',
    'content',
    true
  ),
  (
    'event_calendar',
    'Event Calendar Management',
    'Manage festivals and events with scheduling',
    'content',
    true
  ),
  (
    'blog_narratives',
    'Blog and Narrative Content',
    'Publish stories, articles, and cultural narratives',
    'content',
    true
  ),
  (
    'business_directory',
    'Local Business Directory',
    'Local marketplace with businesses, producers, and services',
    'content',
    true
  );

-- Emergency & SOS Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'sos_system',
    'SOS Emergency System',
    'Emergency request system with status tracking',
    'emergency',
    true
  ),
  (
    'service_directory',
    'Emergency Service Directory',
    'Directory of hospitals, pharmacies, police, fire services',
    'emergency',
    true
  ),
  (
    'hotline_integration',
    'Hotline Integration',
    'Integration with emergency hotlines (102, 100, 101)',
    'emergency',
    true
  ),
  (
    'advanced_location_search',
    'Advanced Location-Based Search',
    'Find services by distance, availability, and specialization',
    'emergency',
    true
  );

-- Analytics Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'view_count_tracking',
    'View Count Tracking',
    'Track views on content listings',
    'analytics',
    true
  ),
  (
    'palika_level_dashboard',
    'Palika-Level Analytics Dashboard',
    'Dashboards for Palika staff to see local metrics',
    'analytics',
    true
  ),
  (
    'national_aggregation',
    'National Aggregation Analytics',
    'National-level aggregation across all Palikas',
    'analytics',
    true
  ),
  (
    'custom_reports',
    'Custom Report Generation',
    'Generate custom reports and export data',
    'analytics',
    true
  );

-- Admin Features
INSERT INTO public.features (
  code,
  display_name,
  description,
  category,
  is_active
) VALUES
  (
    'staff_management',
    'Palika Staff Management',
    'Manage staff roles and permissions',
    'admin',
    true
  ),
  (
    'approval_workflows',
    'Approval Workflows',
    'Content approval and review workflows',
    'admin',
    true
  ),
  (
    'audit_logging',
    'Audit Logging',
    'Complete audit trail of all operations',
    'admin',
    true
  ),
  (
    'rbac',
    'Role-Based Access Control',
    'Fine-grained role-based access control',
    'admin',
    true
  );

-- ============================================================
-- TIER FEATURE MAPPINGS
-- ============================================================

-- BASIC TIER - All fundamental features
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT
  st.id,
  f.id,
  true
FROM public.subscription_tiers st
CROSS JOIN public.features f
WHERE st.name = 'basic'
  AND f.code IN (
    -- Registration (self-service + admin both available)
    'self_service_registration',
    'admin_business_creation',
    -- Contact (direct only)
    'direct_contact_buttons',
    -- QR (digital only)
    'qr_digital_generation',
    -- Content (all basic content)
    'business_directory',
    'event_calendar',
    'blog_narratives',
    -- Emergency (all emergency)
    'sos_system',
    'service_directory',
    'hotline_integration',
    -- Analytics (basic)
    'view_count_tracking',
    -- Admin (basic)
    'staff_management',
    'approval_workflows',
    'audit_logging',
    'rbac'
  );

-- TOURISM TIER - All basic + tourism enhancements
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT
  st.id,
  f.id,
  true
FROM public.subscription_tiers st
CROSS JOIN public.features f
WHERE st.name = 'tourism'
  AND f.code IN (
    -- Registration (all including verification)
    'self_service_registration',
    'admin_business_creation',
    'verification_workflow',
    -- Contact (direct + in-app messaging)
    'direct_contact_buttons',
    'in_app_messaging',
    'message_analytics',
    -- QR (digital + print)
    'qr_digital_generation',
    'qr_print_support',
    -- Content (all including heritage sites)
    'heritage_site_management',
    'business_directory',
    'event_calendar',
    'blog_narratives',
    -- Emergency (all + advanced search)
    'sos_system',
    'service_directory',
    'hotline_integration',
    'advanced_location_search',
    -- Analytics (palika + national)
    'view_count_tracking',
    'palika_level_dashboard',
    'national_aggregation',
    -- Admin (all)
    'staff_management',
    'approval_workflows',
    'audit_logging',
    'rbac'
  );

-- PREMIUM TIER - All features
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT
  st.id,
  f.id,
  true
FROM public.subscription_tiers st
CROSS JOIN public.features f
WHERE st.name = 'premium';

-- ============================================================
-- ASSIGN TIERS TO SAMPLE PALIKAS
-- ============================================================

-- Kathmandu Metropolitan - Tourism Tier
UPDATE public.palikas
SET subscription_tier_id = (SELECT id FROM public.subscription_tiers WHERE name = 'tourism')
WHERE code = 'KTM001';

-- All other Palikas start with Basic Tier
UPDATE public.palikas
SET subscription_tier_id = (SELECT id FROM public.subscription_tiers WHERE name = 'basic')
WHERE subscription_tier_id IS NULL;
