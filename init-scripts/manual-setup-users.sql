-- Manual setup script for users table and admin user
-- Use this when you already have an existing database with data
-- Run this script manually with: docker compose exec postgres psql -U postgres -d main_db -f /path/to/this/file.sql

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create users table (IF NOT EXISTS so it won't fail if already created)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(admin);

-- 4. Create function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Create initial admin user (ONLY if no users exist yet)
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- Only create admin if no users exist
    IF user_count = 0 THEN
        -- ⚠️ CHANGE THESE VALUES to match your .env file:
        INSERT INTO users (email, password_hash, name, last_name, admin)
        VALUES (
            'admin@vorta.com',  -- ⚠️ CHANGE THIS: INITIAL_ADMIN_EMAIL
            crypt('admin123', gen_salt('bf', 12)),  -- ⚠️ CHANGE THIS: INITIAL_ADMIN_PASSWORD
            'Admin',  -- ⚠️ CHANGE THIS: INITIAL_ADMIN_NAME
            'User',   -- ⚠️ CHANGE THIS: INITIAL_ADMIN_LAST_NAME
            true
        );
        
        RAISE NOTICE '✅ Initial admin user created successfully!';
    ELSE
        RAISE NOTICE '⚠️ Users already exist (% users found), skipping admin creation', user_count;
    END IF;
END $$;

-- 7. Verify the setup
SELECT 'Setup completed successfully!' AS status;
SELECT COUNT(*) AS total_users, COUNT(*) FILTER (WHERE admin = true) AS admin_users FROM users;
SELECT email, name, last_name, admin, created_at FROM users;
