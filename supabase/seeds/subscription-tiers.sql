-- Seed subscription tiers
INSERT INTO public.subscription_tiers (name, display_name, cost_per_year, description)
VALUES
    ('basic', 'Basic', 500000, 'Basic tier for local services and governance'),
    ('tourism', 'Tourism', 150000, 'Tourism-focused tier for heritage and tourism discovery'),
    ('premium', 'Premium', 250000, 'Premium tier with custom analytics and integrations')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    cost_per_year = EXCLUDED.cost_per_year,
    description = EXCLUDED.description;

-- Seed features
INSERT INTO public.features (code, display_name, category, description)
VALUES
    -- Registration features
    ('self_service_registration', 'Self-Service Registration', 'registration', 'Allow citizens to self-register'),
    ('admin_creation', 'Admin User Creation', 'registration', 'Admin can create user accounts'),
    ('verification_workflow', 'Verification Workflow', 'registration', 'Require verification for registrations'),
    ('custom_rules', 'Custom Rules', 'registration', 'Custom validation rules per palika'),

    -- Contact features
    ('direct_contact', 'Direct Contact', 'contact', 'Direct contact methods (phone, email)'),
    ('in_app_messaging', 'In-App Messaging', 'contact', 'Built-in messaging system'),
    ('message_analytics', 'Message Analytics', 'contact', 'Analytics on messages'),
    ('payment_integration', 'Payment Integration', 'contact', 'Payment processing'),

    -- QR features
    ('digital_qr', 'Digital QR', 'qr', 'Generate digital QR codes'),
    ('qr_print_support', 'Print Support', 'qr', 'Support for print QR codes'),
    ('qr_analytics', 'QR Analytics', 'qr', 'Analytics on QR code scans'),

    -- Content features
    ('heritage_content', 'Heritage Sites', 'content', 'Heritage site listings'),
    ('events_content', 'Events', 'content', 'Event listings'),
    ('blog_content', 'Blog', 'content', 'Blog post management'),
    ('business_directory', 'Business Directory', 'content', 'Business listings'),

    -- Emergency features
    ('sos_system', 'SOS System', 'emergency', 'Emergency SOS functionality'),
    ('service_directory', 'Service Directory', 'emergency', 'Emergency service directory'),
    ('hotline_support', 'Hotline Support', 'emergency', 'Emergency hotlines'),
    ('location_search', 'Location Search', 'emergency', 'Emergency location search'),

    -- Analytics features
    ('view_analytics', 'View Analytics', 'analytics', 'View basic analytics'),
    ('dashboard_analytics', 'Palika Dashboard', 'analytics', 'Palika-level analytics'),
    ('national_aggregation', 'National Aggregation', 'analytics', 'National-level data'),
    ('custom_reports', 'Custom Reports', 'analytics', 'Custom report generation'),

    -- Admin features
    ('staff_management', 'Staff Management', 'admin', 'Manage staff members'),
    ('approval_workflows', 'Approval Workflows', 'admin', 'Content approval workflows'),
    ('audit_logging', 'Audit Logging', 'admin', 'Complete audit trails'),
    ('rbac_management', 'RBAC Management', 'admin', 'Role-based access control')
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- Map features to tiers
-- Basic tier (all basic features)
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT t.id, f.id, true
FROM public.subscription_tiers t
JOIN public.features f ON f.code IN (
    'self_service_registration', 'admin_creation',
    'direct_contact',
    'digital_qr',
    'heritage_content', 'events_content', 'blog_content', 'business_directory',
    'view_analytics',
    'staff_management'
)
WHERE t.name = 'basic'
ON CONFLICT (tier_id, feature_id) DO UPDATE SET enabled = EXCLUDED.enabled;

-- Tourism tier (basic + tourism features)
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT t.id, f.id, true
FROM public.subscription_tiers t
JOIN public.features f ON f.code IN (
    'self_service_registration', 'admin_creation', 'verification_workflow',
    'direct_contact', 'in_app_messaging',
    'digital_qr', 'qr_print_support',
    'heritage_content', 'events_content', 'blog_content', 'business_directory',
    'sos_system', 'service_directory', 'hotline_support',
    'view_analytics', 'dashboard_analytics',
    'staff_management', 'approval_workflows', 'audit_logging', 'rbac_management'
)
WHERE t.name = 'tourism'
ON CONFLICT (tier_id, feature_id) DO UPDATE SET enabled = EXCLUDED.enabled;

-- Premium tier (all features)
INSERT INTO public.tier_features (tier_id, feature_id, enabled)
SELECT t.id, f.id, true
FROM public.subscription_tiers t
CROSS JOIN public.features f
WHERE t.name = 'premium'
ON CONFLICT (tier_id, feature_id) DO UPDATE SET enabled = EXCLUDED.enabled;
