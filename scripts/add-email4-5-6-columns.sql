-- Add email4, email5, email6 columns to existing email_settings table
-- Run this if you already have email_settings table with only email1, email2, email3

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add email4 if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' AND column_name = 'email4'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN email4 TEXT DEFAULT '';
        RAISE NOTICE 'Added column email4';
    ELSE
        RAISE NOTICE 'Column email4 already exists';
    END IF;

    -- Add email5 if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' AND column_name = 'email5'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN email5 TEXT DEFAULT '';
        RAISE NOTICE 'Added column email5';
    ELSE
        RAISE NOTICE 'Column email5 already exists';
    END IF;

    -- Add email6 if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' AND column_name = 'email6'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN email6 TEXT DEFAULT '';
        RAISE NOTICE 'Added column email6';
    ELSE
        RAISE NOTICE 'Column email6 already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
ORDER BY ordinal_position;

