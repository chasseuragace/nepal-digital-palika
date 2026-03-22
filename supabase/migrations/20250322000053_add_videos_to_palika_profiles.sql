-- Add videos column to palika_profiles table
-- This column stores an array of YouTube video URLs

ALTER TABLE public.palika_profiles
ADD COLUMN videos TEXT[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN public.palika_profiles.videos IS 'Array of YouTube video URLs for the palika profile';
