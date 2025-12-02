-- Add category_id column to stores table in Supabase
-- Run this in Supabase SQL Editor

-- Check what stores table exists (could be 'stores' or 'stores-mimecode')
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    -- Try to find the stores table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores-mimecode') THEN
        table_name := 'stores-mimecode';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
        table_name := 'stores';
    ELSE
        RAISE EXCEPTION 'No stores table found';
    END IF;
    
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = table_name 
        AND column_name = 'category_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL', table_name);
        RAISE NOTICE 'Added category_id column to % table', table_name;
    ELSE
        RAISE NOTICE 'category_id column already exists in % table', table_name;
    END IF;
    
    -- Create index for faster queries
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_category_id ON %I(category_id)', table_name, table_name);
    RAISE NOTICE 'Created index on category_id';
    
    -- Add comment
    EXECUTE format('COMMENT ON COLUMN %I.category_id IS ''Foreign key reference to categories table''', table_name);
    
END $$;

-- Show the result
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'category_id'
AND table_schema = 'public';

