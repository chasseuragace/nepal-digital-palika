-- ==========================================
-- MIGRATION: Add display_author_name to blog_posts
-- ==========================================
-- Allows separating technical author (author_id) from logical author (display_author_name)
-- The technical author is the logged-in admin who creates the post
-- The display author is the credited author shown to users

-- Add display_author_name column
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS display_author_name VARCHAR(200);

-- Create index for faster queries on display_author_name
CREATE INDEX IF NOT EXISTS idx_blog_display_author ON blog_posts(display_author_name);
