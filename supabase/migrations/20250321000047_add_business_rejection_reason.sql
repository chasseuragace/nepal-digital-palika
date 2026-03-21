-- Add rejection_reason column to businesses table
-- This supports the business approval workflow where admins can reject businesses with a reason

ALTER TABLE businesses ADD COLUMN rejection_reason TEXT;

-- Create index for efficient querying of rejected businesses
CREATE INDEX idx_businesses_rejection_reason ON businesses(rejection_reason);

-- Add comment for documentation
COMMENT ON COLUMN businesses.rejection_reason IS 'Reason provided by admin when rejecting a business. Only populated when verification_status = ''rejected''';
