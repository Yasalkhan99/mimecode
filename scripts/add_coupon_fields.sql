-- Add image_alt and priority columns to coupons table
-- These fields are for coupon image alt text (accessibility/SEO) and priority ordering

-- Add image_alt column
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- Add priority column (default 0, higher number = higher priority)
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN coupons.image_alt IS 'Alt text for coupon image/logo (for accessibility and SEO)';
COMMENT ON COLUMN coupons.priority IS 'Priority/order of coupon (higher number = higher priority, shown first). Default is 0.';

-- Create index on priority for faster sorting
CREATE INDEX IF NOT EXISTS idx_coupons_priority ON coupons(priority DESC);

