-- Add NEW Coupon URL column if it doesn't exist
-- This is a NEW column, separate from "Coupon Deep Link"
-- We will NOT update or modify "Coupon Deep Link" - it remains untouched

-- Check if column exists, if not add it
DO $$ 
BEGIN
    -- Check if the "Coupon URL" column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'coupons' 
        AND column_name = 'Coupon URL'
    ) THEN
        -- Add the NEW column
        ALTER TABLE coupons ADD COLUMN "Coupon URL" TEXT NULL;
        RAISE NOTICE '✅ NEW column "Coupon URL" added to coupons table';
        RAISE NOTICE 'ℹ️  Note: "Coupon Deep Link" column remains unchanged';
    ELSE
        RAISE NOTICE 'Column "Coupon URL" already exists in coupons table';
    END IF;
END $$;

-- Verify column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coupons' 
AND column_name IN ('Coupon URL', 'Coupon Deep Link', 'url', 'Deeplink')
ORDER BY column_name;
