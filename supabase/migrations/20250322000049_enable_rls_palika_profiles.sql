-- Enable Row Level Security on palika_profiles table
-- Policies:
-- 1. Palika admins can view/update their own profile
-- 2. Super admins can view/update all profiles
-- 3. Public can view all profiles (read-only)

-- Enable RLS
ALTER TABLE palika_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Palika admins can view their own profile
CREATE POLICY palika_profiles_select_own ON palika_profiles
  FOR SELECT
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 2: Palika admins can update their own profile
CREATE POLICY palika_profiles_update_own ON palika_profiles
  FOR UPDATE
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 3: Super admins can view all profiles
CREATE POLICY palika_profiles_select_super ON palika_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 4: Super admins can update all profiles
CREATE POLICY palika_profiles_update_super ON palika_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 5: Public can view all profiles (for public-facing API)
CREATE POLICY palika_profiles_select_public ON palika_profiles
  FOR SELECT
  USING (true);
