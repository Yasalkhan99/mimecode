-- Reset Store IDs to sequential numbers starting from 1
-- This will update all existing stores to have IDs 1, 2, 3, etc. in order

-- Method: Using ROW_NUMBER() with a CTE (works without UUID id column)
WITH ranked_stores AS (
  SELECT 
    "Store Id" as current_store_id,
    ROW_NUMBER() OVER (
      ORDER BY 
        -- First, try to order by existing numeric Store Id if it's reasonable
        CASE 
          WHEN "Store Id" ~ '^[0-9]+$' AND CAST("Store Id" AS BIGINT) <= 100000 
          THEN CAST("Store Id" AS INTEGER)
          ELSE 999999999
        END,
        -- Then by Created Date
        "Created Date" ASC NULLS LAST,
        -- Finally by Store Name for consistent ordering
        "Store Name" ASC
    ) as new_store_id
  FROM stores
)
UPDATE stores
SET "Store Id" = ranked_stores.new_store_id::TEXT
FROM ranked_stores
WHERE stores."Store Id" = ranked_stores.current_store_id;

-- Verify the update - show first 20 stores with new IDs
SELECT 
  "Store Id",
  "Store Name",
  "Created Date"
FROM stores
ORDER BY CAST("Store Id" AS INTEGER)
LIMIT 20;

-- Show total count
SELECT COUNT(*) as total_stores FROM stores;

-- Note: After running this script:
-- 1. All stores will have sequential IDs starting from 1
-- 2. New stores created will continue from max(Store Id) + 1
-- 3. The create route already handles sequential ID generation
