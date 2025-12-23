-- Add logo_alt column to stores table
-- This column stores the alt text for store logos (for accessibility and SEO)

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS logo_alt TEXT;

-- Add comment to document the column
COMMENT ON COLUMN stores.logo_alt IS 'Alt text for store logo (for accessibility and SEO)';

