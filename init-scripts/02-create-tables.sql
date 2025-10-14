-- Create tables with pgvector columns for embeddings
-- Amazon Titan Embed Text v1 generates 1536-dimensional vectors

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    vt_product_name vector(1536),
    product_brand VARCHAR(255) NOT NULL,
    vt_product_brand vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name_vector ON products USING ivfflat (vt_product_name vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_vector ON products USING ivfflat (vt_product_brand vector_cosine_ops);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    client_id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_group VARCHAR(100) NOT NULL,
    vt_client_name vector(1536),
    vt_client_group vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_name_vector ON clients USING ivfflat (vt_client_name vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_clients_group_vector ON clients USING ivfflat (vt_client_group vector_cosine_ops);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    location_id VARCHAR(50) PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    vt_location_name vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_name_vector ON locations USING ivfflat (vt_location_name vector_cosine_ops);

-- Log success
SELECT 'Tables created successfully with vector columns' AS status;

