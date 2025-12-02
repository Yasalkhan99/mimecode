-- Add category_id column to stores-mimecode table if it doesn't exist
-- Run this in Supabase SQL Editor if the column is missing

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stores-mimecode' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "stores-mimecode" 
        ADD COLUMN category_id TEXT;
        
        RAISE NOTICE 'Column category_id added successfully';
    ELSE
        RAISE NOTICE 'Column category_id already exists';
    END IF;
END $$;

-- Create index on category_id for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_mimecode_category_id 
ON "stores-mimecode"(category_id);

-- Add comment to explain the column
COMMENT ON COLUMN "stores-mimecode".category_id IS 'References the ID of the category this store belongs to';

-- Show the result
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'stores-mimecode'
AND column_name = 'category_id';

