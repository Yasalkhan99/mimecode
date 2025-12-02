-- Create email_settings table in Supabase
-- This table stores admin email addresses for receiving contact forms and newsletter subscriptions

CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email1 TEXT NOT NULL DEFAULT '',
  email2 TEXT DEFAULT '',
  email3 TEXT DEFAULT '',
  email4 TEXT DEFAULT '',
  email5 TEXT DEFAULT '',
  email6 TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings (only if table is empty)
INSERT INTO email_settings (email1, email2, email3, email4, email5, email6)
SELECT 'admin@mimecode.com', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM email_settings);

-- Create an index for faster lookups (though we'll typically only have 1 row)
CREATE INDEX IF NOT EXISTS idx_email_settings_updated_at ON email_settings(updated_at DESC);

-- Add a comment to the table
COMMENT ON TABLE email_settings IS 'Stores admin email addresses for receiving contact forms, newsletter subscriptions, and other notifications';

