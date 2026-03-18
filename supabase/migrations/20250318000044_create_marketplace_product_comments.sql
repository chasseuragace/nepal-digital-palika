-- ==========================================
-- MIGRATION: Create Marketplace Product Comments Table
-- ==========================================
-- Purpose: Public, threaded discussion on products
-- Replaces private inquiries with public comments

CREATE TABLE IF NOT EXISTS public.marketplace_product_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Product Being Commented On
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  palika_id INTEGER NOT NULL REFERENCES public.palikas(id),

  -- Commenter
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(200),

  -- Comment Content
  comment_text TEXT NOT NULL,

  -- Nested Comments (Threading)
  parent_comment_id UUID REFERENCES public.marketplace_product_comments(id) ON DELETE CASCADE,

  -- Business Owner Reply Flag
  is_owner_reply BOOLEAN DEFAULT false,

  -- Visibility & Moderation
  is_approved BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  moderation_reason TEXT,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_edited BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_comments_product ON public.marketplace_product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON public.marketplace_product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user ON public.marketplace_product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_owner_reply ON public.marketplace_product_comments(is_owner_reply);
CREATE INDEX IF NOT EXISTS idx_product_comments_approved ON public.marketplace_product_comments(is_approved, is_hidden);

COMMENT ON TABLE public.marketplace_product_comments IS 'Public, threaded comments on marketplace products';
COMMENT ON COLUMN public.marketplace_product_comments.parent_comment_id IS 'NULL=top-level, UUID=reply to another comment';
COMMENT ON COLUMN public.marketplace_product_comments.is_owner_reply IS 'TRUE=business owner response, marked in UI';

-- ==========================================
-- ENABLE RLS
-- ==========================================
ALTER TABLE public.marketplace_product_comments ENABLE ROW LEVEL SECURITY;

-- User can post comments
DROP POLICY IF EXISTS "marketplace_comments_user_post" ON public.marketplace_product_comments;
CREATE POLICY "marketplace_comments_user_post" ON public.marketplace_product_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Business owner can mark replies
DROP POLICY IF EXISTS "marketplace_comments_owner_reply" ON public.marketplace_product_comments;
CREATE POLICY "marketplace_comments_owner_reply" ON public.marketplace_product_comments
  FOR INSERT
  WITH CHECK (
    is_owner_reply = false OR (
      is_owner_reply = true AND
      product_id IN (
        SELECT id FROM public.marketplace_products mp
        WHERE mp.business_id IN (
          SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
        )
      )
    )
  );

-- Public can read approved comments
DROP POLICY IF EXISTS "marketplace_comments_public_read" ON public.marketplace_product_comments;
CREATE POLICY "marketplace_comments_public_read" ON public.marketplace_product_comments
  FOR SELECT
  USING (is_approved = true AND is_hidden = false);

-- Users can edit own comments
DROP POLICY IF EXISTS "marketplace_comments_edit_own" ON public.marketplace_product_comments;
CREATE POLICY "marketplace_comments_edit_own" ON public.marketplace_product_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Palika staff can moderate comments
DROP POLICY IF EXISTS "marketplace_comments_moderation" ON public.marketplace_product_comments;
CREATE POLICY "marketplace_comments_moderation" ON public.marketplace_product_comments
  FOR UPDATE
  USING (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM public.admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('moderate_marketplace_comments')
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin' OR (
      palika_id IN (
        SELECT palika_id FROM public.admin_regions
        WHERE admin_id = auth.uid()
      )
      AND public.user_has_permission('moderate_marketplace_comments')
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.marketplace_product_comments TO authenticated;
GRANT SELECT ON public.marketplace_product_comments TO anon;
