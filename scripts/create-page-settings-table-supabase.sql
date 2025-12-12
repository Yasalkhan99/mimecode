-- Create page_settings table in Supabase
-- This table stores custom navbar labels and URL slugs for pages

CREATE TABLE IF NOT EXISTS page_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  events_nav_label TEXT DEFAULT 'Events',
  events_slug TEXT DEFAULT 'events',
  blogs_nav_label TEXT DEFAULT 'Blogs',
  blogs_slug TEXT DEFAULT 'blogs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row
INSERT INTO page_settings (id, events_nav_label, events_slug, blogs_nav_label, blogs_slug)
VALUES ('default', 'Events', 'events', 'Blogs', 'blogs')
ON CONFLICT (id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_settings_updated_at ON page_settings(updated_at DESC);

-- Add comment to table
COMMENT ON TABLE page_settings IS 'Stores custom navbar labels and URL slugs for dynamic pages like Events and Blogs';

SELECT 'Page settings table created successfully!' as status;

