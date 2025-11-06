-- Migration script to add category column and vector to products table
-- This script updates the main_db vector database to include product categories

-- First, remove NOT NULL constraint from product_brand if it exists
ALTER TABLE products ALTER COLUMN product_brand DROP NOT NULL;

-- Add product_category column and its vector
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS vt_product_category vector(1024);

-- Create index for category vector search
CREATE INDEX IF NOT EXISTS idx_products_category_vector 
ON products USING ivfflat (vt_product_category vector_cosine_ops);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Show summary
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_products,
    COUNT(product_category) as products_with_category,
    COUNT(vt_product_category) as products_with_category_vector
FROM products;

