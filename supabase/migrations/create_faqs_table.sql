-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs("order");
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON public.faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_created_at ON public.faqs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow public read access for active FAQs
CREATE POLICY "Public can view active FAQs"
  ON public.faqs
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all FAQs (for admin)
CREATE POLICY "Authenticated users can view all FAQs"
  ON public.faqs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert FAQs (admin only)
CREATE POLICY "Authenticated users can insert FAQs"
  ON public.faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update FAQs (admin only)
CREATE POLICY "Authenticated users can update FAQs"
  ON public.faqs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete FAQs (admin only)
CREATE POLICY "Authenticated users can delete FAQs"
  ON public.faqs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default FAQs
INSERT INTO public.faqs (question, answer, "order", is_active) VALUES
  ('What is MimeCode, and how can it save me money?', 'MimeCode is a trusted publisher that collects and verifies the latest affiliate coupons, promotional codes, and exclusive discounts from hundreds of online retailers. We save you money by providing all the best deals in one easy-to-use platform.', 1, true),
  ('How do I use a coupon code I find on MimeCode?', 'Simply click on the coupon code to copy it, then paste it at checkout on the retailer''s website. For deals, click "Get Deal" and you''ll be automatically redirected to the store with the discount applied.', 2, true),
  ('How often are the coupon codes on MimeCode updated and verified?', 'Our team updates and verifies coupon codes daily to ensure they are working. We remove expired codes and add new ones as soon as they become available.', 3, true),
  ('Why does a deal sometimes show a "Click to Reveal" button instead of the coupon code?', 'Some retailers require us to verify user engagement before showing the code. This helps prevent abuse and ensures the deals remain available for genuine shoppers.', 4, true),
  ('What should I do if a coupon code from MimeCode doesn''t work?', 'If a code doesn''t work, please report it using the feedback button on the coupon. Our team will verify and update it immediately. You can also try other available codes for the same store.', 5, true),
  ('Is MimeCode free to use?', 'Yes! MimeCode is completely free to use. We earn a small commission from retailers when you make a purchase using our links, but this never affects the price you pay.', 6, true);

