-- ==========================================
-- TEMPORARY ADMIN USERS FOR DEVELOPMENT
-- ==========================================
-- This creates temporary admin records for content management
-- Replace with proper Supabase Auth integration later

-- Create temporary admin users table (development only)
CREATE TABLE IF NOT EXISTS temp_admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    full_name_ne VARCHAR(200),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'palika_admin', 'moderator', 'support')),
    palika_id INTEGER REFERENCES palikas(id),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    password_hash VARCHAR(255), -- For simple auth
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert temporary admin users
INSERT INTO temp_admin_users (email, full_name, full_name_ne, role, palika_id, permissions, password_hash) VALUES
('superadmin@nepal-tourism.gov.np', 'System Administrator', 'प्रणाली प्रशासक', 'super_admin', 
 (SELECT id FROM palikas WHERE name_en = 'Kathmandu Metropolitan' LIMIT 1), 
 '["manage_heritage_sites", "manage_events", "manage_businesses", "manage_blog_posts", "manage_users", "manage_admins"]',
 '$2b$10$example_hash_replace_with_real_hash'),

('ktm.admin@nepal-tourism.gov.np', 'Kathmandu Metro Administrator', 'काठमाडौं महानगर प्रशासक', 'palika_admin',
 (SELECT id FROM palikas WHERE name_en = 'Kathmandu Metropolitan' LIMIT 1),
 '["manage_heritage_sites", "manage_events", "manage_businesses", "view_analytics"]',
 '$2b$10$example_hash_replace_with_real_hash'),

('moderator@nepal-tourism.gov.np', 'Content Moderator', 'सामग्री संयोजक', 'moderator',
 (SELECT id FROM palikas WHERE name_en = 'Kathmandu Metropolitan' LIMIT 1),
 '["moderate_content", "manage_reviews", "view_reports"]',
 '$2b$10$example_hash_replace_with_real_hash');

-- Create simple session table for temp auth
CREATE TABLE IF NOT EXISTS temp_admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES temp_admin_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update blog_posts to reference temp_admin_users
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_temp_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES temp_admin_users(id);

COMMENT ON TABLE temp_admin_users IS 'Temporary admin users for development. Replace with proper Supabase Auth integration.';
COMMENT ON TABLE temp_admin_sessions IS 'Temporary session management. Replace with proper Supabase Auth tokens.';