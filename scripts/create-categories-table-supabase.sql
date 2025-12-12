-- Create categories table in Supabase
-- Run this in Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    background_color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, background_color, logo_url) VALUES
    ('Fashion & Clothing', '#FF6B9D', 'https://api.iconify.design/mdi/tshirt-crew.svg?color=%23ffffff'),
    ('Electronics & Tech', '#4A90E2', 'https://api.iconify.design/mdi/laptop.svg?color=%23ffffff'),
    ('Home & Garden', '#7ED321', 'https://api.iconify.design/mdi/home.svg?color=%23ffffff'),
    ('Beauty & Health', '#F5A623', 'https://api.iconify.design/mdi/spa.svg?color=%23ffffff'),
    ('Sports & Outdoors', '#50E3C2', 'https://api.iconify.design/mdi/basketball.svg?color=%23ffffff'),
    ('Food & Grocery', '#FF5722', 'https://api.iconify.design/mdi/food.svg?color=%23ffffff'),
    ('Books & Media', '#9013FE', 'https://api.iconify.design/mdi/book-open-page-variant.svg?color=%23ffffff'),
    ('Toys & Kids', '#FF4081', 'https://api.iconify.design/mdi/toy-brick.svg?color=%23ffffff'),
    ('Automotive', '#607D8B', 'https://api.iconify.design/mdi/car.svg?color=%23ffffff'),
    ('Travel & Hotels', '#00BCD4', 'https://api.iconify.design/mdi/airplane.svg?color=%23ffffff'),
    ('Jewelry & Watches', '#E91E63', 'https://api.iconify.design/mdi/diamond-stone.svg?color=%23ffffff'),
    ('Pet Supplies', '#8BC34A', 'https://api.iconify.design/mdi/paw.svg?color=%23ffffff'),
    ('Office & Stationery', '#3F51B5', 'https://api.iconify.design/mdi/briefcase.svg?color=%23ffffff')
ON CONFLICT (name) DO NOTHING;

-- Show created categories
SELECT id, name, background_color FROM categories ORDER BY name;

