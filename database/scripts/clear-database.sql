-- Nepal Digital Tourism Infrastructure - Database Clear Script
-- 
-- This script safely drops all tables in reverse dependency order.
-- Run this in Supabase SQL Editor for a fresh database start.
--
-- WARNING: This will DELETE ALL DATA. Make sure you have backups!

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS sos_requests CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS heritage_sites CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS palikas CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS app_versions CASCADE;

-- Confirm completion
SELECT 'Database cleared successfully!' as status;
