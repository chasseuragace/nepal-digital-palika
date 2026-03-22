-- Enable Row Level Security on palika_gallery table
-- Policies:
-- 1. Palika admins can view/insert/update/delete their own palika's gallery
-- 2. Super admins can view/insert/update/delete all palikas' galleries
-- 3. Public can view all gallery items (read-only)

-- Enable RLS
ALTER TABLE palika_gallery ENABLE ROW LEVEL SECURITY;

-- Policy 1: Palika admins can view their own palika's gallery
CREATE POLICY palika_gallery_select_own ON palika_gallery
  FOR SELECT
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 2: Palika admins can insert into their own palika's gallery
CREATE POLICY palika_gallery_insert_own ON palika_gallery
  FOR INSERT
  WITH CHECK (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 3: Palika admins can update their own palika's gallery
CREATE POLICY palika_gallery_update_own ON palika_gallery
  FOR UPDATE
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 4: Palika admins can delete from their own palika's gallery
CREATE POLICY palika_gallery_delete_own ON palika_gallery
  FOR DELETE
  USING (
    palika_id IN (
      SELECT palika_id FROM admin_users 
      WHERE id = auth.uid() AND palika_id IS NOT NULL
    )
  );

-- Policy 5: Super admins can view all galleries
CREATE POLICY palika_gallery_select_super ON palika_gallery
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 6: Super admins can insert into all galleries
CREATE POLICY palika_gallery_insert_super ON palika_gallery
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 7: Super admins can update all galleries
CREATE POLICY palika_gallery_update_super ON palika_gallery
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 8: Super admins can delete from all galleries
CREATE POLICY palika_gallery_delete_super ON palika_gallery
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 9: Public can view all gallery items (read-only)
CREATE POLICY palika_gallery_select_public ON palika_gallery
  FOR SELECT
  USING (true);
