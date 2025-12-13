-- Migration: Add Language Support for Admin-Generated Content
-- Created: 2025-01-XX
-- Description: Adds language_code column to support multilingual content

-- First, create tables if they don't exist (for privacy_policy and terms_and_conditions)
CREATE TABLE IF NOT EXISTS privacy_policy (
  id TEXT PRIMARY KEY DEFAULT 'main',
  title TEXT NOT NULL DEFAULT 'Privacy Policy',
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'privacy@mimecode.com',
  contact_website TEXT NOT NULL DEFAULT 'www.mimecode.com',
  last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id TEXT PRIMARY KEY DEFAULT 'main',
  title TEXT NOT NULL DEFAULT 'Terms and Conditions',
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'legal@mimecode.com',
  contact_website TEXT NOT NULL DEFAULT 'www.mimecode.com',
  last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE privacy_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (only if they don't exist)
DROP POLICY IF EXISTS "Allow public read access" ON privacy_policy;
DROP POLICY IF EXISTS "Allow public read access" ON terms_and_conditions;

CREATE POLICY "Allow public read access" ON privacy_policy
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON terms_and_conditions
  FOR SELECT
  USING (true);

-- Note: FAQs table should already exist, but we'll handle it gracefully
-- Add language_code to privacy_policy table
ALTER TABLE privacy_policy 
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en';

-- Add language_code to terms_and_conditions table
ALTER TABLE terms_and_conditions 
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en';

-- Add language_code to faqs table (only if table exists)
-- This will fail silently if faqs table doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    ALTER TABLE faqs ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_privacy_policy_language ON privacy_policy(language_code);
CREATE INDEX IF NOT EXISTS idx_terms_language ON terms_and_conditions(language_code);

-- Create index for FAQs only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    CREATE INDEX IF NOT EXISTS idx_faqs_language ON faqs(language_code);
  END IF;
END $$;

-- Update existing records to have 'en' as default language
UPDATE privacy_policy SET language_code = 'en' WHERE language_code IS NULL;
UPDATE terms_and_conditions SET language_code = 'en' WHERE language_code IS NULL;

-- Update FAQs only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    UPDATE faqs SET language_code = 'en' WHERE language_code IS NULL;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN privacy_policy.language_code IS 'Language code (ISO 639-1) for the content. Default: en';
COMMENT ON COLUMN terms_and_conditions.language_code IS 'Language code (ISO 639-1) for the content. Default: en';
COMMENT ON COLUMN faqs.language_code IS 'Language code (ISO 639-1) for the content. Default: en';

