-- Add new status tracking columns to existing businesses table
-- This allows tier-gated business registration with verification workflow

-- ============================================================
-- PART 1: Add missing columns to businesses table
-- ============================================================

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'status') THEN
    ALTER TABLE public.businesses ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
  END IF;
END
$$;

-- Add reviewer_feedback column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'reviewer_feedback') THEN
    ALTER TABLE public.businesses ADD COLUMN reviewer_feedback TEXT;
  END IF;
END
$$;

-- Add reviewer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'reviewer_id') THEN
    ALTER TABLE public.businesses ADD COLUMN reviewer_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Add is_published column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_published') THEN
    ALTER TABLE public.businesses ADD COLUMN is_published BOOLEAN DEFAULT false;
  END IF;
END
$$;

-- Add published_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'published_at') THEN
    ALTER TABLE public.businesses ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

-- ============================================================
-- PART 2: Create indexes for new columns (if table exists)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_published ON public.businesses(is_published, palika_id);
